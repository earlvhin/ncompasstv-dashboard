import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, forkJoin, Observable } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { API_FILTERS, API_LICENSE_PROPS, WORKSHEET, PAGING } from 'src/app/global/models';
import { UI_LICENSE } from 'src/app/global/models/ui-license.model';
import { AuthService, ExportService, LicenseService, UpdateService } from 'src/app/global/services';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-outdated-licenses',
    templateUrl: './outdated-licenses.component.html',
    styleUrls: ['./outdated-licenses.component.scss'],
})
export class OutdatedLicensesComponent implements OnInit, OnDestroy {
    currentTableData: UI_LICENSE[] = [];
    filters: API_FILTERS = { page: 1, pageSize: 15, sortColumn: 'UiVersion', sortOrder: 'asc' };
    hasNoData = false;
    latestVersion = { server: '--', ui: '--' };
    hasLoadedStats = false;
    isExporting = false;
    isPageReady = false;
    isPreloadDataReady = false;
    searchControl = new FormControl(null);
    tableColumns = this._tableColumns;
    totalCount = 0;

    private currentPaging: PAGING;
    private queuedForReset: UI_LICENSE[] = [];
    private queuedTableData: UI_LICENSE[] = [];
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _datePipe: DatePipe,
        private _export: ExportService,
        private _license: LicenseService,
    ) {}

    ngOnInit() {
        this.loadLicenses().add(() => (this.queuedForReset = Array.from(this.currentTableData)));
        this.subscribeToLicenseSearch();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    addToTable() {
        this.isPreloadDataReady = false;
        this.currentTableData = this.currentTableData.concat(this.queuedTableData);
        this.preloadLicenses();
    }

    getDataForExport() {
        this.isExporting = true;

        const WORKSHEETS = this._workSheetConfig;
        const DEFAULT_PAGE_SIZE = 1000;
        const FIRST_PAGE = 1;

        this._license
            .get_outdated_licenses({ pageSize: DEFAULT_PAGE_SIZE, page: FIRST_PAGE })
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(async (response) => {
                let requests: Observable<{
                    appUiVersion?: string;
                    appServerVersion?: string;
                    paging?: PAGING;
                    message?: string;
                }>[] = [];
                let result: API_LICENSE_PROPS[] = [];
                result = result.concat(response.paging.entities);

                if (DEFAULT_PAGE_SIZE >= response.paging.totalEntities) {
                    WORKSHEETS[0].data = result;
                    await this.exportTable(WORKSHEETS);
                    this.isExporting = false;
                    return;
                }

                const NEXT_PAGE = 2;
                const TOTAL_PAGES = response.paging.pages;

                for (let i = NEXT_PAGE; i <= TOTAL_PAGES; i++) {
                    requests.push(
                        this._license.get_outdated_licenses({
                            pageSize: DEFAULT_PAGE_SIZE,
                            page: i,
                        }),
                    );
                }

                forkJoin(requests)
                    .pipe(takeUntil(this._unsubscribe))
                    .subscribe(
                        async (responses) => {
                            responses.forEach((response) => {
                                result = result.concat(response.paging.entities);
                            });

                            WORKSHEETS[0].data = result;
                            await this.exportTable(WORKSHEETS);
                            this.isExporting = false;
                        },
                        (e) => {
                            this.isExporting = false;
                            throw new Error(e);
                        },
                    );
            });
    }

    sortTable(data: { column: string; order: string }) {
        this.resetFilters();
        this.filters.sortColumn = data.column;
        this.filters.sortOrder = data.order;
        this.loadLicenses();
    }

    private async exportTable(data: WORKSHEET[]) {
        data = data.map((worksheet) => {
            worksheet.data = this.mapForExport(worksheet.data);
            return worksheet;
        });

        return await this._export.generate('outdated-licenses', data);
    }

    private getAnydeskPassword(licenseKey: string) {
        const split = licenseKey.split('-');
        return split[split.length - 1];
    }

    private getOutdatedLicenses() {
        return this._license.get_outdated_licenses(this.filters).pipe(takeUntil(this._unsubscribe));
    }

    private isBlankOrEmptyString(value: string) {
        return typeof value === 'undefined' || !value || value.trim().length === 0;
    }

    private loadLicenses() {
        this.isPageReady = false;
        return this.getOutdatedLicenses().subscribe(
            (response) => {
                if ('message' in response) {
                    this.hasNoData = true;
                    this.hasLoadedStats = true;
                    return;
                }

                this.latestVersion = {
                    server: response.appServerVersion,
                    ui: response.appUiVersion,
                };

                this.totalCount = response.paging.totalEntities;
                this.hasLoadedStats = true;
                this.currentPaging = response.paging;
                const mapped = this.mapToDataTable(response.paging.entities);
                this.currentTableData = [...mapped];
                this.preloadLicenses();
                this.isPageReady = true;
            },
            (error) => {
                this.hasNoData = true;
                console.error(error);
            },
        );
    }

    private mapForExport(data: API_LICENSE_PROPS[]) {
        const licenses = Array.from(data);

        return licenses.map((license) => {
            license.status = license.piStatus === 1 ? 'Online' : 'Offline';
            license.password = this.getAnydeskPassword(license.licenseId);
            license.lastDisconnect = this.parseDate(license.timeOut);
            license.lastPush = this.parseDate(license.contentsUpdated);
            license.displayStatus = license.displayStatus === 1 ? 'ON' : 'OFF';
            return license;
        });
    }

    private mapToDataTable(data: API_LICENSE_PROPS[]): UI_LICENSE[] {
        let count = this.currentPaging.pageStart;

        const parseImageUrl = (image: string) => (image ? image : null);

        return data.map((license) => {
            let mapped = {} as UI_LICENSE;

            this._tableColumns.forEach(({ key }) => {
                mapped[key] = { value: license[key] };

                switch (key) {
                    case 'index':
                        mapped[key].value = count++;
                        break;
                    case 'dealerId':
                        mapped[key].value = license.businessName;
                        break;
                    case 'hostId':
                        mapped[key].value = license.hostName;
                        break;
                    case 'screenId':
                        mapped[key].value = license.screenName;
                        break;
                    case 'screenshotUrl':
                        const parsedImageUrl = parseImageUrl(license.screenshotUrl);
                        mapped[key].link = parsedImageUrl;
                        mapped[key].value = parsedImageUrl;
                        mapped[key].isImage = true;
                        break;
                    case 'displayStatus':
                        mapped[key].value = license.displayStatus === 1 ? 'ON' : 'OFF';
                        break;
                    case 'lastDisconnect':
                        mapped[key].value = this.parseDate(license.timeOut);
                        break;
                    case 'lastPush':
                        mapped[key].value = this.parseDate(license.contentsUpdated);
                        break;
                    case 'alias':
                    case 'licenseKey':
                        const isInvalidString = this.isBlankOrEmptyString(license[key]);
                        mapped[key].value = isInvalidString ? '--' : license[key];
                        if (isInvalidString) break;

                        if (key === 'licenseKey') {
                            mapped[key].status = true;
                            mapped[key].hidden = false;
                        }

                        mapped[key].link = `/${this._currentRole}/licenses/${license.licenseId}`;
                        mapped[key].new_tab_link = true;
                        break;
                    case 'status':
                        break;
                    case 'pi_status':
                        const currentValue = mapped[key].value;
                        let newValue = currentValue === 1 ? 'text-primary' : 'text-danger';
                        mapped[key].label = currentValue === 1 ? 'Online' : 'Offline';
                        mapped[key].hidden = true;
                        mapped[key].new_status = true;
                        mapped[key].value = newValue;
                        break;
                    case 'anydesk':
                        mapped[key].value = license.anydeskId;

                        if (!license.anydeskId) {
                            mapped[key].value = '--';
                            mapped[key].password = '--';
                            break;
                        }

                        mapped[key].password = this.getAnydeskPassword(license.licenseId);
                        mapped[key].label = 'Anydesk ID';
                        mapped[key].copy = true;
                        mapped[key].anydesk = true;
                        break;
                    default: // intentionally blank to fulfil coding guidelines
                }

                if (key.includes('Id')) {
                    const isInvalidString = this.isBlankOrEmptyString(mapped[key].value);

                    if (isInvalidString) {
                        mapped[key].value = '--';
                        return;
                    }

                    let pageName = `${key.split('Id')[0]}s`;
                    mapped[key].link = `/${this._currentRole}/${pageName}/${license[key]}`;
                    mapped[key].new_tab_link = true;
                }
            });

            return mapped;
        });
    }

    private parseDate(date: string) {
        if (this.isBlankOrEmptyString(date)) return '--';
        return this._datePipe.transform(date, 'MMM dd, y h:mm a');
    }

    private preloadLicenses() {
        this.filters.page++;

        return this.getOutdatedLicenses().subscribe((response) => {
            if ('message' in response || response.paging.entities.length === 0) {
                this.isPreloadDataReady = true;
                this.hasNoData = true;
                return;
            }

            this.currentPaging = response.paging;
            this.queuedTableData = this.mapToDataTable(response.paging.entities);
            this.filters.page = response.paging.page;
            this.isPreloadDataReady = true;
        });
    }

    private resetFilters(): void {
        this.filters = {
            page: 1,
            pageSize: 15,
            sortColumn: 'UiVersion',
            sortOrder: 'asc',
        };
    }

    private searchOutdatedLicenses() {
        this.getOutdatedLicenses().subscribe((response) => {
            if (response.paging.entities.length === 0) {
                this.hasNoData = true;
                return;
            }

            this.currentPaging = response.paging;
            this.currentTableData = this.mapToDataTable(response.paging.entities);
            this.isPageReady = true;
        });
    }

    private subscribeToLicenseSearch() {
        const control = this.searchControl;

        control.valueChanges
            .pipe(takeUntil(this._unsubscribe), debounceTime(1000))
            .subscribe((keyword: string) => {
                this.hasNoData = false;
                this.isPageReady = false;
                this.resetFilters();

                if (!keyword || keyword.trim().length === 0) {
                    delete this.filters.search;
                    this.currentTableData = [...this.queuedForReset];
                    this.resetFilters();
                    this.preloadLicenses();
                    setTimeout(() => (this.isPageReady = true), 1000);
                    return;
                }

                this.filters.search = keyword;
                this.searchOutdatedLicenses();
                this.preloadLicenses();
            });
    }

    protected get _workSheetConfig(): WORKSHEET[] {
        const columns = this._exportColumns.map((column) => {
            return {
                name: column.name,
                key: column.key,
            };
        });

        return [{ name: 'outdated-licenses', columns, data: [] }];
    }

    protected get _exportColumns() {
        return [
            { name: 'License Key', key: 'licenseKey' },
            { name: 'Status', key: 'status' },
            { name: 'Alias', key: 'alias' },
            { name: 'Server', key: 'serverVersion' },
            { name: 'UI', key: 'uiVersion' },
            { name: 'Display', key: 'displayStatus' },
            { name: 'Dealer', key: 'businessName' },
            { name: 'Host', key: 'hostName' },
            { name: 'Anydesk', key: 'anydeskId' },
            { name: 'Password', key: 'password' },
            { name: 'Last Disconnect', key: 'lastDisconnect' },
            { name: 'Last Push', key: 'lastPush' },
        ];
    }

    protected get _tableColumns() {
        return [
            { name: '#', key: 'index' },
            { name: 'Screenshot', key: 'screenshotUrl' },
            { name: 'License Key', sortable: true, column: 'LicenseKey', key: 'licenseKey' },
            {
                name: 'Status',
                sortable: false,
                key: 'pi_status',
                hidden: true,
                new_status: true,
                no_show: true,
            },
            { name: 'Alias', key: 'alias' },
            { name: 'Server', key: 'serverVersion', column: 'ServerVersion', sortable: true },
            { name: 'UI', key: 'uiVersion', column: 'UiVersion', sortable: true },
            { name: 'Display', key: 'displayStatus' },
            { name: 'Dealer', key: 'dealerId' },
            { name: 'Host', key: 'hostId' },
            { name: 'Anydesk', sortable: true, column: 'AnydeskId', key: 'anydesk' },
            { name: 'Last Disconnect', key: 'lastDisconnect' },
            { name: 'Last Push', key: 'lastPush' },
        ];
    }

    protected get _columnNames() {
        return this._tableColumns.map((column) => column.name);
    }

    protected get _currentRole() {
        return this._auth.current_role;
    }
}
