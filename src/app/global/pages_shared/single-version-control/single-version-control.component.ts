import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UpdateService } from '../../services';
import { App, APP_VERSION, TABLE_VERSION } from '../../models';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material';
import { CreateAppVersionComponent } from '../../components_shared/version_components/create-app-version/create-app-version.component';

@Component({
    selector: 'app-single-version-control',
    templateUrl: './single-version-control.component.html',
    styleUrls: ['./single-version-control.component.scss'],
})
export class SingleVersionControlComponent implements OnInit, OnDestroy {
    appName: string;
    loading: boolean = false;
    paramsPlayerId: string;
    playerId: string;
    tableDataVersion: TABLE_VERSION = {
        label: ['#', 'Version', 'Description', 'Date Created'],
        data: [],
        hasActions: {
            value: true,
            actions: [
                {
                    label: 'Delete',
                    icon: 'fas fa-trash',
                    action: 'delete_version',
                    title: 'Delete Version',
                },
                {
                    label: 'Download',
                    icon: 'fas fa-download',
                    action: 'download_version',
                    title: 'Download Version',
                },
            ],
        },
    };

    protected unSubscribe = new Subject<void>();

    constructor(
        private _route: ActivatedRoute,
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _updates: UpdateService,
    ) {}

    ngOnInit() {
        this._route.paramMap.pipe(takeUntil(this.unSubscribe)).subscribe(() => {
            this.paramsPlayerId = this._route.snapshot.params.data;
            this.getAppVersions();
            this.getApps();
        });
    }

    ngOnDestroy(): void {
        this.unSubscribe.next();
        this.unSubscribe.complete();
    }

    public getApps() {
        this._updates
            .get_apps()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((data) => {
                if ('message' in data) return;

                const appData = data as App[];
                this.appName = appData.find((app) => this.paramsPlayerId === app.appId).appName;
            });
    }

    public getAppVersions() {
        this.loading = true;
        this.tableDataVersion.data = [];

        this._updates
            .get_app_versions()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(
                (data) => {
                    if ('message' in data) {
                        this.loading = false;
                        return;
                    }

                    this.loading = false;
                    const appVersions = data as APP_VERSION[];
                    const appByParamsId = appVersions.filter((app) => this.paramsPlayerId === app.appId);
                    this.mapTableData(appByParamsId);
                },
                (error) => {
                    console.error(error);
                    this.loading = false;
                },
            );
    }

    public mapTableData(tableData: APP_VERSION[]) {
        const sortedTableData = tableData.sort(
            (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
        );

        return this.tableDataVersion.data.push(
            ...sortedTableData.map((app) => [
                {
                    value: app.version,
                    isHidden: false,
                },
                {
                    value: app.releaseNotes,
                    isHidden: false,
                },
                {
                    value: this._date.transform(app.dateCreated, 'MMM dd, yyyy, hh:mm:ss a'),
                    isHidden: false,
                },
                {
                    value: app.zipUrl,
                    downloadUrl: app.zipUrl,
                    isHidden: true,
                },
                {
                    value: app.versionId,
                    uniqueIdentifier: app.versionId,
                    isHidden: true,
                },
            ]),
        );
    }

    public deleteAppVersion(id: string): void {
        this._updates
            .remove_app_version([id])
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(() => {
                this.ngOnInit();
            });
    }

    public onAddPlayerVersion(): void {
        this._dialog
            .open(CreateAppVersionComponent, {
                width: '600px',
                panelClass: 'app-media-modal',
                autoFocus: false,
                disableClose: true,
                data: { appId: this.paramsPlayerId },
            })
            .afterClosed()
            .subscribe(() => {
                this.ngOnInit();
            });
    }
}
