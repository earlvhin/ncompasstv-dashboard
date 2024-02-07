import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { environment } from 'src/environments/environment';
import { API_FILTERS, API_LICENSE, PAGING, UI_LICENSE_BY_TAGS } from 'src/app/global/models';
import { AuthService, LicenseService } from 'src/app/global/services';

@Component({
    selector: 'app-tags-tab',
    templateUrl: './tags-tab.component.html',
    styleUrls: ['./tags-tab.component.scss'],
})
export class TagsTabComponent implements OnInit, OnDestroy {
    apiFilters: API_FILTERS = { page: 1, search: '' };
    hasNoData = false;
    isPageReady = false;
    pagingData: PAGING;
    searchFormControl = new FormControl(null, [Validators.minLength(3)]);
    tableData: UI_LICENSE_BY_TAGS[];

    tableColumns = [
        { name: '#', sortable: false, no_export: true },
        { name: 'Status', sortable: false, key: 'piStatus', hidden: true, no_show: true },
        { name: 'Screenshot', sortable: false, no_export: true },
        { name: 'License Key', sortable: false, column: 'LicenseKey', key: 'licenseKey' },
        { name: 'Type', sortable: false, column: 'ScreenType', key: 'screenType' },
        { name: 'Host', sortable: false, column: 'HostName', key: 'hostName' },
        { name: 'Alias', sortable: false, column: 'Alias', key: 'alias' },
        { name: 'Tags', sortable: false, column: 'Tags', key: 'name' },
        // { name: 'Last Push', sortable: false, column:'ContentsUpdated', key:'contentsUpdated' },
        // { name: 'Last Startup', sortable: false, column:'TimeIn', key:'timeIn' },
        // { name: 'Net Type', sortable: false, column:'InternetType', key:'internetType' },
        // { name: 'Net Speed', sortable: false, key:'internetSpeed', column:'InternetSpeed' },
        // { name: 'Display', sortable: false, key: 'displayStatus', column:'DisplayStatus' },
        // { name: 'Anydesk', sortable: false, column:'AnydeskId', key:'anydeskId' },
        // { name: 'Password', sortable: false, key:'password' },
    ];

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _date: DatePipe,
        private _license: LicenseService,
        private _title: TitleCasePipe,
    ) {}

    ngOnInit() {
        this.searchLicenses({ page: 1, search: '' });
        this.initializeSubscriptions();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    onClickPageNumber(page: number) {
        const search = this.apiFilters.search;
        this.searchLicenses({ page, search });
    }

    private initializeSubscriptions(): void {
        this.subscribeToSearch();
    }

    private getInternetType(value: string): string {
        if (!value || value.trim().length <= 0) return '--';
        value = value.toLowerCase();
        if (value.includes('w')) return 'WiFi';
        if (value.includes('eth')) return 'LAN';
    }

    private searchLicenses(filters: API_FILTERS) {
        this.isPageReady = false;
        this.hasNoData = false;

        this._license
            .get_by_tags(filters, true)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                ({ licenses, paging }) => {
                    if (licenses.length <= 0) {
                        this.tableData = [];
                        this.hasNoData = true;
                        return;
                    }

                    this.pagingData = paging;
                    this.tableData = this.mapToTableFormat(licenses, paging);
                    this.isPageReady = true;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private splitKey(key: string) {
        const split = key.split('-');
        const length = split.length - 1;
        return split[length];
    }

    private mapToTableFormat(
        licenses: API_LICENSE['license'][],
        paging: PAGING,
    ): UI_LICENSE_BY_TAGS[] {
        let count = paging.pageStart;

        return licenses.map((data) => {
            return {
                index: { value: count++, editable: false, hidden: false },
                id: {
                    value: data.licenseId,
                    link: null,
                    editable: false,
                    hidden: true,
                    key: false,
                    table: 'license',
                },
                screenshot: {
                    value: data.screenshotUrl ? data.screenshotUrl : null,
                    link: data.screenshotUrl ? data.screenshotUrl : null,
                    editable: false,
                    hidden: false,
                    isImage: true,
                    new_tab_link: true,
                },
                key: {
                    value: data.licenseKey,
                    link: `/${this.currentRole}/licenses/${data.licenseId}`,
                    new_tab_link: true,
                    compressed: true,
                    editable: false,
                    hidden: false,
                    status: true,
                },
                screenType: {
                    value: data.screenType ? this._title.transform(data.screenType) : '--',
                    editable: false,
                    hidden: false,
                },
                hostId: {
                    value: data.hostId ? data.hostName : '--',
                    link: data.hostId ? `/${this.currentRole}/hosts/${data.hostId}` : null,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                alias: {
                    value: data.alias ? data.alias : '--',
                    link: `/${this.currentRole}/licenses/${data.licenseId}`,
                    editable: false,
                    new_tab_link: true,
                    label: 'License Alias',
                    id: data.licenseId,
                    hidden: false,
                },
                tags: {
                    value: data.tags,
                    editable: false,
                    label: 'Tags',
                    type: 'tags',
                    hidden: false,
                },
                // lastPush: { value: data.contentsUpdated ? data.contentsUpdated : '--', label: 'Last Push', hidden: false },
                // lastOnline: { value: data.timeIn ? this._date.transform(data.timeIn, 'MMM dd, y h:mm a') : '--', hidden: false },
                // connectionType: { value: data.internetType ? this.getInternetType(data.internetType) : '--', link: null, editable: false, hidden: false },
                // connectionSpeed: { value: data.internetSpeed ? (data.internetSpeed == 'Fast' ? 'Good' : data.internetSpeed) : '--', link: null, editable: false, hidden: false },
                // displayStatus: { value: data.displayStatus == 1 ? 'ON' : "N/A", link: null, editable: false, hidden: false },
                // anydeskId: { value: data.anydeskId ? data.anydeskId : '--', link: null, editable: false, hidden: false, copy: true, label: 'Anydesk Id' },
                // anydeskPassword: { value: data.anydeskId ? this.splitKey(data.licenseId) : '--', link: null, editable: false, hidden: false, copy: true, label: 'Anydesk Password' },
                // piStatus: { value: data.piStatus, link: null , editable: false, hidden: true },
            };
        });
    }

    private subscribeToSearch(): void {
        const control = this.searchFormControl;

        control.valueChanges
            .pipe(takeUntil(this._unsubscribe), debounceTime(1000))
            .subscribe((keyword) => {
                let search = keyword;
                if (keyword.trim().length === 1) search = '';
                this.apiFilters.search = search;
                this.searchLicenses(this.apiFilters);
            });
    }

    protected get currentRole() {
        return this._auth.current_role;
    }
}
