import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import { environment } from 'src/environments/environment';
import {
    API_ADVERTISER,
    API_HOST,
    API_LICENSE,
    PAGING,
    UI_ADVERTISER,
    UI_DEALER_HOSTS,
    UI_TABLE_LICENSE_BY_HOST,
} from 'src/app/global/models';
import { AuthService, AdvertiserService, HostService, LicenseService } from 'src/app/global/services';
import { UserSortModalComponent } from 'src/app/global/components_shared/media_components/user-sort-modal/user-sort-modal.component';

@Component({
    selector: 'app-hosts',
    templateUrl: './hosts.component.html',
    styleUrls: ['./hosts.component.scss'],
    providers: [TitleCasePipe],
})
export class HostsComponent implements OnInit {
    createHostLink: string;
    filtered_data: any = [];
    host_data: any = [];
    host_filtered_data: any = [];
    hosts_to_export: any = [];
    initial_load: boolean = true;
    subscription: Subscription = new Subscription();
    host_count: any;
    no_hosts: boolean = false;
    pageSize: number;
    paging_data: any;
    search_data: string = '';
    searching: boolean = false;
    temp_array: any = [];
    workbook: any;
    workbook_generation: boolean = false;
    worksheet: any;
    is_searching = false;
    table = { columns: [], data: [] as UI_ADVERTISER[] };
    no_advertisers = false;
    initial_load_advertiser = true;
    hostsPaging: PAGING;
    licensesPaging: PAGING;
    advertisersPaging: PAGING;
    searching_license: boolean = false;
    search_data_license: string = '';
    sort_column: string = '';
    sort_order: string = '';
    initial_load_license: boolean = true;
    license_data_api: any;
    license_data: UI_TABLE_LICENSE_BY_HOST[] = [];
    license_filtered_data: any = [];
    no_licenses: boolean = false;
    now: any;
    splitted_text: any;
    dealers_name: string;
    is_view_only = false;

    private keyword = '';
    protected _unsubscribe = new Subject<void>();

    host_table_column = [
        { name: '#', no_export: true },
        { name: 'Name', key: 'name' },
        { name: 'Address', key: 'address' },
        { name: 'City', key: 'city' },
        { name: 'Postal Code', key: 'postalCode' },
        { name: 'Number of Licenses', key: 'totalLicenses' },
        { name: 'Status', key: 'status' },
        { name: 'Notes', sortable: false, key: 'notes' },
        { name: 'Others', sortable: false, key: 'others' },
    ];

    license_table_columns = [
        { name: '#', sortable: false, no_export: true },
        { name: 'Screenshot', sortable: false, no_export: true },
        { name: 'Status', sortable: false, key: 'piStatus', hidden: true, no_show: true },
        { name: 'License Key', sortable: true, key: 'licenseKey', column: 'LicenseKey' },
        { name: 'Type', sortable: true, key: 'screenType', column: 'ScreenType' },
        { name: 'Host', sortable: true, key: 'hostName', column: 'HostName' },
        { name: 'Alias', sortable: true, key: 'alias', column: 'Alias' },
        { name: 'Last Push', sortable: true, key: 'contentsUpdated', column: 'ContentsUpdated' },
        { name: 'Last Startup', sortable: true, key: 'timeIn', column: 'TimeIn' },
        { name: 'Upload Speed', sortable: true, column: 'UploadSpeed', key: 'uploadSpeed' },
        { name: 'Download Speed', sortable: true, column: 'DownloadSpeed', key: 'downloadSpeed' },
        { name: 'Net Type', sortable: true, key: 'internetType', column: 'InternetType' },
        { name: 'Net Speed', sortable: true, key: 'internetSpeed', column: 'InternetSpeed' },
        { name: 'Anydesk', sortable: true, key: 'anydeskId', column: 'AnydeskId' },
        { name: 'Password', sortable: false, key: 'password', no_show: true, hidden: true },
        { name: 'Display', sortable: true, key: 'displayStatus', column: 'DisplayStatus' },
        { name: 'Install Date', sortable: true, key: 'installDate', column: 'InstallDate' },
        // { name: 'Creation Date', sortable: true, key: 'dateCreated', column: 'DateCreated' },
        { name: 'Zone & Duration', sortable: false, hidden: true, key: 'zone', no_show: true },
    ];

    filters: any = {
        activated: '',
        zone: '',
        status: '',
        host: '',
        label_status: '',
        label_zone: '',
        label_dealer: '',
        label_host: '',
    };

    constructor(
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _change_detector: ChangeDetectorRef,
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _host: HostService,
        private _license: LicenseService,
        private _title: TitleCasePipe,
    ) {}

    ngOnInit() {
        this.getHosts(1);
        this.getLicenses(1);
        this.getTotalCount(this.currentUser.roleInfo.dealerId);
        this.table.columns = ['#', 'Business Name', 'Total Assets', 'City', 'State', 'Status'];
        this.getAdvertiserByDealer(1);
        this.createHostLink = `/${this.currentRole}/hosts/create-host`;
        this.is_view_only = this.currentUser.roleInfo.permission === 'V';
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
        this.subscription.unsubscribe();
    }

    ngAfterContentChecked(): void {
        this._change_detector.detectChanges();
    }

    clearFilter(): void {
        this.filters = {
            activated: '',
            zone: '',
            status: '',
            host: '',
            label_status: '',
            label_zone: '',
            label_dealer: '',
            label_host: '',
        };

        this.getLicenses(1);
    }

    exportTable(): void {
        this.workbook_generation = true;
        const header = [];
        this.workbook = new Workbook();
        this.workbook.creator = 'NCompass TV';
        this.workbook.useStyles = true;
        this.workbook.created = new Date();
        this.worksheet = this.workbook.addWorksheet('HOSTS');

        Object.keys(this.host_table_column).forEach((key) => {
            if (this.host_table_column[key].name && !this.host_table_column[key].no_export) {
                header.push({
                    header: this.host_table_column[key].name,
                    key: this.host_table_column[key].key,
                    width: 30,
                    style: { font: { name: 'Arial', bold: true } },
                });
            }
        });

        this.worksheet.columns = header;
        this.getDataForExport();
    }

    filterTable(type: string, value: any) {
        switch (type) {
            case 'status':
                this.filters.status = value;
                this.filters.activated = '';
                this.filters.label_status = value == 1 ? 'Online' : 'Offline';
                break;
            case 'zone':
                this.filters.zone = value;
                this.filters.label_zone = value;
                break;
            case 'activated':
                this.filters.status = '';
                this.filters.activated = value;
                this.filters.label_status = 'Inactive';
                break;
            default:
        }

        this.getLicenses(1);
    }

    getAdvertiserByDealer(page: number) {
        const filters = {
            dealer_id: this.currentUser.roleInfo.dealerId,
            page,
            search: this.keyword,
            sortColumn: '',
            sortOrder: '',
            pageSize: 15,
        };

        this.is_searching = true;

        this._advertiser
            .get_advertisers_by_dealer_id(filters)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                if (response.message) {
                    this.table.data = [];
                    if (this.keyword === '') this.no_advertisers = true;
                    return;
                }

                this.advertisersPaging = response.paging;
                const advertisers = this.mapToAdvertisersTable(response.advertisers);
                this.table.data = [...advertisers];
            })
            .add(() => {
                this.initial_load_advertiser = false;
                this.is_searching = false;
            });
    }

    getColumnsAndOrder(data: { column: string; order: string }) {
        this.sort_column = data.column;
        this.sort_order = data.order;
        this.getLicenses(1);
    }

    getHosts(page: number) {
        this.searching = true;
        this.host_data = [];
        this.host_filtered_data = [];
        this.temp_array = [];

        this._host
            .get_host_by_dealer_id(this.currentUser.roleInfo.dealerId, page, this.search_data)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                this.hostsPaging = response.paging;

                if (response.message) {
                    if (this.search_data == '') this.no_hosts = true;
                    this.host_data = [];
                    this.host_filtered_data = [];
                    return;
                }

                const data = response.paging.entities as API_HOST[];
                const mappedData = this.mapToHostsTable([...data]);
                this.host_data = [...mappedData];
                this.host_filtered_data = [...mappedData];
            })
            .add(() => {
                this.initial_load = false;
                this.searching = false;
            });
    }

    getLicenses(page: number) {
        this.searching_license = true;

        this._license
            .sort_license_by_dealer_id(
                this.currentUser.roleInfo.dealerId,
                page,
                this.search_data_license,
                this.sort_column,
                this.sort_order,
                15,
                this.filters.status,
                this.filters.activated,
                this.filters.zone,
                this.filters.host,
            )
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                this.licensesPaging = response.paging;

                if (response.message) {
                    if (this.search_data_license == '') this.no_licenses = true;
                    this.license_data = [];
                    this.license_filtered_data = [];
                    return;
                }

                const data = response.paging.entities as API_LICENSE['license'][];
                const mappedData = this.mapToLicensesTable([...data]);
                this.license_data_api = data;
                this.license_data = [...mappedData];
                this.filtered_data = [...mappedData];
                this.license_filtered_data = [...mappedData];
            })
            .add(() => {
                this.initial_load_license = false;
                this.searching_license = false;
            });
    }

    hostFilterData(keyword: string = '') {
        this.search_data = keyword;
        this.getHosts(1);
    }

    licenseFilterData(keyword: string = '') {
        this.search_data_license = keyword;
        this.getLicenses(1);
    }

    onSearchAdvertiser(keyword: string) {
        if (keyword) this.keyword = keyword;
        else this.keyword = '';
        this.getAdvertiserByDealer(1);
    }

    onTabChanged(e: { index: number }) {
        switch (e.index) {
            case 1:
                // this.pageRequested(1);
                break;
            case 0:
                // this.getLicenses(1);
                break;
            case 3:
                this.getHosts(1);
                break;
            default:
        }
    }

    reloadLicense() {
        this.license_data = [];
        this.ngOnInit();
    }

    sortByUser() {
        let dialog = this._dialog.open(UserSortModalComponent, {
            width: '500px',
            data: {
                view: 'license',
                is_dealer: true,
                dealer_id: this.currentUser.roleInfo.dealerId,
                dealer_name: this.dealers_name,
            },
        });

        dialog.afterClosed().subscribe((data) => {
            if (data) {
                if (data.host.id) {
                    this.filters.host = data.host.id;
                    this.filters.label_host = data.host.name;
                }
                this.getLicenses(1);
            }
        });
    }

    splitKey(key) {
        this.splitted_text = key.split('-');
        return this.splitted_text[this.splitted_text.length - 1];
    }

    sortList(order): void {
        var filter = {
            column: 'PiStatus',
            order: order,
        };
        this.getColumnsAndOrder(filter);
    }

    private getDataForExport(): void {
        this.pageSize = 0;

        this._host
            .get_host_by_dealer_id(this.currentUser.roleInfo.dealerId, 1, '', this.pageSize)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                if (!data.message) {
                    const EXCEL_TYPE =
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                    this.hosts_to_export = data.paging.entities;
                    this.hosts_to_export.forEach((item, i) => {
                        this.worksheet.addRow(item).font = {
                            bold: false,
                        };
                    });
                    let rowIndex = 1;
                    for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
                        this.worksheet.getRow(rowIndex).alignment = {
                            vertical: 'middle',
                            horizontal: 'center',
                            wrapText: true,
                        };
                    }
                    this.workbook.xlsx.writeBuffer().then((file: any) => {
                        const blob = new Blob([file], { type: EXCEL_TYPE });
                        const filename = this.currentUser.roleInfo.businessName + '-HOSTS' + '.xlsx';
                        saveAs(blob, filename);
                    });
                    this.workbook_generation = false;
                } else {
                    this.hosts_to_export = [];
                }
            });
    }

    private getInternetType(value: string): string {
        if (value) {
            value = value.toLowerCase();
            if (value.includes('w')) {
                return 'WiFi';
            }
            if (value.includes('eth')) {
                return 'LAN';
            }
        }
    }

    private getLabel(data) {
        this.now = moment().format('d');
        this.now = this.now;
        var storehours = JSON.parse(data.storeHours);
        storehours = storehours.sort((a, b) => {
            return a.id - b.id;
        });
        var modified_label = {
            date: moment().format('LL'),
            address: data.hostAddress,
            schedule:
                storehours[this.now] && storehours[this.now].status
                    ? storehours[this.now].periods[0].open == '' && storehours[this.now].periods[0].close == ''
                        ? 'Open 24 Hours'
                        : storehours[this.now].periods.map((i) => {
                              return i.open + ' - ' + i.close;
                          })
                    : 'Closed',
        };
        return modified_label;
    }

    private getTotalCount(id: string): void {
        this._host
            .get_host_total_per_dealer(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response: any) => {
                this.host_count = {
                    basis: response.total,
                    basis_label: 'Host(s)',
                    good_value: response.totalActive,
                    good_value_label: 'Active',
                    bad_value: response.totalInActive,
                    bad_value_label: 'Inactive',
                    new_this_week_value: response.newHostsThisWeek,
                    new_this_week_label: 'Host(s)',
                    new_this_week_description: 'New this week',
                    new_last_week_value: response.newHostsLastWeek,
                    new_last_week_label: 'Host(s)',
                    new_last_week_description: 'New last week',
                };
            });
    }

    private mapToAdvertisersTable(data: API_ADVERTISER[]): UI_ADVERTISER[] {
        let count = this.advertisersPaging.pageStart;

        return data.map((advertiser) => {
            return {
                advertiserId: { value: advertiser.id, link: null, editable: false, hidden: true },
                index: { value: count++, link: null, editable: false, hidden: false },
                name: {
                    value: advertiser.name,
                    link: `${'dealer/advertisers'}/${advertiser.id}`,
                    editable: false,
                    hidden: false,
                },
                totalAssets: { value: advertiser.totalAssets },
                city: {
                    value: advertiser.city ? advertiser.city : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                state: {
                    value: advertiser.state ? advertiser.state : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                status: { value: advertiser.status, link: null, editable: false, hidden: false },
            };
        });
    }

    private mapToHostsTable(data: API_HOST[]): UI_DEALER_HOSTS[] {
        let count = this.hostsPaging.pageStart;

        return data.map((hosts) => {
            return new UI_DEALER_HOSTS(
                { value: hosts.hostId, link: null, editable: false, hidden: true },
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: hosts.name,
                    link: `/${this.currentRole}/hosts/` + hosts.hostId,
                    editable: false,
                    hidden: false,
                },
                { value: hosts.address, link: null, editable: false, hidden: false },
                { value: hosts.city, link: null, editable: false, hidden: false },
                { value: hosts.postalCode, link: null, editable: false, hidden: false },
                { value: hosts.totalLicenses, link: null, editable: false, hidden: false },
                {
                    value: hosts.category ? this._title.transform(hosts.category.replace(/_/g, ' ')) : '--',
                    link: null,
                    editable: false,
                    hidden: true,
                },
                {
                    value: hosts.status ? (hosts.status === 'A' ? 'Active' : 'Inactive') : 'Inactive',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: hosts.notes ? hosts.notes : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: hosts.others ? hosts.others : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
            );
        });
    }

    private mapToLicensesTable(data: API_LICENSE['license'][]): UI_TABLE_LICENSE_BY_HOST[] {
        let count = this.licensesPaging.pageStart;

        return data.map((i) => {
            return new UI_TABLE_LICENSE_BY_HOST(
                { value: i.licenseId, link: null, editable: false, hidden: true },
                { value: i.hostId ? i.hostId : '--', link: null, editable: false, hidden: true },
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: i.screenshotUrl ? i.screenshotUrl : null,
                    link: i.screenshotUrl ? i.screenshotUrl : null,
                    editable: false,
                    hidden: false,
                    isImage: true,
                },
                {
                    value: i.licenseKey,
                    link: `/${this.currentRole}/licenses/` + i.licenseId,
                    editable: false,
                    hidden: false,
                    status: true,
                },
                {
                    value: i.screenType ? this._title.transform(i.screenType) : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: i.hostId ? i.hostName : '--',
                    link: i.hostId ? `$/{this.currentRole}/hosts/` + i.hostId : null,
                    editable: false,
                    hidden: false,
                    business_hours: i.hostId ? true : false,
                    business_hours_label: i.hostId ? this.getLabel(i) : null,
                },
                {
                    value: i.alias ? i.alias : '--',
                    link: `/${this.currentRole}/licenses/` + i.licenseId,
                    editable: true,
                    label: 'License Alias',
                    id: i.licenseId,
                    hidden: false,
                },
                {
                    value: i.contentsUpdated ? this._date.transform(i.contentsUpdated) : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: i.timeIn ? this._date.transform(i.timeIn) : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: i.uploadSpeed ? this.roundOffNetworkData(parseInt(i.uploadSpeed)) : '--',
                    label: 'Speed',
                    customclass: this.getSpeedColorIndicator(i.uploadSpeed),
                    hidden: false,
                },
                {
                    value: i.downloadSpeed ? this.roundOffNetworkData(parseInt(i.downloadSpeed)) : '--',
                    label: 'Speed',
                    customclass: this.getSpeedColorIndicator(i.downloadSpeed),
                    hidden: false,
                },
                {
                    value: i.internetType ? this.getInternetType(i.internetType) : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: i.internetSpeed ? i.internetSpeed : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: i.anydeskId ? i.anydeskId : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                    copy: true,
                    label: 'Anydesk Id',
                    anydesk: true,
                    password: i.anydeskId ? this.splitKey(i.licenseId) : '--',
                },
                {
                    value: i.displayStatus == 1 ? 'ON' : 'N/A',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: i.installDate ? this._date.transform(i.installDate) : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                { value: i.piStatus, link: null, editable: false, hidden: true },
                { value: i.playerStatus, link: null, editable: false, hidden: true },
                { value: i.isActivated, link: null, editable: false, hidden: true },
            );
        });
    }

    private roundOffNetworkData(data: number) {
        return (Math.round(data * 100) / 100).toFixed(2) + ' MBPS';
    }

    private getSpeedColorIndicator(speed) {
        if (speed > 25) return 'text-primary';
        else if (speed <= 25 && speed > 6) return 'text-orange';
        else return 'text-danger';
    }

    protected get currentUser() {
        return this._auth.current_user_value;
    }

    protected get currentRole() {
        return this._auth.current_role;
    }
}
