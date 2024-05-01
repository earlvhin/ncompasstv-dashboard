import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import {
    API_ADVERTISER,
    API_HOST,
    API_LICENSE,
    PAGING,
    UI_ADVERTISER,
    UI_DEALER_HOSTS,
    UI_TABLE_LICENSE_BY_HOST,
    UI_DEALER_LICENSE_ZONE,
} from 'src/app/global/models';
import { AuthService, AdvertiserService, HostService, DealerService } from 'src/app/global/services';

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
    hosts_to_export: API_HOST[] = [];
    initial_load: boolean = true;
    initial_load_zone = true;
    host_count: any;
    license_zone_data: any = [];
    license_filtered_data: any = [];
    no_hosts: boolean = false;
    pageSize: number;
    paging_data: any;
    paging_data_zone: any;
    search_data: string = '';
    searching: boolean = false;
    search_data_license_zone: string = '';
    searching_license_zone = false;
    temp_array: any = [];
    workbook: any;
    workbook_generation: boolean = false;
    worksheet: any;
    is_searching = false;
    table = { columns: [], data: [] as UI_ADVERTISER[] };
    no_advertisers = false;
    no_license_zone = false;
    initial_load_advertiser = true;
    hostsPaging: PAGING;
    licensesPaging: PAGING;
    advertisersPaging: PAGING;
    searching_license: boolean = false;
    search_data_license: string = '';
    sort_column: string = '';
    sort_order: string = '';
    subscription: Subscription = new Subscription();
    host_sort_column: string = '';
    host_sort_order: string = '';
    adv_sort_column: string = '';
    adv_sort_order: string = '';
    initial_load_license: boolean = true;
    license_data_api: any;
    license_data: UI_TABLE_LICENSE_BY_HOST[] = [];
    license_zone_filtered_data: any = [];
    no_licenses: boolean = false;
    now: any;
    splitted_text: any;
    dealers_name: string;
    is_view_only = false;

    private keyword = '';
    protected _unsubscribe = new Subject<void>();

    host_table_column = [
        { name: '#', no_export: true },
        { name: 'Name', sortable: true, key: 'name', column: 'Name' },
        { name: 'Category', key: 'category', no_show: true, hidden: true },
        { name: 'General Category', key: 'generalCategory', no_show: true, hidden: true },
        { name: 'Address', key: 'address' },
        { name: 'City', sortable: true, key: 'city', column: 'City' },
        { name: 'Postal Code', key: 'postalCode' },
        {
            name: 'Number of Licenses',
            sortable: true,
            key: 'totalLicenses',
            column: 'TotalLicenses',
        },
        { name: 'Status', key: 'status' },
        //{ name: 'Notes', sortable: false, key: 'notes' },
        { name: 'Others', sortable: false, key: 'others' },
        { name: 'Tags', key: 'tagsToString', no_show: true, hidden: true },
    ];

    license_zone_table_col = [
        { name: '#', sortable: false },
        { name: 'License ID', sortable: false, column: 'LicenseKey' },
        { name: 'Host Name', sortable: false, column: 'HostName' },
        { name: 'Alias', sortable: false, column: 'LicenseAlias' },
        { name: 'Main', sortable: false, column: 'MainDuration' },
        { name: 'Vertical', sortable: false, column: 'VerticalDuration' },
        { name: 'Banner', sortable: false, column: 'HorizontalDuration' },
        { name: 'Background', sortable: false, column: 'BackgroundDuration' },
        { name: 'Assets', sortable: false, column: 'MainTotalAsset' },
        { name: 'Hosts', sortable: false, column: 'MainTotalHost' },
        { name: 'Hosts (%)', sortable: false, column: 'MainTotalHostPercentage' },
        { name: 'Advertisers', sortable: false, column: 'MainTotalAdvertiser' },
        { name: 'Advertisers (%)', sortable: false, column: 'MainTotalAdvertiserPercentage' },
        { name: 'Fillers', sortable: false, column: 'MainTotalFiller' },
        { name: 'Fillers (%)', sortable: false, column: 'MainTotalFillerPercentage' },
        { name: 'Feeds', sortable: false, column: 'MainTotalFeed' },
        { name: 'Feeds (%)', sortable: false, column: 'MainTotalFeedPercentage' },
        { name: 'Other', sortable: false, column: 'MainTotalOther' },
        { name: 'Other (%)', sortable: false, column: 'MainTotalOtherPercentage' },
    ];

    constructor(
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _change_detector: ChangeDetectorRef,
        private _dealer: DealerService,
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _host: HostService,
        private _title: TitleCasePipe,
    ) {}

    ngOnInit() {
        this.getHosts(1);
        this.getTotalCount(this._auth.current_user_value.roleInfo.dealerId);
        this.table.columns = [
            '#',
            { name: 'Business Name', sortable: true, column: 'Name' },
            { name: 'Total Assets', sortable: true, column: 'TotalAssets' },
            { name: 'City', sortable: true, column: 'City' },
            'State',
            'Status',
        ];
        this.createHostLink = `/${this.currentRole}/hosts/create-host`;
        this.is_view_only = this.currentUser.roleInfo.permission === 'V';
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    ngAfterContentChecked(): void {
        this._change_detector.detectChanges();
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

    getColumnsAndOrder(data: { column: string; order: string }) {
        this.sort_column = data.column;
        this.sort_order = data.order;
    }

    getHostColumnsAndOrder(data: { column: string; order: string }) {
        if (data.column === 'TotalLicenses') {
            data.column = 'TotalLicences';
        }
        this.host_sort_column = data.column;
        this.host_sort_order = data.order;
        this.getHosts(1);
    }

    getHosts(page: number) {
        this.searching = true;
        this.host_data = [];
        this.host_filtered_data = [];
        this.temp_array = [];

        const filters = {
            dealerId: this._auth.current_user_value.roleInfo.dealerId,
            page,
            search: this.search_data,
            sortColumn: this.host_sort_column,
            sortOrder: this.host_sort_order,
            pageSize: 15,
        };

        this._host
            .get_host_by_dealer_id_with_sort(filters)
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

    hostFilterData(keyword: string = '') {
        this.search_data = keyword;
        this.getHosts(1);
    }

    onTabChanged(e: { index: number }) {
        switch (e.index) {
            case 0:
                this.getHosts(1);
                break;
            case 1:
                // this.getLicenses(1);
                break;
            case 2:
                // this.getAdvertisers(1);
                break;   
            case 3:
                this.getDealerLicenseZone(1);
                break;
            default:
        }
    }

    reloadLicense() {
        this.license_data = [];
        this.ngOnInit();
    }

    private getDataForExport(): void {
        this.pageSize = 0;
        const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

        this._host
            .get_host_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, 1, '', this.pageSize)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                if (response.message) {
                    this.hosts_to_export = [];
                    return;
                }

                var hosts = response.paging.entities;
                this.hosts_to_export = this.mapForExport([...hosts]);

                this.hosts_to_export.forEach((item) => {
                    this.worksheet.addRow(item).font = { bold: false };
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
                    const filename = this._auth.current_user_value.roleInfo.businessName + '-HOSTS' + '.xlsx';
                    saveAs(blob, filename);
                });

                this.workbook_generation = false;
            });
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
                    pending_installation_value: response.forInstallationScheduled,
                    pending_installation_label: 'Pending Host(s)',
                    pending_installation_description: 'For Installation',
                };
            });
    }

    private mapForExport(hosts: any) {
        return hosts.map((host) => {
            host.generalCategory = host.generalCategory ? host.generalCategory : 'Other';
            if (host.tags) {
                host.tagsToString = host.tags.join(',');
            }
            return host;
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
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                { value: hosts.address, link: null, editable: false, hidden: false },
                { value: hosts.city, link: null, editable: false, hidden: false },
                { value: hosts.postalCode, link: null, editable: false, hidden: false },
                { value: hosts.totalLicences, link: null, editable: false, hidden: false },
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
                    hidden: true,
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

    public getDealerLicenseZone(page) {
            this.searching_license_zone = true;
            this.subscription.add(
                this._dealer.get_dealer_license_zone(this.search_data_license_zone, this.currentUser.roleInfo.dealerId, page).subscribe(
                    (data) => this.setZoneData(data),
                    (error) => {
                        this.initial_load_zone = false;
                        this.searching_license_zone = false;
                        this.license_zone_data = [];
                        this.license_zone_filtered_data = [];
                    },
                ),
            );
        }


    public setZoneData(data) {
            if (data) {
                this.initial_load_zone = false;
                this.searching_license_zone = false;
                this.paging_data_zone = data;
                if (data.entities.length > 0) {
                    const licenseContents = this.license_zone_mapToUI(data.entities);
                    this.license_zone_data = [...licenseContents];
                    this.license_zone_filtered_data = [...licenseContents];
                    this.no_license_zone = false;
                } else {
                    if (this.search_data_license_zone == '') this.no_license_zone = true;
                    this.license_zone_data = [];
                    this.license_zone_filtered_data = [];
                }
            }
        }

    public license_zone_mapToUI(data: any[]): UI_DEALER_LICENSE_ZONE[] {
            let count = this.paging_data_zone.pageStart;
            return data.map((i) => {
                return new UI_DEALER_LICENSE_ZONE(
                    { value: i.licenseId, link: null, editable: false, hidden: true },
                    { value: count++, link: null, editable: false, hidden: false },
                    {
                        value: i.licenseKey,
                        link: `/${this.currentRole}/licenses/` + i.licenseId,
                        new_tab_link: true,
                        editable: false,
                        hidden: false,
                    },
                    {
                        value: i.hostId,
                        link: null,
                        editable: false,
                        hidden: true,
                    },
                    {
                        value: i.hostName ? i.hostName : '--',
                        link: `/${this.currentRole}/hosts/` + i.hostId,
                        new_tab_link: true,
                        editable: false,
                        hidden: false,
                    },
                    {
                        value: i.licenseAlias ? i.licenseAlias : '--',
                        link: `/${this.currentRole}/licenses/` + i.licenseId,
                        new_tab_link: true,
                        editable: false,
                        hidden: false,
                    },
                    {
                        value: this.calculateTime(i.mainDuration),
                        link: null,
                        editable: false,
                        hidden: false,
                    },
                    {
                        value: this.calculateTime(i.verticalDuration),
                        link: null,
                        editable: false,
                        hidden: false,
                    },
                    {
                        value: this.calculateTime(i.horizontalDuration),
                        link: null,
                        editable: false,
                        hidden: false,
                    },
                    {
                        value: this.calculateTime(i.backgroundDuration),
                        link: null,
                        editable: false,
                        hidden: false,
                    },
                    { value: i.mainTotalAsset, link: null, editable: false, hidden: false },
                    { value: i.mainTotalHost, link: null, editable: false, hidden: false },
                    { value: i.mainTotalHostPercentage, link: null, editable: false, hidden: false },
                    { value: i.mainTotalAdvertiser, link: null, editable: false, hidden: false },
                    {
                        value: i.mainTotalAdvertiserPercentage,
                        link: null,
                        editable: false,
                        hidden: false,
                    },
                    { value: i.mainTotalFiller, link: null, editable: false, hidden: false },
                    { value: i.mainTotalFillerPercentage, link: null, editable: false, hidden: false },
                    { value: i.mainTotalFeed, link: null, editable: false, hidden: false },
                    { value: i.mainTotalFeedPercentage, link: null, editable: false, hidden: false },
                    { value: i.mainTotalOther, link: null, editable: false, hidden: false },
                    { value: i.mainTotalOtherPercentage, link: null, editable: false, hidden: false },
                );
            });
        }

    public licenseZoneFilterData(e): void {
            if (e) {
                this.search_data_license_zone = e;
                this.getDealerLicenseZone(1);
            } else {
                this.search_data_license_zone = '';
                this.getDealerLicenseZone(1);
            }
        }

    private calculateTime(duration: number): string {
            if (duration < 60) return `${Math.round(duration)}s`;
            if (duration === 60) return '1m';
    
            const minutes = Math.floor(duration / 60);
            const seconds = Math.round(duration - minutes * 60);
    
            return `${minutes}m ${seconds}s`;
        }

    protected get currentUser() {
        return this._auth.current_user_value;
    }

    protected get currentRole() {
        return this._auth.current_role;
    }


}
