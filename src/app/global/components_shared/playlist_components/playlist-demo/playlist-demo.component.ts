import {
    Component,
    OnInit,
    Input,
    Injectable,
    Output,
    EventEmitter,
    ViewChild,
    ElementRef,
    Inject,
    Optional,
} from '@angular/core';
import { Subscription, Observable, of } from 'rxjs';
import { PlaylistService } from '../../../services/playlist-service/playlist.service';
import { UI_CONTENT } from 'src/app/global/models/ui_content.model';
import {
    API_SINGLE_PLAYLIST,
    API_CONTENT_BLACKLISTED_CONTENTS,
} from 'src/app/global/models/api_single-playlist.model';
import { MAT_DIALOG_DATA } from '@angular/material';

@Injectable({
    providedIn: 'root',
})
@Component({
    selector: 'app-playlist-demo',
    templateUrl: './playlist-demo.component.html',
    styleUrls: ['./playlist-demo.component.scss'],
})
export class PlaylistDemoComponent implements OnInit {
    @Input() playlist_id: string;
    @Input() passed_playlist_content: UI_CONTENT[];
    @Input() playlist_updating: boolean = false;
    @Output() is_fullscreen = new EventEmitter();
    @Input() no_stretch: boolean;
    current_filetype: string;
    current_content: Observable<string>;
    playlist_content: UI_CONTENT[];
    slide_duration: number = 8000;
    in_modal: boolean = false;
    subscription: Subscription = new Subscription();
    count: number = 0;
    @ViewChild('videoPlayer', { static: false }) videoplayer: ElementRef;

    constructor(
        private _playlist: PlaylistService,
        @Optional() @Inject(MAT_DIALOG_DATA) public _dialog_data: any,
    ) {}

    ngOnInit() {
        if (this._dialog_data) {
            this.in_modal = true;
            this.playlist_id = this._dialog_data;

            this.getPlaylistById();
        } else {
            if (this.passed_playlist_content) {
                this.playlist_content = this.passed_playlist_content;
                this.checkFileType(this.count);
            } else {
                this.getPlaylistById();
            }
        }
    }

    mediaFileError(e) {
        this.checkFileType(this.count++);
    }

    checkFileType(i) {
        if (this.playlist_content[i]) {
            const filetype = this.playlist_content[i].file_type;
            const fileurl = `${this.playlist_content[i].file_url}${this.playlist_content[i].file_name}`;

            if (filetype == 'webm') {
                this.playVideo(filetype, i);
            } else if (filetype == 'feed') {
                const duration = this.playlist_content[i].duration;
                this.displayFeed(this.playlist_content[i].file_url, filetype, duration);
                if (this.isFullscreen(i) == 1) {
                    this.is_fullscreen.emit(true);
                } else {
                    this.is_fullscreen.emit(false);
                }
            } else {
                const duration = this.playlist_content[i].duration;
                this.displayImage(fileurl, filetype, duration);
                if (this.isFullscreen(i) == 1) {
                    this.is_fullscreen.emit(true);
                } else {
                    this.is_fullscreen.emit(false);
                }
            }
        }
    }

    playVideo(filetype, i) {
        this.current_filetype = filetype;

        if (i > 0) {
            if (
                this.playlist_content[i].file_name == this.playlist_content[i - 1].file_name &&
                this.videoplayer
            ) {
                this.videoplayer.nativeElement.play();
            }
        }

        this.current_content = of(
            `${this.playlist_content[this.count].file_url}${this.playlist_content[this.count].file_name}`,
        );

        if (this.isFullscreen(i) == 1) {
            this.is_fullscreen.emit(true);
        } else {
            this.is_fullscreen.emit(false);
        }
    }

    getPlaylistById() {
        this.subscription.add(
            this._playlist
                .get_playlist_by_id(this.playlist_id)
                .subscribe((data: API_SINGLE_PLAYLIST) => {
                    this.playlist_content = this.playlist_mapToUI(data.playlistContents);
                    this.checkFileType(this.count);
                }),
        );
    }

    displayFeed(file, filetype, duration) {
        this.current_filetype = filetype;
        this.current_content = file;

        if (duration == 0) {
            duration = 20;
        }

        setTimeout(() => {
            if (this.count < this.playlist_content.length - 1) {
                this.count++;
            } else {
                this.count = 0;
            }
            this.checkFileType(this.count);
        }, duration * 1000);
    }

    videoEnded() {
        this.current_filetype = null;
        this.current_content = null;

        if (this.playlist_content.length > 1) {
            if (this.count++ != this.playlist_content.length - 1) {
                setTimeout(() => {
                    this.checkFileType(this.count);
                }, 1000);
            } else {
                this.count = 0;
                setTimeout(() => {
                    this.checkFileType(this.count);
                }, 1000);
            }
        } else {
            setTimeout(() => {
                this.checkFileType(0);
            }, 0);
        }
    }

    displayImage(file, filetype, duration) {
        this.current_filetype = filetype;
        this.current_content = of(file);

        if (duration == 0) {
            duration = 20;
        }

        setTimeout(() => {
            if (this.count < this.playlist_content.length - 1) {
                this.count++;
            } else {
                this.count = 0;
            }
            this.checkFileType(this.count);
        }, duration * 1000);
    }

    isFullscreen(i) {
        return this.playlist_content[i].is_fullscreen;
    }

    playlist_mapToUI(data: any[]): UI_CONTENT[] {
        if (data) {
            return data.map((p: any) => {
                return new UI_CONTENT(
                    p.playlistContentId,
                    p.createdBy,
                    p.contentId,
                    p.createdByName,
                    p.dealerId,
                    p.duration,
                    p.hostId,
                    p.advertiserId,
                    p.fileName,
                    p.url,
                    p.fileType,
                    p.handlerId,
                    p.dateCreated,
                    p.isFullScreen,
                    p.filesize,
                    p.thumbnail,
                    p.isActive,
                    p.isConverted,
                    p.isProtected,
                    p.uuid,
                );
            });
        }
    }
}
