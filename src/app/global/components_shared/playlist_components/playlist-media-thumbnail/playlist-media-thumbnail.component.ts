import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Socket } from 'ngx-socket-io';
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

	constructor(
		private _socket: Socket,
	) { 
		this._socket.ioSocket.io.uri = environment.socket_server;
	}

	ngOnInit() {
		this._socket.connect();
		this._socket.on('video_converted', data => {
			if (data == this.content.uuid) {
				this.is_converted = 1;
				this.converted.emit(data);
			}
		})
	}

	removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}
}
