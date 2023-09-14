import { Component, OnInit } from '@angular/core';
import { FillerService, AuthService, UserService } from 'src/app/global/services';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material';

import { AddFillerContentComponent } from '../add-filler-content/add-filler-content.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { CreateFillerFeedComponent } from '../create-filler-feed/create-filler-feed.component';
import { UI_ROLE_DEFINITION } from 'src/app/global/models';

@Component({
	selector: 'app-view-fillers-group',
	templateUrl: './view-fillers-group.component.html',
	styleUrls: ['./view-fillers-group.component.scss']
})
export class ViewFillersGroupComponent implements OnInit {
	filler_group_contents: any = [];
	filler_group_pagination: any = [];
	filler_group_data: any;
	filler_group_id: string;
	isActiveTab = 0;
	is_loading = true;
	loading_playing_where = false;
	no_search_result = false;
	playing_where: any = [];
	playing_where_selected: any = [];
	playlist_selected: any = [];
	host_selected: any = [];
	restricted: boolean = false;
	search_keyword: string;
	selected_filler: string;
	selected_filler_feed_index: string;
	selected_playlist_index: string;
	selected_host_index: string;
	selected_license_index: string;
	sorting_order: string = '';
	sorting_column: string = '';
	title = 'Fillers Library';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _filler: FillerService,
		private _params: ActivatedRoute,
		private _dialog: MatDialog,
		private _auth: AuthService,
		private _user: UserService
	) {}

	ngOnInit() {
		this._params.paramMap.pipe(takeUntil(this._unsubscribe)).subscribe(() => (this.filler_group_id = this._params.snapshot.params.data));
		this.getFillerGroupContents(this.filler_group_id);
		this.getFillerGroupDetails(this.filler_group_id);
	}

	getFillerGroupDetails(id) {
		this._filler
			.get_filler_group_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				this.filler_group_data = response.data[0];
			})
			.add(() => this.allowedToDelete());
	}

	getFillerGroupContents(id, page?) {
		this._filler
			.get_filler_group_contents(id, this.search_keyword, page, 30, this.sorting_column, this.sorting_order)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				if (!data.message) {
					this.filler_group_pagination = data.paging;
					if (page > 1) {
						data.paging.entities.map((data) => {
							this.filler_group_contents.push(data);
						});
					} else {
						this.filler_group_contents = data.paging.entities;
						this.no_search_result = false;
					}
				} else {
					this.filler_group_pagination = [];
					if (this.search_keyword != '') this.no_search_result = true;
					else {
						this.filler_group_contents = [];
						this.no_search_result = false;
					}
				}
			})
			.add(() => {
				this.is_loading = false;
			});
	}

	gotoFileURL(url) {
		let new_url = url.replace(/ /g, '+');
		window.open(new_url, '_blank');
	}

	addFillerContent(group) {
		this._dialog
			.open(AddFillerContentComponent, {
				width: '500px',
				data: {
					group: group,
					all_media: this.filler_group_contents
				}
			})
			.afterClosed()
			.subscribe(() => {
				this.ngOnInit();
			});
	}

	createFillerFeed(group, single_filler) {
		this._dialog
			.open(CreateFillerFeedComponent, {
				width: '500px',
				data: {
					group: group
				}
			})
			.afterClosed()
			.subscribe(() => {
				this.ngOnInit();
			});
	}

	splitOriginalFilename(name) {
		return name.substring(name.indexOf('_') + 1);
	}

	deleteContent(id) {
		this.selected_filler = id;
		this.warningModal('warning', 'Delete Filler', 'Are you sure you want to delete this filler?', '', 'delete', true);
	}

	private warningModal(status: string, message: string, data: string, return_msg: string, action: string, todelete?: boolean): void {
		this._dialog.closeAll();

		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status,
				message,
				data,
				return_msg,
				action,
				delete: todelete
			}
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result == 'delete') {
				this._filler
					.delete_filler_contents(this.selected_filler)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe((data: any) => {
						this.warningModal('success', 'Delete Filler', 'Filler Content ' + data.message, '', '', false);
						this.ngOnInit();
					});
			}
			this.ngOnInit();
		});
	}

	onSearchFiller(keyword) {
		this.is_loading = true;
		if (keyword) this.search_keyword = keyword;
		else this.search_keyword = '';
		this.getFillerGroupContents(this.filler_group_id, 1);
	}

	sortFillerGroup(order) {
		this.is_loading = true;
		this.sorting_column = 'Title';
		this.sorting_order = order;
		this.getFillerGroupContents(this.filler_group_id, 1);
	}

	clearFilter() {
		this.is_loading = true;
		this.sorting_column = '';
		this.sorting_order = '';
		this.getFillerGroupContents(this.filler_group_id, 1);
	}

	getFillerGroupPlayingWhere(id) {
		this._filler
			.get_filler_group_playing_where(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				this.loading_playing_where = false;
				if (data.fillerFeeds.length > 0) {
					this.playing_where = data.fillerFeeds;
					this.selectFillerFeeds(data.fillerFeeds[0], 0);
				}
			});
	}

	selectFillerFeeds(data, index) {
		this.selected_filler_feed_index = index;
		if (data.playlists && data.playlists.length) {
			this.playing_where_selected = data.playlists;
			this.selectPlaylist(this.playing_where_selected[0], 0);
		} else {
			this.playing_where_selected = [];
			this.playlist_selected = [];
			this.host_selected = [];
		}
	}

	selectPlaylist(data, index) {
		this.selected_playlist_index = index;
		if (data.hosts && data.hosts.length) {
			this.playlist_selected = data.hosts;
			this.selectHost(this.playlist_selected[0], 0);
		} else {
			this.playlist_selected = [];
			this.host_selected = [];
		}
	}

	selectHost(data, index) {
		this.selected_host_index = index;
		if (data.licenses) {
			this.host_selected = data.licenses;
			this.selectLicenses(this.host_selected[0], 0);
		} else {
			this.host_selected = [];
		}
	}

	selectLicenses(data, index) {
		this.selected_license_index = index;
	}

	onTabChanged(tab) {
		this.isActiveTab = tab;
		switch (tab) {
			case 1:
				this.getFillerGroupPlayingWhere(this.filler_group_id);
				this.loading_playing_where = true;
				break;
			default:
		}
	}

	allowedToDelete() {
		if (this._isDealer || this._isSubDealer) {
			if (this.filler_group_data.createdBy != this._auth.current_user_value.user_id) this.restricted = true;
			else this.restricted = false;
		} else if (this._isAdmin) {
			this._user
				.get_user_role_by_id(this.filler_group_data.createdBy)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe((data: any) => {
					if (UI_ROLE_DEFINITION.dealer in data.role) this.restricted = true;
					else this.restricted = false;
				});
		}
	}

	protected get _isAdmin() {
		return this._auth.current_role === 'administrator';
	}

	protected get _isDealer() {
		return this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer;
	}

	protected get _isSubDealer() {
		return this._auth.current_user_value.role_id === UI_ROLE_DEFINITION['sub-dealer'];
	}
}
