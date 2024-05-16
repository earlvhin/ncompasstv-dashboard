import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CreateAppComponent } from 'src/app/global/components_shared/version_components/create-app/create-app.component';
import { App, TABLE_VERSION } from 'src/app/global/models';
import { UpdateService } from 'src/app/global/services/update-service/update.service';

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

    public getApps() {
        this.loading = true;
        this.tableDataVersion.data = [];

        this._updates
            .get_apps()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe(
                async (data: App[]) => {
                    if (data.length > 0) {
                        this.apps = data;

                        this.mapTableData(data);
                        this.loading = false;
                    }
                },
                (error) => {
                    console.error(error);
                    this.loading = false;
                },
            );
    }

    public mapTableData(tableData: App[]) {
        return this.tableDataVersion.data.push(
            ...tableData.map((i) => [
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
}
