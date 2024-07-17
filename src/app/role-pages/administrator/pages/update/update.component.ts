import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CreateAppComponent } from 'src/app/global/components_shared/version_components/create-app/create-app.component';
import { App, TABLE_VERSION, APP_ROLLOUT_TARGETS, API_FILTERS, PAGING } from 'src/app/global/models';
import { TargetLicenseModal } from 'src/app/global/components_shared/license_components/target-license-modal/target-license.component';
import { LicenseService, UpdateService } from 'src/app/global/services';
import { Observable } from 'rxjs-compat';

@Component({
    selector: 'app-update',
    templateUrl: './update.component.html',
    styleUrls: ['./update.component.scss'],
})
export class UpdateComponent implements OnInit, OnDestroy {
    addedSuccess = false;
    apps: App[] = [];
    currentTableData: TABLE_VERSION[] = [];
    filters: API_FILTERS = { page: 1, pageSize: 15 };
    hasNoData = false;
    appLoading: boolean = false;
    licenseLoading: boolean = false;
    isPageReady = false;

    private queuedTableData: TABLE_VERSION[] = [];
    private currentPaging: PAGING = null;

    tableDataVersion: TABLE_VERSION = {
        label: ['#', 'Title', 'Description', 'Current Version', 'Date Created', 'URL'],
        data: [],
        hasActions: {
            value: true,
            actions: [
                {
                    label: 'Delete',
                    icon: 'fas fa-trash',
                    action: 'delete_app',
                    title: 'Delete App',
                },
            ],
        },
    };
    rolloutTargetTableData: TABLE_VERSION = {
        label: ['#', 'Dealer', 'License Key', 'Alias', 'UI Version', 'Server Version'],
        data: [],
        hasActions: {
            value: true,
            actions: [
                {
                    label: 'Delete',
                    icon: 'fas fa-trash',
                    action: 'delete_app',
                    title: 'Delete App',
                },
            ],
        },
    };

    private targets: APP_ROLLOUT_TARGETS[] = [];

    protected unSubscribe = new Subject<void>();

    constructor(
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _license: LicenseService,
        private _updates: UpdateService,
    ) {}

    ngOnInit() {
        this.getApps();
        this.getLicense();
        this.resetFilters();
    }

    ngOnDestroy(): void {
        this.unSubscribe.next();
        this.unSubscribe.complete();
    }

    public onAddApp() {
        this._dialog
            .open(CreateAppComponent, {
                width: '600px',
                panelClass: 'app-media-modal',
                autoFocus: false,
                disableClose: true,
            })
            .afterClosed()
            .subscribe(() => {
                this.addedSuccess = true;
                this.ngOnInit();
            });
    }

    public onDeleteApp(id: string) {
        this._updates
            .remove_app([id])
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(() => {
                this.ngOnInit();
            });
    }

    public onDeleteTargetLicense(id: string): void {
        this._license
            .update_toggle_settings({ licenseIds: [id], enableUpdates: false })
            .pipe(takeUntil(this.unSubscribe))
            .subscribe({
                next: () => {
                    const index = this.targets.findIndex((x) => x.licenseId === id);
                    this.targets.splice(index, 1);
                    this.rolloutTargetTableData.data = [];
                    this.mapRolloutTargetTableData(this.targets);
                },
                error: (err) => {
                    console.error(err);
                },
            });
    }

    public targetLicenseModal(): void {
        this._dialog
            .open(TargetLicenseModal, {
                height: '710px',
                width: '1000px',
            })
            .afterClosed()
            .subscribe(() => this.ngOnInit());
    }

    public getApps() {
        this.appLoading = true;
        this.tableDataVersion.data = [];

        this._updates
            .get_apps()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(
                (data) => {
                    if ('message' in data) {
                        this.appLoading = false;
                        return;
                    }

                    const appData = data as App[];
                    this.mapTableData(appData);
                    this.appLoading = false;
                },
                (error) => {
                    console.error(error);
                    this.appLoading = false;
                },
            );
    }

    public getLicense(): void {
        this.licenseLoading = true;
        this.rolloutTargetTableData.data = [];
        this.hasNoData = false;

        this._updates
            .getLicenseUpdateStatus({ enableUpdates: true })
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(
                (res) => {
                    if (res.status === 'error') {
                        this.licenseLoading = false;
                        return;
                    }
                    this.hasNoData = res.data.hasNextPage === false ? true : this.hasNoData;

                    this.targets = res.data.entities as APP_ROLLOUT_TARGETS[];
                    this.mapRolloutTargetTableData(this.targets);
                    this.licenseLoading = false;
                },
                (error) => {
                    console.error(error);
                    this.licenseLoading = false;
                },
            );
    }

    public mapTableData(tableData: App[]): number {
        const sortedTableData = tableData.sort(
            (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
        );

        return this.tableDataVersion.data.push(
            ...sortedTableData.map((i) => [
                {
                    value: i.appName,
                    isHidden: false,
                    isLink: true,
                    insideLink: i.appId,
                    newTab: true,
                },
                {
                    value: i.appDescription,
                    isHidden: false,
                },
                {
                    value: i.currentVersion ? i.currentVersion : 'No Version Available',
                    isHidden: false,
                },
                {
                    value: this._date.transform(i.dateCreated, 'MMM dd, yyyy, hh:mm:ss a'),
                    isHidden: false,
                },
                {
                    value: i.githubUrl,
                    isLink: true,
                    externalLink: i.githubUrl,
                    newTab: true,
                    isHidden: false,
                },
                {
                    value: i.appId,
                    uniqueIdentifier: i.appId,
                    isHidden: true,
                },
            ]),
        );
    }

    public mapRolloutTargetTableData(tableData: APP_ROLLOUT_TARGETS[]): number {
        const sortedTableData = tableData.sort((a, b) => a.businessName.localeCompare(b.businessName));
        const dealerBaseURL = '/administrator/dealers/';
        const licenseBaseURL = '/administrator/licenses/';

        return this.rolloutTargetTableData.data.push(
            ...sortedTableData.map((i) => [
                {
                    value: i.businessName,
                    isHidden: false,
                    isLink: true,
                    insideLink: `${dealerBaseURL}${i.dealerId}/${i.businessName}`,
                    newTab: true,
                },
                {
                    value: i.licenseKey,
                    isHidden: false,
                    isLink: true,
                    insideLink: `${licenseBaseURL}${i.licenseId}/${i.licenseKey}`,
                    newTab: true,
                },
                {
                    value: i.alias ? i.alias : 'N/A',
                    isHidden: false,
                },
                {
                    value: i.uiVersion ? i.uiVersion : 'No Version Available',
                    isHidden: false,
                },
                {
                    value: i.serverVersion ? i.serverVersion : 'No Version Available',
                    isHidden: false,
                },
                {
                    value: i.licenseId,
                    uniqueIdentifier: i.licenseId,
                    isHidden: true,
                },
            ]),
        );
    }

    private getTargetLicenses(type = 'default'): Observable<any> {
        let filters = type === 'export' ? { page: 1, enableUpdates: true } : this.filters;
        filters.enableUpdates = true;
        return this._updates.getLicenseUpdateStatus(filters).pipe(takeUntil(this.unSubscribe));
    }

    public preLoadTargetLicenses(): Subscription {
        this.filters.page++;

        return this.getTargetLicenses().subscribe((response) => {
            if (response.data.entities.length === 0) {
                this.hasNoData = true;
                return;
            }

            this.hasNoData = response.data.hasNextPage === false ? true : this.hasNoData;

            this.currentPaging = response.data;
            this.queuedTableData = response.data.entities;
            this.mapRolloutTargetTableData(response.data.entities);
            this.filters.page = response.data.page;
        });
    }

    public addToTable(): void {
        this.currentTableData = this.currentTableData.concat(this.queuedTableData);
        this.preLoadTargetLicenses();
    }

    private resetFilters(): void {
        this.filters = {
            page: 1,
            pageSize: 15,
        };
    }
}
