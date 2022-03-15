import { DatePipe, Location, TitleCasePipe } from '@angular/common'
import { Component, OnInit, AfterViewInit, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import * as io from 'socket.io-client';

import { AdvertiserService } from '../../services/advertiser-service/advertiser.service';
import { API_DEALER } from '../../models/api_dealer.model';
import { API_HOST } from '../../models/api_host.model';
import { API_LICENSE } from '../../models/api_license.model';
import { API_LICENSE_STASTICS } from '../../models/api_license_statistics.model';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { DEALER_UI_TABLE_ADVERTISERS } from '../../models/ui_table_advertisers.model';
import { environment } from '../../../../environments/environment';
import { HostService } from '../../services/host-service/host.service';
import { LicenseService } from '../../services/license-service/license.service';
import { RoleService } from '../../services/role-service/role.service';
import { SubstringPipe } from '../../pipes/substring.pipe';
import { UI_DEALER_HOST } from '../../models/ui_dealer-host.model';
import { UI_DEALER_LICENSE } from '../../models/ui_dealer-license.model';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from '../../models/ui_role-definition.model';
import { UserService } from '../../services/user-service/user.service';
import { AuthService } from '../../services/auth-service/auth.service';
import { UserSortModalComponent } from '../../components_shared/media_components/user-sort-modal/user-sort-modal.component';
import { UI_DEALER_LICENSE_ZONE } from '../../models/ui_table_dealer-license-zone.model';


@Component({
	selector: 'app-single-dealer',
	templateUrl: './single-dealer.component.html',
	styleUrls: ['./single-dealer.component.scss'],
	providers: [DatePipe, TitleCasePipe, SubstringPipe]
})

export class SingleDealerComponent implements AfterViewInit, OnInit, OnDestroy {
	advertiser_card: any;
	advertiser_data:any = [];
	advertiser_filtered_data: any = [];
	license_zone_data:any = [];
	license_zone_filtered_data: any = [];
	apps: any;
	array_to_delete: any = [];
	combined_data: API_HOST[];
	current_role: string;
	current_tab = 'hosts';
	dealer: API_DEALER;
	dealers: API_DEALER[];
	dealers_data: Array<any> = []; 
	dealer_id: string;
	dealer_loading = true;
	dealer_name: string;
	dealer_user_data: any;
	d_desc: string = "Dealer since January 25, 2019";
	d_name: string = "Business Name";
	from_change: boolean = false;
    height_show: boolean = true;
	host_card:any;
	host_data: any = [];
	host_data_api: API_HOST[];
	host_filtered_data: any = [];
	hosts_to_export: any = [];
	img: string = "assets/media-files/admin-icon.png";
	initial_load = true;
	initial_load_advertiser = true;
	initial_load_license = true;
	initial_load_zone = true;
	is_search: boolean = false;
	license$: Observable<API_LICENSE[]>;
	licenses: any[];
	license_card:any;
	license_count: number;
	license_data: any = [];
	license_data_api: any;
	license_filtered_data: any = [];
	license_row_slug: string = "host_id";
	license_row_url: string = "/dealer/hosts";
	license_tbl_row_slug: string = "license_id";
	license_tbl_row_url: string = "/administrator/licenses/";
	licenses_to_export: any = [];
	loaded: boolean = false;
	loading_data: boolean = true;
	loading_search: boolean = false;
	loading_statistics = { activity: true, status: true, connection: true, screen: true };
	no_advertisers = false;
	no_case: boolean = true;
	no_hosts = false;
	no_licenses = false;
	no_license_zone = false;
	no_record: boolean = false;
	now: any;
	paging: any;
	paging_data: any;
	paging_data_advertiser: any;
	paging_data_license: any;
	paging_data_zone: any;
	pi_updating: boolean = false;
	remote_update_disabled = false;
	remote_reboot_disabled = false;
	screenshot_disabled = false;
	search_data: string = "";
	search_data_advertiser: string = "";
	search_data_license: string = "";
	search_data_license_zone: string = "";
	searching = false;
	searching_advertiser = false;
	searching_license = false;
	searching_license_zone = false;
	selected_index: number;
	show_admin_buttons: boolean = false
	single_info: Array<any>;
	sort_column: string = "";
    sort_column_advertisers: string = "";
	sort_column_hosts: string = "";
	sort_order: string = "";
	sort_order_advertisers: string = "";
	sort_order_hosts: string = "";
    splitted_text: any;
	statistics: API_LICENSE_STASTICS;
	subscription: Subscription = new Subscription;
	temp_array: any = [];
    temp_label: any = [];
    temp_array_value: any = [];
	timeout_duration: number;
	timeout_message: string;
	title: string = "The Dealer";
	workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

	saved_license_page: any;
	saved_hosts_page: any;
	saved_adv_page: any;
	saved_tab: any;

	_socket: any;

	adv_table_col = [
		{ name: '#', sortable: false},
		{ name: 'Name', sortable: true, column:'Name'},
		{ name: 'Region', sortable: true, column:'Region'},
		{ name: 'State', sortable: true, column:'State'},
		{ name: 'Status', sortable: true, column:'Status'},
		{ name: 'Assigned User', sortable: true, column:'AdvertiserUser'}
	];

	//Documentation for columns:
	// Name = Column Name,  
	// Sortable: If Sortable, 
	// Column: For BE Key to sort, 
	// Key: Column to be exported as per API, 
	// No_export: Dont Include to Export
	host_table_col = [ 
		{ name: '#', sortable: false, no_export: true},
        { name: 'Dealer Name', sortable: false, key: 'businessName', hidden: true, no_show: true},
		{ name: 'Host Name', sortable: true, column:'Name', key: 'name'},
        { name: 'Category', no_show:true, hidden: true, key: 'category'},
		{ name: 'Address', sortable: true, column:'Address', key: 'address'},
		{ name: 'City', sortable: true, column:'City', key: 'city'},
		{ name: 'State', sortable: true, column:'State', key: 'state'},
		{ name: 'Postal Code', sortable: true, column:'PostalCode', key: 'postalCode'},
		{ name: 'License Count', sortable: true, column:'TotalLicences', key: 'totalLicences'},
		{ name: 'Vistar Venue ID', no_show:true, key: 'vistarVenueId'},
		{ name: 'Notes', no_show:true, hidden: true, key: 'notes'},
		{ name: 'Others', no_show:true, hidden: true, key: 'others'},
        { name: 'Status', sortable: true, column: 'Status',no_export: true, hidden: true},
	];

	license_table_columns = [
		{ name: '#', sortable: false, no_export: true},
        { name: null, sortable: false, no_export: true, hidden: true},
        { name: 'Status', sortable: false, key: 'piStatus', hidden: true, no_show: true},
		{ name: 'Screenshot', sortable: false, no_export: true},
		{ name: 'License Key', sortable: true, column:'LicenseKey', key: 'licenseKey'},
		{ name: 'Type', sortable: true, column:'ScreenType', key: 'screenType'},
		{ name: 'Dealer', sortable: true, key: 'dealer', hidden: true, no_show: true},
		{ name: 'Host', sortable: true, column:'HostName', key: 'hostName'},
		{ name: 'Alias', sortable: true, column:'Alias', key: 'alias'},
		{ name: 'Last Push', sortable: true, column:'ContentsUpdated', key:'contentsUpdated'},
		{ name: 'Last Online', sortable: true, column:'TimeIn', key:'timeIn'},
		{ name: 'Net Type', sortable: true, column:'InternetType', key:'internetType'},
		{ name: 'Net Speed', sortable: false, key:'internetSpeed'},
		{ name: 'Display', sortable: false, key: 'displayStatus'},
		{ name: 'Anydesk', sortable: true, column:'AnydeskId', key:'anydeskId'},
		{ name: 'Password', sortable: false, key:'password'},
		{ name: 'PS Version', sortable: true, key:'server', column:'ServerVersion'},
		{ name: 'UI Version', sortable: true, key:'ui', column:'UiVersion'},
		{ name: 'Pi Version', sortable: false, key:'piVersion', hidden: true, no_show: true},
		{ name: 'Memory', sortable: false, key:'memory', hidden: true, no_show: true },
		{ name: 'Storage', sortable: false, key:'totalStorage', hidden: true, no_show: true},
		{ name: 'Screen', sortable: true, column:'ScreenName', key:'screenName' },
		{ name: 'Template', sortable: true, column:'TemplateName', key:'templateName'},
        { name: 'Zone & Duration', sortable: false, hidden: true, key:'zone', no_show: true},		
		{ name: 'Installation Date', sortable: true, column:'InstallDate', key:'installDate'},
		{ name: 'Creation Date', sortable: false, key:'dateCreated'},
		{ name: 'Tags', key:'tagsToString', hidden: true, no_show: true },
	];

	license_zone_table_col = [
		{ name: '#', sortable: false},
		{ name: 'License ID', sortable: false, column:'LicenseKey'},
		{ name: 'Alias', sortable: false, column:'LicenseAlias'},
		{ name: 'Main', sortable: false, column:'MainDuration'},
		{ name: 'Vertical', sortable: false, column:'VerticalDuration'},
		{ name: 'Banner', sortable: false, column:'HorizontalDuration'},
		{ name: 'Background', sortable: false, column:'BackgroundDuration'},
		{ name: 'Assets', sortable: false, column:'MainTotalAsset'},
		{ name: 'Hosts', sortable: false, column:'MainTotalHost'},
		{ name: 'Hosts (%)', sortable: false, column:'MainTotalHostPercentage'},
		{ name: 'Advertisers', sortable: false, column:'MainTotalAdvertiser'},
		{ name: 'Advertisers (%)', sortable: false, column:'MainTotalAdvertiserPercentage'},
		{ name: 'Fillers', sortable: false, column:'MainTotalFiller'},
		{ name: 'Fillers (%)', sortable: false, column:'MainTotalFillerPercentage'},
		{ name: 'Feeds', sortable: false, column:'MainTotalFeed'},
		{ name: 'Feeds (%)', sortable: false, column:'MainTotalFeedPercentage'},
		{ name: 'Other', sortable: false, column:'MainTotalOther'},
		{ name: 'Other (%)', sortable: false, column:'MainTotalOtherPercentage'}
	];

    filters: any = {
        admin_licenses: false,
        isactivated: "",
        assigned: "",
        online: "",
        inactive: "",
        activated: "",
        zone:"",
        status:"",
        host:'',
        label_status:"",
        label_zone:"",
        label_dealer: "",
        label_admin: "",
    }

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
		private _location: Location,
		private _params: ActivatedRoute,
		private _role: RoleService,
		private _titlecase: TitleCasePipe,
		private _user: UserService
	) { }

	ngOnInit() {
		this.current_role = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);

		this._socket = io(environment.socket_server, {
			transports: ['websocket'],
			query: 'client=Dashboard__SingleDealerComponent'
		});

		this._params.queryParams.subscribe(params => {
			this.saved_tab = params['tab'] || 0;
			if (this.saved_tab == 0) {
				this.saved_license_page = params['page'] || 1;
			} else if(this.saved_tab == 1) {
				this.saved_hosts_page = params['page'] || 1;
			} else if(this.saved_tab == 2) {
				this.saved_adv_page = params['page'] || 1;
			}
		})

		this._socket.on('connect', () => {
			// console.log('#SingleDealerComponent - Connected to Socket Server');
		});
		
		this._socket.on('disconnect', () => {
			// console.log('#SingleDealerComponent - Disconnnected to Socket Server');
		})

		if (this._role.get_user_role() == UI_ROLE_DEFINITION_TEXT.administrator) this.show_admin_buttons = true;

		this.setCurrentTabOnLoad();

		this.subscription.add(
			this._params.paramMap.subscribe(
				() => {
					if (!this.from_change) {
						this.dealer_id = this._params.snapshot.params.data;
					} else {
						this.dealer_id = this.dealer_id;
					}
					this.getDealerInfo(this.dealer_id);
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
				error => {
					console.log('Error on paramMap subscription', error)
				}
			)
		);

		this.subscription.add(
			this._params.queryParams.subscribe(
				data => this.selected_index = data.tab,
				error => console.log('Error on query params subscription', error)
			)
		);

		this.subscribeToReassignSuccess();
		this.getDealers(1);
	}

	ngAfterViewInit() {				
		if (this.current_tab === 'licenses') {
			this.getLicenseStatisticsByDealer(this.dealer_id);
		}
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
				() => 
				this.warningModal('success', 'License Activated', 'License successfully activated.', '', ''),
				error => console.log('Error activating license', error)
			)
		);
	}

	adminButton(): void {
		const single_dealer_administrative_tools = localStorage.getItem(`${this.dealer_id}`);
		if (single_dealer_administrative_tools) {
			this.timeout_duration = moment().diff(moment(single_dealer_administrative_tools, 'MMMM Do YYYY, h:mm:ss a'), 'minutes');
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
			this.search_data_advertiser = "";
			this.getDealerAdvertiser(1);
		}
	}

	advertiser_mapToUI(data: any[]): DEALER_UI_TABLE_ADVERTISERS[] {
		let count = this.paging_data_advertiser.pageStart;
		return data.map(
			i => {
				return new DEALER_UI_TABLE_ADVERTISERS(
					{ value: i.id, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: i.name, link: '/administrator/advertisers/' + i.id, editable: false, hidden: false},
					{ value: i.region ? i.region : '--', link: null , editable: false, hidden: false},
					{ value: i.state, link: null , editable: false, hidden: false},
					{ value: i.status, link: null , editable: false, hidden: false},
					{ value: i.userId ? i.advertiserUser : 'Unassigned', link: null , editable: false, hidden: false},
				)
			}
		);
	}

	licenseZoneFilterData(e): void {
		if (e) {
			this.search_data_license_zone = e;
			this.getDealerLicenseZone(1);
		} else {
			this.search_data_license_zone = "";
			this.getDealerLicenseZone(1);
		}
	}

	license_zone_mapToUI(data: any[]): UI_DEALER_LICENSE_ZONE[] {
		let count = this.paging_data_zone.pageStart;
		return data.map(
			i => {
				return new UI_DEALER_LICENSE_ZONE(
					{ value: i.licenseId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: i.licenseKey, link: '/administrator/licenses/' + i.licenseId , editable: false, hidden: false},
					{ value: i.licenseAlias ? i.licenseAlias : '--', link: '/administrator/licenses/' + i.licenseId, editable: false, hidden: false},
					{ value: this.calculateTime(i.mainDuration), link: null , editable: false, hidden: false},
					{ value: this.calculateTime(i.verticalDuration), link: null , editable: false, hidden: false},
					{ value: this.calculateTime(i.horizontalDuration), link: null , editable: false, hidden: false},
					{ value: this.calculateTime(i.backgroundDuration), link: null , editable: false, hidden: false},
					{ value: i.mainTotalAsset, link: null , editable: false, hidden: false},
					{ value: i.mainTotalHost, link: null , editable: false, hidden: false},
					{ value: i.mainTotalHostPercentage, link: null , editable: false, hidden: false},
					{ value: i.mainTotalAdvertiser, link: null , editable: false, hidden: false},
					{ value: i.mainTotalAdvertiserPercentage, link: null , editable: false, hidden: false},
					{ value: i.mainTotalFiller, link: null , editable: false, hidden: false},
					{ value: i.mainTotalFillerPercentage, link: null , editable: false, hidden: false},
					{ value: i.mainTotalFeed, link: null , editable: false, hidden: false},
					{ value: i.mainTotalFeedPercentage, link: null , editable: false, hidden: false},
					{ value: i.mainTotalOther, link: null , editable: false, hidden: false},
					{ value: i.mainTotalOtherPercentage, link: null , editable: false, hidden: false}
				)
			}
		);
	}

	private calculateTime(duration: number): string {
		if (duration < 60) {
			return `${Math.round(duration)}s`;
		}

		if (duration === 60) {
			return '1m';
		}

		const minutes = Math.floor(duration / 60);
		const seconds = Math.round(duration - minutes * 60);

		return `${minutes}m ${seconds}s`;
	}

	deactivateLicense(e): void {
		this.subscription.add(
			this._license.deactivate_license(e).subscribe(
				() => this.warningModal('success', 'License Deactivated', 'License successfully deactivated.', '', ''),
				error => console.log('Error deactivating license', error)
			)
		);
	}

	getAdvertiserTotalCount(id): void {
		this.subscription.add(
			this._advertiser.get_advertisers_total_by_dealer(id).subscribe(
				data => {
					this.advertiser_card = {
						basis: data.total,
						basis_label: 'ADVERTISERS',
						good_value: data.totalActive,
						good_value_label: 'ACTIVE',
						bad_value: data.totalInActive,
						bad_value_label: 'INACTIVE'
					}
				},
				error => console.log('Error retrieving total advertiser count', error)
			)
		);
	}

	getDealerAdvertiser(page): void {
		this.searching_advertiser = true;
		this.subscription.add(
			this._advertiser.get_advertisers_by_dealer_id(this.dealer_id, page, this.search_data_advertiser, this.sort_column_advertisers, this.sort_order_advertisers).subscribe(
				data => {
					this.initial_load_advertiser = false;
					this.searching_advertiser = false;
                    this.paging_data_advertiser = data.paging;
					if (!data.message) {
						const advertisers = this.advertiser_mapToUI(data.paging.entities);
						this.advertiser_data = [...advertisers];
						this.advertiser_filtered_data = [...advertisers];
						this.no_advertisers = false;
					} else {
						if (this.search_data_advertiser == "") {
							this.no_advertisers = true;
						}
						this.advertiser_data=[];
						this.advertiser_filtered_data = [];
					}
				},
				error => console.log('Error retrieving advertisers by dealer', error)
			)
		);
	}

	getDealerHost(page): void {
		this.searching = true;
		this.host_data = [];
		this.host_filtered_data = [];
		this.temp_array = [];

		this.subscription.add(
			this._host.get_host_by_dealer_id_with_sort(this.dealer_id, page, this.search_data, this.sort_column_hosts, this.sort_order_hosts).subscribe(
				data => {
					this.initial_load = false;
					this.searching = false;
                    this.paging_data = data.paging;
					
					if (!data.message) {
						this.temp_array = data.paging.entities;
						this.host_data = this.hostTable_mapToUI(this.temp_array);
						this.host_filtered_data = this.hostTable_mapToUI(this.temp_array);
						this.no_hosts = false;
					} else {

						if (this.search_data == "") {
							this.no_hosts = true;
						}

						this.host_data = [];
						this.host_filtered_data = [];
					}
					
				},
				error => console.log('Error retrieving dealer host', error)
			)
		);
	}

	getDealerInfo(id): void {
		this.subscription.add(
			this._dealer.get_dealer_by_id(id).subscribe(
				(response: API_DEALER) => {
					this.dealer = response;
					this.dealer_id = response.dealerId;
					this.dealer_name = response.businessName;
					this.getDealerUserData(response.userId);
				},
				error => console.log('Error retrieving dealer info', error)
			)
		);
	}

	getDealerUserData(id): void {
		this.subscription.add(
			this._user.get_user_alldata_by_id(id).subscribe(
				data =>  {
					data.dealer[0].tags = this.dealer.tags;
					this.dealer_user_data = Object.assign({}, data.user, data.dealer[0]);
					this.loaded = true;
				},
				error => console.log('Error retrieving dealer user data', error)
			)
		);
	}

	getHostTotalCount(id): void {
		this.subscription.add(
			this._host.get_host_total_per_dealer(id).subscribe(
				(data: any) => {
					this.host_card = {
						basis: data.total,
						basis_label: 'HOSTS',
						good_value: data.totalActive,
						good_value_label: 'ACTIVE',
						bad_value: data.totalInActive,
						bad_value_label: 'INACTIVE'
					}
				},
				error => console.log('Error retrieving total host count', error)
			)
		);
	}

	getLicensesofDealer(page: number): void {
		this.searching_license = true;
		this.subscription.add(
			this._license.sort_license_by_dealer_id(this.dealer_id, page, this.search_data_license, this.sort_column, this.sort_order,  15, this.filters.status, "", this.filters.activated, "", this.filters.zone, this.filters.host, this.filters.assigned, this.filters.inactive, this.filters.online, this.filters.isactivated).subscribe(
				(response: { paging, statistics, message }) => {	

					if (response.message) {

						if (this.search_data_license == "") {
							this.no_licenses = true;
						}

						this.license_data = [];
						this.license_filtered_data = [];

					} else {				
						this.license_data_api = response.paging.entities;
						this.no_licenses = false;

						this.license_data_api.map(
							i => {
								if(i.appVersion) {
									i.apps = JSON.parse(i.appVersion);
								} else {
									i.apps = null;
								}	
							}
						);
                        this.paging_data_license = response.paging;
						const mappedLicenses = this.licenseTable_mapToUI(this.license_data_api);
						this.license_data = mappedLicenses;
						this.license_filtered_data = mappedLicenses;
						
					}

					this.initial_load_license = false;
					this.searching_license = false; 
				},
				error => {
					console.log('Error retrieving licenses', error);
					this.no_licenses = true;
					this.license_data = [];
					this.license_filtered_data = [];
					this.initial_load_license = false;
					this.searching_license = false;
				}
			)
		);
	}

	getLicenseTotalCount(id): void {
		this.subscription.add(
			this._license.get_licenses_total_by_dealer(id).subscribe(
				(data: any) => {
					this.license_card = {
						basis: data.total,
						basis_label: 'Licenses',
                        basis_sub_label: 'Current Count',
						good_value: data.totalAssigned,
						good_value_label: 'Assigned',
						bad_value: data.totalUnAssigned,
						bad_value_label: 'Unassigned',
                        breakdown1_value: data.totalOnline,
                        breakdown1_label: 'Online',
                        breakdown2_value: data.totalOffline,
                        breakdown2_label: 'Offline',
                        breakdown3_value: data.totalInActive,
                        breakdown3_label: 'Inactive',
                        breakdown4_sub_label: 'Connection Status Breakdown :',
                        breakdown4_value: data.totalOffline,
                        breakdown4_label: 'LAN',
                        breakdown5_value: data.totalInActive,
                        breakdown5_label: 'WIFI',

                        ad_value: data.totalAd,
						ad_value_label: 'Ad',
						menu_value: data.totalMenu,
						menu_value_label: 'Menu',
						closed_value: data.totalClosed,
						closed_value_label: 'Closed',
						unassigned_value: data.totalUnassignedScreenCount,
						unassigned_value_label: 'Unassigned',
					}

                    if (this.license_card) {
						this.temp_label.push(this.license_card.ad_value_label + ": " + this.license_card.ad_value);
						this.temp_label.push(this.license_card.menu_value_label+ ": " + this.license_card.menu_value);
						this.temp_label.push(this.license_card.closed_value_label+ ": " + this.license_card.closed_value);
						this.temp_label.push(this.license_card.unassigned_value_label+ ": " + this.license_card.unassigned_value);
						this.temp_array_value.push(this.license_card.ad_value);
						this.temp_array_value.push(this.license_card.menu_value);
						this.temp_array_value.push(this.license_card.closed_value);
						this.temp_array_value.push(this.license_card.unassigned_value);
                    }
				},
				error => console.log('Error retrieving total license count', error)
			)
		);
	}

	hostFilterData(e): void {
		if (e) {
			this.search_data = e;
			this.getDealerHost(1);
		} else {
			this.search_data = "";
			this.getDealerHost(1);
		}
	}

	hostTable_mapToUI(data: any[]): UI_DEALER_HOST[] {
		let count = this.paging_data.pageStart;
		return data.map(
			(h: any) => {
				return new UI_DEALER_HOST(
					{ value: h.hostId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: h.name, link: '/administrator/hosts/' + h.hostId, editable: false, hidden: false},
					{ value: h.address, link: null, editable: false, hidden: false},
					{ value: h.city, link: null, editable: false, hidden: false},
					{ value: h.state, link: null, editable: false, hidden: false},
					{ value: h.postalCode, link: null, editable: false, hidden: false},
					{ value: h.totalLicences, link: null, editable: false, hidden: false},
					{ value: h.status, link: null, editable: false, hidden: false},
					// { value: this._date.transform(h.installDate), link: null, editable: false, hidden: false},	
				)
			}
		);
	}

	licenseFilterData(e): void {
		if (e) {
			this.search_data_license = e;
			this.getLicensesofDealer(1);
		} else {
			this.search_data_license = "";
			this.getLicensesofDealer(1);
		}
	}

	licenseTable_mapToUI(data: any[]): UI_DEALER_LICENSE[] {

		let count = this.paging_data_license.pageStart;
		return data.map(
			(l: any) => {
				const table = new UI_DEALER_LICENSE(
                    { value: count++, link: null , editable: false, hidden: false},
					{ value: l.licenseId, link: null , editable: false, hidden: true, key: true, table: 'license'},
					{ 
						value: l.screenshotUrl ? `${environment.base_uri_old}${l.screenshotUrl.replace("/API/", "")}` : null,
						link: l.screenshotUrl ? `${environment.base_uri_old}${l.screenshotUrl.replace("/API/", "")}` : null, 
						editable: false, 
						hidden: false, 
						isImage: true
					},
					{ value: l.licenseKey, link: '/administrator/licenses/' + l.licenseId, compressed: true, editable: false, hidden: false, status: true},
					{ value: l.screenType ? this._titlecase.transform(l.screenType) : '--', editable: false, hidden: false },
					{ value: l.hostId ? l.hostName : '--', link: l.hostId ? '/administrator/hosts/' + l.hostId : null, editable: false, hidden: false, business_hours: l.hostId ? true : false, business_hours_label: l.hostId ? this.getLabel(l) : null },
					{ value: l.alias ? l.alias : '--', link: '/administrator/licenses/' + l.licenseId, editable: true, label: 'License Alias', id: l.licenseId, hidden: false },
					{ value: l.contentsUpdated ? l.contentsUpdated : '--', label: 'Last Push', hidden: false },
					{ value: l.timeIn ? this._date.transform(l.timeIn, 'MMM dd, y h:mm a') : '--', hidden: false },
					{ value: l.internetType ? this.getInternetType(l.internetType) : '--', link: null, editable: false, hidden: false },
					{ value: l.internetSpeed ? (l.internetSpeed == 'Fast' ? 'Good' : l.internetSpeed) : '--', link: null, editable: false, hidden: false },
					{ value: l.displayStatus == 1 ? 'ON' : "N/A", link: null, editable: false, hidden: false },
					{ value: l.anydeskId ? l.anydeskId : '--', link: null, editable: false, hidden: false, copy: true, label: 'Anydesk Id' },
					{ value: l.anydeskId ? this.splitKey(l.licenseId) : '--', link: null, editable: false, hidden: false, copy:true, label: 'Anydesk Password' },
					{ value: l.serverVersion ? l.serverVersion : '1.0.0', link: null, editable: false, hidden: false },
					{ value: l.uiVersion ? l.uiVersion : '1.0.0', link: null, editable: false, hidden: false },
					{ value: l.screenName ? l.screenName : '--', compressed: true, link: `/administrator/screens/${l.screenId}` , editable: false },
					{ value: l.templateName ? l.templateName : '--', compressed: true, link: null, editable: false, hidden: false },
					{ value: l.installDate && !l.installDate.includes('Invalid') ? this._date.transform(l.installDate, 'MMM dd, y') : '--', link: null, editable: true, label: 'Install Date', hidden: false, id: l.licenseId },
					{ value: l.dateCreated ? this._date.transform(l.dateCreated, 'MMM dd, y') : '--', link: null, editable: false, hidden: false },
					{ value: l.isActivated, link: null , editable: false, hidden: true },
					{ value: l.hostId ? true : false, link: null , editable: false, hidden: true },
					{ value: l.piStatus, link: null , editable: false, hidden: true },
				);
				return table;
			}
		);
	}

    splitKey(key) {
        this.splitted_text = key.split("-");
        return this.splitted_text[this.splitted_text.length - 1];
    }

	getLabel(data) {
		this.now = moment().format('d');
		this.now = this.now;
        var storehours = JSON.parse(data.storeHours)
        storehours = storehours.sort((a, b) => {return a.id - b.id;});
		var modified_label = {
			date : moment().format('LL'),
			address: data.hostAddress,
			schedule: storehours[this.now] && storehours[this.now].status ? (
				storehours[this.now].periods[0].open == "" && storehours[this.now].periods[0].close == "" 
				? "Open 24 Hours" : storehours[this.now].periods.map(
					i => {
						return i.open + " - " + i.close
					})) : "Closed"
		}
		return modified_label;
	}

	onSelectTab(event: { index: number }): void {
		switch (event.index) {
			case 1:
				this.current_tab = 'hosts';
				break;

			case 2:
				this.current_tab = 'advertisers';
				break;

			case 3:
				this.current_tab = 'zone';
				break;

			default:

				this.current_tab = 'licenses';

				if (!this.no_licenses) {
					this.getLicenseStatisticsByDealer(this.dealer_id);
				}
		}

		this._router.navigate([], {
			relativeTo: this._params,
			queryParams: {
				tab: event.index
			},
			queryParamsHandling: 'merge'
		})
	}

	sortList(order, page?): void {
		var filter = {
			column: 'PiStatus',
			order: order
		}

		this.getColumnsAndOrder(filter)

		if (this.saved_tab == 0) {
			this.getLicensesofDealer(parseInt(this.saved_license_page));
		} else {
			this.getLicensesofDealer(1);
		}
	}

	getDealers(e) {
		this.loading_data = true;
		if(e > 1) {
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, "").subscribe(
					data => {
						data.dealers.map(
							i => {
								this.dealers.push(i)
							}
						)
						this.paging = data.paging;
						this.loading_data = false;
					}
				)
			)
		} else {
			if(this.is_search) {
				this.loading_search = true;
			}
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, "").subscribe(
					data => {
						this.dealers = data.dealers;
						this.dealers_data = data.dealers;
						this.paging = data.paging;
						this.loading_data = false;
						this.loading_search = false;
					}
				)
			)
		}
	}

	getDealerLicenseZone(page){
		this.searching_license_zone = true;
		this.subscription.add(
			this._dealer.get_dealer_license_zone(this.search_data_license_zone, this.dealer_id, page).subscribe(
				data => {
					if(data){
						this.initial_load_zone= false;
						this.searching_license_zone = false;
						this.paging_data_zone= data;
						if (data.entities.length > 0) {
							const licenseContents = this.license_zone_mapToUI(data.entities);
							this.license_zone_data = [...licenseContents];
							this.license_zone_filtered_data = [...licenseContents];
							this.no_license_zone = false;
						} else {
							if(this.search_data_license_zone == "") {
								this.no_license_zone = true;
							}
							this.license_zone_data=[];
							this.license_zone_filtered_data = [];
						}
					}
				},
				error => {
					console.log('Error retrieving licenses content by dealer', error);
					this.initial_load_zone= false;
					this.searching_license_zone = false;
					this.license_zone_data=[];
					this.license_zone_filtered_data = [];
				}
			)
		);
	}

	async dealerSelected(id: string): Promise<void> {
		await this._router.navigate([`/${this.current_role}/dealers/${id}`]);
		this.getLicenseStatisticsByDealer(id, true);
	}

	searchBoxTrigger(event) {
		this.is_search = event.is_search;
		if (this.paging.hasNextPage || this.is_search) this.getDealers(event.page);
	}

	searchData(e: any): void {
		this.loading_search = true;

		this.subscription.add(
			this._dealer.get_search_dealer(e)
				.map(
					(response: { paging: { entities: any[] } }) => {
						
						const dealers = response.paging.entities;
	
						if (response.paging.entities.length > 0) {

							dealers.forEach(
								(dealer, index) => {
									if (dealer.dealerId === this.dealer_id) response.paging.entities.splice(index, 1)
								}
							);

						}
	
						return response;

					}
				).subscribe(
					response => {
	
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
					error => console.log('Error searching for dealers', error)
				)
		);

	}

	toggleActivateDeactivate(e): void {
		if (e.status) {
			this.activateLicense(e.id);
		} else {
			this.deactivateLicense(e.id);
		}
	}

	rebootPi(): void {
		this.warningModal('warning', 'Reboot Pi (Device)', 'Are you sure you want to reboot pi?', 'Click OK to reboot device', 'reboot');
	}

	rebootPlayer(): void  {
		this.warningModal('warning', 'Reboot Player (Software)', 'Are you sure you want to reboot player?', 'Click OK to reboot software', 'reboot_player');
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

		if (this.licenses) {
			this.resyncSocketConnection();
		}
	}

	screenshotDealer(): void {
		this.warningModal('warning', 'Screenshot Dealer', "Screenshot all this dealer's licenses, Requires a reload after a minute or two.", 'Click OK to continue', 'screenshot');
	}

	updateAndRestart(): void {
		this.warningModal('warning', 'Update System and Restart', 'Are you sure you want to update the player and restart the pi?', 'Click OK to push updates for this license', 'system_update');
	}

	warningModal(status, message, data, return_msg, action, id?): void {
		this._dialog.closeAll();
		
		let dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data,
				return_msg: return_msg,
				action: action
			}
		})

		dialogRef.afterClosed().subscribe(result => {
			switch(result) {
				case 'system_update':
					this.licenses.forEach(
						i => {
							this._socket.emit('D_system_update_by_license', i.licenseId);
						}
					)
					break;
				case 'reboot':
					this.licenses.forEach(
						i => {
							this._socket.emit('D_pi_restart', i.licenseId);
						}
					)
					break;
				case 'reboot_player':
					this.licenses.forEach(
						i => {
							this._socket.emit('D_player_restart', i.licenseId);
						}
					)
					break;
				case 'license_delete':
					this.subscription.add(
						this._license.delete_license(this.array_to_delete).subscribe(
							data => {
								this.warningModal('success', 'License Deleted', 'License successfully deleted.', '', ''),
								this.reloadLicense();
							}
						)
					);
					break;
				case 'upgrade_to_v2': 
					this.licenses.forEach(
						i => {
							this._socket.emit('D_upgrade_to_v2_by_license', i.licenseId);
						}
					)
					break;
				case 'screenshot': 
					if (this.licenses) {
						this.licenses.forEach(
							i => {
								this._socket.emit('D_screenshot_pi', i.licenseId);
							}
						)
					}
					break;
				default:
			}
			const now = moment().format('MMMM Do YYYY, h:mm:ss a');
			localStorage.setItem(`${this.dealer_id}`, now);
			this.timeout_duration = 0;
			this.timeout_message = `Will be available after ${10 - this.timeout_duration} minutes`;
			this.remote_reboot_disabled = true;
			this.remote_update_disabled = true;
			this.screenshot_disabled = true;
		});
	}

	getMultipleDeleteData(data) {
		this.array_to_delete = data;
	}	

	multipleDeleteLicense() {
		this.warningModal('warning', 'Delete Licenses', 'Are you sure you want to delete ' + this.array_to_delete.length + ' licenses?','','license_delete', this.array_to_delete)
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
            this._license.get_license_to_export(this.dealer_id).subscribe(
                data => {
                    data.licenses.map(
                        i => {
                            if(i.appVersion) {
                                i.apps = JSON.parse(i.appVersion);
                            } else {
                                i.apps = null;
                            }	
                        }
                    );
                    this.licenses = data.licenses;
                    if (this.licenses) this.resyncSocketConnection();
                }
            )
        );
    }

    resyncSocketConnection() {
        this.licenses.forEach(
            i => {
                this._socket.emit('D_is_electron_running', i.licenseId);
            }
        )
    }

	getDataForExport(id, tab): void {
		switch(tab) {
			case 'Licenses': 
				this.subscription.add(
					// this._license.sort_license_by_dealer_id(id, 1, '', '', '', 0).subscribe(
					this._license.get_license_to_export_duration(id, this.search_data_license, this.sort_column, this.sort_order, 0, this.filters.status, "", this.filters.activated, "", this.filters.zone, this.filters.host, this.filters.assigned, this.filters.inactive, this.filters.online, this.filters.isactivated).subscribe(
						data => {
                            data.licenseTemplateZoneExports.map(
                                i => {
                                    if(i.appVersion) {
                                        i.apps = JSON.parse(i.appVersion);
                                    } else {
                                        i.apps = null;
                                    }	
                                }
                            );
                            this.licenses_to_export = data.licenseTemplateZoneExports;
							this.licenses_to_export.forEach((item, i) => {
								this.modifyItem(item, tab);
								this.worksheet.addRow(item).font ={
									bold: false
								};
							});
							this.generateExcel(tab);
						}
					)
				)
				break;
			case 'Hosts':
				this.subscription.add(
					this._host.get_host_by_dealer_id_with_sort(this.dealer_id, 1, this.search_data, this.sort_column_hosts, this.sort_order_hosts, 0).subscribe(
						data => {
							this.hosts_to_export = data.paging.entities;
							this.hosts_to_export.forEach((item, i) => {
                                this.modifyItem(item, tab);
								this.worksheet.addRow(item).font ={
									bold: false
								};
							});
							this.generateExcel(tab);
						}
					)
				)
				break;
		}
	}

	generateExcel(tab) {
		const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
		let rowIndex = 1;
		for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
			this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
		}
		this.workbook.xlsx.writeBuffer().then((file: any) => {
			const blob = new Blob([file], { type: EXCEL_TYPE });
			const filename = this.dealer_user_data.businessName	+ '-' + tab +  '.xlsx';
			saveAs(blob, filename);
		});
		this.workbook_generation = false;
	}

	modifyItem(item, tab) {
		switch(tab) {
			case 'Licenses':
                item.dealer = this.dealer_user_data.businessName;
                item.piVersion = item.apps ? item.apps.rpi_model : '';
                item.zone = this.getZoneHours(item);
                item.displayStatus = item.displayStatus == 1 ? 'ON' : "";
                item.password = item.anydeskId ? this.splitKey(item.licenseId) : '';
				item.piStatus =  item.piStatus == 0 ? 'Offline':'Online';
				item.screenType =  this._titlecase.transform(item.screenType);
				item.contentsUpdated = this._date.transform(item.contentsUpdated, 'MMM dd, yyyy h:mm a');
				item.timeIn = item.timeIn ? this._date.transform(item.timeIn, 'MMM dd, yyyy h:mm a'): '';
				item.installDate = this._date.transform(item.installDate, 'MMM dd, yyyy h:mm a');
				item.dateCreated = this._date.transform(item.dateCreated, 'MMM dd, yyyy');
				item.internetType = this.getInternetType(item.internetType);
				item.internetSpeed = item.internetSpeed == 'Fast' ? 'Good' : item.internetSpeed;
				item.isActivated = item.isActivated == 0 ? 'No' : 'Yes';
				var parse_version = JSON.parse(item.appVersion);
				item.ui = parse_version && parse_version.ui  ? parse_version.ui : '1.0.0';
				item.server = parse_version && parse_version.server  ? parse_version.server : '1.0.0';
				item.tagsToString = item.tags.join(',');
				break;
            case 'Hosts':
                item.businessName = this.dealer_user_data.businessName;
                break;
        }	
	}

    getZoneHours(data) {
        if(data.templateName == 'Fullscreen') {
            return "Main: " + this.msToTime(data.templateMain)
        } else {
            var data_to_return: any = '';
            if(data.templateBackground != 'NO DATA') {
                data_to_return = data_to_return + "Background: " + this.msToTime(data.templateBackground);
            }
            if (data.templateBottom != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Bottom: " + this.msToTime(data.templateBottom);
            } 
            if (data.templateHorizontal != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Horizontal: " + this.msToTime(data.templateHorizontal);
            } 
            if (data.templateHorizontalSmall != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Horizontal Small: " + this.msToTime(data.templateHorizontalSmall)
            } 
            if (data.templateLowerLeft != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Lower Left: " + this.msToTime(data.templateLowerLeft)
            } 
            if (data.templateMain != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Main: " + this.msToTime(data.templateMain)
            } 
            if (data.templateUpperLeft != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Upper Left: " + this.msToTime(data.templateUpperLeft)
            } 
            if (data.templateVertical != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Vertical: " + this.msToTime(data.templateVertical)
            }
            return data_to_return;
        }
    }

    msToTime(input) {
        let totalSeconds = input
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;

        return hours.toFixed(0) + "h " + minutes.toFixed(0) + "m " + seconds.toFixed(0) + "s "
    }

	exportTable(tab) {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet(tab);
		switch(tab) {
			case 'Licenses':
				Object.keys(this.license_table_columns).forEach(key => {
					if(this.license_table_columns[key].name && !this.license_table_columns[key].no_export) {
						header.push({ header: this.license_table_columns[key].name, key: this.license_table_columns[key].key, width: 30, style: { font: { name: 'Arial', bold: true}}});
					}
				});
				header.push({ header: 'Activated', key: 'isActivated', width: 30, style: { font: { name: 'Arial', bold: true, color: '8EC641' }}});
				break;
			case 'Hosts':
				Object.keys(this.host_table_col).forEach(key => {
					if(this.host_table_col[key].name && !this.host_table_col[key].no_export) {
						header.push({ header: this.host_table_col[key].name, key: this.host_table_col[key].key, width: 30, style: { font: { name: 'Arial', bold: true}}});
					}
				});
				break;
		}
		this.worksheet.columns = header;
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

	private getInternetType(value: string): string {
		if(value) {
			value = value.toLowerCase();
			if (value.includes('w')) {
				return 'WiFi';
			}
			if (value.includes('eth')) {
				return 'LAN';
			}
		}
	}

	private getLicenseStatisticsByDealer(id: string, reload = false): void {
		this.subscription.add(
			this._license.get_statistics_by_dealer(id)
				.subscribe(
					(response: API_LICENSE_STASTICS) => {
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
								statusOnline: '0'
							}
						} 
						
						this.statistics = response;
					},
					error => console.log('Error retrieving license statistics by dealer', error)
				)
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


		this.current_tab = 'licenses';

	}

	private subscribeToReassignSuccess(): void {
		this.subscription.add(
			this._dealer.onSuccessReassigningDealer.subscribe(
				() => this.ngOnInit(),
				error => console.log('Error on reassign success subscription', error)
			)
		);
	}

    resetFilterStatus() {
        this.filters.activated = "";
        this.filters.status = "";
        this.filters.assigned = "";
        this.filters.inactive = "";
        this.filters.online = "";
    }

    filterTable(type: string, value: any, days?:any) {
        switch(type) {
            case 'status':
                this.resetFilterStatus();
                // this.filters.status = value;
                this.filters.activated = true;
                this.filters.label_status = value == 1 ? 'Online' : 'Offline';
                if(value == 1) {
                    this.filters.online = true
                } else {
                    this.filters.online = false
                }
                this.filters.assigned = true;
                this.filters.isactivated = 1;
                if(value == 0) {
                    var filter = {
                        column: 'TimeIn',
                        order: 'desc'
                    }
                    // this.getColumnsAndOrder(filter, 'licenses')
                } else {
                    this.sortList('desc');
                }
                break;
            case 'zone':
                this.filters.zone = value
                this.filters.label_zone = value;
                break;
            case 'activated':
                this.resetFilterStatus();
                this.filters.status = "";
                this.filters.activated = value;
                this.filters.label_status = 'Inactive';
                break;
            case 'assigned':
                this.resetFilterStatus();
                this.filters.assigned = value;
                value == 'true' ? this.filters.isactivated = 1 : this.filters.isactivated = "";
                this.filters.label_status = value == 'true' ? 'Assigned':'Unassigned';
                break;
            case 'inactive':
                this.resetFilterStatus();
                this.filters.isactivated = 1;
                this.filters.assigned = true;
                this.filters.inactive = value;
                this.filters.label_status = value == 'true' ? 'Inactive':'';
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
                dealer_name: this.dealer_name
            }
		})

		dialog.afterClosed().subscribe(
			data => {
				if (data) {
					if(data.host.id) {
                        this.filters.host = data.host.id;
                        this.filters.label_host = data.host.name;
                    }
                    this.getLicensesofDealer(1);
				}
			}
		)
	}

    clearFilter() {
        this.filters = {
            admin_licenses: false,
            isactivated: "",
            assigned: "",
            online: "",
            inactive: "",
            activated: "",
            zone:"",
            status:"",
            host:'',
            label_status:"",
            label_zone:"",
            label_dealer: "",
            label_host: "",
            label_admin: "",
        }
        this.sortList('desc')
        this.getLicensesofDealer(1);
    }
}
