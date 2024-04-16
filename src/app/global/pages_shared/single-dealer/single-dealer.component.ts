import { DatePipe, Location, TitleCasePipe } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, Subscription, forkJoin } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as moment from 'moment';
import * as io from 'socket.io-client';

import { environment } from 'src/environments/environment';
import {
    AuthService,
    AdvertiserService,
    DealerService,
    HostService,
    LicenseService,
    RoleService,
    UserService,
    ExportService,
} from 'src/app/global/services';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { SubstringPipe } from '../../pipes/substring.pipe';
import { UserSortModalComponent } from '../../components_shared/media_components/user-sort-modal/user-sort-modal.component';
import { BUTTONS_FUNCTIONS, BUTTONS_DISABLED } from '../../constants/buttons';

import {
    API_DEALER,
    API_HOST,
    API_LICENSE,
    API_USER_DATA,
    DEALER_UI_TABLE_ADVERTISERS,
    UI_DEALER_HOST,
    UI_DEALER_LICENSE,
    UI_DEALER_LICENSE_ZONE,
    UI_ROLE_DEFINITION_TEXT,
    UI_ROLE_DEFINITION,
    ACTIVITY_LOGS,
    UI_ACTIVITY_LOGS,
    API_ADVERTISER,
    UI_ADVERTISER,
    WORKSHEET,
} from 'src/app/global/models';
import { MatSnackBar } from '@angular/material';

@Component({
    selector: 'app-single-dealer',
    templateUrl: './single-dealer.component.html',
    styleUrls: ['./single-dealer.component.scss'],
    providers: [DatePipe, TitleCasePipe, SubstringPipe],
})
export class SingleDealerComponent implements AfterViewInit, OnInit, OnDestroy {
    activity_data: UI_ACTIVITY_LOGS[] = [];
    advertiser_card: any;
    advertiser_data: any = [];
    advertiser_filtered_data: any = [];
    advertiser_to_export: any = [];
    apps: any;
    array_to_delete: any = [];
    banner_description = '';
    buttonsDisabled = BUTTONS_DISABLED;
    buttonsFunctions = BUTTONS_FUNCTIONS;
    combined_data: API_HOST[];
    created_by: any;
    createdBy: string;
    current_advertiser_status_filter = 'active';
    current_host_status_filter = 'all';
    current_tab = 'hosts';
    currentRole = this._auth.current_role;
    currentUser = this._auth.current_user_value;
    d_desc: string = 'Dealer since January 25, 2019';
    d_name: string = 'Business Name';
    dateCreated: any;
    dateFormatted: any;
    dealer_and_user_data: { dealer: API_DEALER; user: API_USER_DATA };
    dealer_data: any;
    dealer_id: string;
    dealer_loading = true;
    dealer_name: string;
    dealer: API_DEALER;
    dealers_data: Array<any> = [];
    dealers: API_DEALER[];
    from_change = false;
    height_show = true;
    host_card: any;
    host_data_api: API_HOST[];
    host_data: any = [];
    host_filtered_data: any = [];
    hosts_to_export: any = [];
    img: string = 'assets/media-files/admin-icon.png';
    initial_load = true;
    initial_load_activity = true;
    initial_load_advertiser = true;
    initial_load_license = true;
    initial_load_zone = true;
    is_admin = this._auth.current_role === UI_ROLE_DEFINITION_TEXT.administrator;
    is_dealer_admin = this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin;
    is_host_stats_loaded = false;
    is_search = false;
    license_card: any;
    license_count: number;
    license_data_api: any;
    license_data: any = [];
    license_filtered_data: any = [];
    license_row_slug: string = 'host_id';
    license_row_url: string = '/dealer/hosts';
    license_tbl_row_slug: string = 'license_id';
    license_tbl_row_url: string = '/administrator/licenses/';
    license_zone_data: any = [];
    license_zone_filtered_data: any = [];
    license$: Observable<API_LICENSE[]>;
    licenses_to_export: any = [];
    licenses: any[];
    loaded = false;
    loading_data = true;
    loading_search = false;
    loading_statistics = { activity: true, status: true, connection: true, screen: true };
    no_activity_data = false;
    no_advertisers = false;
    no_case = true;
    no_hosts = false;
    no_license_zone = false;
    no_licenses = false;
    no_record = false;
    now: any;
    page: any;
    paging_data_activity: any;
    paging_data_advertiser: any;
    paging_data_license: any;
    paging_data_zone: any;
    paging_data: any;
    paging: any;
    pi_updating = false;
    reload_activity = false;
    reload_billing = false;
    reload_data = false;
    remote_reboot_disabled = false;
    remote_update_disabled = false;
    saved_adv_page: any;
    saved_hosts_page: any;
    saved_license_page: any;
    saved_tab: any;
    screenshot_disabled = false;
    search_data_advertiser: string = '';
    search_data_license_zone: string = '';
    search_data_license: string = '';
    search_data: string = '';
    searching = false;
    searching_advertiser = false;
    searching_license = false;
    searching_license_zone = false;
    selected_index: number;
    show_admin_buttons = false;
    show_buttons = false;
    single_info: Array<any>;
    sort_column_activity = 'DateCreated';
    sort_column_advertisers: string = '';
    sort_column_hosts: string = '';
    sort_column: string = '';
    sort_order_activity = 'desc';
    sort_order_advertisers: string = '';
    sort_order_hosts: string = '';
    sort_order: string = '';
    splitted_text: any;
    statistics: any;
    subscription: Subscription = new Subscription();
    temp_array_value: any = [];
    temp_array: any = [];
    temp_label: any = [];
    timeout_duration: number;
    timeout_message: string;
    user: API_USER_DATA;
    workbook_generation = false;
    worksheet: WORKSHEET[];

    disabled = false;

    _socket: any;

    adv_table_col = [
        { name: '#', sortable: false },
        { name: 'Name', sortable: true, column: 'Name' },
        { name: 'Total Assets', column: 'Total Assets' },
        { name: 'Address', column: 'Address' },
        { name: 'City', column: 'City' },
        { name: 'State', sortable: true, column: 'State' },
        { name: 'Date Created', column: 'Date Created' },
        { name: 'Category', column: 'Category' },
        { name: 'Postal Code', key: 'Postal Code' },
    ];

    activity_table_column = [
        { name: '#', sortable: false },
        { name: 'Date Created', column: 'dateCreated', sortable: true },
        { name: 'Activity', column: 'activityCode', sortable: false },
    ];

    //Documentation for columns:
    // Name = Column Name,
    // Sortable: If Sortable,
    // Column: For BE Key to sort,
    // Key: Column to be exported as per API,
    // No_export: Dont Include to Export
    advertiser_table_columns = [
        { name: 'Dealer Name', key: 'dealerName' },
        { name: 'Name', key: 'name' },
        { name: 'Status', key: 'status' },
        { name: 'Assigned User', key: 'assignedUser' },
        { name: 'Contents Count', key: 'contentsCount' },
        { name: 'Address', key: 'address' },
        { name: 'City', key: 'city' },
        { name: 'State', key: 'state' },
        { name: 'Postal Code', key: 'postalCode' },
        { name: 'Date Created', key: 'dateCreated' },
        { name: 'Contents', key: 'contentsFormatted' },
    ];

    host_table_col = [
        { name: '#', sortable: false, no_export: true },
        { name: 'Dealer Name', sortable: false, key: 'businessName', hidden: true, no_show: true },
        { name: 'Host Name', sortable: true, column: 'Name', key: 'name' },
        { name: 'Category', no_show: true, hidden: true, key: 'category' },
        { name: 'General Category', no_show: true, hidden: true, key: 'generalCategory' },
        { name: 'Address', sortable: true, column: 'Address', key: 'address' },
        { name: 'City', sortable: true, column: 'City', key: 'city' },
        { name: 'State', sortable: true, column: 'State', key: 'state' },
        { name: 'Latitude', sortable: true, key: 'latitude', no_show: true, hidden: true },
        { name: 'Longitude', sortable: true, key: 'longitude', no_show: true, hidden: true },
        { name: 'Postal Code', sortable: true, column: 'PostalCode', key: 'postalCode' },
        { name: 'License Count', sortable: true, column: 'TotalLicences', key: 'totalLicences' },
        { name: 'Vistar Venue ID', no_show: true, key: 'vistarVenueId' },
        { name: 'Notes', no_show: true, hidden: true, key: 'notes' },
        { name: 'Others', no_show: true, hidden: true, key: 'others' },
        { name: 'Status', sortable: true, column: 'Status', no_export: true, hidden: true },
        {
            name: 'Business Hours',
            sortable: false,
            key: 'storeHoursParse',
            hidden: true,
            no_show: true,
        },
    ];

    license_table_columns = [
        { name: '#', sortable: false, no_export: true },
        { name: null, sortable: false, no_export: true, hidden: true },
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
        { name: 'Dealer', sortable: true, key: 'dealer', hidden: true, no_show: true },
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
            key: 'storeHoursParse',
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
        { name: 'Last Push', sortable: true, column: 'ContentsUpdated', key: 'contentsUpdated' },
        { name: 'Last Disconnect', sortable: true, column: 'TimeOut', key: 'timeIn' },
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
        { name: 'Net Speed', sortable: false, key: 'internetSpeed', hidden: true, no_show: true },
        { name: 'Display', sortable: false, key: 'displayStatus' },
        { name: 'Anydesk', sortable: true, column: 'AnydeskId', key: 'anydeskId' },
        { name: 'Password', sortable: false, key: 'password', hidden: true, no_show: true },
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
        { name: 'Screen', sortable: true, column: 'ScreenName', key: 'screenName' },
        {
            name: 'Template',
            sortable: true,
            column: 'TemplateName',
            key: 'templateName',
            hidden: true,
            no_show: true,
        },
        { name: 'Zone & Duration', sortable: false, hidden: true, key: 'zone', no_show: true },
        { name: 'Installation Date', sortable: true, column: 'InstallDate', key: 'installDate' },
        {
            name: 'Install Request Date',
            sortable: true,
            column: 'InstallRequestDate',
            key: 'installRequestDate',
        },
        { name: 'Creation Date', sortable: false, key: 'dateCreated', hidden: true, no_show: true },
        { name: 'Tags', key: 'tagsToString', hidden: true, no_show: true },
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

    filters: any = {
        admin_licenses: false,
        isactivated: '',
        assigned: '',
        online: '',
        pending: '',
        activated: '',
        zone: '',
        status: '',
        host: '',
        label_status: '',
        label_zone: '',
        label_dealer: '',
        label_admin: '',
        days_offline_from: '',
        days_offline_to: '',
    };

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        public _router: Router,
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _date: DatePipe,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _host: HostService,
        private _license: LicenseService,
        private _snackbar: MatSnackBar,
        private _location: Location,
        private _params: ActivatedRoute,
        private _role: RoleService,
        private _titlecase: TitleCasePipe,
        private _user: UserService,
        private cd: ChangeDetectorRef,
        private _export: ExportService,
    ) {}

    ngOnInit() {
        this.reload_billing = !this.reload_billing;
        this.cd.detectChanges();

        this._socket = io(environment.socket_server, {
            transports: ['websocket'],
            query: 'client=Dashboard__SingleDealerComponent',
        });

        this._params.queryParams.subscribe((params) => {
            this.saved_tab = params['tab'] || 0;
            if (this.saved_tab == 0) this.saved_license_page = params['page'] || 1;
            else if (this.saved_tab == 1) this.saved_hosts_page = params['page'] || 1;
            else if (this.saved_tab == 2) this.saved_adv_page = params['page'] || 1;
        });

        this._socket.on('connect', () => {});

        this._socket.on('disconnect', () => {});

        if (
            this._role.get_user_role() == UI_ROLE_DEFINITION_TEXT.administrator ||
            this._role.get_user_role() == UI_ROLE_DEFINITION_TEXT.dealeradmin
        )
            this.show_admin_buttons = true;

        this.setCurrentTabOnLoad();

        this.subscription.add(
            this._params.paramMap.subscribe(
                () => {
                    this.dealer_id = this.from_change ? this.dealer_id : this._params.snapshot.params.data;
                    this.getDealer();
                    this.getDealerAdvertiser(1);
                    this.getDealerHost(1);
                    this.sortList('desc', parseInt(this.saved_license_page));
                    this.getLicenseTotalCount(this.dealer_id);
                    this.getAdvertiserTotalCount(this.dealer_id);
                    this.getHostTotalCount(this.dealer_id);
                    this.getDealerLicenseZone(1);
                    this.adminButton();
                    this.getDealerLicenses();
                },
                (error) => console.error(error),
            ),
        );

        this.subscription.add(
            this._params.queryParams.subscribe(
                (data) => (this.selected_index = data.tab),
                (error) => console.error(error),
            ),
        );

        this.subscribeToReassignSuccess();
        this.getDealers(1);
    }

    ngAfterViewInit() {
        if (this.current_tab === 'licenses') this.getLicenseStatisticsByDealer(this.dealer_id);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this._socket.disconnect();
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    activateLicense(e): void {
        this.subscription.add(
            this._license.activate_license(e).subscribe(
                () => this.warningModal('success', 'License Activated', 'License successfully activated.', '', ''),
                (error) => console.error(error),
            ),
        );
    }

    adminButton(): void {
        const single_dealer_administrative_tools = localStorage.getItem(`${this.dealer_id}`);
        if (single_dealer_administrative_tools) {
            this.timeout_duration = moment().diff(
                moment(single_dealer_administrative_tools, 'MMMM Do YYYY, h:mm:ss a'),
                'minutes',
            );
            if (this.timeout_duration >= 10) {
                this.remote_update_disabled = false;
                this.remote_reboot_disabled = false;
                this.screenshot_disabled = false;
                localStorage.removeItem(`${this.dealer_id}`);
            } else {
                this.remote_update_disabled = true;
                this.remote_reboot_disabled = true;
                this.screenshot_disabled = false;
            }
            this.timeout_message = `Will be available after ${10 - this.timeout_duration} minutes`;
        }
    }

    reloadAdvertiser() {
        this.getDealerAdvertiser(1);
        this.getAdvertiserTotalCount(this.dealer_id);
    }

    advertiserFilterData(e): void {
        if (e) {
            this.search_data_advertiser = e;
            this.getDealerAdvertiser(1);
        } else {
            this.search_data_advertiser = '';
            this.getDealerAdvertiser(1);
        }
    }

    advertiser_mapToUI(data: API_ADVERTISER[]): UI_ADVERTISER[] {
        let count = this.paging_data_advertiser.pageStart;

        return data.map((a) => {
            return {
                advertiserId: { value: a.id, link: null, editable: false, hidden: true },
                index: { value: count++, link: null, editable: false, hidden: false },
                name: {
                    value: a.name,
                    link: '/administrator/advertisers/' + a.id,
                    editable: false,
                    hidden: false,
                },
                totalAssets: { value: a.totalAssets },
                address: { value: a.address },
                city: { value: a.city ? a.city : '--', link: null, editable: false, hidden: false },
                state: {
                    value: a.state ? a.state : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                dateCreated: {
                    value: this._date.transform(a.dateCreated, 'MMMM d, y'),
                    hidden: false,
                },
                category: { value: a.category, hidden: false },
                status: { value: a.status, link: null, editable: false, hidden: true },
                postalCode: { value: a.postalCode },
            };
        });
    }

    filterAdvertisersByStatus(status: string): void {
        this.current_advertiser_status_filter = status;
        this.getDealerAdvertiser();
    }

    filterHostsByStatus(status: string) {
        if (status === this.current_host_status_filter) return;
        this.current_host_status_filter = status;
        this.getDealerHost(1);
    }

    licenseZoneFilterData(e): void {
        if (e) {
            this.search_data_license_zone = e;
            this.getDealerLicenseZone(1);
        } else {
            this.search_data_license_zone = '';
            this.getDealerLicenseZone(1);
        }
    }

    license_zone_mapToUI(data: any[]): UI_DEALER_LICENSE_ZONE[] {
        let count = this.paging_data_zone.pageStart;
        return data.map((i) => {
            return new UI_DEALER_LICENSE_ZONE(
                { value: i.licenseId, link: null, editable: false, hidden: true },
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: i.licenseKey,
                    link: '/administrator/licenses/' + i.licenseId,
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
                    link: '/administrator/hosts/' + i.hostId,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                {
                    value: i.licenseAlias ? i.licenseAlias : '--',
                    link: '/administrator/licenses/' + i.licenseId,
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

    private calculateTime(duration: number): string {
        if (duration < 60) return `${Math.round(duration)}s`;
        if (duration === 60) return '1m';

        const minutes = Math.floor(duration / 60);
        const seconds = Math.round(duration - minutes * 60);

        return `${minutes}m ${seconds}s`;
    }

    deactivateLicense(e): void {
        this.subscription.add(
            this._license.deactivate_license(e).subscribe(
                () => this.warningModal('success', 'License Deactivated', 'License successfully deactivated.', '', ''),
                (error) => console.error(error),
            ),
        );
    }

    openButtonsMenu() {
        this.show_buttons = !this.show_buttons;
    }

    clickedOutside(): void {
        this.show_buttons = false;
    }

    getActivityColumnsAndOrder(data: { column: string; order: string }): void {
        this.sort_column_activity = data.column;
        this.sort_order_activity = data.order;
        this.getDealerActivity(1);
    }

    getDealerActivity(page: number): void {
        this.activity_data = [];

        this._dealer
            .get_dealer_activity(this.dealer_id, this.sort_column_activity, this.sort_order_activity, page)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (res) => {
                    if (res.paging.entities.length === 0) {
                        this.no_activity_data = true;
                        this.activity_data = [];
                        return;
                    }
                    this.getUserById(res.paging.entities.map((a) => a.initiatedBy)).subscribe((responses) => {
                        this.created_by = responses;
                        const mappedData = this.activity_mapToUI(res.paging.entities);
                        this.paging_data = res.paging;
                        this.activity_data = [...mappedData];
                        this.reload_data = true;
                    });
                },
                (error) => console.error(error),
            )
            .add(() => (this.initial_load_activity = false));
    }

    getUserById(ids: any[]) {
        const userObservables = ids.map((id) => this._user.get_user_by_id(id).pipe(takeUntil(this._unsubscribe)));
        return forkJoin(userObservables);
    }

    reload_page(e: boolean): void {
        if (e) this.ngOnInit();
    }

    activity_mapToUI(activity): any {
        let count = 1;

        return activity.map((a: any) => {
            const activityCode = a.activityCode;
            let activityMessage = 'Other activitiy detected';
            let createdBy;

            this.created_by.map((c) => {
                if (c.userId === a.initiatedBy) createdBy = c;
            });

            switch (activityCode) {
                case 'modify_dealer':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} modified the dealer`;
                    break;
                case 'modify_billing':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} modified the billing details`;
                    break;
                case 'deleted_license':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} deleted a license`;
                    break;
                case 'deleted_multiple_license':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} deleted multiple license`;
                    break;
                case 'updated_license':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} updated system on licenses`;
                    break;
                case 'reboot_player':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} rebooted the player software`;
                    break;
                case 'reboot_pi':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} reboot the pi`;
                    break;
                case 'reassign_dealer':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} re-assign the dealer`;
                    break;
                case 'modify_dealer_profile':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} modified their profile info`;
                    break;
                case 'change_password':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} changed their password`;
                    break;
                case 'added_card':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} added their card`;
                    break;
                case 'update_billing_address':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} updated their billing address`;
                    break;
                case 'delete_card':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} deleted their card`;
                    break;
                case 'update_card':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} updated their card details`;
                    break;
                default:
                    return activityMessage;
            }

            return new UI_ACTIVITY_LOGS(
                { value: count++, editable: false },
                { value: a.ownerId, hidden: true },
                { value: a.activityLogId, hidden: true },
                { value: this._date.transform(a.dateCreated, 'MMMM d, y'), hidden: false },
                { value: activityMessage, hidden: false },
                { value: a.initiatedBy, hidden: true },
                { value: a.dateUpdated, hidden: true },
            );
        });
    }

    getAdvertiserTotalCount(id): void {
        this.subscription.add(
            this._advertiser.get_advertisers_total_by_dealer(id).subscribe(
                (data) => {
                    this.advertiser_card = {
                        basis: data.total,
                        basis_label: 'Advertisers',
                        good_value: data.totalActive,
                        good_value_label: 'Active',
                        bad_value: data.totalInActive,
                        bad_value_label: 'Inactive',
                    };
                },
                (error) => console.error(error),
            ),
        );
    }

    getDealerAdvertiser(page = 1): void {
        const status = this.current_advertiser_status_filter === 'active' ? 'A' : 'I';
        this.searching_advertiser = true;

        const filters = {
            dealer_id: this.dealer_id,
            page,
            status,
            search: this.search_data_advertiser,
            sortColumn: this.sort_column_advertisers,
            sortOrder: this.sort_order_advertisers,
            pageSize: 15,
        };

        this._advertiser
            .get_advertisers_by_dealer_id(filters)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    this.initial_load_advertiser = false;
                    this.searching_advertiser = false;
                    this.paging_data_advertiser = data.paging;
                    if (!data.message) {
                        const advertisers = this.advertiser_mapToUI(data.paging.entities);
                        this.advertiser_data = [...advertisers];
                        this.advertiser_filtered_data = [...advertisers];
                        this.no_advertisers = false;
                    } else {
                        if (this.search_data_advertiser == '') this.no_advertisers = true;
                        this.advertiser_data = [];
                        this.advertiser_filtered_data = [];
                    }
                },
                (error) => console.error(error),
            );
    }

    getDealerHost(page: number): void {
        let status = this.current_host_status_filter === 'active' ? 'A' : 'I';
        if (this.current_host_status_filter === 'all') status = '';

        this.searching = true;
        this.host_data = [];
        this.host_filtered_data = [];
        this.temp_array = [];

        const filters = {
            dealerId: this.dealer_id,
            status,
            page,
            search: this.search_data,
            sortColumn: this.sort_column_hosts,
            sortOrder: this.sort_order_hosts,
            pageSize: 15,
        };

        this.subscription.add(
            this._host.get_host_by_dealer_id_with_sort(filters).subscribe(
                (data) => {
                    this.initial_load = false;
                    this.searching = false;
                    this.paging_data = data.paging;

                    if (!data.message) {
                        this.temp_array = data.paging.entities;
                        this.host_data = this.hostTable_mapToUI(this.temp_array);
                        this.host_filtered_data = this.hostTable_mapToUI(this.temp_array);
                        this.no_hosts = false;
                    } else {
                        if (this.search_data == '') this.no_hosts = true;
                        this.host_data = [];
                        this.host_filtered_data = [];
                    }
                },
                (error) => console.error(error),
            ),
        );
    }

    getHostTotalCount(dealerId: string): void {
        this.subscription.add(
            this._host
                .get_host_total_per_dealer(dealerId)
                .subscribe(
                    (data: any) => {
                        this.host_card = {
                            basis: data.total,
                            basis_label: 'Hosts',
                            good_value: data.totalActive,
                            good_value_label: 'Active',
                            bad_value: data.totalInActive,
                            bad_value_label: 'Inactive',
                        };
                    },
                    (error) => console.error(error),
                )
                .add(() => (this.is_host_stats_loaded = true)),
        );
    }

    setHostCount(data) {
        this.host_card = {
            basis: data.total,
            basis_label: 'Hosts',
            good_value: data.totalActive,
            good_value_label: 'Active',
            bad_value: data.totalInActive,
            bad_value_label: 'Inactive',
        };
    }

    getLicensesofDealer(page: number): void {
        this.searching_license = true;

        this.subscription.add(
            this._license
                .sort_license_by_dealer_id(
                    this.dealer_id,
                    page,
                    this.search_data_license,
                    this.sort_column,
                    this.sort_order,
                    15,
                    this.filters.status,
                    this.filters.days_offline_from,
                    this.filters.days_offline_to,
                    this.filters.activated,
                    '',
                    this.filters.zone,
                    this.filters.host,
                    this.filters.assigned,
                    this.filters.pending,
                    this.filters.online,
                    this.filters.isactivated,
                )
                .subscribe(
                    (response: { paging; statistics; message }) => this.setLicensesData(response),
                    (error) => {
                        this.no_licenses = true;
                        this.license_data = [];
                        this.license_filtered_data = [];
                        this.initial_load_license = false;
                        this.searching_license = false;
                    },
                ),
        );
    }

    setLicensesData(response) {
        if (response.message) {
            if (this.search_data_license == '') this.no_licenses = true;
            this.license_data = [];
            this.license_filtered_data = [];
        } else {
            if (this.is_dealer_admin) this.license_data_api = response.licenses;
            else this.license_data_api = response.licenses;

            this.no_licenses = false;
            this.license_data_api.map((i) => {
                if (i.appVersion) i.apps = JSON.parse(i.appVersion);
                else i.apps = null;
            });
            this.paging_data_license = response.paging;
            const mappedLicenses = this.licenseTable_mapToUI(this.license_data_api);
            this.license_data = mappedLicenses;
            this.license_filtered_data = mappedLicenses;
        }

        this.initial_load_license = false;
        this.searching_license = false;
    }

    getLicenseTotalCount(id): void {
        this.subscription.add(
            this._license.get_licenses_total_by_dealer(id).subscribe((data: any) => this.setLicensesCount(data)),
        );
    }

    setLicensesCount(data) {
        this.license_card = {
            basis: data.total,
            basis_label: 'Licenses',
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
            breakdown4_sub_label: 'Connection Status Breakdown :',
            breakdown4_value: data.totalLan || 0,
            breakdown4_label: 'LAN',
            breakdown5_value: data.totalWifi || 0,
            breakdown5_label: 'WiFi',
            third_value: data.totalPending || 0,
            third_value_label: 'Pending',
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
        };

        if (this.license_card) {
            this.temp_label.push(this.license_card.ad_value_label + ': ' + this.license_card.ad_value);
            this.temp_label.push(this.license_card.menu_value_label + ': ' + this.license_card.menu_value);
            this.temp_label.push(this.license_card.closed_value_label + ': ' + this.license_card.closed_value);
            this.temp_label.push(this.license_card.unassigned_value_label + ': ' + this.license_card.unassigned_value);
            this.temp_array_value.push(this.license_card.ad_value);
            this.temp_array_value.push(this.license_card.menu_value);
            this.temp_array_value.push(this.license_card.closed_value);
            this.temp_array_value.push(this.license_card.unassigned_value);
        }
    }

    hostFilterData(e): void {
        if (e) {
            this.search_data = e;
            this.getDealerHost(1);
        } else {
            this.search_data = '';
            this.getDealerHost(1);
        }
    }

    hostTable_mapToUI(data: any[]): UI_DEALER_HOST[] {
        let count = this.paging_data.pageStart;
        return data.map((h: any) => {
            return new UI_DEALER_HOST(
                { value: h.hostId, link: null, editable: false, hidden: true },
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: h.name,
                    link: '/administrator/hosts/' + h.hostId,
                    editable: false,
                    hidden: false,
                    new_tab_link: true,
                },
                { value: h.address, link: null, editable: false, hidden: false },
                { value: h.city, link: null, editable: false, hidden: false },
                { value: h.state, link: null, editable: false, hidden: false },
                { value: h.postalCode, link: null, editable: false, hidden: false },
                { value: h.totalLicences, link: null, editable: false, hidden: false },
                { value: h.status, link: null, editable: false, hidden: false },
            );
        });
    }

    licenseFilterData(e): void {
        if (e) {
            this.search_data_license = e;
            this.getLicensesofDealer(1);
        } else {
            this.search_data_license = '';
            this.getLicensesofDealer(1);
        }
    }

    licenseTable_mapToUI(data: any[]): UI_DEALER_LICENSE[] {
        let count = this.paging_data_license.pageStart;
        return data.map((l: any) => {
            const table = new UI_DEALER_LICENSE(
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: l.licenseId,
                    link: null,
                    editable: false,
                    hidden: true,
                    key: true,
                    table: 'license',
                },
                {
                    value: l.screenshotUrl ? l.screenshotUrl : null,
                    link: l.screenshotUrl ? l.screenshotUrl : null,
                    editable: false,
                    hidden: false,
                    isImage: true,
                    new_tab_link: true,
                },
                {
                    value: l.licenseKey,
                    link: '/administrator/licenses/' + l.licenseId,
                    editable: false,
                    hidden: false,
                    status: true,
                    new_tab_link: true,
                    has_favorites: true,
                    is_favorite: l.isFavorite,
                    show_tags: l.tags != null ? true : false,
                    tags: l.tags != null ? l.tags : [],
                    compressed: true,
                },
                {
                    value: l.hostId ? l.hostName : '--',
                    link: l.hostId ? '/administrator/hosts/' + l.hostId : null,
                    editable: false,
                    hidden: false,
                    business_hours: l.hostId ? true : false,
                    business_hours_label: l.hostId ? this.getLabel(l) : null,
                    new_tab_link: true,
                    compressed: true,
                },
                {
                    value: l.alias ? l.alias : '--',
                    link: '/administrator/licenses/' + l.licenseId,
                    editable: true,
                    label: 'License Alias',
                    id: l.licenseId,
                    hidden: false,
                    new_tab_link: true,
                },
                {
                    value: l.contentsUpdated ? l.contentsUpdated : '--',
                    label: 'Last Push',
                    hidden: false,
                },
                {
                    value: l.timeOut ? this._date.transform(l.timeOut, 'MMM dd y \n h:mm a') : '--',
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
                    value: l.screenName ? l.screenName : '--',
                    compressed: true,
                    link: `/administrator/screens/${l.screenId}`,
                    editable: false,
                    new_tab_link: true,
                },
                {
                    value:
                        l.installDate && !l.installDate.includes('Invalid')
                            ? this._date.transform(l.installDate, 'MMM dd, y')
                            : '--',
                    link: null,
                    editable: true,
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
                { value: l.isActivated, link: null, editable: false, hidden: true },
                { value: l.hostId ? true : false, link: null, editable: false, hidden: true },
                {
                    value: this.checkStatus(l),
                    link: null,
                    editable: false,
                    hidden: true,
                    no_show: true,
                    label: this.checkStatusForExport(l),
                    new_status: true,
                },
            );
            return table;
        });
    }

    splitKey(key) {
        this.splitted_text = key.split('-');
        return this.splitted_text[this.splitted_text.length - 1];
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

    checkStatusForExport(license) {
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        if (
            new Date(license.installDate) <= currentDate &&
            license.isActivated === 1 &&
            license.hostName != null &&
            license.piStatus === 1
        )
            return 'Online';
        else if (
            new Date(license.installDate) <= currentDate &&
            license.isActivated === 1 &&
            license.hostName != null &&
            license.piStatus === 0
        )
            return 'Offline';
        else if (new Date(license.installDate) > currentDate && license.hostName != null && license.isActivated === 1)
            return 'Pending';
        else if (license.isActivated === 0 && license.hostName != null) return 'Inactive';
        else return 'Unassigned';
    }

    getLabel(data) {
        this.now = moment().format('d');
        this.now = this.now;
        let storehours = JSON.parse(data.storeHours);
        storehours = storehours.sort((a, b) => {
            return a.id - b.id;
        });
        let modified_label = {
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

    onSelectTab(event: { index: number }): void {
        switch (event.index) {
            case 1:
                if (this.current_tab === 'hosts') return;
                this.current_tab = 'hosts';
                this.current_host_status_filter = 'all';
                this.getDealerHost(1);
                break;

            case 2:
                this.current_tab = 'advertisers';
                break;

            case 3:
                this.current_tab = 'zone';
                break;

            case 4:
                this.current_tab = 'activity';
                this.getDealerActivity(1);
                break;

            case 5:
                this.current_tab = 'terminal';
                break;

            case 6:
                this.current_tab = 'billing';

                break;

            default:
                this.current_tab = 'licenses';
                if (!this.no_licenses) this.getLicenseStatisticsByDealer(this.dealer_id);
        }

        this._router.navigate([], {
            relativeTo: this._params,
            queryParams: {
                tab: event.index,
            },
            queryParamsHandling: 'merge',
        });
    }

    sortList(order, page?): void {
        let filter = {
            column: 'PiStatus',
            order: order,
        };
        this.getColumnsAndOrder(filter);

        if (this.saved_tab == 0) this.getLicensesofDealer(parseInt(this.saved_license_page));
        else this.getLicensesofDealer(1);
    }

    getDealers(e) {
        this.loading_data = true;
        if (e > 1) {
            this.subscription.add(
                this._dealer
                    .get_dealers_with_page(e, '')
                    .subscribe((data) => this.setDealersDropdownDataWithPage(data)),
            );
        } else {
            if (this.is_search) this.loading_search = true;
            this.subscription.add(
                this._dealer.get_dealers_with_page(e, '').subscribe((data) => this.setDealersDropdownData(data)),
            );
        }
    }

    setDealersDropdownDataWithPage(data) {
        data.dealers.map((i) => this.dealers.push(i));
        this.paging = data.paging;
        this.loading_data = false;
    }

    setDealersDropdownData(data) {
        this.dealers = data.dealers;
        this.dealers_data = data.dealers;
        this.paging = data.paging;
        this.loading_data = false;
        this.loading_search = false;
    }

    getDealerLicenseZone(page) {
        this.searching_license_zone = true;
        this.subscription.add(
            this._dealer.get_dealer_license_zone(this.search_data_license_zone, this.dealer_id, page).subscribe(
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

    setZoneData(data) {
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

    async dealerSelected(id: string): Promise<void> {
        await this._router.navigate([`/${this.roleRoute}/dealers/${id}`]);
        this.getLicenseStatisticsByDealer(id, true);
    }

    searchBoxTrigger(event) {
        this.is_search = event.is_search;
        if (this.paging.hasNextPage || this.is_search) this.getDealers(event.page);
    }

    searchData(e: any): void {
        this.loading_search = true;

        this.subscription.add(
            this._dealer
                .get_search_dealer(e)
                .map((response: { paging: { entities: any[] } }) => {
                    const dealers = response.paging.entities;

                    if (response.paging.entities.length > 0) {
                        dealers.forEach((dealer, index) => {
                            if (dealer.dealerId === this.dealer_id) response.paging.entities.splice(index, 1);
                        });
                    }
                    return response;
                })
                .subscribe(
                    (response) => {
                        if (response.paging.entities.length > 0) {
                            this.dealers = response.paging.entities;
                            this.dealers_data = response.paging.entities;
                            this.loading_search = false;
                        } else {
                            this.dealers_data = [];
                            this.loading_search = false;
                        }

                        this.paging = response.paging;
                    },
                    (error) => console.error(error),
                ),
        );
    }

    toggleActivateDeactivate(e): void {
        if (e.status) this.activateLicense(e.id);
        else this.deactivateLicense(e.id);
    }

    rebootPi(): void {
        this.warningModal(
            'warning',
            'Reboot Pi (Device)',
            'Are you sure you want to reboot pi?',
            'Click OK to reboot device',
            'reboot',
        );
    }

    rebootPlayer(): void {
        this.warningModal(
            'warning',
            'Reboot Player (Software)',
            'Are you sure you want to reboot player?',
            'Click OK to reboot software',
            'reboot_player',
        );
    }

    reloadLicense(): void {
        if (this.searching_license) return;
        this.license_data = [];
        this.sort_column = 'PiStatus';
        this.sort_order = 'desc';
        this.array_to_delete = [];
        this.getLicenseTotalCount(this.dealer_id);
        this.getLicensesofDealer(this.saved_license_page);
        this.getLicenseStatisticsByDealer(this.dealer_id, true);

        if (this.licenses) this.resyncSocketConnection();
    }

    buttonOnClick(btnName: string): void {
        switch (btnName) {
            case 'screenshotDealer':
                this.screenshotDealer();
                this.screenshot_disabled;
                break;
            case 'rebootPlayer':
                this.rebootPlayer();
                this.remote_reboot_disabled;
                break;
            case 'rebootPi':
                this.rebootPi();
                this.remote_reboot_disabled;
                break;

            default:
                console.error('Function not implemented for', btnName);
                break;
        }
    }

    screenshotDealer(): void {
        this.warningModal(
            'warning',
            'Screenshot Dealer',
            "Screenshot all this dealer's licenses, Requires a reload after a minute or two.",
            'Click OK to continue',
            'screenshot',
        );
    }

    updateAndRestart(): void {
        this.warningModal(
            'warning',
            'Update System and Restart',
            'Are you sure you want to update the player and restart the pi?',
            'Click OK to push updates for this license',
            'system_update',
        );
    }

    warningModal(status, message, data, return_msg, action, id?): void {
        this._dialog.closeAll();
        const updateLicenseActivity = new ACTIVITY_LOGS(
            this.dealer_id,
            'updated_license',
            this._auth.current_user_value.user_id,
        );
        const rebootPlayerActivity = new ACTIVITY_LOGS(
            this.dealer_id,
            'reboot_player',
            this._auth.current_user_value.user_id,
        );
        const rebootPiActivity = new ACTIVITY_LOGS(this.dealer_id, 'reboot_pi', this._auth.current_user_value.user_id);
        const deletedLicenseActivity = new ACTIVITY_LOGS(
            this.dealer_id,
            'deleted_multiple_license',
            this._auth.current_user_value.user_id,
        );

        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: {
                    status: status,
                    message: message,
                    data: data,
                    return_msg: return_msg,
                    action: action,
                },
            })
            .afterClosed()
            .subscribe((result) => {
                switch (result) {
                    case 'system_update':
                        this.licenses.forEach((i) => this._socket.emit('D_system_update_by_license', i.licenseId));
                        this.createActivity(updateLicenseActivity);
                        this.getTimeOut();
                        break;
                    case 'reboot':
                        this.licenses.forEach((i) => this._socket.emit('D_pi_restart', i.licenseId));
                        this.createActivity(rebootPiActivity);
                        this.getTimeOut();

                        break;
                    case 'reboot_player':
                        this.licenses.forEach((i) => {
                            this._socket.emit('D_player_restart', i.licenseId);
                            this._host.emitActivity();
                        });
                        this.createActivity(rebootPlayerActivity);
                        this.getTimeOut();

                        break;
                    case 'license_delete':
                        this.subscription.add(
                            this._license.delete_license(this.array_to_delete).subscribe((data) => {
                                this.warningModal(
                                    'success',
                                    'License Deleted',
                                    'License successfully deleted.',
                                    '',
                                    '',
                                );
                                this.reloadLicense();
                            }),
                        );
                        this.createActivity(deletedLicenseActivity);
                        this.getTimeOut();
                        break;
                    case 'upgrade_to_v2':
                        this.licenses.forEach((i) => this._socket.emit('D_upgrade_to_v2_by_license', i.licenseId));
                        this.getTimeOut();

                        break;
                    case 'screenshot':
                        if (this.licenses)
                            this.licenses.forEach((i) => this._socket.emit('D_screenshot_pi', i.licenseId));
                        this.getTimeOut();
                        break;
                    default:
                }
            });
    }

    public getTimeOut() {
        const now = moment().format('MMMM Do YYYY, h:mm:ss a');
        localStorage.setItem(`${this.dealer_id}`, now);
        this.timeout_duration = 0;
        this.timeout_message = `Will be available after ${10 - this.timeout_duration} minutes`;
        this.remote_reboot_disabled = true;
        this.remote_update_disabled = true;
        this.screenshot_disabled = true;
    }

    createActivity(activity) {
        this._dealer
            .create_dealer_activity_logs(activity)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    return data;
                },
                (error) => console.error(error),
            );
    }

    getMultipleDeleteData(data) {
        this.array_to_delete = data;
    }

    multipleDeleteLicense() {
        this.warningModal(
            'warning',
            'Delete Licenses',
            'Are you sure you want to delete ' + this.array_to_delete.length + ' licenses?',
            '',
            'license_delete',
            this.array_to_delete,
        );
    }

    getColumnsAndOrder(data) {
        this.sort_column = data.column;
        this.sort_order = data.order;
        this.getLicensesofDealer(1);
    }

    getHostsColumnsAndOrder(data) {
        this.sort_column_hosts = data.column;
        this.sort_order_hosts = data.order;
        this.getDealerHost(1);
    }

    getAdvertisersColumnsAndOrder(data) {
        this.sort_column_advertisers = data.column;
        this.sort_order_advertisers = data.order;
        this.getDealerAdvertiser(1);
    }

    getDealerLicenses() {
        this.subscription.add(
            this._license.get_license_to_export(this.dealer_id).subscribe((response) => {
                if ('message' in response) return;
                this.setDealerAllLicenses(response);
            }),
        );
    }

    setDealerAllLicenses(data) {
        data.licenses.map((i) => {
            i.new_status = this.checkStatusForExport(i);
            if (i.appVersion) i.apps = JSON.parse(i.appVersion);
            else i.apps = null;
        });
        this.licenses = data.licenses;
        if (this.licenses) this.resyncSocketConnection();
    }

    resyncSocketConnection() {
        this.licenses.forEach((i) => this._socket.emit('D_is_electron_running', i.licenseId));
    }

    runTerminalScript(script: string) {
        this.licenses.forEach((i) => {
            this._socket.emit('D_run_terminal', {
                license_id: i.licenseId,
                script: script,
            });
        });

        this._snackbar.open(`Terminal fired!`, '', {
            duration: 3000,
        });
    }

    getDataForExport(id, tab): void {
        switch (tab) {
            case 'Licenses':
                this.subscription.add(
                    this._license
                        .get_license_to_export_duration(
                            id,
                            this.search_data_license,
                            this.sort_column,
                            this.sort_order,
                            0,
                            this.filters.status,
                            this.filters.days_offline_from,
                            this.filters.days_offline_to,
                            this.filters.activated,
                            '',
                            this.filters.zone,
                            this.filters.host,
                            this.filters.assigned,
                            this.filters.pending,
                            this.filters.online,
                            this.filters.isactivated,
                        )
                        .subscribe((data) => {
                            data.licenseTemplateZoneExports.map((i) => {
                                if (i.appVersion) i.apps = JSON.parse(i.appVersion);
                                else i.apps = null;
                                this.modifyItem(i, tab);
                            });
                            this.licenses_to_export = data.licenseTemplateZoneExports;
                            this.prepareForExport(tab, this.license_table_columns, this.licenses_to_export);
                        })
                        .add(() => (this.workbook_generation = false)),
                );
                break;
            case 'Hosts':
                const hostFilters = {
                    dealerId: this.dealer_id,
                    page: 1,
                    search: this.search_data,
                    sortColumn: this.sort_column_hosts,
                    sortOrder: this.sort_order_hosts,
                    pageSize: 0,
                };

                this.subscription.add(
                    this._host
                        .get_host_by_dealer_id_with_sort(hostFilters)
                        .subscribe((data) => {
                            this.hosts_to_export = data.paging.entities;
                            this.hosts_to_export.forEach((item, i) => {
                                this.modifyItem(item, tab);
                            });
                            this.prepareForExport(tab, this.host_table_col, this.hosts_to_export);
                        })
                        .add(() => (this.workbook_generation = false)),
                );
                break;

            case 'Advertisers':
                const advertiserFilters = {
                    dealerId: this.dealer_id,
                    search: this.search_data,
                    sortColumn: this.sort_column_advertisers,
                    sortOrder: this.sort_order_advertisers,
                    status: this.filters.status,
                };

                this.subscription.add(
                    this._advertiser
                        .export_advertisers(
                            advertiserFilters.dealerId,
                            advertiserFilters.search,
                            advertiserFilters.sortColumn,
                            advertiserFilters.sortOrder,
                        )
                        .subscribe((data) => {
                            this.advertiser_to_export = data;
                            this.advertiser_to_export.forEach((item, i) => {
                                this.modifyItem(item, tab);
                            });
                            this.prepareForExport(tab, this.advertiser_table_columns, this.advertiser_to_export);
                        })
                        .add(() => (this.workbook_generation = false)),
                );
                break;
        }
    }

    prepareForExport(tab, columns, data) {
        const filename = this.dealer_name + '-' + tab;
        let tables_to_export = columns;
        tables_to_export = tables_to_export.filter(function (column) {
            return !column.no_export;
        });
        this.worksheet = [
            {
                name: filename,
                columns: tables_to_export,
                data: data,
            },
        ];
        this._export.generate(filename, this.worksheet);
    }

    modifyItem(item, tab) {
        switch (tab) {
            case 'Licenses':
                item.new_status = this.checkStatusForExport(item);
                item.dealer = this.dealer_name;
                item.piVersion = item.apps ? item.apps.rpi_model : '';
                item.zone = this.getZoneHours(item);
                item.displayStatus = item.displayStatus == 1 ? 'ON' : '';
                item.password = item.anydeskId ? this.splitKey(item.licenseId) : '';
                item.piStatus = item.piStatus == 0 ? 'Offline' : 'Online';
                item.screenType = this._titlecase.transform(item.screenType);
                item.contentsUpdated = this._date.transform(item.contentsUpdated, 'MMM dd, yyyy h:mm a');
                item.timeIn = item.timeIn ? this._date.transform(item.timeIn, 'MMM dd, yyyy h:mm a') : '';
                item.storeHoursParse = this.getStoreHourseParse(item);
                item.installDate = this._date.transform(item.installDate, 'MMM dd, yyyy');
                item.installRequestDate = this._date.transform(item.installRequestDate, 'MMM dd, yyyy');
                item.dateCreated = this._date.transform(item.dateCreated, 'MMM dd, yyyy');
                item.internetType = this.getInternetType(item.internetType);
                item.internetSpeed = item.internetSpeed == 'Fast' ? 'Good' : item.internetSpeed;
                item.uploadSpeed = item.uploadSpeed ? this.roundOffNetworkData(parseInt(item.uploadSpeed)) : '';
                item.downloadSpeed = item.downloadSpeed ? this.roundOffNetworkData(parseInt(item.downloadSpeed)) : '';
                item.isActivated = item.isActivated == 0 ? 'No' : 'Yes';
                let parse_version = JSON.parse(item.appVersion);
                item.ui = parse_version && parse_version.ui ? parse_version.ui : '1.0.0';
                item.server = parse_version && parse_version.server ? parse_version.server : '1.0.0';
                item.tagsToString = item.tags.join(',');
                break;
            case 'Hosts':
                item.storeHoursParse = this.getStoreHourseParse(item);
                item.generalCategory = item.generalCategory ? item.generalCategory : 'Other';
                item.businessName = this.dealer.businessName;
                //To Set AVG Dwell Time and Foot Traffic Default Value to 0
                for (let i = 1; i < 13; i++) {
                    var average_dwell_time_with_index = 'averageDwellTime-' + i;
                    var foot_traffic_with_index = 'footTraffic-' + i;
                    item[average_dwell_time_with_index] = 0;
                    item[foot_traffic_with_index] = 0;
                }

                //To Overwrite Dwell Time and Foot Traffic to available months only
                if (item.placerDump) {
                    item.placerDump.map((dump) => {
                        let dissected_month = dump.month.split(' ');
                        let month_index = moment().month(dissected_month[0]).format('M');
                        var average_dwell_time_with_index = 'averageDwellTime-' + month_index[0];
                        var foot_traffic_with_index = 'footTraffic-' + month_index[0];
                        item[average_dwell_time_with_index] = dump.averageDwellTime;
                        item[foot_traffic_with_index] = dump.footTraffic;
                    });
                }

                break;

            case 'Advertisers':
                item.contentsCount = item.contentCount;
                if (item.contents && item.contents.length > 0) item.contentsFormatted = item.contents.join('\n');
                break;
        }
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
                        if (period.open == '' && period.close == '') days.push(day.day + ' : Open 24 hrs');
                        else days.push(day.day + ' : ' + period.open + ' - ' + period.close);
                    });
                } else days.push(day.day + ' : ' + 'Closed');
            });
            data.storeHoursParse = days.toString();
            return data.storeHoursParse.split(',').join('\n');
        }
    }

    getZoneHours(data) {
        if (data.templateName == 'Fullscreen') return 'Main: ' + this.msToTime(data.templateMain);

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
                data_to_return += (index === 0 ? '' : '\n') + template + ': ' + this.msToTime(data[templateKey]);
            }
        });

        return data_to_return;
    }

    msToTime(input) {
        const totalSeconds = input;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return hours.toFixed(0) + 'h ' + minutes.toFixed(0) + 'm ' + seconds.toFixed(0) + 's ';
    }

    exportTable(tab) {
        this.workbook_generation = true;
        this.getDataForExport(this.dealer_id, tab);
    }

    private get isAdvertisersTabOnLoad(): boolean {
        return this._location.path().includes('tab=2');
    }

    private get isHostsTabOnLoad(): boolean {
        return this._location.path().includes('tab=1');
    }

    private get isZoneTabOnLoad(): boolean {
        return this._location.path().includes('tab=3');
    }

    private get isActivityTabOnLoad(): boolean {
        return this._location.path().includes('tab=4');
    }

    private get isTerminalTabOnLoad(): boolean {
        return this._location.path().includes('tab=5');
    }

    private get isBillingTabOnLoad(): boolean {
        return this._location.path().includes('tab=6');
    }

    private getDealer(): void {
        this._dealer
            .get_dealer_by_id(this.dealer_id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response: API_DEALER) => {
                    this.dealer = response;
                    this.banner_description = `${response.city}, ${response.state} ${response.region} - Dealer since ${this._date.transform(response.startDate)}`;
                    this.dealer_id = response.dealerId;
                    this.dealer_name = response.businessName;
                    this.getDealerUserData(response.userId);
                    this.dealer_data = response;
                    this.createdBy = response.createdBy;
                    this.dateCreated = response.dateCreated;
                    this.getDealerActivity(1);
                },
                (error) => console.error(error),
            );
    }

    private getDealerUserData(id: string): void {
        const isCurrentUserAdmin = this._auth.current_role === 'administrator';

        this._user
            .get_user_alldata_by_id(id, isCurrentUserAdmin)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if ('message' in response) {
                        this.loaded = true;
                        return;
                    }

                    this.user = response.user;
                    this.dealer_and_user_data = { dealer: this.dealer, user: this.user };
                    this.loaded = true;
                },
                (error) => console.error(error),
            );
    }

    private getInternetType(value: string): string {
        if (value) {
            value = value.toLowerCase();
            if (value.includes('w')) return 'WiFi';
            if (value.includes('eth')) return 'LAN';
        }
    }

    private getLicenseStatisticsByDealer(id: string, reload = false): void {
        this.subscription.add(
            this._license.get_statistics_by_dealer(id).subscribe(
                (response) => {
                    let hasNull = false;
                    for (let [key, value] of Object.entries(response)) {
                        if (value == null) {
                            hasNull = true;
                            break;
                        }
                    }
                    if (hasNull) {
                        response = {
                            activityActive: '0',
                            activityInactive: '0',
                            connectionTypeLan: '0',
                            connectionTypeWifi: '0',
                            screenTypeAd: '0',
                            screenTypeClosed: '0',
                            screenTypeMenu: '0',
                            statusOffline: '0',
                            statusOnline: '0',
                        };
                    }
                    this.statistics = response;
                },
                (error) => console.error(error),
            ),
        );
    }

    private setCurrentTabOnLoad(): void {
        if (this.isHostsTabOnLoad) {
            this.current_tab = 'hosts';
            return;
        }
        if (this.isAdvertisersTabOnLoad) {
            this.current_tab = 'advertisers';
            return;
        }
        if (this.isZoneTabOnLoad) {
            this.current_tab = 'zone';
            return;
        }
        if (this.isActivityTabOnLoad) {
            this.current_tab = 'activity';
            return;
        }
        if (this.isTerminalTabOnLoad) {
            this.current_tab = 'terminal';
            return;
        }
        if (this.isBillingTabOnLoad) {
            this.current_tab = 'billing';
            this.reload_billing = true;
            this.cd.detectChanges();
            return;
        }
        this.current_tab = 'licenses';
    }

    private subscribeToReassignSuccess(): void {
        this.subscription.add(
            this._dealer.onSuccessReassigningDealer.subscribe(
                () => this.ngOnInit(),
                (error) => console.error(error),
            ),
        );
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

    filterTable(type: string, value: any, value2?: any, days?: any) {
        switch (type) {
            case 'status':
                this.resetFilterStatus();
                this.filters.activated = true;
                this.filters.label_status = value == 1 ? 'Online' : 'Offline';
                this.filters.online = value == 1 ? true : false;
                this.filters.assigned = true;
                this.filters.isactivated = 1;
                if (value == 0) {
                    let filter = {
                        column: 'TimeIn',
                        order: 'desc',
                    };
                    this.getColumnsAndOrder(filter);
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
            case 'days_offline':
                this.resetFilterStatus();
                this.filters.status = 0;
                this.filters.days_offline_from = value;
                this.filters.days_offline_to = value2;
                this.filters.label_status = 'Offline for ' + days;
                const filter = { column: 'TimeIn', order: 'desc' };
                this.getColumnsAndOrder(filter);
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
                this.filters.isactivated = 1;
                this.filters.assigned = true;
                this.filters.pending = value;
                this.filters.label_status = value == 'true' ? 'Pending' : '';
                this.sortList('desc');
                break;
            default:
        }
        this.getLicensesofDealer(1);
    }

    sortByUser() {
        let dialog = this._dialog.open(UserSortModalComponent, {
            width: '500px',
            data: {
                view: 'license',
                is_dealer: true,
                dealer_id: this.dealer_id,
                dealer_name: this.dealer_name,
            },
        });

        dialog.afterClosed().subscribe((data) => {
            if (data) {
                if (data.host.id) {
                    this.filters.host = data.host.id;
                    this.filters.label_host = data.host.name;
                }
                this.getLicensesofDealer(1);
            }
        });
    }

    clearFilter() {
        this.filters = {
            admin_licenses: false,
            isactivated: '',
            assigned: '',
            online: '',
            pending: '',
            activated: '',
            zone: '',
            status: '',
            host: '',
            label_status: '',
            label_zone: '',
            label_dealer: '',
            label_host: '',
            label_admin: '',
            days_offline_from: '',
            days_offline_to: '',
        };
        this.sortList('desc');
        this.getLicensesofDealer(1);
    }

    private getSpeedColorIndicator(speed) {
        if (speed > 25) return 'text-primary';
        else if (speed <= 25 && speed > 6) return 'text-orange';
        else return 'text-danger';
    }

    private roundOffNetworkData(data: number) {
        return (Math.round(data * 100) / 100).toFixed(2) + ' MBPS';
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
