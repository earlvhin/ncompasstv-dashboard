import { Component, Input, OnInit } from '@angular/core';
import { DatePipe, formatNumber } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as moment from 'moment';

import { HostService } from 'src/app/global/services';
import { API_HOST_CONTENT, PAGING, UI_HOST_CONTENT } from 'src/app/global/models';

@Component({
    selector: 'app-host-contents-tab',
    templateUrl: './contents-tab.component.html',
    styleUrls: ['./contents-tab.component.scss'],
})
export class ContentsTabComponent implements OnInit {
    @Input() currentRole: string;
    @Input() hostId: string;

    contents: API_HOST_CONTENT[];
    contentsForDialog: any[];
    hasNoData = false;
    pagingData: PAGING;
    tableColumns: string[];
    tableData: UI_HOST_CONTENT[];

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _date: DatePipe,
        private _host: HostService,
    ) {}

    ngOnInit() {
        this.tableColumns = this.columns;
        this.getContents();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    getContents(page = 1): void {
        this.contents = [];
        this._host
            .get_contents(this.hostId, page)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if (response.message || response.contents.length <= 0) {
                        this.tableData = [];
                        this.hasNoData = true;
                        return;
                    }

                    this.pagingData = response.paging;
                    this.contents = response.contents;

                    //for preview
                    this.contents.map((content) => {
                        content.url = content.url.replace(
                            'https://n-compass-filestack.s3.amazonaws.com/',
                            '',
                        );
                    });

                    this.contentsForDialog = this.mapToMediaPreviewDialog(this.contents);
                    this.tableData = this.mapToTable(response.contents);
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private parseTotalDuration(data: number): string {
        if (!data) return '0';
        const duration = moment.duration(data, 'seconds');
        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    private mapToTable(data: API_HOST_CONTENT[]): UI_HOST_CONTENT[] {
        let count = this.pagingData.pageStart;

        return data.map((content) => {
            return {
                id: { value: content.advertiserId, link: null, editable: false, hidden: true },
                index: { value: count++, link: null, editable: false, hidden: false },
                name: {
                    value: content.title ? content.title : '',
                    link: `/${this.currentRole}/media-library/${content.contentId}`,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                type: {
                    value:
                        content.fileType == 'jpeg' ||
                        content.fileType == 'jfif' ||
                        content.fileType == 'jpg' ||
                        content.fileType == 'png'
                            ? 'Image'
                            : 'Video',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                totalPlayCount: {
                    value: formatNumber(content.playsTotal, 'en'),
                    editable: false,
                    hidden: false,
                },
                totalDuration: {
                    value: this.parseTotalDuration(content.durationsTotal),
                    editable: false,
                    hidden: false,
                },
                uploadDate: { value: this._date.transform(content.dateCreated, 'MMMM d, y') },
                uploadedBy: {
                    value: content.createdByName ? content.createdByName : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
            };
        });
    }

    private mapToMediaPreviewDialog(data: API_HOST_CONTENT[]) {
        return data.map((content) => {
            let {
                advertiserId,
                dealerId,
                duration,
                hostId,
                url,
                fileType,
                filesize,
                dateCreated,
                createdByName,
                previewThumbnail,
                title,
            } = content;
            duration = Math.round(duration);

            return {
                advertiser_id: advertiserId,
                dealer_id: dealerId,
                duration,
                host_id: hostId,
                fileName: url,
                fileType,
                filesize,
                dateCreated,
                uploaded_by: createdByName,
                createdBy: createdByName,
                thumbnail: previewThumbnail,
                title,
            };
        });
    }

    protected get columns(): string[] {
        return [
            '#',
            'Name',
            'Type',
            'Total Play Count',
            'Total Duration',
            'Upload Date',
            'Uploaded By',
        ];
    }
}
