import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material'
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_CONTENT, UI_ROLE_DEFINITION } from 'src/app/global/models';
import { AuthService, ContentService } from 'src/app/global/services';
import { MediaPlaywhereComponent } from '../media-playwhere/media-playwhere.component';

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
	show_floating: boolean = false;
	page: number = 1;
	paging: any;
	isDealer: boolean = true;
	isGettingData: boolean = true;
	// subscription: Subscription = new Subscription();

	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _dialog: MatDialog,
		private _content: ContentService,
		private _auth: AuthService
	) { }

	ngOnInit() {
		this.getDealerContent(this._dialog_data.dealer_id);

		if (this._auth.current_user_value.role_id == UI_ROLE_DEFINITION.administrator || this._auth.current_user_value.role_id == UI_ROLE_DEFINITION.tech) {
			this.isDealer = false;
			this.getFloatingContents();
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
		this._content.get_content_by_dealer_id(dealer, false, this.page++, 60).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {

					if (data.message) {
						this.dealer_has_no_contents = true;
						this.isGettingData = false;
						return; 
					}

					this.media_files = this.media_files.concat(data.contents);
					this.media_files_backup = this.media_files_backup.concat(data.contents);
					this.paging = data.paging

					data.contents.map(
						i => {
							if(i.dealerId !== null && i.dealerId !== "") {
								this.media_files_no_floating.push(i)
							}
						}
					);

					if (this.page <= data.paging.pages) this.getDealerContent(dealer);
					else this.isGettingData = false;
					this.dealer_has_no_contents = false;
				}
			);

	}

	getFloatingContents() {
		
		this._content.get_floating_contents().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					const contents = response.iContents;
					this.floating_contents = [...contents];
					this.paging = response.paging

					if (this.dealer_has_no_contents) {
						this.media_files = [...contents];
						this.media_files_backup = [...contents];
						this.show_floating = true;
					}
				}
			);
	}

	displayFloating(e) {
		if (e.checked == true) {
			this.show_floating = e.checked;
			this.media_files = this.media_files.concat(this.floating_contents);
		} else {
			this.show_floating = e.checked;
			this.media_files = this.media_files.filter(i => i.dealerId !== null && i.dealerId !== "")
		}
	}

	// Search Content Field
	searchContent(e) {
		this.file_not_found = false;

		if(e.target.value !== '') {
			this.media_files = this.media_files.filter(
				i => {
					if (i.fileName) {
						return this.removeFilenameHandle(i.fileName).toLowerCase().includes(e.target.value.toLowerCase())
					} else if (i.title) {
						return i.title.toLowerCase().includes(e.target.value.toLowerCase())
					}
				}
			)

			if (this.media_files.length == 0) {
				this.media_files = this.media_files_backup;
				this.file_not_found = true;
			}
		} else {
			if (this.show_floating == true) {
				this.media_files = this.media_files_backup;
			} else {
				this.media_files = [];
				this.media_files_backup.map(
					i => {
						if(i.dealerId !== null && i.dealerId !== "") {
							this.media_files.push(i)
						}
					}
				)
			}
		}
	}

	playWhere() {
		let play_where = this._dialog.open(MediaPlaywhereComponent, {
			data: this._dialog_data.playlist_host_license,
			height: '700px',
			width: '650px'
		})

		play_where.afterClosed().subscribe(
			data => {
				if (data) {
					localStorage.setItem('to_blocklist', data);
				}
			}
		)
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
				
				this.selected_contents = this.selected_contents.filter(i => {
					return i !== e;
				});
	
			} else {
				this.selected_contents.push(e)
			}
	
			if (this.selected_contents.length == 0) {
				localStorage.removeItem('to_blocklist');
			}

			return;

		}

		// for swap content
		if (this.selected_contents.length <= 0) return this.selected_contents.push(e);
		if (e.playlistContentId === this.selected_contents[0].playlistContentId) return this.selected_contents = this.selected_contents.filter(content => content !== e);


	}

	removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}
	
	contentNotReady() {
		console.log('Content Not Ready')
	}

	videoConverted(e) {
		this.media_files.find(
			i => {
				if (i.uuid == e) {
					i.isConverted = 1;
					return;
				}
			}
		)
	}
}
