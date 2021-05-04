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
	@Output() converted = new EventEmitter;
	is_converted: number = 0;
	_socket: any;

	constructor() { }

	ngOnInit() {
		if (this.content.fileType === 'webm' && this.content.isConverted === 0) {
			this._socket = io(environment.socket_server, {
				transports: ['websocket']
			});

			this._socket.on('video_converted', data => {
				if (data == this.content.uuid) {
					this.is_converted = 1;
					this.converted.emit(data);
				}
			})
	
			this._socket.on('connect', () => {
				console.log('#PlaylistMediaThumbnailComponent - Connected to Socket Server');
			})
			
			this._socket.on('disconnect', () => {
				console.log('#PlaylistMediaThumbnailComponent - Disconnnected to Socket Server');
			})
		}
	}

	removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}
}
