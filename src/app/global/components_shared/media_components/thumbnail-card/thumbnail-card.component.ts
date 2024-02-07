import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as io from 'socket.io-client';

import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { environment } from 'src/environments/environment';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from 'src/app/global/models';
import { AuthService, ContentService } from 'src/app/global/services';
import { Router } from '@angular/router';

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

    fs_screenshot: string = `${environment.third_party.filestack_screenshot}`;
    is_admin = this._isAdmin;
    is_dealer = this._isDealer;
    route: string;
    mp4_thumb: string;

    private return_mes: string;
    private role = this._auth.current_role;

    protected _socket: any;
    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _content: ContentService,
        private router: Router,
    ) {}

    ngOnInit() {
        if (this.role === UI_ROLE_DEFINITION_TEXT.dealeradmin)
            this.role = UI_ROLE_DEFINITION_TEXT.administrator;
        this.route = `/${this.role}/media-library/${this.content_id}`;
        if (
            !this.disconnect_to_socket &&
            (this.filetype == 'webm' || this.filetype === 'mp4') &&
            this.is_converted == 0
        ) {
            this._socket = io(environment.socket_server, {
                transports: ['websocket'],
                query: 'client=Dashboard__ThumbnailCardComponent',
            });

            this._socket.on('connect', () => {});

            this._socket.on('disconnect', () => {});

            this._socket.on('video_converted', (data) => {
                if (data == this.uuid) {
                    this.is_converted = 1;
                    this.converted.emit(true);
                }
                this.ngOnInit();
            });
        }

        if (this.filetype === 'mp4') {
            this.getMp4Thumbnail();
        }
    }

    ngOnDestroy() {
        if (this._socket) this._socket.disconnect();
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    deleteContentArray(event: { checked: boolean }, content_id: string): void {
        if (event.checked) this.is_checked = true;
        this.content_to_delete.emit({ toadd: event.checked, id: content_id });
    }

    deleteMedia(event): void {
        this.warningModal(
            'warning',
            'Delete Content',
            'Are you sure you want to delete this content?',
            this.return_mes,
            'delete',
        );
        event.stopPropagation();
    }

    deleteFiller() {
        this.filler_delete.emit(true);
    }

    routeToMedia(filename) {
        if (!this.is_filler) this.router.navigate([`/${this.route}`, filename]);
    }

    getMp4Thumbnail() {
        try {
            fetch(
                `https://cdn.filestackcontent.com/video_convert=preset:thumbnail,thumbnail_offset:5/${this.handle}`,
            ).then(async (res) => {
                const { data } = await res.json();
                this.mp4_thumb = data.url;
            });

            return;
        } catch (err) {
            throw new Error(err);
        }
    }

    private deleteContentLogs() {
        this.warningModal(
            'warning',
            'Delete Content Logs',
            'Do you want to delete all the logs of this content',
            '',
            'delete-logs',
        );
    }

    private warningModal(
        status: string,
        message: string,
        data: string,
        return_msg: string,
        action: string,
    ): void {
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
                            this.return_mes = data.message;
                            this.deleted.emit(true);
                        },
                        (error) => {
                            console.error(error);
                        },
                    );
            }
        });
    }

    protected get _isAdmin() {
        return this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.administrator;
    }

    protected get _isDealer() {
        return this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer;
    }

    protected get _isSubDealer() {
        return this._auth.current_user_value.role_id === UI_ROLE_DEFINITION['sub-dealer'];
    }
}
