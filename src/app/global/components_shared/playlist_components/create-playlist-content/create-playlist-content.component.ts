import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UI_PLAYLIST_HOST_LICENSE } from 'src/app/global/models/ui_playlist-host-license.model';
import { UI_BLOCKLIST_CONTENT } from 'src/app/global/models/ui_single-playlist.model';
import { UI_CONTENT, UI_PLAYLIST_CONTENT } from 'src/app/global/models/ui_content.model';
import { API_CONTENT_BLACKLISTED_CONTENTS } from 'src/app/global/models/api_single-playlist.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-create-playlist-content',
  templateUrl: './create-playlist-content.component.html',
  styleUrls: ['./create-playlist-content.component.scss']
})
export class CreatePlaylistContentComponent implements OnInit {

	@Input() blocklist: API_CONTENT_BLACKLISTED_CONTENTS[];
	@Input() content: UI_PLAYLIST_CONTENT;
	@Input() content_id: string;
	@Input() image_uri: string;
	@Input() filename: string;
	@Input() array_index: number;
	@Input() is_fullscreen: number;
	@Input() content_position: number;
	@Input() content_duration_disabled: boolean;
	@Input() host_license: UI_PLAYLIST_HOST_LICENSE[];
	@Output() blocked_content = new EventEmitter();
	@Output() remove_content = new EventEmitter();
	@Output() remove_in_blocklist = new EventEmitter();
	@Output() set_fullscreen = new EventEmitter();
	@Output() deselect_all_host_license = new EventEmitter();
	@Output() content_duration = new EventEmitter();
	duration_value: number;
	checked: boolean = false;

	constructor() { }

	ngOnInit() {
		if (this.content.content_data.is_fullscreen == 1) {
			this.checked = true;
		}

		this.duration_value = this.content.content_data.duration || 20;
	}

	setDurationForContent() {
		if (this.duration_value > 1000) {

			this.duration_value = 1000;

		} else {

			const duration_data = {
				content_id: this.content_id,
				duration: this.duration_value,
				playlist_content_id: this.content.content_data.playlist_content_id
			}

			this.content_duration.emit(duration_data);
		}
	}

	blockedContents(e) {
		this.blocked_content.emit(e);
	}

	removeContent(array_index) {
		this.remove_content.emit(array_index);
	}

	removeInBlocklist(e) {
		this.remove_in_blocklist.emit(e);
	}

	isFullScreen(data){
		setTimeout(() => {
			this.set_fullscreen.emit(this.checked);
		}, 0)
	}

	deselectAllHostLicense(e) {
		this.deselect_all_host_license.emit(e);
	}

	removeFilenameHandle(filename, filetype) {
		// return filename.substring(filename.indexOf('_') + 1);
	}

}
