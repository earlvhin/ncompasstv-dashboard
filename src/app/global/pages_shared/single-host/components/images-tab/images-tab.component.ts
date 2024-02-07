import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as filestack from 'filestack-js';

import { environment } from 'src/environments/environment';
import {
    API_HOST_FILE,
    HOST_S3_FILE,
    PAGING,
    UI_CURRENT_USER,
    UI_HOST_FILE,
} from 'src/app/global/models';
import { HelperService, HostService } from 'src/app/global/services';

@Component({
    selector: 'app-images-tab',
    templateUrl: './images-tab.component.html',
    styleUrls: ['./images-tab.component.scss'],
})
export class ImagesTabComponent implements OnInit, OnDestroy {
    @Input() currentRole: string;
    @Input() currentUser: UI_CURRENT_USER;
    @Input() hostId: string;

    hasNoData = false;
    images: API_HOST_FILE[] = [];
    isViewOnly: boolean;
    pagingData: PAGING;
    tableColumns: string[];
    tableData: UI_HOST_FILE[] = [];

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _helper: HelperService,
        private _host: HostService,
    ) {}

    ngOnInit() {
        this.tableColumns = this.columns;
        this.isViewOnly = this.currentUser.roleInfo.permission === 'V';
        this.getImages();
        this.subscribeToRefreshPage();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    getImages(page = 1) {
        this.images = [];

        this._host
            .get_files_by_type(this.hostId, 1, page)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    this.pagingData = response;

                    if (!response.entities || response.entities.length <= 0) {
                        this.hasNoData = true;
                        return;
                    }

                    const images = response.entities as API_HOST_FILE[];
                    this.images = [...images];
                    this.tableData = this.mapToTable([...images]);
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    onClickUploadBtn() {
        const client = filestack.init(environment.third_party.filestack_api_key);
        client.picker(this.filestackOptions).open();
    }

    private mapToTable(data: API_HOST_FILE[]): UI_HOST_FILE[] {
        let count = this.pagingData.pageStart;

        return data.map((file) => {
            return {
                id: { value: file.id, link: null, editable: false, hidden: true },
                index: { value: count++, link: null, editable: false, hidden: false },
                thumbnail: {
                    value: file.url,
                    link: null,
                    isImage: true,
                    editable: false,
                    hidden: false,
                },
                fileName: { value: file.filename, link: null, editable: false, hidden: false },
                alias: {
                    value: file.alias,
                    id: file.id,
                    editable: true,
                    label: 'Host Photo Alias',
                    hidden: false,
                },
                date: {
                    value: this._date.transform(file.dateCreated, 'MMM dd, y h:mm a'),
                    editable: false,
                    hidden: false,
                },
                s3FileName: { value: file.s3Filename, hidden: true },
            };
        });
    }

    private subscribeToRefreshPage() {
        this._helper.onRefreshSingleHostImagesTab
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(() => this.getImages());
    }

    protected get columns() {
        return ['#', 'Thumbnail', 'Filename', 'Alias', 'Upload Date', 'Actions'];
    }

    protected get filestackOptions(): filestack.PickerOptions {
        return {
            storeTo: {
                location: 's3',
                container: 'n-compass-files',
                region: 'us-east-1',
            },
            accept: ['image/jpg', 'image/jpeg', 'image/png'],
            maxFiles: 10,
            imageMax: [720, 640],
            onUploadDone: (response) => {
                const files = response.filesUploaded.map((uploaded) => {
                    const { filename, key } = uploaded;
                    return { oldFile: filename, newFile: key };
                });

                const toUpload: HOST_S3_FILE = {
                    hostId: this.hostId,
                    type: 1,
                    createdBy: this.currentUser.user_id,
                    files,
                };

                this._host
                    .upload_s3_files(toUpload)
                    .pipe(takeUntil(this._unsubscribe))
                    .subscribe(
                        () => this.ngOnInit(),
                        (error) => {
                            console.error(error);
                        },
                    );
            },
        };
    }
}
