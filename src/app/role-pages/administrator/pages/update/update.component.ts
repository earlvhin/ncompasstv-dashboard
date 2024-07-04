import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CreateAppComponent } from 'src/app/global/components_shared/version_components/create-app/create-app.component';
import { App, TABLE_VERSION, APP_ROLLOUT_TARGETS } from 'src/app/global/models';
import { UpdateService } from 'src/app/global/services/update-service/update.service';
import { TargetLicenseModal } from 'src/app/global/components_shared/license_components/target-license-modal/target-license.component';


@Component({
    selector: 'app-update',
    templateUrl: './update.component.html',
    styleUrls: ['./update.component.scss'],
})
export class UpdateComponent implements OnInit, OnDestroy {
    addedSuccess = false;
    apps: App[] = [];
    loading: boolean = false;
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
            actions: [],
        },
    };

    protected unSubscribe = new Subject<void>();

    constructor(
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _updates: UpdateService,
    ) {}

    ngOnInit() {
        this.getApps();
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

    public targetLicenseModal() {
        this._dialog
            .open(TargetLicenseModal, {
                height: '700px',
                width: '1000px',
            })
            .afterClosed()
            .subscribe(() => this.ngOnInit());
    }

    public getApps() {
        this.loading = true;
        this.tableDataVersion.data = [];
        this.rolloutTargetTableData.data = [];

        this._updates
            .get_apps()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(
                (data) => {
                    if ('message' in data) {
                        this.loading = false;
                        return;
                    }

                    const appData = data as App[];
                    this.mapTableData(appData);
                    this.loading = false;
                },
                (error) => {
                    console.error(error);
                    this.loading = false;
                },
            );

        this._updates
            .getRolloutTargets()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(
                (data) => {
                    if ('message' in data) {
                        this.loading = false;
                        return;
                    }

                    const targets = data as APP_ROLLOUT_TARGETS[];
                    this.mapRolloutTargetTableData(targets);
                    this.loading = false;
                },
                (error) => {
                    console.error(error);
                    this.loading = false;
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
        const sortedTableData = tableData.sort((a, b) => a.dealerBusinessName.localeCompare(b.dealerBusinessName));

        return this.rolloutTargetTableData.data.push(
            ...sortedTableData.map((i) => [
                {
                    value: i.dealerBusinessName,
                    isHidden: false,
                    //isLink: true,
                    //insideLink: i.appId,
                    //newTab: true,
                },
                {
                    value: i.licenseKey,
                    isHidden: false,
                },
                {
                    value: i.alias,
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
            ]),
        );
    }
}
