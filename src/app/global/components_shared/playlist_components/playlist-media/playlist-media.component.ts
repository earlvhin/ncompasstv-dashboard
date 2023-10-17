import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_CONTENT, UI_ROLE_DEFINITION } from 'src/app/global/models';
import { AuthService, ContentService, FillerService, PlaylistService } from 'src/app/global/services';
import { MediaPlaywhereComponent } from '../media-playwhere/media-playwhere.component';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-playlist-media',
	templateUrl: './playlist-media.component.html',
	styleUrls: ['./playlist-media.component.scss']
})
export class PlaylistMediaComponent implements OnInit {
	@Input() type = 'add';
	dealer_has_no_contents = false;
	media_files: API_CONTENT[] = [];
	media_files_no_floating: API_CONTENT[] = [];
	selected_contents: API_CONTENT[] = [];
	media_files_backup: API_CONTENT[] = [];
	floating_contents: API_CONTENT[] = [];
	file_not_found: boolean = false;
	filler_groups: any = [];
	no_filler_groups: boolean = false;
	show_floating: boolean = false;
	page: number = 1;
	paging: any;
	isGettingData: boolean = true;
	selected_groups: any = [];
	isActiveTab: number = 0;
	active_filler: number;
	// subscription: Subscription = new Subscription();

	current_selection: any = '';
	prev_selection: any = '';
	current_content: any = [];
	in_progress_saving_fillers: boolean = false;
	has_fillers: boolean = false;

	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _dialog: MatDialog,
		private _content: ContentService,
		private _auth: AuthService,
		private _filler: FillerService,
		private _playlist: PlaylistService,
		private _currentDialog: MatDialogRef<PlaylistMediaComponent>
	) {}

	ngOnInit() {
		// this.checkIfPlaylistHasFillers();
		this.onTabChanged(this.isActiveTab);
		if (
			this._auth.current_user_value.role_id == UI_ROLE_DEFINITION.administrator ||
			this._auth.current_user_value.role_id == UI_ROLE_DEFINITION.tech
		) {
			this.getFloatingContents();
			this.active_filler = 1;
		} else {
			if (this._isDealer()) this.active_filler = 2;
			else if (this._isDealerAdmin()) this.active_filler = 3;
		}
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getDealerContent(dealer) {
		/**
		 * @params
		 * dealerId: string,
		 * floating: boolean,
		 * page: number,
		 * pageSize: number
		 */
		this._content
			.get_content_by_dealer_id(dealer, false, this.page++, 60)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data) => {
				if (data.message) {
					this.dealer_has_no_contents = true;
					this.isGettingData = false;
					return;
				}

				this.media_files = this.media_files.concat(data.contents);
				this.media_files_backup = this.media_files_backup.concat(data.contents);
				this.paging = data.paging;

				data.contents.map((i) => {
					if (i.dealerId !== null && i.dealerId !== '') {
						this.media_files_no_floating.push(i);
					}
				});

				if (this.page <= data.paging.pages) this.getDealerContent(dealer);
				else this.isGettingData = false;
				this.dealer_has_no_contents = false;
			});
	}

	getFloatingContents() {
		this._content
			.get_floating_contents()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				const contents = response.iContents;
				this.floating_contents = [...contents];
				this.paging = response.paging;

				if (this.dealer_has_no_contents) {
					this.media_files = [...contents];
					this.media_files_backup = [...contents];
					this.show_floating = true;
				}
			});
	}

	displayFloating(e) {
		if (e.checked == true) {
			this.show_floating = e.checked;
			this.media_files = this.media_files.concat(this.floating_contents);
		} else {
			this.show_floating = e.checked;
			this.media_files = this.media_files.filter((i) => i.dealerId !== null && i.dealerId !== '');
		}
	}

	// Search Content Field
	searchContent(e) {
		this.file_not_found = false;

		if (e.target.value !== '') {
			this.media_files = this.media_files.filter((i) => {
				if (i.fileName) {
					return this.removeFilenameHandle(i.fileName).toLowerCase().includes(e.target.value.toLowerCase());
				} else if (i.title) {
					return i.title.toLowerCase().includes(e.target.value.toLowerCase());
				}
			});

			if (this.media_files.length == 0) {
				this.media_files = this.media_files_backup;
				this.file_not_found = true;
			}
		} else {
			if (this.show_floating == true) {
				this.media_files = this.media_files_backup;
			} else {
				this.media_files = [];
				this.media_files_backup.map((i) => {
					if (i.dealerId !== null && i.dealerId !== '') {
						this.media_files.push(i);
					}
				});
			}
		}
	}

	playWhere() {
		let play_where = this._dialog.open(MediaPlaywhereComponent, {
			data: this._dialog_data.playlist_host_license,
			height: '700px',
			width: '650px'
		});

		play_where.afterClosed().subscribe((data) => {
			if (data) {
				localStorage.setItem('to_blocklist', data);
			}
		});
	}

	deselectAll() {
		this.selected_contents = [];
		localStorage.removeItem('to_blocklist');
	}

	isMarked(content) {
		return this.selected_contents.includes(content) ? true : false;
	}

	addToMarked(e: API_CONTENT) {
		if (this.type === 'add') {
			if (this.selected_contents.includes(e)) {
				this.selected_contents = this.selected_contents.filter((i) => {
					return i !== e;
				});
			} else {
				this.selected_contents.push(e);
			}

			if (this.selected_contents.length == 0) {
				localStorage.removeItem('to_blocklist');
			}

			return;
		}

		// for swap content
		if (this.selected_contents.length <= 0) return this.selected_contents.push(e);
		if (e.playlistContentId === this.selected_contents[0].playlistContentId)
			return (this.selected_contents = this.selected_contents.filter((content) => content !== e));
	}

	removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}

	contentNotReady() {}

	videoConverted(e) {
		this.media_files.find((i) => {
			if (i.uuid == e) {
				i.isConverted = 1;
				return;
			}
		});
	}

	getAllFillerGroups(role?) {
		let dealer_id = '';
		if (role == 2) dealer_id = this._dialog_data.dealer_id;
		if (this._isAdmin() && role == 3) dealer_id = this._dialog_data.dealer_id;
		this._filler
			.get_filler_feeds_by_role(role, dealer_id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				if (!data.message) {
					data.paging.entities.map((group) => {
						let sum = 0;
						group.fillerGroups.map((inside_group) => {
							if (inside_group.isPair) sum = sum + inside_group.quantity * 2;
							else sum = sum + inside_group.quantity;
						});
						group.totalFillers = sum;
					});
					this.filler_groups = data.paging.entities;
					this.no_filler_groups = false;
				} else this.no_filler_groups = true;
			});
	}

	prepareDataToAddToPlaylist(id, total) {
		this.current_content = [];
		this.current_selection = id;
		this._filler
			.get_single_filler_feeds_placeholder(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					data.data.map((filler, index) => {
						this.current_content.push({
							contentId: filler.contentId,
							duration: filler.duration,
							isFullScreen: 0,
							playlistContentId: null,
							seq: index + 1
						});
					});
				},
				(error) => {
					console.error(error);
				}
			)
			.add(() => {
				//map existing contents to comply with format
				this._dialog_data.existing_contents.map((contents) => {
					let x = {
						contentId: contents.contentId,
						duration: contents.duration,
						isFullScreen: contents.isFullScreen,
						playlistContentId: contents.playlistContentId,
						seq: contents.seq + total
					};
					this.current_content.push(x);
				});
			});

		if (this.current_selection != this.prev_selection) {
			this.addFillerSelectedEffect(id);
		}
	}

	addFillerSelectedEffect(id) {
		const box = document.getElementById(id);
		box.classList.add('selected-box');
		box.classList.remove('bg-dark');
		if (this.prev_selection != '') this.removeFillerSelectedEffect(this.prev_selection);
		else this.prev_selection = id;
	}

	removeFillerSelectedEffect(id) {
		const box = document.getElementById(id);
		box.classList.remove('selected-box');
		box.classList.add('bg-dark');
		this.prev_selection = this.current_selection;
	}

	addFillerOnPlaylist() {
		this.in_progress_saving_fillers = true;
		let final_format = {
			playlist: {
				playlistId: this._dialog_data.playlist_id
			},
			playlistContents: this.current_content
		};
		this._playlist
			.update_playlist_contents(final_format)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					if (data) this.openConfirmationModal('success', 'Success!', 'Filler Feed successfully added to playlist.');
				},
				(error) => {
					console.error(error);
				}
			);
	}

	addToPlaylist() {
		this._currentDialog.close({ mode: 'add', data: this.selected_contents });
	}

	swapContents() {
		this._currentDialog.close({ mode: 'swap', data: this.selected_contents });
	}

	openConfirmationModal(status, message, data): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});

		dialog.afterClosed().subscribe(() => {
			this._currentDialog.close({ mode: 'fillers' });
		});
	}

	onTabChanged(index) {
		this.isActiveTab = index;
		switch (index) {
			case 0:
				this.getDealerContent(this._dialog_data.dealer_id);
				break;
			case 1:
				this.getAllFillerGroups(this.active_filler);
				break;
			default:
		}
	}

	_isDealer() {
		const DEALER_ROLES = ['dealer', 'sub-dealer'];
		return DEALER_ROLES.includes(this._auth.current_role);
	}

	_isDealerAdmin() {
		const DEALER_ADMIN_ROLE = ['dealeradmin'];
		return DEALER_ADMIN_ROLE.includes(this._auth.current_role);
	}

	_isAdmin() {
		const ADMIN_ROLE = ['administrator'];
		return ADMIN_ROLE.includes(this._auth.current_role);
	}
}
