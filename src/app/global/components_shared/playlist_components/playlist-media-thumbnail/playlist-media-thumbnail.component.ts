import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as io from 'socket.io-client';
import { API_CONTENT } from '../../../../global/models/api_content.model';
import { environment } from '../../../../../environments/environment';

@Component({
	selector: 'app-playlist-media-thumbnail',
	templateUrl: './playlist-media-thumbnail.component.html',
	styleUrls: ['./playlist-media-thumbnail.component.scss']
})
export class PlaylistMediaThumbnailComponent implements OnInit {
	@Input() content: API_CONTENT;
	@Input() show_fullscreen_status: boolean;
	@Output() converted = new EventEmitter();
	is_converted: number = 0;
	_socket: any;
	fs_screenshot: string = `${environment.third_party.filestack_screenshot}`;

	constructor() {}

	ngOnInit() {
		if (this.content.fileType === 'webm' || this.content.fileType === 'mp4') {
			// Thumbnail
			this.content.thumbnail = `${this.content.url}${this.content.fileName.substr(0, this.content.fileName.lastIndexOf('.') + 1)}jpg`;

			if (this.content.isConverted === 0) {
				this._socket = io(environment.socket_server, {
					transports: ['websocket'],
					query: 'client=Dashboard__PlaylistMediaThumbnailComponent'
				});

				this._socket.on('video_converted', (data) => {
					if (data == this.content.uuid) {
						this.is_converted = 1;
						this.converted.emit(data);
					}
				});

				this._socket.on('connect', () => {});

				this._socket.on('disconnect', () => {});
			}
		}
	}

	removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}
}
