import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as io from 'socket.io-client';

import { environment } from 'src/environments/environment';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from 'src/app/global/models';
import { AuthService, ContentService } from 'src/app/global/services';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';

@Component({
    selector: 'app-thumbnail-card',
    templateUrl: './thumbnail-card.component.html',
    styleUrls: ['./thumbnail-card.component.scss'],
})
export class ThumbnailCardComponent implements OnInit {
    @Input() classification: string;
    @Input() content_id: string;
    @Input() dealer: string;
    @Input() disconnect_to_socket: boolean;
    @Input() file_url: string;
    @Input() filename: string;
    @Input() filetype: string;
    @Input() handle: string;
    @Input() image_uri: string;
    @Input() is_checked: boolean;
    @Input() is_converted: number;
    @Input() is_filler: boolean;
    @Input() is_fullscreen: number;
    @Input() is_protected: number;
    @Input() is_scheduled_content = false;
    @Input() is_view_only = false;
    @Input() multiple_delete: boolean;
    @Input() sequence: number;
    @Input() uuid: string;
    @Input() zone_content: boolean;
    @Output() converted: EventEmitter<boolean> = new EventEmitter();
    @Output() deleted: EventEmitter<boolean> = new EventEmitter();
    @Output() content_to_delete = new EventEmitter();
    @Output() filler_delete = new EventEmitter();

    isAdmin = this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.administrator;
    isDealer = this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer;
    route: string;
    mp4Thumbnail: string;

    private returnMessage: string;
    private role = this._auth.current_role;
    protected _socket: any;
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _content: ContentService,
        private _dialog: MatDialog,
        private _router: Router,
    ) {}

    ngOnInit() {
        if (this.role === UI_ROLE_DEFINITION_TEXT.dealeradmin) this.role = UI_ROLE_DEFINITION_TEXT.administrator;
        this.route = `/${this.role}/media-library/${this.content_id}`;

        if (this.isConvertingVideos) {
            this._socket = io(environment.socket_server, {
                transports: ['websocket'],
                query: 'client=Dashboard__ThumbnailCardComponent',
            });

            this._socket.on('video_converted', (data: string) => {
                if (data == this.uuid) {
                    this.is_converted = 1;
                    this.converted.emit(true);
                }

                this.ngOnInit();
            });
        }

        this.getMp4Thumbnail();
    }

    ngOnDestroy() {
        if (this._socket) this._socket.disconnect();
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    public deleteContentArray(event: { checked: boolean }, content_id: string): void {
        if (event.checked) this.is_checked = true;
        this.content_to_delete.emit({ toadd: event.checked, id: content_id });
    }

    public deleteMedia(e: Event): void {
        this.warningModal(
            'warning',
            'Delete Content',
            'Are you sure you want to delete this content?',
            this.returnMessage,
            'delete',
        );
        e.stopPropagation();
    }

    public deleteFiller(): void {
        this.filler_delete.emit(true);
    }

    public routeToMedia(filename: string): void {
        // Disable this function if multiple selection is enabled
        if (this.multiple_delete) return;

        // Open the media dialog if the content is a filler
        if (this.is_filler) {
            const url = filename.replace(/ /g, '+');

            const data: MatDialogConfig = {
                data: { url, filetype: this.filetype, filename: this.filename },
                width: '768px',
                panelClass: 'no-padding',
            };

            this._dialog.open(ImageViewerComponent, data);

            return;
        }

        // Otherwise redirect to the single-content page
        this._router.navigate([`/${this.route}`, filename]);
    }

    private async getMp4Thumbnail(): Promise<void> {
        if (this.filetype !== 'mp4') return;

        try {
            const url = `https://cdn.filestackcontent.com/video_convert=preset:thumbnail,thumbnail_offset:5/${this.handle}`;
            const thumbnail = await fetch(url);
            const { data } = await thumbnail.json();
            this.mp4Thumbnail = data.url;
        } catch (err) {
            console.error('Failed to retrieve thumbnail for MP4 content', err);
        }
    }

    private isConvertingVideos(): boolean {
        return (
            !this.disconnect_to_socket && (this.filetype == 'webm' || this.filetype === 'mp4') && this.is_converted == 0
        );
    }

    private warningModal(status: string, message: string, data: string, return_msg: string, action: string): void {
        this._dialog.closeAll();

        const dialogRef = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status, message, data, return_msg, action },
        });

        dialogRef.afterClosed().subscribe((result) => {
            const filter = [{ contentid: this.content_id }];

            if (result == 'delete') {
                this._content
                    .remove_content(filter)
                    .pipe(takeUntil(this._unsubscribe))
                    .subscribe(
                        (data) => {
                            this.returnMessage = data.message;
                            this.deleted.emit(true);
                        },
                        (error) => {
                            console.error(error);
                        },
                    );
            }
        });
    }
}
