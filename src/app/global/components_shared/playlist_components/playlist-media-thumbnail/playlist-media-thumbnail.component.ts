import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as io from 'socket.io-client';
import { API_CONTENT } from '../../../../global/models/api_content.model';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-playlist-media-thumbnail',
    templateUrl: './playlist-media-thumbnail.component.html',
    styleUrls: ['./playlist-media-thumbnail.component.scss'],
})
export class PlaylistMediaThumbnailComponent implements OnInit {
    @Input() content: any;
    @Input() show_fullscreen_status: boolean;
    @Output() converted = new EventEmitter();
    is_converted: number = 0;
    _socket: any;
    fs_screenshot: string = `${environment.third_party.filestack_screenshot}`;

    constructor() {}

    ngOnInit() {
        if (this.content.fileType === 'webm' || this.content.fileType === 'mp4') {
            if (this.content.fileType == 'webm') {
                this.content.thumbnail = `${this.content.url}${this.content.fileName.substr(0, this.content.fileName.lastIndexOf('.') + 1)}jpg`;
            }

            if (this.content.fileType == 'mp4') {
                this.getMp4Thumbnail(this.content.handlerId);
            }

            if (this.content.isConverted === 0) {
                this._socket = io(environment.socket_server, {
                    transports: ['websocket'],
                    query: 'client=Dashboard__PlaylistMediaThumbnailComponent',
                });

                this._socket.on('video_converted', (data) => {
                    if (data == this.content.uuid) {
                        this.is_converted = 1;
                        this.converted.emit(data);
                    }
                });
            }
        }
    }

    getMp4Thumbnail(handleId) {
        try {
            fetch(
                `https://cdn.filestackcontent.com/video_convert=preset:thumbnail,thumbnail_offset:5/${handleId}`,
            ).then(async (res) => {
                const { data } = await res.json();
                this.content.thumbnail = data.url;
            });
        } catch (err) {
            throw new Error(err);
        }
    }

    removeFilenameHandle(file_name) {
        return file_name.substring(file_name.indexOf('_') + 1);
    }
}
