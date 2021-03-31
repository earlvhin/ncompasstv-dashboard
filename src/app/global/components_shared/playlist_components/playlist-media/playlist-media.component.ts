import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material'
import { API_CONTENT } from 'src/app/global/models/api_content.model';
import { ContentService } from '../../../../global/services/content-service/content.service';
import { MediaPlaywhereComponent } from '../media-playwhere/media-playwhere.component';
import { PlayWhereComponent } from '../play-where/play-where.component';

@Component({
  selector: 'app-playlist-media',
  templateUrl: './playlist-media.component.html',
  styleUrls: ['./playlist-media.component.scss']
})

export class PlaylistMediaComponent implements OnInit {
	
	media_files: API_CONTENT[];
	media_files_no_floating: API_CONTENT[] = [];
	selected_contents: any = [];
	media_files_backup: API_CONTENT[];
	file_not_found: boolean = false;
	show_floating: boolean = false;

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _dialog: MatDialog,
		private _content: ContentService
	) { }

	ngOnInit() {
		this.getDealerContent(this._dialog_data.dealer_id);
	}

	getDealerContent(dealer) {
		this._content.get_content_by_dealer_id(dealer, true).subscribe(
			(data: API_CONTENT[]) => {
				console.log(data);
				this.media_files = data;
				this.media_files_backup = data;

				data.map(
					i => {
						if(i.dealerId !== null && i.dealerId !== "") {
							this.media_files_no_floating.push(i)
						}
					}
				)

				console.log('#getDealerContent', this.media_files);
			}
		)
	}

	displayFloating(e) {
		if (e.checked == true) {
			this.show_floating = e.checked;
			this.media_files_no_floating = this.media_files;
			console.log(this.media_files_no_floating);
		} else {
			this.media_files_no_floating = [];
			this.show_floating = e.checked;
			this.media_files.map(
				i => {
					if(i.dealerId !== null && i.dealerId !== "") {
						this.media_files_no_floating.push(i)
					}
				}
			)
		}
	}

	// Search Content Field
	searchContent(e) {
		this.file_not_found = false;

		if(e.target.value !== '') {
			this.media_files_no_floating = this.media_files_no_floating.filter(
				i => {
					if (i.fileName) {
						return this.removeFilenameHandle(i.fileName).toLowerCase().includes(e.target.value.toLowerCase())
					} else if (i.title) {
						return i.title.toLowerCase().includes(e.target.value.toLowerCase())
					}
				}
			)

			if (this.media_files.length == 0) {
				this.media_files_no_floating = this.media_files_backup;
				this.file_not_found = true;
			}
		} else {
			if (this.show_floating == true) {
				this.media_files_no_floating = this.media_files_backup;
			} else {
				this.media_files_no_floating = [];
				this.media_files_backup.map(
					i => {
						if(i.dealerId !== null && i.dealerId !== "") {
							this.media_files_no_floating.push(i)
						}
					}
				)
			}
		}
	}

	playWhere() {
		console.log('#playWhere', this._dialog_data.playlist_host_license);

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

	addToMarked(e) {
		if (this.selected_contents.includes(e)) {
			this.selected_contents = this.selected_contents.filter(i => {
				return i !== e;
			})
		} else {
			this.selected_contents.push(e)
		}

		if(this.selected_contents.length == 0) {
			localStorage.removeItem('to_blocklist');
		}
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
