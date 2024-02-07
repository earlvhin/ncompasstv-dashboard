import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subject } from 'rxjs';

import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { OptionsComponent } from '../options/options.component';
import { API_CONTENT } from 'src/app/global/models';
import { HelperService } from 'src/app/global/services';
import { environment } from 'src/environments/environment';
import { takeUntil } from 'rxjs/operators';
import { IsimagePipe } from 'src/app/global/pipes';

@Component({
    selector: 'app-playlist-content',
    templateUrl: './playlist-content.component.html',
    styleUrls: ['./playlist-content.component.scss'],
    providers: [IsimagePipe],
})
export class PlaylistContentComponent implements OnInit, OnDestroy {
    @Input() array_index: number;
    @Input() content: API_CONTENT;
    @Input() playlist_host_license: any;
    @Input() is_admin? = false;
    @Input() is_dealer? = false;
    @Input() is_marking: boolean;
    @Input() is_list: boolean;
    @Input() is_view_only = false;
    @Input() dealer: string;
    @Input() schedule_status?: string;
    @Input() page? = '';
    @Input() total_contents? = 0;
    @Input() playlist_contents: any;
    @Output() options_saved = new EventEmitter();
    @Output() reset_playlist_content = new EventEmitter();
    @Output() remove_playlist_content = new EventEmitter();
    @Output() log_content_history = new EventEmitter();

    canSetFrequencyBorder = false;
    contentTitle: string;
    frequency: number;
    fs_screenshot: string = `${environment.third_party.filestack_screenshot}`;
    hoveredPlaylistContentId: string;
    isBaseFrequency = false;
    isChildFrequency = false;

    protected _unsubscribe: Subject<void> = new Subject();

    constructor(
        private _dialog: MatDialog,
        private _helper: HelperService,
        private _isImage: IsimagePipe,
    ) {}

    ngOnInit() {
        if (this.content.classification == 'filler-v2')
            this.content.thumbnail = `${this.content.url.substr(0, this.content.url.lastIndexOf('.') + 1)}jpg`;

        if (this.content.fileType === 'webm' && this.content.classification != 'filler-v2')
            this.content.thumbnail = `${this.content.url}${this.content.fileName.substr(0, this.content.fileName.lastIndexOf('.') + 1)}jpg`;

        if (this.content.fileType === 'mp4' && this.content.handlerId)
            this.getMp4Thumbnail(this.content.handlerId);

        if (this._isImage.transform(this.content.fileType))
            this.content.thumbnail = `${this.content.url}${this.content.fileName}`;

        if (this.playlist_host_license) {
            this.playlist_host_license = this.playlist_host_license.sort((a, b) => {
                return a.host.name.localeCompare(b.host.name);
            });
        }

        if (this.page === 'single-playlist') {
            this.isBaseFrequency = this.content.frequency === 22 || this.content.frequency === 33;
            this.isChildFrequency = this.content.frequency === 2 || this.content.frequency === 3;
            this.frequency = this.setFrequency(this.content.frequency);
        }

        this.contentTitle = this.content.title;

        if (this.contentTitle.length >= 15)
            this.contentTitle = `${this.contentTitle.substr(0, 12)}...`;

        this.subscribeToContentHover();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    getMp4Thumbnail(handleId) {
        try {
            this.content.thumbnail = `${this.content.url}${this.content.fileName.substr(0, this.content.fileName.lastIndexOf('.') + 1)}jpg`;
        } catch (err) {
            throw new Error(err);
        }
    }

    optionsModal(): void {
        const data = {
            index: this.array_index,
            content: this.content,
            host_license: this.playlist_host_license,
            total_contents: this.total_contents,
            contents_list: this.playlist_contents,
        };

        const dialog = this._dialog.open(OptionsComponent, {
            data,
            width: '1200px',
            height: '750px',
        });

        dialog.afterClosed().subscribe((response) => {
            if (typeof response === 'undefined') return;
            if (typeof response === 'object') return this.options_saved.emit(response);
            return this.reset_playlist_content.emit(true);
        });
    }

    removeContentToPlaylistModal(id, contentId): void {
        const dialog = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: {
                status: 'warning',
                message: `Remove Playlist Content - #${this.array_index}`,
                data: `Are you sure you want to remove content #${this.array_index} in this playlist?`,
            },
        });

        dialog.afterClosed().subscribe((response) => {
            if (!response) return;
            this.remove_playlist_content.emit(id);
            this.log_content_history.emit({ id, contentId });
        });
    }

    removeFilenameHandle(file_name) {
        return file_name.substring(file_name.indexOf('_') + 1);
    }

    setHoveredBaseFrequency(content: API_CONTENT) {
        let id: string;
        if (this.isBaseFrequency) id = content.playlistContentId;
        else id = content.parentId;
        if (!id) return;
        this._helper.onHoverContent.next({ playlistContentId: id });
    }

    unsetHoveredBaseFrequency() {
        this._helper.onHoverContent.next({ playlistContentId: undefined });
    }

    private setFrequency(value: number): number {
        let result: number;

        switch (value) {
            case 2:
            case 22:
                result = 2;
                break;

            case 3:
            case 33:
                result = 3;
                break;

            default:
                result = 0;
        }

        return result;
    }

    private subscribeToContentHover() {
        this._helper.onHoverContent.pipe(takeUntil(this._unsubscribe)).subscribe((response) => {
            let result = false;
            if (!response) return;
            const { playlistContentId } = response;
            if (this.isBaseFrequency) result = this.content.playlistContentId === playlistContentId;
            else result = this.content.parentId === playlistContentId;
            this.canSetFrequencyBorder = result;
        });
    }
}
