import { HttpResponse } from '@angular/common/http';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { MatFileUploadQueueComponent } from 'angular-material-fileupload';

import { UI_CURRENT_USER } from 'src/app/global/models';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-upload-image-dialog',
    templateUrl: './upload-image-dialog.component.html',
    styleUrls: ['./upload-image-dialog.component.scss'],
})
export class UploadImageDialogComponent implements OnInit, AfterViewInit {
    @ViewChild('imageUploadQueue', { static: false }) queuedImages: MatFileUploadQueueComponent;
    @Input() currentUser: UI_CURRENT_USER;
    @Input() currentRole: string;
    @Input() hostId: string;

    isLoading = false;
    queuedForUploadCount = 0;
    uploadUrl: string;

    constructor(private _dialog_ref: MatDialogRef<UploadImageDialogComponent>) {}

    ngOnInit() {
        this.uploadUrl = `${this.apiBase}${this.uploadEndpoint}?hostId=${this.hostId}&type=1&createdBy=${this.currentUserId}`;
    }

    ngAfterViewInit() {}

    onClickChooseFilesBtn() {
        const input = document.getElementById('singleFile');
        input.click();
    }

    onQueueImage() {
        // workaround to filter out non-image files
        setTimeout(() => {
            const files = [...(this.queuedImages.files as File[])];
            this.queuedImages.files = files.filter((file) => file.type.includes('image'));
            this.queuedForUploadCount = this.queuedImages.files.length;
        }, 1000);
    }

    uploaded(data: { event: HttpResponse<any> }) {
        const serverEvent = data.event;

        // If the event has a body then the upload is complete
        if (serverEvent.body) this.queuedForUploadCount--;
        if (this.queuedForUploadCount <= 0) this._dialog_ref.close();
    }

    protected get apiBase() {
        return environment.base_uri;
    }

    protected get currentUserId() {
        return this.currentUser.user_id;
    }

    protected get uploadEndpoint() {
        return environment.create.amazon_s3_upload;
    }
}
