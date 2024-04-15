import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment';

import { environment } from 'src/environments/environment';
import { AuthService, HostService, LicenseService, ExportService } from 'src/app/global/services';
import {
    UI_LICENSE,
    UI_HOST_VIEW,
    UI_TABLE_LICENSE_BY_DEALER,
    API_HOST,
    UI_ROLE_DEFINITION_TEXT,
    API_LICENSE_PROPS,
    WORKSHEET,
} from 'src/app/global/models';
import { UserSortModalComponent } from 'src/app/global/components_shared/media_components/user-sort-modal/user-sort-modal.component';
import { LicenseModalComponent } from 'src/app/global/components_shared/license_components/license-modal/license-modal.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-licenses',
    templateUrl: './licenses.component.html',
    styleUrls: ['./licenses.component.scss'],
    providers: [DatePipe, TitleCasePipe],
})
export class LicensesComponent implements OnInit {
    active_view: string = 'list';
    current_user_role = this._currentUserRole;
    diff_hours: any;
    dealers_data: UI_TABLE_LICENSE_BY_DEALER[] = [];
    licenses_data: UI_LICENSE[] = [];
    hosts_data: UI_HOST_VIEW[] = [];
    hour_diff: number;
    hour_diff_temp: any;
    no_dealer: boolean;
    no_host: boolean;
    no_licenses: boolean;
    no_licenses_result: boolean;
    no_favorites: boolean;
    filtered_data: UI_TABLE_LICENSE_BY_DEALER[] = [];
    filtered_data_host: UI_HOST_VIEW[] = [];
    filtered_data_licenses: UI_LICENSE[] = [];
    is_dealer_admin = this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin;
    title = 'Licenses';
    tab: any = { tab: 0 };
    licenses_details: any;
    now: any;
    paging_data: any;
    paging_data_favorites: any;
    paging_data_licenses: any;
    paging_data_host: any;
    searching = false;
    searching_licenses = false;
    searching_hosts = false;
    hide_all_license = true;
    initial_load = true;
    initial_load_licenses = true;
    initial_load_hosts = true;
    is_administrator = this.current_user_role === 'administrator';
    is_favorite = false;
    favorites_list: any = [];
    search_data = '';
    search_data_licenses = '';
    search_data_host = '';
    splitted_text: any;
    sort_column = 'PiStatus';
    sort_order = 'desc';
    sort_column_hosts = '';
    sort_order_hosts = '';
    has_sort = false;
    license_data_for_grid_view: API_LICENSE_PROPS[] = [];
    favorite_view = true;
    show_more_clicked = false;
    favorites_list_cache: any = [];
    grid_list_cache: any = [];
    total_favorites: 0;
    total_not_favorites: 0;

    //for export
    hosts_to_export: API_HOST[] = [];
    licenses_to_export: any[] = [];
    pageSize: number;
    workbook_generation = false;
    temp_label: any = [];
    temp_array: any = [];
    temp_label_this_week: any = [];
    temp_array_this_week: any = [];
    temp_label_last_week: any = [];
    temp_array_last_week: any = [];
    url_link: any;
    worksheet: WORKSHEET[];

    // UI Table Column Header
    license_table_column = this._licenseTableColumns;
    hosts_table_column = this._hostTableColumns;

    filters: any = {
        admin_licenses: false,
        isactivated: '',
        assigned: '',
        online: '',
        pending: '',
        activated: '',
        zone: '',
        status: '',
        dealer: '',
        host: '',
        recent: '',
        days_offline_from: '',
        days_offline_to: '',
        label_status: '',
        label_zone: '',
        label_dealer: '',
        label_admin: '',
    };

    protected _unsubscribe = new Subject<void>();
    total_license_results: any;
    total_online_results: any;
    total_offline_results: any;
    total_inactive_results: any;
    total_unassigned_results: any;
    licenses_data_result: boolean = false;
    licenseSearchKeyword: string;
    hostSearchKeyword: string;

    constructor(
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _date: DatePipe,
        private _host: HostService,
        private _license: LicenseService,
        private _title: TitleCasePipe,
        private cdr: ChangeDetectorRef,
        private _activatedRoute: ActivatedRoute,
        private router: Router,
        private _export: ExportService,
    ) {}

    ngOnInit() {
        const status = this._activatedRoute.snapshot.paramMap.get('status');
        if (status) this.filterTable('status', status === 'Online' ? '1' : '0');
        this.getLicensesTotal();
        this.getLicenses(1);
        this.url_link = environment.base_uri.replace('/api/', '');
    }

    ngAfterContentChecked(): void {
        this.cdr.detectChanges();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    addToFavorites(id: string) {
        this._license
            .add_license_favorite(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                if (response) {
                    this.openConfirmationModal('error', 'Error!', response.message);
                    return;
                }

                this.license_data_for_grid_view = this.license_data_for_grid_view.filter((x) => x.licenseId != id);
            });
    }

    changeView(view: string) {
        this.active_view = view;

        if (view === 'grid') {
            this.has_sort = true;
            this.license_data_for_grid_view = [];
            this.getLicenses(1, this.grid_list_cache.length > 0 ? this.grid_list_cache.length : 24);
            return;
        }

        this.getLicenses(1);
    }

    checkStatus(license) {
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        if (
            new Date(license.installDate) <= currentDate &&
            license.isActivated === 1 &&
            license.hostName != null &&
            license.piStatus === 1
        )
            return 'text-primary';
        else if (
            new Date(license.installDate) <= currentDate &&
            license.isActivated === 1 &&
            license.hostName != null &&
            license.piStatus === 0
        )
            return 'text-danger';
        else if (new Date(license.installDate) > currentDate && license.hostName != null && license.isActivated === 1)
            return 'text-orange';
        else if (license.isActivated === 0 && license.hostName != null) return 'text-light-gray';
        else return 'text-gray';
    }

    checkStatusForExport(license: API_LICENSE_PROPS) {
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        if (
            new Date(license.installDate) <= currentDate &&
            license.isActivated == 1 &&
            license.hostName != null &&
            license.piStatus == 1
        )
            return 'Online';
        else if (
            new Date(license.installDate) <= currentDate &&
            license.isActivated == 1 &&
            license.hostName != null &&
            license.piStatus == 0
        )
            return 'Offline';
        else if (new Date(license.installDate) > currentDate && license.hostName != null && license.isActivated === 1)
            return 'Pending';
        else if (license.isActivated == 0 && license.hostName != null) return 'Inactive';
        else return 'Unassigned';
    }

    clearFilter() {
        this.filters = {
            admin_licenses: false,
            assigned: '',
            isactivated: '',
            online: '',
            pending: '',
            activated: '',
            recent: '',
            days_offline_from: '',
            days_offline_to: '',
            zone: '',
            status: '',
            dealer: '',
            host: '',
            label_status: '',
            label_zone: '',
            label_dealer: '',
            label_host: '',
            label_admin: '',
        };

        if (this.active_view === 'grid') {
            this.getFavoriteLicenses(false);
            this.has_sort = true;
            this.license_data_for_grid_view = [];
            this.getLicenses(1, 24, true);
            return;
        }

        this.sortList('desc');
        this.getLicenses(1);
    }

    exportTable(tab: string) {
        this.workbook_generation = true;
        this.getDataForExport(tab);
    }

    filterTable(type: string, value: any, value2?: any, days?: any) {
        switch (type) {
            case 'status':
                this.resetFilterStatus();
                this.filters.status = value;
                this.filters.activated = true;
                this.filters.label_status = value == 1 ? 'Online' : 'Offline';
                this.filters.online = value == 1 ? true : false;
                this.filters.assigned = true;
                this.filters.pending = '';
                this.filters.isactivated = 1;
                if (value == 0) {
                    const filter = { column: 'TimeIn', order: 'desc' };
                    this.getColumnsAndOrder(filter, 'licenses');
                    return;
                }
                this.sortList('desc');
                break;

            case 'zone':
                this.filters.zone = value;
                this.filters.label_zone = value;
                this.sortList('desc');
                break;

            case 'activated':
                this.resetFilterStatus();
                this.filters.status = '';
                this.filters.isactivated = 0;
                this.filters.assigned = true;
                this.filters.label_status = 'Inactive';
                this.sortList('desc');
                break;

            case 'recent':
                this.resetFilterStatus();
                this.filters.status = '';
                this.filters.recent = value;
                this.filters.label_status = 'Recent Installs';
                this.sortList('desc');
                break;

            case 'days_offline':
                this.resetFilterStatus();
                this.filters.status = 0;
                this.filters.days_offline_from = value;
                this.filters.days_offline_to = value2;
                this.filters.label_status = 'Offline for ' + days;
                const filter = { column: 'TimeIn', order: 'desc' };
                this.getColumnsAndOrder(filter, 'licenses');
                break;

            case 'assigned':
                this.resetFilterStatus();
                this.filters.assigned = value;
                value == 'true' ? (this.filters.isactivated = 1) : (this.filters.isactivated = '');
                this.filters.label_status = value == 'true' ? 'Assigned' : 'Unassigned';
                this.sortList('desc');
                break;

            case 'pending':
                this.resetFilterStatus();
                this.filters.assigned = true;
                this.filters.isactivated = 1;
                this.filters.pending = value;
                this.filters.label_status = value == 'true' ? 'Pending' : '';
                this.sortList('desc');
                break;

            default:
        }
    }

    formulateScreenshotURL(url: string) {
        return `${environment.base_uri}${url.replace('/API/', '')}`;
    }

    getAnydeskPassword(id: string) {
        return this.splitKey(id);
    }

    getColumnsAndOrder(data: { column: string; order: string }, tab: string) {
        switch (tab) {
            case 'licenses':
                this.has_sort = true;
                this.sort_column = data.column;
                this.sort_order = data.order;

                if (this.active_view === 'grid') {
                    this.license_data_for_grid_view = [];
                    this.getFavoriteLicenses();
                    this.getLicenses(1, this.grid_list_cache.length, false);
                    return;
                }

                this.getLicenses(1);

                break;
            case 'hosts':
                this.has_sort = true;
                this.sort_column_hosts = data.column;
                this.sort_order_hosts = data.order;
                this.getHosts(1);
                break;
            default:
        }
    }

    getFavoriteLicenses(reset?: boolean) {
        this.favorites_list = [];
        this._license
            .get_all_licenses(
                1,
                !reset ? this.search_data_licenses : '',
                this.sort_column,
                this.sort_order,
                0,
                this.filters.admin_licenses,
                this.filters.status,
                this.filters.days_offline_from,
                this.filters.days_offline_to,
                this.filters.activated,
                this.filters.recent,
                this.filters.zone,
                this.filters.dealer,
                this.filters.host,
                this.filters.assigned,
                this.filters.pending,
                this.filters.online,
                this.filters.isactivated,
                true,
            )
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                if (data.licenses.length === 0) this.no_favorites = true;
                else {
                    data.licenses.map((entities) => this.favorites_list.push(entities));
                    this.favorites_list_cache = this.favorites_list;
                    this.no_favorites = false;
                    this.paging_data_favorites = data.paging;

                    this.total_license_results = data.totalCounts.total;
                    this.total_online_results = data.totalCounts.totalOnline;
                    this.total_offline_results = data.totalCounts.totalOffline;
                    this.total_inactive_results = data.totalCounts.totalInActive;
                    this.total_unassigned_results = data.totalCounts.totalUnAssigned;
                }
                if (reset) this.favorites_list_cache = this.favorites_list;
            });
    }

    getHosts(page: number) {
        this.searching_hosts = true;
        this.hosts_data = [];

        const filters = {
            page,
            search: this.search_data_host,
            sortColumn: this.sort_column_hosts,
            sortOrder: this.sort_order_hosts,
        };

        let request = this.has_sort ? this._host.get_host_by_page(filters) : this._host.get_host_fetch(filters);

        request
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if (response.message) {
                        if (this.search_data_host == '') this.no_host = true;
                        this.filtered_data_host = [];
                        return;
                    }

                    this.paging_data_host = response.paging;
                    const mappedData = this.mapToHostsTable([...response.paging.entities]);
                    this.hosts_data = [...mappedData];
                    this.filtered_data_host = [...mappedData];
                },
                (error) => console.error(error),
            )
            .add(() => {
                this.initial_load_hosts = false;
                this.searching_hosts = false;
            });
    }

    getLicenses(page: number, pageSize?: number, fromShowMore?: boolean) {
        let favorite: any;
        this.hosts_data = [];
        this.no_licenses_result = false;
        if (this.active_view != 'grid') {
            favorite = '';
            this.searching_licenses = true;
        } else {
            if (page > 1) this.searching_licenses = false;
            else this.searching_licenses = true;
            favorite = '';
        }
        this._license
            .get_all_licenses(
                page,
                this.search_data_licenses,
                this.sort_column,
                this.sort_order,
                pageSize ? pageSize : 15,
                this.filters.admin_licenses,
                this.filters.status,
                this.filters.days_offline_from,
                this.filters.days_offline_to,
                this.filters.activated,
                this.filters.recent,
                this.filters.zone,
                this.filters.dealer,
                this.filters.host,
                this.filters.assigned,
                this.filters.pending,
                this.filters.online,
                this.filters.isactivated,
                favorite,
            )
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    this.paging_data_licenses = data.paging;
                    if (data.licenses.length <= 0) {
                        this.hideLicenseSpinner();

                        if (this.active_view === 'grid') this.no_licenses_result = true;
                        else {
                            this.no_licenses_result = true;
                            this.filtered_data_licenses = [];
                        }

                        return;
                    }

                    if (this.active_view === 'grid') {
                        this.license_data_for_grid_view = [...data.licenses];

                        if (fromShowMore && page > 1) {
                            this.license_data_for_grid_view.map((lic) => {
                                this.grid_list_cache.push(lic);
                            });
                            this.license_data_for_grid_view = this.grid_list_cache;
                        }

                        if (page === 1) this.grid_list_cache = this.license_data_for_grid_view;

                        this.total_license_results = data.totalCounts.total;
                        this.total_online_results = data.totalCounts.totalOnline;
                        this.total_offline_results = data.totalCounts.totalOffline;
                        this.total_inactive_results = data.totalCounts.totalInActive;
                        this.total_unassigned_results = data.totalCounts.totalUnAssigned;

                        this.hideLicenseSpinner();
                        return;
                    }

                    const mapped = this.mapToLicensesTable(data.licenses);

                    this.licenses_data = [...mapped];
                    this.filtered_data_licenses = [...mapped];
                    this.hideLicenseSpinner();
                    this.total_license_results = data.totalCounts.total;
                    this.total_online_results = data.totalCounts.totalOnline;
                    this.total_offline_results = data.totalCounts.totalOffline;
                    this.total_inactive_results = data.totalCounts.totalInActive;
                    this.total_unassigned_results = data.totalCounts.totalUnAssigned;
                },
                (error) => console.error(error),
            );
    }

    getTotalHours(data: { storeHours: any }) {
        if (data.storeHours) {
            data.storeHours = JSON.parse(data.storeHours);
            this.hour_diff_temp = [];

            data.storeHours.map((hours) => {
                if (hours.status) {
                    hours.periods.map((period) => {
                        this.diff_hours = 86400;

                        if (period.open && period.close) {
                            const close = moment(period.close, 'H:mm A');
                            const open = moment(period.open, 'H:mm A');
                            const time_start = new Date('01/01/2007 ' + open.format('HH:mm:ss'));
                            let time_end = new Date('01/01/2007 ' + close.format('HH:mm:ss'));
                            if (time_start.getTime() > time_end.getTime())
                                time_end = new Date(time_end.getTime() + 60 * 60 * 24 * 1000);
                            this.diff_hours = (time_end.getTime() - time_start.getTime()) / 1000;
                        }
                        this.hour_diff_temp.push(this.diff_hours);
                    });
                }
            });

            this.hour_diff = 0;
            this.hour_diff_temp.map((hour) => (this.hour_diff += hour));
        }
        return this.msToTime(this.hour_diff);
    }

    getTotalLicenses() {
        if (this.active_view === 'grid') {
            if (this.no_favorites) return this.paging_data_licenses.totalEntities;
            return this.paging_data_favorites.totalEntities + this.paging_data_licenses.totalEntities;
        }

        return this.paging_data_licenses.totalEntities;
    }

    getZoneHours(data: API_LICENSE_PROPS) {
        if (data.templateName == 'Fullscreen') return 'Main: ' + this.msToTime(parseInt(data.templateMain));

        let data_to_return = '';
        const templates = [
            'Background',
            'Bottom',
            'Horizontal',
            'HorizontalSmall',
            'LowerLeft',
            'Main',
            'UpperLeft',
            'Vertical',
        ];

        templates.forEach((template, index) => {
            const templateKey = 'template' + template;
            if (data[templateKey] != 'NO DATA') {
                data_to_return +=
                    (index === 0 ? '' : '\n') + template + ': ' + this.msToTime(parseInt(data[templateKey]));
            }
        });

        return data_to_return;
    }

    onTabChanged(tab: { index: number }) {
        switch (tab.index) {
            case 0:
                this.getLicenses(1);
                this.resetSearchInput('licenses');
                this.clearFilter();
                this.licenses_data_result = false;
                break;
            case 2:
                if (!this.is_dealer_admin) return;
                this.getHosts(1);
                this.resetSearchInput('hosts');
                break;
            case 3:
                this.getHosts(1);
                this.resetSearchInput('hosts');
                break;
            default:
                break;
        }
    }

    sortByUser() {
        this._dialog
            .open(UserSortModalComponent, {
                width: '500px',
                data: 'license',
            })
            .afterClosed()
            .subscribe((data) => {
                if (!data) return;

                if (data.dealer.id) {
                    this.filters.dealer = data.dealer.id;
                    this.filters.label_dealer = data.dealer.name;
                }

                if (data.host.id) {
                    this.filters.host = data.host.id;
                    this.filters.label_host = data.host.name;
                }

                if (this.active_view === 'grid') {
                    this.license_data_for_grid_view = [];
                    this.getFavoriteLicenses(false);
                    this.getLicenses(1, 24, false);
                } else this.getLicenses(1);

                this.hide_all_license = false;
            });
    }

    filterData(keyword: string, tab: string) {
        switch (tab) {
            case 'licenses':
                this.has_sort = keyword ? true : false;
                this.search_data_licenses = keyword ? keyword : '';

                if (this.active_view === 'grid') {
                    this.license_data_for_grid_view = [];
                    this.getLicenses(1, 24, false);
                } else {
                    this.getLicenses(1);
                }

                this.showAllLicenses();
                this.licenses_data_result = keyword ? true : false;
                break;

            case 'hosts':
                this.has_sort = keyword ? true : false;
                this.search_data_host = keyword ? keyword : '';
                this.getHosts(1);
                break;

            default:
                break;
        }
    }

    resetSearchInput(tab: string) {
        switch (tab) {
            case 'licenses':
                this.search_data_licenses = '';
                break;
            case 'hosts':
                this.search_data_host = '';
                break;
            default:
                break;
        }
    }

    clearLabelStatusFilter(filters): void {
        this.filters = {
            admin_licenses: filters.admin_licenses,
            assigned: '',
            isactivated: '',
            online: '',
            pending: filters.pending,
            activated: '',
            recent: '',
            days_offline_from: filters.days_offline_from,
            days_offline_to: filters.days_offline_to,
            zone: filters.zone,
            status: '',
            dealer: filters.dealer,
            host: filters.host,
            label_status: '',
            label_zone: filters.label_zone,
            label_dealer: filters.label_dealer,
            label_host: '',
            label_admin: filters.label_admin,
        };
        this.sortList('desc');
        this.getLicenses(1);
    }

    clearLabelZoneFilter(filters): void {
        this.filters = {
            admin_licenses: filters.admin_licenses,
            assigned: filters.assigned,
            isactivated: filters.isactivated,
            online: filters.online,
            pending: filters.pending,
            activated: filters.activated,
            recent: filters.recent,
            days_offline_from: filters.days_offline_from,
            days_offline_to: filters.days_offline_to,
            zone: '',
            status: filters.status,
            dealer: filters.dealer,
            host: filters.host,
            label_status: filters.label_status,
            label_zone: '',
            label_dealer: filters.label_dealer,
            label_host: filters.label_host,
            label_admin: filters.label_admin,
        };
        this.sortList('desc');
        this.getLicenses(1);
    }

    clearLabelDealerFilter(filters): void {
        this.filters = {
            admin_licenses: filters.admin_licenses,
            assigned: filters.assigned,
            isactivated: filters.isactivated,
            online: filters.online,
            pending: filters.pending,
            activated: filters.activated,
            recent: filters.recent,
            days_offline_from: filters.days_offline_from,
            days_offline_to: filters.days_offline_to,
            zone: filters.zone,
            status: filters.status,
            dealer: '',
            host: filters.host,
            label_status: filters.label_status,
            label_zone: filters.label_zone,
            label_dealer: '',
            label_host: filters.label_host,
            label_admin: filters.label_admin,
        };
        this.sortList('desc');
        this.getLicenses(1);
    }

    clearLabelHostFilter(filters): void {
        this.filters = {
            admin_licenses: filters.admin_licenses,
            assigned: filters.assigned,
            isactivated: filters.isactivated,
            online: filters.online,
            pending: filters.pending,
            activated: filters.activated,
            recent: filters.recent,
            days_offline_from: filters.days_offline_from,
            days_offline_to: filters.days_offline_to,
            zone: filters.zone,
            status: filters.status,
            dealer: filters.dealer,
            host: '',
            label_status: filters.label_status,
            label_zone: filters.label_zone,
            label_dealer: filters.label_dealer,
            label_host: '',
            label_admin: filters.label_admin,
        };
        this.sortList('desc');
        this.getLicenses(1);
    }

    clearAdminFilter(filters): void {
        this.filters = {
            admin_licenses: false,
            assigned: filters.assigned,
            isactivated: filters.isactivated,
            online: filters.online,
            pending: filters.pending,
            activated: filters.activated,
            recent: filters.recent,
            days_offline_from: filters.days_offline_from,
            days_offline_to: filters.days_offline_to,
            zone: filters.zone,
            status: filters.status,
            dealer: filters.dealer,
            host: filters.host,
            label_status: filters.label_status,
            label_zone: filters.label_zone,
            label_dealer: filters.label_dealer,
            label_host: filters.label_host,
            label_admin: filters.label_admin,
        };
        this.sortList('desc');
        this.getLicenses(1);
    }

    getDataForExport(tab: string): void {
        switch (tab) {
            case 'licenses':
                this._license
                    .get_all_licenses_duration(
                        0,
                        this.search_data_licenses,
                        this.sort_column,
                        this.sort_order,
                        0,
                        this.filters.admin_licenses,
                        this.filters.status,
                        this.filters.days_offline_from,
                        this.filters.days_offline_to,
                        this.filters.activated,
                        this.filters.recent,
                        this.filters.zone,
                        this.filters.dealer,
                        this.filters.host,
                        this.filters.assigned,
                        this.filters.pending,
                        this.filters.online,
                        this.filters.isactivated,
                    )
                    .pipe(takeUntil(this._unsubscribe))
                    .subscribe((data: any) => {
                        if (data.message) {
                            this.licenses_to_export = [];
                            return;
                        }

                        data.licenses.map((license) => {
                            license.apps = license.appVersion ? JSON.parse(license.appVersion) : null;

                            if (license.internetInfo) {
                                license.internetInfo = JSON.parse(license.internetInfo);
                                license.upload = Math.round(license.internetInfo.uploadMbps * 100) / 100 + ' mbps';
                                license.download = Math.round(license.internetInfo.downloadMbps * 100) / 100 + ' mbps';
                            }

                            if (license.storeHours) this.getStoreHourseParse(license);
                        });

                        this.licenses_to_export = data.licenses;

                        this.licenses_to_export.forEach((item) => this.mapLicensesForExport(item));

                        this.prepareForExport(tab, this._licenseTableColumns, this.licenses_to_export);
                    })
                    .add(() => (this.workbook_generation = false));

                break;

            case 'hosts':
                const filters = {
                    page: 1,
                    search: this.search_data_host,
                    sortColumn: this.sort_column_hosts,
                    sortOrder: this.sort_order_hosts,
                    pageSize: 0,
                };

                this._host
                    .get_host_fetch_export(filters)
                    .subscribe((response) => {
                        if (response.message) {
                            this.hosts_to_export = [];
                            return;
                        } else {
                            response.host.map((host) => {
                                host.storeHours = this.getTotalHours(host);
                                this.mapHostsForExport(host);
                            });
                            this.hosts_to_export = response.host;
                        }
                        this.prepareForExport(tab, this._hostTableColumns, this.hosts_to_export);
                    })
                    .add(() => (this.workbook_generation = false));

                break;
            default:
        }
    }

    private prepareForExport(tab, column, dataToExport) {
        const filename = tab;
        let tables_to_export = column;
        tables_to_export = tables_to_export.filter(function (column) {
            return !column.no_export;
        });
        this.worksheet = [
            {
                name: filename,
                columns: tables_to_export,
                data: dataToExport,
            },
        ];
        this._export.generate(filename, this.worksheet);
    }

    getLabel(data: API_HOST) {
        this.now = moment().format('d');
        this.now = this.now;
        let storehours = JSON.parse(data.storeHours);
        storehours = storehours.sort((a, b) => a.id - b.id);

        const isAlmostOpenAllDay = storehours[this.now].periods.some(
            (i) => i.open === '12:00 AM' && i.close === '11:59 PM',
        );

        const modified_label = {
            date: moment().format('LL'),
            address: data.hostAddress,
            schedule:
                storehours[this.now] && storehours[this.now].status
                    ? (storehours[this.now].periods[0].open == '' && storehours[this.now].periods[0].close == '') ||
                      isAlmostOpenAllDay
                        ? 'Open 24 Hours'
                        : storehours[this.now].periods.map((i) => {
                              return i.open + ' - ' + i.close;
                          })
                    : 'Closed',
        };

        return modified_label;
    }

    getLicensesTotal() {
        this._license
            .get_licenses_total()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data: any) => {
                    this.licenses_details = {
                        basis: data.total,
                        basis_label: 'License(s)',
                        basis_sub_label: 'Current Count',
                        good_value: data.totalAssigned || 0,
                        good_value_label: 'Assigned',
                        bad_value: data.totalUnAssigned || 0,
                        bad_value_label: 'Unassigned',
                        breakdown1_value: data.totalOnline || 0,
                        breakdown1_label: 'Online',
                        breakdown2_value: data.totalOffline || 0,
                        breakdown2_label: 'Offline',
                        breakdown3_value: data.totalPending || 0,
                        breakdown3_label: 'Pending',
                        third_value: data.totalAdminLicenses || 0,
                        third_value_label: 'Demo',
                        fourth_value: data.totalDisabled || 0,
                        fourth_value_label: 'Inactive',

                        ad_value: data.totalAd,
                        ad_value_label: 'Ad',
                        menu_value: data.totalMenu,
                        menu_value_label: 'Menu',
                        closed_value: data.totalClosed,
                        closed_value_label: 'Closed',
                        unassigned_value: data.totalUnassignedScreenCount,
                        unassigned_value_label: 'Unassigned',
                        new_this_week_value: data.newLicensesThisWeek,
                        new_this_week_value_label: 'License(s)',
                        new_this_week_value_description: 'New this week',
                        new_last_week_value: data.newLicensesLastWeek,
                        new_last_week_value_label: 'License(s)',
                        new_last_week_value_description: 'New last week',
                        this_week_ad_value: data.thisWeekTotalAd,
                        this_week_menu_value: data.thisWeekTotalMenu,
                        this_week_closed_value: data.thisWeekTotalClosed,
                        this_week_unassigned_value: data.thisWeekUnassignedCount,
                        last_week_ad_value: data.lastWeekTotalAd,
                        last_week_menu_value: data.lastWeekTotalMenu,
                        last_week_closed_value: data.lastWeekTotalClosed,
                        last_week_unassigned_value: data.lastWeekUnassignedCount,
                    };

                    if (this.is_dealer_admin) {
                        delete this.licenses_details['third_value'];
                        delete this.licenses_details['third_value_label'];
                    }

                    if (this.licenses_details) {
                        this.temp_label.push(
                            this.licenses_details.ad_value_label + ': ' + this.licenses_details.ad_value,
                        );
                        this.temp_label.push(
                            this.licenses_details.menu_value_label + ': ' + this.licenses_details.menu_value,
                        );
                        this.temp_label.push(
                            this.licenses_details.unassigned_value_label +
                                ': ' +
                                this.licenses_details.unassigned_value,
                        );
                        this.temp_label.push(
                            this.licenses_details.closed_value_label + ': ' + this.licenses_details.closed_value,
                        );
                        this.temp_array.push(this.licenses_details.ad_value);
                        this.temp_array.push(this.licenses_details.menu_value);
                        this.temp_array.push(this.licenses_details.unassigned_value);
                        this.temp_array.push(this.licenses_details.closed_value);

                        this.temp_label_this_week.push(
                            this.licenses_details.ad_value_label + ': ' + this.licenses_details.this_week_ad_value,
                        );
                        this.temp_label_this_week.push(
                            this.licenses_details.menu_value_label + ': ' + this.licenses_details.this_week_menu_value,
                        );
                        this.temp_label_this_week.push(
                            this.licenses_details.closed_value_label +
                                ': ' +
                                this.licenses_details.this_week_closed_value,
                        );
                        this.temp_label_this_week.push(
                            this.licenses_details.unassigned_value_label +
                                ': ' +
                                this.licenses_details.this_week_unassigned_value,
                        );
                        this.temp_array_this_week.push(this.licenses_details.this_week_ad_value);
                        this.temp_array_this_week.push(this.licenses_details.this_week_menu_value);
                        this.temp_array_this_week.push(this.licenses_details.this_week_closed_value);
                        this.temp_array_this_week.push(this.licenses_details.this_week_unassigned_value);

                        this.temp_label_last_week.push(
                            this.licenses_details.ad_value_label + ': ' + this.licenses_details.last_week_ad_value,
                        );
                        this.temp_label_last_week.push(
                            this.licenses_details.menu_value_label + ': ' + this.licenses_details.last_week_menu_value,
                        );
                        this.temp_label_last_week.push(
                            this.licenses_details.closed_value_label +
                                ': ' +
                                this.licenses_details.last_week_closed_value,
                        );
                        this.temp_label_last_week.push(
                            this.licenses_details.unassigned_value_label +
                                ': ' +
                                this.licenses_details.last_week_unassigned_value,
                        );
                        this.temp_array_last_week.push(this.licenses_details.last_week_ad_value);
                        this.temp_array_last_week.push(this.licenses_details.last_week_menu_value);
                        this.temp_array_last_week.push(this.licenses_details.last_week_closed_value);
                        this.temp_array_last_week.push(this.licenses_details.last_week_unassigned_value);
                    }
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    getTotalShownLicenses() {
        if (this.active_view === 'grid') {
            if (this.favorite_view) return this.favorites_list.length + this.paging_data_licenses.entities.length;
            else return this.paging_data_licenses.entities.length;
        } else return this.paging_data_licenses.entities.length;
    }

    msToTime(input: number) {
        let totalSeconds = input;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        return hours + 'h ' + minutes + 'm ' + seconds + 's ';
    }

    navigateToAlias(id: string) {
        const url = this.router.serializeUrl(this.router.createUrlTree([`/${this._roleRoute}/licenses/${id}`], {}));
        window.open(url, '_blank');
    }

    navigateToDealer(id: string) {
        const url = this.router.serializeUrl(this.router.createUrlTree([`/${this._roleRoute}/dealers/${id}`], {}));
        window.open(url, '_blank');
    }

    navigateToHost(id: string) {
        const url = this.router.serializeUrl(this.router.createUrlTree([`/${this._roleRoute}/hosts/${id}`], {}));
        window.open(url, '_blank');
    }

    openConfirmationModal(status: string, message: string, data: any): void {
        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: { status, message, data },
            })
            .afterClosed()
            .subscribe(() => {
                if (status !== 'success') return;
                this.getFavoriteLicenses(false);
            });
    }

    openGenerateLicenseModal(): void {
        this._dialog
            .open(LicenseModalComponent, {
                height: '400px',
                width: '500px',
            })
            .afterClosed()
            .subscribe(() => this.ngOnInit());
    }

    resetFilterStatus() {
        this.filters.recent = '';
        this.filters.activated = '';
        this.filters.days_offline_from = '';
        this.filters.days_offline_to = '';
        this.filters.status = '';
        this.filters.assigned = '';
        this.filters.pending = '';
        this.filters.online = '';
    }

    showAdminLicenses(value) {
        this.filters.admin_licenses = value;
        this.getLicenses(1);
    }

    showAllLicenses() {
        this.hide_all_license = false;
    }

    showMore(event: { page: number; pageSize: number }): void {
        this.show_more_clicked = true;
        this.getLicenses(event.page, event.pageSize, true);
    }

    sortDisplay(order: string) {
        const filter = { column: 'DisplayStatus', order };
        this.getColumnsAndOrder(filter, 'licenses');
    }

    sortList(order: string): void {
        const filter = { column: 'PiStatus', order };
        this.getColumnsAndOrder(filter, 'licenses');
    }

    splitKey(key: string) {
        this.splitted_text = key.split('-');
        return this.splitted_text[this.splitted_text.length - 1];
    }

    toggleFavorites(value: string) {
        if (value === 'false') {
            this.favorite_view = false;
            this.getLicenses(1);
            return;
        }

        this.favorites_list = this.favorites_list_cache;
        this.no_favorites = false;
        this.favorite_view = true;
        this.getFavoriteLicenses(true);
    }

    getStoreHourseParse(data) {
        let days = [];
        if (data.storeHours) {
            let storehours = JSON.parse(data.storeHours);
            storehours = storehours.sort((a, b) => {
                return a.id - b.id;
            });
            storehours.map((day) => {
                if (day.status) {
                    day.periods.map((period) => {
                        if (period.open == '' && period.close == '') {
                            days.push(day.day + ' : Open 24 hrs');
                        } else {
                            days.push(day.day + ' : ' + period.open + ' - ' + period.close);
                        }
                    });
                } else {
                    days.push(day.day + ' : ' + 'Closed');
                }
            });
            data.storeHoursParsed = days.toString();
            data.storeHoursParsed = data.storeHoursParsed.split(',').join('\n');
        }
    }

    private getInternetType(value: string): string {
        if (!value) return;

        value = value.toLowerCase();

        if (value.includes('w')) return 'WiFi';
        if (value.includes('eth')) return 'LAN';
    }

    private hideLicenseSpinner() {
        this.initial_load_licenses = false;
        this.searching_licenses = false;
    }

    private mapHostsForExport(data: API_HOST) {
        data.storeHours = data.storeHours;
        data.generalCategory = data.generalCategory ? data.generalCategory : 'Other';
        data.tagsToString = data.tags.join(',');
    }

    private mapLicensesForExport(item: API_LICENSE_PROPS) {
        item.new_status = this.checkStatusForExport(item);
        item.zone = this.getZoneHours(item);
        item.piVersion = item.apps ? item.apps.rpi_model : '';
        item.displayStatus = item.displayStatus == 1 ? 'ON' : '';
        item.password = item.anydeskId ? this.splitKey(item.licenseId) : '';
        item.piStatus = item.piStatus == 0 ? 'Offline' : 'Online';
        item.screenType = this._title.transform(item.screenType);
        item.contentsUpdated = this._date.transform(item.contentsUpdated, 'MMM dd, yyyy h:mm a');
        item.timeIn = item.timeIn ? this._date.transform(item.timeIn, 'MMM dd, yyyy h:mm a') : '';
        item.installDate = this._date.transform(item.installDate, 'MMM dd, yyyy');
        item.installRequestDate = this._date.transform(item.installRequestDate, 'MMM dd, yyyy');
        item.dateCreated = this._date.transform(item.dateCreated, 'MMM dd, yyyy');
        item.internetType = this.getInternetType(item.internetType);
        item.internetSpeed = item.internetSpeed == 'Fast' ? 'Good' : item.internetSpeed;
        item.uploadSpeed = item.uploadSpeed ? this.roundOffNetworkData(parseInt(item.uploadSpeed)) : '';
        item.downloadSpeed = item.downloadSpeed ? this.roundOffNetworkData(parseInt(item.uploadSpeed)) : '';
        item.isActivated = item.isActivated == 0 ? 'No' : 'Yes';
        const parse_version = item.appVersion ? JSON.parse(item.appVersion) : '';
        item.ui = parse_version && parse_version.ui ? parse_version.ui : '1.0.0';
        item.server = parse_version && parse_version.server ? parse_version.server : '1.0.0';
        item.tagsToString = item.tags.join(',');
    }

    private mapToHostsTable(data: API_HOST[]): UI_HOST_VIEW[] {
        let count = this.paging_data_host.pageStart;
        let role = this._auth.current_role;
        if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) role = UI_ROLE_DEFINITION_TEXT.administrator;

        return data.map((h: API_HOST) => {
            const table = new UI_HOST_VIEW(
                { value: count++, link: null, editable: false, hidden: false },
                { value: h.hostId, link: null, editable: false, hidden: true, key: false },
                {
                    value: h.hostName,
                    link: `/` + role + `/hosts/${h.hostId}`,
                    new_tab_link: true,
                    compressed: true,
                    editable: false,
                    hidden: false,
                    status: true,
                    business_hours: h.hostId ? true : false,
                    business_hours_label: h.hostId ? this.getLabel(h) : null,
                },
                {
                    value: h.businessName ? h.businessName : '--',
                    link: `/` + role + `/dealers/${h.dealerId}`,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.address ? h.address : '--',
                    link: null,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                { value: h.city ? h.city : '--', link: null, editable: false, hidden: false },
                { value: h.state ? h.state : '--', hidden: false },
                {
                    value: h.postalCode ? h.postalCode : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.timezoneName ? h.timezoneName : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.totalLicenses ? h.totalLicenses : '0',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                { value: h.status, editable: false, hidden: true },
            );

            return table;
        });
    }

    private mapToLicensesTable(data): UI_LICENSE[] {
        let count = this.paging_data_licenses.pageStart;
        return data.map((l: any) => {
            const table = new UI_LICENSE(
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: l.licenseId,
                    link: null,
                    editable: false,
                    hidden: true,
                    key: false,
                    table: 'license',
                },
                {
                    value: l.screenshotUrl ? l.screenshotUrl : null,
                    link: l.screenshotUrl ? l.screenshotUrl : null,
                    editable: false,
                    hidden: false,
                    isImage: true,
                },
                {
                    value: l.licenseKey,
                    link: '/administrator/licenses/' + l.licenseId,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    status: true,
                    has_favorites: true,
                    is_favorite: l.isFavorite,
                    show_tags: l.tags != null ? true : false,
                    tags: l.tags != null ? l.tags : [],
                },
                {
                    value: l.dealerId ? l.businessName : '--',
                    link: '/administrator/dealers/' + l.dealerId,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    compressed: true,
                },
                {
                    value: l.hostId ? l.hostName : '--',
                    link: l.hostId ? '/administrator/hosts/' + l.hostId : null,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    business_hours: l.hostId ? true : false,
                    business_hours_label: l.hostId ? this.getLabel(l) : null,
                    compressed: true,
                },
                {
                    value: l.alias ? l.alias : '--',
                    link: '/administrator/licenses/' + l.licenseId,
                    editable: false,
                    new_tab_link: true,
                    label: 'License Alias',
                    id: l.licenseId,
                    hidden: false,
                },
                {
                    value: l.contentsUpdated ? l.contentsUpdated : '--',
                    label: 'Last Push',
                    hidden: false,
                },
                {
                    value: l.timeIn ? this._date.transform(l.timeIn, 'MMM dd y \n h:mm a') : '--',
                    hidden: false,
                },
                {
                    value: l.uploadSpeed ? this.roundOffNetworkData(l.uploadSpeed) : '--',
                    label: 'Speed',
                    customclass: this.getSpeedColorIndicator(l.uploadSpeed),
                    hidden: false,
                },
                {
                    value: l.downloadSpeed ? this.roundOffNetworkData(l.downloadSpeed) : '--',
                    label: 'Speed',
                    customclass: this.getSpeedColorIndicator(l.downloadSpeed),
                    hidden: false,
                },
                {
                    value: l.displayStatus == 1 ? 'ON' : 'OFF',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: l.anydeskId ? l.anydeskId : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                    copy: true,
                    label: 'Anydesk Id',
                    anydesk: true,
                    password: l.anydeskId ? this.splitKey(l.licenseId) : '--',
                },
                {
                    value:
                        l.installDate && !l.installDate.includes('Invalid')
                            ? this._date.transform(l.installDate, 'MMM dd, y')
                            : '--',
                    link: null,
                    editable: false,
                    label: 'Install Date',
                    hidden: false,
                    id: l.licenseId,
                },
                {
                    value:
                        l.installRequestDate && !l.installRequestDate.includes('Invalid')
                            ? this._date.transform(l.installRequestDate, 'MMM dd, y')
                            : '--',
                    link: null,
                    hidden: false,
                    editable: true,
                    label: 'Install Request Date',
                    id: l.licenseId,
                },
                {
                    value: this.checkStatus(l),
                    link: null,
                    editable: false,
                    hidden: true,
                    label: this.checkStatusForExport(l),
                    new_status: true,
                },
                { value: l.playerStatus, link: null, editable: false, hidden: true },
                { value: l.isActivated, link: null, editable: false, hidden: true },
            );
            return table;
        });
    }

    protected get _currentUserRole() {
        return this._auth.current_role;
    }

    protected get _hostTableColumns() {
        return [
            { name: '#', sortable: false, no_export: true },
            { name: 'Host ID', sortable: true, key: 'hostId', hidden: true, no_show: true },
            { name: 'Host Name', sortable: true, column: 'HostName', key: 'hostName' },
            { name: 'Category', key: 'category', no_show: true, hidden: true },
            { name: 'General Category', hidden: true, no_show: true, key: 'generalCategory' },
            { name: 'Dealer Name', sortable: true, column: 'BusinessName', key: 'businessName' },
            { name: 'Address', sortable: true, column: 'Address', key: 'address' },
            { name: 'City', sortable: true, column: 'City', key: 'city' },
            { name: 'State', sortable: true, column: 'State', key: 'state' },
            { name: 'Postal Code', sortable: true, column: 'PostalCode', key: 'postalCode' },
            { name: 'Timezone', sortable: true, column: 'TimezoneName', key: 'timezoneName' },
            {
                name: 'Total Licenses',
                sortable: true,
                column: 'TotalLicenses',
                key: 'totalLicenses',
            },
            { name: 'Tags', key: 'tagsToString', no_show: true, hidden: true },
            {
                name: 'Total Business Hours',
                sortable: false,
                key: 'storeHours',
                hidden: true,
                no_show: true,
            },
            { name: 'DMA Rank', sortable: false, hidden: true, key: 'dmaRank', no_show: true },
            { name: 'DMA Code', sortable: false, hidden: true, key: 'dmaCode', no_show: true },
            { name: 'DMA Name', sortable: false, hidden: true, key: 'dmaName', no_show: true },
            { name: 'Latitude', sortable: false, hidden: true, key: 'latitude', no_show: true },
            { name: 'Longitude', sortable: false, hidden: true, key: 'longitude', no_show: true },
        ];
    }

    protected get _licenseTableColumns() {
        return [
            { name: '#', sortable: false, no_export: true },
            { name: 'Status', sortable: false, key: 'new_status', hidden: true, no_show: true },
            { name: 'Screenshot', sortable: false, no_export: true },
            { name: 'License Key', sortable: true, column: 'LicenseKey', key: 'licenseKey' },
            {
                name: 'Type',
                sortable: true,
                column: 'ScreenType',
                key: 'screenType',
                hidden: true,
                no_show: true,
            },
            { name: 'Dealer', sortable: true, column: 'BusinessName', key: 'businessName' },
            { name: 'Host', sortable: true, column: 'HostName', key: 'hostName' },
            { name: 'Alias', sortable: true, column: 'Alias', key: 'alias' },
            {
                name: 'Address',
                sortable: false,
                key: 'hostAddress',
                hidden: true,
                no_show: true,
            },
            {
                name: 'City',
                sortable: false,
                key: 'city',
                hidden: true,
                no_show: true,
            },
            {
                name: 'State',
                sortable: false,
                key: 'state',
                hidden: true,
                no_show: true,
            },
            {
                name: 'Business Hours',
                sortable: false,
                key: 'storeHoursParsed',
                hidden: true,
                no_show: true,
            },
            {
                name: 'Contact Person',
                sortable: false,
                key: 'contactPerson',
                hidden: true,
                no_show: true,
            },
            {
                name: 'Contact Number',
                sortable: false,
                key: 'contactNumber',
                hidden: true,
                no_show: true,
            },
            {
                name: 'Last Push',
                sortable: true,
                column: 'ContentsUpdated',
                key: 'contentsUpdated',
            },
            { name: 'Last Disconnect', sortable: true, column: 'TimeIn', key: 'timeIn' },
            { name: 'Upload Speed', sortable: true, column: 'UploadSpeed', key: 'uploadSpeed' },
            { name: 'Download Speed', sortable: true, column: 'DownloadSpeed', key: 'downloadSpeed' },
            {
                name: 'Net Type',
                sortable: true,
                column: 'InternetType',
                key: 'internetType',
                hidden: true,
                no_show: true,
            },
            {
                name: 'Net Speed',
                sortable: true,
                key: 'internetSpeed',
                column: 'InternetSpeed',
                hidden: true,
                no_show: true,
            },
            { name: 'Display', sortable: true, key: 'displayStatus', column: 'DisplayStatus' },
            {
                name: 'PS Version',
                sortable: true,
                key: 'server',
                column: 'ServerVersion',
                hidden: true,
                no_show: true,
            },
            {
                name: 'UI Version',
                sortable: true,
                key: 'ui',
                column: 'UiVersion',
                hidden: true,
                no_show: true,
            },
            { name: 'Pi Version', sortable: false, key: 'piVersion', hidden: true, no_show: true },
            { name: 'Memory', sortable: false, key: 'memory', hidden: true, no_show: true },
            { name: 'Storage', sortable: false, key: 'totalStorage', hidden: true, no_show: true },
            { name: 'Anydesk', sortable: true, column: 'AnydeskId', key: 'anydeskId' },
            { name: 'Password', sortable: false, key: 'password', hidden: true, no_show: true },
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
            {
                name: 'Creation Date',
                sortable: true,
                key: 'dateCreated',
                column: 'DateCreated',
                hidden: true,
                no_show: true,
            },
            { name: 'Zone & Duration', sortable: false, hidden: true, key: 'zone', no_show: true },
            { name: 'Tags', key: 'tagsToString', no_show: true },
        ];
    }

    private roundOffNetworkData(data: number) {
        return (Math.round(data * 100) / 100).toFixed(2) + ' MBPS';
    }

    private getSpeedColorIndicator(speed) {
        if (speed > 25) return 'text-primary';
        else if (speed <= 25 && speed > 6) return 'text-orange';
        else return 'text-danger';
    }

    protected get _roleRoute() {
        return this._auth.roleRoute;
    }
}
