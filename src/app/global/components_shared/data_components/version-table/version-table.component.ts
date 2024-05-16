import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TABLE_VERSION, TABLE_ACTIONS, TABLE_DATA } from 'src/app/global/models/api_version-table.model';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material';
import { DownloadService } from 'src/app/global/services';

@Component({
    selector: 'app-version-table',
    templateUrl: './version-table.component.html',
    styleUrls: ['./version-table.component.scss'],
})
export class VersionTableComponent implements OnInit, OnDestroy {
    @Input() table_data: TABLE_VERSION = {
        label: [],
        data: [],
        hasActions: {},
    };
    @Input() query_params: string;
    @Output() on_delete = new EventEmitter<any>();

    currentAppId: string;
    protected unSubscribe = new Subject<void>();

    constructor(
        private _route: ActivatedRoute,
        private _dialog: MatDialog,
        private _download: DownloadService,
    ) {}

    ngOnInit() {
        this._route.paramMap.pipe(takeUntil(this.unSubscribe)).subscribe(() => {
            this.currentAppId = this._route.snapshot.params.data;
        });
    }

    ngOnDestroy(): void {
        this.unSubscribe.next();
        this.unSubscribe.complete();
    }

    public onClickIcon(data: TABLE_DATA[], action: TABLE_ACTIONS): void {
        const id = data.find((d) => d.uniqueIdentifier);
        const url = data.find((d) => d.downloadUrl);
        const navigate = data.find((d) => d.route);

        switch (action.action) {
            case 'delete_app':
                this.warningModal(
                    'warning',
                    'Delete App',
                    'Are you sure you want to delete this app?',
                    '',
                    'app_version_delete',
                    id.uniqueIdentifier,
                );
                break;

            case 'delete_version':
                this.warningModal(
                    'warning',
                    'Delete App Version',
                    'Are you sure you want to delete this app version?',
                    '',
                    'app_version_delete',
                    id.uniqueIdentifier,
                );
                break;

            case 'download_version':
                this._download.downloadFile(url.downloadUrl, 'File Download');
                break;

            case 'visit_link':
                window.open(navigate.route, '_blank');
                break;

            default:
                break;
        }
    }

    public warningModal(
        status: string,
        message: string,
        data: string,
        return_msg: string,
        action: string,
        id: any,
    ): void {
        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: { status, message, data, return_msg, action },
            })
            .afterClosed()
            .subscribe((result) => {
                if (result === 'app_version_delete') {
                    this.on_delete.emit(id);
                }
            });
    }
}
