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
import { API_SINGLE_PLAYLIST, API_CONTENT_BLACKLISTED_CONTENTS } from 'src/app/global/models/api_single-playlist.model';
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
            this.playlist_id = this._dialog_data.playlistId;

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

    private checkFileType(index: number): void {
        const content = this.playlist_content[index];
        if (!content) return;

        const { file_type: filetype, classification, file_url: url, file_name: name, duration } = content;
        const fileurl = classification === 'filler-v2' ? url : `${url}${name}`;

        if (filetype === 'webm') this.playVideo(filetype, index, classification);
        else if (filetype === 'feed') this.displayFeed(url, filetype, duration);
        else this.displayImage(fileurl, filetype, duration);

        this.is_fullscreen.emit(this.isFullscreen(index) === 1);
    }

    private playVideo(filetype: string, index: number, classification: string): void {
        this.current_filetype = filetype;

        if (
            index > 0 &&
            this.playlist_content[index].file_name === this.playlist_content[index - 1].file_name &&
            this.videoplayer
        )
            this.videoplayer.nativeElement.play();

        this.current_content = of(
            classification === 'filler-v2'
                ? `${this.playlist_content[this.count].file_url}`
                : `${this.playlist_content[this.count].file_url}${this.playlist_content[this.count].file_name}`,
        );

        this.is_fullscreen.emit(this.isFullscreen(index) === 1);
    }

    public getPlaylistById(): void {
        this.subscription.add(
            this._playlist.get_playlist_by_id(this.playlist_id).subscribe((data) => {
                this.playlist_content = this.playlist_mapToUI(data.playlistContents);
                this.checkFileType(this.count);
            }),
        );
    }

    private displayFeed(file: any, filetype: string, duration: number): void {
        this.current_filetype = filetype;
        this.current_content = file;
        duration = duration || 20;

        setTimeout(() => {
            this.count = this.count < this.playlist_content.length - 1 ? this.count + 1 : 0;
            this.checkFileType(this.count);
        }, duration * 1000);
    }

    public videoEnded(): void {
        this.current_filetype = null;
        this.current_content = null;

        if (this.playlist_content.length > 1) this.count = (this.count + 1) % this.playlist_content.length;
        else this.count = 0;

        setTimeout(
            () => {
                this.checkFileType(this.count);
            },
            this.playlist_content.length > 1 ? 1000 : 0,
        );
    }

    private displayImage(file: any, filetype: string, duration: number): void {
        this.current_filetype = filetype;
        this.current_content = of(file);
        duration = duration || 20;

        setTimeout(() => {
            this.count = (this.count + 1) % this.playlist_content.length;
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
                    p.title,
                    p.playlistContentsSchedule,
                    p.createdBy,
                    p.ownerRoleId,
                    p.classification,
                    p.seq,
                );
            });
        }
    }
}
