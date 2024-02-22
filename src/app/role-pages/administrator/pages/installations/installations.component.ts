import { Component, OnDestroy, OnInit } from '@angular/core';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as moment from 'moment';
import { AuthService, HelperService, LicenseService, ExportService } from 'src/app/global/services';
import { API_FILTERS, INSTALLATION, PAGING, UI_ROLE_DEFINITION_TEXT, WORKSHEET } from 'src/app/global/models';
import { MatTabChangeEvent } from '@angular/material';

@Component({
    selector: 'app-installations',
    templateUrl: './installations.component.html',
    styleUrls: ['./installations.component.scss'],
    providers: [TitleCasePipe, DatePipe],
})
export class InstallationsComponent implements OnInit, OnDestroy {
    current_tab: string;
    currentFilters: API_FILTERS = { page: 1, installDate: moment().format('MM-DD-YYYY') };
    filteredData = [];
    initialLoad = false;
    installation_count: any;
    installations: INSTALLATION[] = [];
    installationTableColumns = this._tableColumns;
    isExporting = false;
    onResetDatePicker = new Subject<void>();
    pagingData: PAGING;
    searching = false;
    tabs = this._tabs;
    worksheet: WORKSHEET[];

    private licenses_to_export = [];
    private currentMonth = '';
    private nextMonth = '';
    private previousMonth = '';
    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dates: DatePipe,
        private _helper: HelperService,
        private _license: LicenseService,
        private _titlecase: TitleCasePipe,
        private _export: ExportService,
    ) {}

    ngOnInit() {
        this.previousMonth = moment().subtract(1, 'month').format('MMMM');
        this.currentMonth = moment().format('MMMM');
        this.nextMonth = moment().add(1, 'month').format('MMMM');
        this.loadInstallationsData();
        this.getInstallationStats();
        this.subscribeToUpdateInstallationDate();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    dateSelected(value, type = 'default'): void {
        this.currentFilters = { page: 1, installDate: moment(value, 'llll').format('MM-DD-YYYY') };
        this.loadInstallationsData(type);
    }

    dateViewSelected(type: number): void {
        if (type === 0) {
            this.currentFilters = { page: 1, installDate: moment().format('MM-DD-YYYY') };
            this.onResetDatePicker.next();
        }

        this.currentFilters.type = type;
        this.loadInstallationsData();
    }

    exportTable(tab = 'default'): void {
        this.isExporting = true;
        this.getDataForExport(tab);
    }

    loadInstallationsData(type = 'default'): void {
        this.searching = true;
        this.getInstallations(type).add(() => (this.searching = false));
    }

    pageSelected(data: number, type = 'default'): void {
        this.currentFilters.page = data;
        this.loadInstallationsData(type);
    }

    resetCurrentFilters(event: MatTabChangeEvent): void {
        this.currentFilters = { page: 1, installDate: moment().format('MM-DD-YYYY') };
        const type = this.tabs.filter((tab) => tab.index === event.index)[0].name;
        this.loadInstallationsData(type);
    }

    searchInstallations(keyword = '', type = 'default'): void {
        this.currentFilters.page = 1;
        this.currentFilters.search = keyword;
        this.loadInstallationsData(type);
    }

    sortByColumnAndOrder(data: { column: string; order: string }, type = 'default'): void {
        this.currentFilters.sortColumn = data.column;
        this.currentFilters.sortOrder = data.order;
        this.loadInstallationsData(type);
    }

    private getDataForExport(tab = 'default') {
        this.currentFilters.pageSize = 0;
        this.current_tab = tab;
        return this._license
            .get_installations(this.currentFilters, tab)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response: { paging: PAGING; message: string }) => {
                delete this.currentFilters.pageSize;

                if (response.message) {
                    this.licenses_to_export = [];
                    return;
                }
                this.licenses_to_export = response.paging.entities;

                this.licenses_to_export.forEach((item) => this.modifyItem(item));
                this.prepareForExport();
            })
            .add(() => (this.isExporting = false));
    }

    private prepareForExport() {
        const filename = `${this._titlecase.transform(this.current_tab)} Installations for ${this.currentFilters.installDate}`;
        let tables_to_export = this._tableColumns;
        tables_to_export = tables_to_export.filter(function (column) {
            return !column.no_export;
        });
        this.worksheet = [
            {
                name: filename,
                columns: tables_to_export,
                data: this.licenses_to_export,
            },
        ];
        this._export.generate(filename, this.worksheet);
    }

    private getInstallations(type = 'default') {
        return this._license
            .get_installations(this.currentFilters, type)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                let installations = [];
                let filtered_data = [];

                if (!data.message) {
                    this.pagingData = data.paging;
                    installations = this.mapToTableFormat(this.pagingData.entities);
                    filtered_data = installations;
                }

                this.installations = installations;
                this.filteredData = filtered_data;
                this.initialLoad = false;
            });
    }

    private getInstallationStats(): void {
        this._license.get_installation_statistics().subscribe((response) => {
            let stats = { total: 0, previousMonth: 0, currentMonth: 0, nextMonth: 0 };
            if (response.licenseInstallationStats) stats = response.licenseInstallationStats;
            this.getTotalCount(stats);
        });
    }

    private getTotalCount(data: {
        currentMonth: number;
        nextMonth: number;
        previousMonth: number;
        total: number;
    }): void {
        this.installation_count = {
            scheduled: data.total,
            scheduled_label: 'Installation(s)',
            scheduled_description: 'Scheduled Installations',
            prev: data.previousMonth,
            prev_label: 'Installation(s)',
            prev_description: 'Last Month of ' + this.previousMonth,
            current: data.currentMonth,
            current_label: 'Installation(s)',
            current_description: 'This Month of ' + this.currentMonth,
            next: data.nextMonth,
            next_label: 'Installation(s)',
            next_description: 'Next Month of ' + this.nextMonth,
        };
    }

    private mapToTableFormat(data: any[]): INSTALLATION[] {
        let count = this.pagingData.pageStart;
        let role = this._currentRole;
        if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            role = 'administrator';
        }

        return data.map((license) => {
            // subtract 1 day from date today, because todays date is considered as past
            const isPast = moment(license.installDate, 'MMM dd, y').isBefore(moment().subtract(1, 'd'));

            return new INSTALLATION(
                { value: license.licenseKey, link: null, editable: false, hidden: true },
                { value: count++, link: null, editable: false, hidden: false, past: isPast },
                {
                    value: license.licenseKey,
                    link: `/` + role + `/licenses/${license.licenseId}`,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    past: isPast,
                },
                {
                    value: license.hostName != null ? license.hostName : '--',
                    link: `/` + role + `/hosts/${license.hostId}`,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    past: isPast,
                },
                {
                    value: license.dealerIdAlias != null ? license.dealerIdAlias : '--',
                    link: `/` + role + `/dealers/${license.dealerId}`,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    past: isPast,
                },
                {
                    value: license.businessName,
                    link: `/` + role + `/dealers/${license.dealerId}`,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    past: isPast,
                },
                {
                    value: license.screenTypeName != null ? this._titlecase.transform(license.screenTypeName) : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                    past: isPast,
                },
                {
                    value: this._dates.transform(license.installDate, 'MMM d, y'),
                    id: license.licenseId,
                    label: 'Install Date',
                    link: null,
                    editable: true,
                    hidden: false,
                    past: isPast,
                },
                {
                    value: this._dates.transform(license.installRequestDate, 'MMM d, y'),
                    link: null,
                    hidden: false,
                    past: isPast,
                    editable: true,
                    label: 'Install Request Date',
                    id: license.licenseId,
                },
            );
        });
    }

    private modifyItem(item: { screenTypeName: string; installDate: string; installRequestDate: string }): void {
        item.screenTypeName = this._titlecase.transform(item.screenTypeName);
        item.installDate = this._dates.transform(item.installDate, 'MMM d, y');
        item.installRequestDate = this._dates.transform(item.installRequestDate, 'MMM d, y');
    }

    private subscribeToUpdateInstallationDate() {
        this._helper.onUpdateInstallationDate
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(() => this.getInstallationStats());
    }

    protected get _tableColumns() {
        return [
            { name: '#', sortable: false, key: 'licenseKey', hidden: true, no_export: true },
            { name: 'License Key', sortable: true, column: 'LicenseKey', key: 'licenseKey' },
            { name: 'Host', sortable: true, column: 'HostName', key: 'hostName' },
            { name: 'Dealer Alias', sortable: true, column: 'DealerIdAlias', key: 'dealerIdAlias' },
            { name: 'Business Name', sortable: true, column: 'BusinessName', key: 'businessName' },
            {
                name: 'License Type',
                sortable: true,
                column: 'ScreenTypeName',
                key: 'screenTypeName',
            },
            {
                name: 'Installation Date',
                sortable: true,
                column: 'InstallDate',
                key: 'installDate',
            },
            {
                name: 'Install Request Date',
                sortable: true,
                column: 'InstallRequestDate',
                key: 'installRequestDate',
            },
        ];
    }

    protected get _currentRole() {
        return this._auth.current_role;
    }

    protected get _tabs() {
        return [
            {
                index: 0,
                name: 'default',
                label: 'Default',
                isDatePickerEnabled: true,
                isDatePickerViewEnabled: true,
            },
            {
                index: 1,
                name: 'upcoming',
                label: 'Upcoming',
                isDatePickerEnabled: false,
                isDatePickerViewEnabled: false,
            },
            {
                index: 2,
                name: 'recent',
                label: 'Recent',
                isDatePickerEnabled: false,
                isDatePickerViewEnabled: false,
            },
            {
                index: 3,
                name: 'next-week',
                label: 'Next Week',
                isDatePickerEnabled: false,
                isDatePickerViewEnabled: false,
            },
            {
                index: 4,
                name: 'next-month',
                label: 'Next Month',
                isDatePickerEnabled: false,
                isDatePickerViewEnabled: false,
            },
        ];
    }
}
