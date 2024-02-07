import { Component, OnInit, Inject, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { MatSlideToggleChange, MAT_DIALOG_DATA } from '@angular/material';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { MediaModalComponent } from '../media-modal/media-modal.component';
import {
    API_CONTENT,
    UI_CONTENT,
    UI_ROLE_DEFINITION,
    VIDEO_FILETYPE,
    IMAGE_FILETYPE,
    UI_ROLE_DEFINITION_TEXT,
} from 'src/app/global/models';
import {
    AdvertiserService,
    AuthService,
    ContentService,
    HostService,
} from 'src/app/global/services';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { environment as env } from 'src/environments/environment';
@Component({
    selector: 'app-media-viewer',
    templateUrl: './media-viewer.component.html',
    styleUrls: ['./media-viewer.component.scss'],
})
export class MediaViewerComponent implements OnInit, OnDestroy {
    @Output() deleted: EventEmitter<boolean> = new EventEmitter();
    @Input() is_view_only = false;
    @Input() page = 'media-library';

    file_data: {
        content_array: UI_CONTENT[];
        index: number;
        selected: UI_CONTENT;
        is_advertiser?: boolean;
        zoneContent?: boolean;
    };
    file_size_formatted: any;
    feed_demo_url = `${env.third_party.filestack_screenshot}/`;
    has_updated_content = false;
    is_admin = this._isAdmin;
    is_advertiser = false;
    is_dealer_admin = false;
    is_edit = false;
    is_dealer = this._isDealer || this._isSubDealer;
    updated_content: UI_CONTENT;

    protected _unsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialog_data: any,
        private _auth: AuthService,
        private _advertiser: AdvertiserService,
        private _content: ContentService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _dialog_ref: MatDialogRef<MediaViewerComponent>,
        private _host: HostService,
    ) {}

    ngOnInit() {
        let role = this._auth.current_role;
        if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) this.is_dealer_admin = true;
        this.file_data = this._dialog_data;
        this.configureContents();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    fetchNextMedia(index: number) {
        this.file_data.selected = this.file_data.content_array[index + 1];
        if (this.file_data.selected.content_data)
            this.file_data.selected = this.file_data.selected.content_data;
        this.configureSelectedContent(this.file_data.selected);
    }

    fetchPrevMedia(index: number) {
        this.file_data.selected = this.file_data.content_array[index - 1];
        if (this.file_data.selected.content_data)
            this.file_data.selected = this.file_data.selected.content_data;
        this.configureSelectedContent(this.file_data.selected);
    }

    onCloseMediaViewer() {
        if (this.has_updated_content) return this.updated_content;
        return false;
    }

    onSetContentAsFiller(event: MatSlideToggleChange) {
        const contentId = this.file_data.selected.content_id;

        this._content
            .update_content_to_filler({ contentId, isFiller: event.checked })
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                async () => await this.updateContentsArray(contentId),
                (error) => {
                    console.error(error);
                },
            );
    }

    reassignMedia() {
        const temp = [];
        temp.push({ is_edit: true });
        temp.push({ id: this.file_data.selected.content_id });
        this.is_edit = true;

        const dialogRef = this._dialog.open(MediaModalComponent, {
            width: '600px',
            panelClass: 'app-media-modal',
            disableClose: true,
            data: temp,
        });

        dialogRef.afterClosed().subscribe((response) => {});
    }

    async onDeleteMedia(event: { stopPropagation() }) {
        event.stopPropagation();
        const response: boolean | string = await this.openWarningModal(
            'warning',
            'Delete Content',
            'Are you sure you want to delete this content',
            '',
            'delete',
        ).toPromise();

        if (!response || typeof response !== 'string' || response !== 'delete') return;

        const filter = [{ contentid: this.file_data.selected.content_id }];

        this._content
            .remove_content(filter)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                () => this._dialog_ref.close(true),
                (error) => {
                    console.error(error);
                },
            );
    }

    async onToggleContentProtection(event: { stopPropagation() }) {
        // event.stopPropagation();
        const isLocked = this.file_data.selected.is_protected;
        const message = isLocked === 1 ? 'Unlock Content' : 'Lock Content';
        const status = isLocked === 1 ? 'unlock' : 'lock';
        const data = `Are you sure you want to ${status} the content?`;
        const response: boolean | string = await this.openWarningModal(
            'warning',
            message,
            data,
        ).toPromise();

        if ((typeof response === 'boolean' && !response) || typeof response === 'string') return;

        const { content_id, is_protected } = this.file_data.selected;

        this._content
            .update_content_protection({ contentId: content_id, isProtected: is_protected ? 0 : 1 })
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                async () => await this.updateContentsArray(content_id),
                (error) => {
                    console.error(error);
                },
            );
    }

    private configureContents() {
        this.configureSelectedContent(this.file_data.selected);

        // for cycling through content within the media viewer
        this.file_data.content_array.map((data, index) => {
            if (data.content_data) {
                data.content_data.index = index;
                data = data.content_data;
            } else {
                data.index = index;
            }
        });
    }

    private configureSelectedContent(selected: UI_CONTENT) {
        var datetime = new Date(selected.date_uploaded);
        var time =
            datetime.getHours() +
            ':' +
            datetime.getMinutes() +
            ' ' +
            (datetime.getHours() < 12 ? 'AM' : 'PM');
        this.file_data.selected.time_uploaded = time;
        this.file_size_formatted = this.getFileSize(selected.file_size);
        this.file_data.selected.index = selected.index;

        // File URL Base on Filetype
        if (selected.file_type in VIDEO_FILETYPE) {
            if (this.file_data.zoneContent) {
                this.file_data.selected.file_url = `${selected.file_url}`;
            } else {
                this.file_data.selected.file_url = `${env.s3}${selected.file_name}`;
            }
        } else if (selected.file_type in IMAGE_FILETYPE) {
            this.file_data.selected.file_url = selected.thumbnail;
        }

        // Get Owners
        this.getOwner(selected);
    }

    private getAdvertiser(id: string) {
        this._advertiser
            .get_advertiser_by_id(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => (this.file_data.selected.owner_name = data.advertiser.name),
                (error) => {
                    console.error(error);
                },
            );
    }

    private getDealer(id: string): void {
        this._dealer
            .get_dealer_by_id(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => (this.file_data.selected.owner_name = data.businessName),
                (error) => {
                    console.error(error);
                },
            );
    }

    private getFileSize(bytes: number, decimals = 2) {
        if (bytes === 0 || bytes === null) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    private getHost(id: string) {
        this._host.get_host_by_id(id).subscribe(
            (data) => (this.file_data.selected.owner_name = data.host.name),
            (error) => {
                console.error(error);
            },
        );
    }

    private getOwner(selected): void {
        if (selected.advertiser_id != '' && selected.advertiser_id != null) {
            selected.owner_type = 'Advertiser';
            this.getAdvertiser(selected.advertiser_id);
        } else if (selected.host_id != '' && selected.host_id != null) {
            selected.owner_type = 'Host';
            this.getHost(selected.host_id);
        } else if (selected.dealer_id != '' && selected.dealer_id != null) {
            selected.owner_type = 'Dealer';
            this.getDealer(selected.dealer_id);
        } else if (selected.owner_role_id === 2) {
            selected.owner_type = 'Dealer Admin';
            selected.owner_name = selected.created_by_name;
        } else {
            selected.owner_type = 'Administrator';
            selected.owner_name = 'Administrator';
        }
    }

    private mapContentsToUI(data: API_CONTENT[]): UI_CONTENT[] {
        return data.map((m: API_CONTENT) => {
            let fileThumbnailUrl = '';

            if (m.fileType === 'webm' || m.fileType === 'mp4') {
                fileThumbnailUrl = this.renameWebmThumb(m.fileName, m.url);
            } else {
                fileThumbnailUrl = m.previewThumbnail || m.thumbnail;
            }

            return new UI_CONTENT(
                m.playlistContentId,
                m.createdBy,
                m.contentId,
                m.createdByName,
                m.dealerId,
                m.duration,
                m.hostId,
                m.advertiserId,
                m.fileName,
                m.url,
                m.fileType,
                m.handlerId,
                m.dateCreated,
                m.isFullScreen,
                m.filesize,
                fileThumbnailUrl,
                m.isActive,
                m.isConverted,
                m.isProtected,
                m.uuid,
                m.title,
                '',
                m.createdByName,
                m.ownerRoleId,
                m.classification,
            );
        });
    }

    private openWarningModal(
        status: string,
        message: string,
        data: string,
        return_msg: string = '',
        action: string = '',
    ) {
        const dialogRef = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: {
                status: status,
                message: message,
                data: data,
                return_msg: return_msg,
                action: action,
            },
        });

        return dialogRef.afterClosed();
    }

    private renameWebmThumb(filename: string, source: string) {
        return `${source}${filename.substr(0, filename.lastIndexOf('.') + 1)}jpg`;
    }

    private async updateContentsArray(contentId: string): Promise<void> {
        try {
            this.has_updated_content = true;
            this.updated_content = this.mapContentsToUI([
                (await this._content.get_content_by_id(contentId).toPromise()).content,
            ])[0];
            const index = (this._dialog_data.content_array as UI_CONTENT[]).findIndex(
                (content) => content.content_id === this.updated_content.content_id,
            );
            this._dialog_data.content_array[index] = this.updated_content;
            this._dialog_data.selected = this.updated_content;
            this.file_data = this._dialog_data;
            this.configureContents();
        } catch (e) {}
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
