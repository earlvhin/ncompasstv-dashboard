import { DatePipe, Location, TitleCasePipe } from '@angular/common'
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Chart } from 'chart.js';
import * as moment from 'moment';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver';
import * as io from 'socket.io-client';
import { API_DEALER } from '../../models/api_dealer.model';
import { API_HOST } from '../../models/api_host.model';
import { API_LICENSE } from '../../models/api_license.model';
import { API_LICENSE_STASTICS } from '../../models/api_license_statistics.model';
import { UI_DEALER_HOST } from '../../models/ui_dealer-host.model';
import { UI_DEALER_LICENSE } from '../../models/ui_dealer-license.model';
import { DEALER_UI_TABLE_ADVERTISERS } from '../../models/ui_table_advertisers.model';
import { UI_ROLE_DEFINITION_TEXT } from '../../models/ui_role-definition.model';
import { AdvertiserService } from '../../services/advertiser-service/advertiser.service';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { HostService } from '../../services/host-service/host.service';
import { LicenseService } from '../../services/license-service/license.service';
import { UserService } from '../../services/user-service/user.service';
import { RoleService } from '../../services/role-service/role.service';
import { environment } from '../../../../environments/environment';
import { SubstringPipe } from '../../pipes/substring.pipe';


@Component({
	selector: 'app-single-dealer',
	templateUrl: './single-dealer.component.html',
	styleUrls: ['./single-dealer.component.scss'],
	providers: [DatePipe, TitleCasePipe, SubstringPipe]
})

export class SingleDealerComponent implements OnInit, OnDestroy {
	advertiser_card: any;
	advertiser_data:any = [];
	advertiser_filtered_data: any = [];
	array_to_delete: any = [];
	combined_data: API_HOST[];
	current_tab = 'hosts';
	dealer: API_DEALER;
	dealer_id: string;
	dealer_loading = true;
	dealer_user_data: any;
	d_desc: string = "Dealer since January 25, 2019";
	d_name: string = "Business Name";
	host_card:any;
	host_data: any = [];
	host_data_api: API_HOST[];
	host_filtered_data: any = [];
	img: string = "assets/media_files/admin-icon.png";
	initial_load = true;
	initial_load_advertiser = true;
	initial_load_charts = true;
	initial_load_license = true;
	license$: Observable<API_LICENSE[]>;
	license_card:any;
	license_count: number;
	license_data: any = [];
	license_data_api: API_LICENSE[];
	license_filtered_data: any = [];
	license_row_slug: string = "host_id";
	license_row_url: string = "/dealer/hosts";
	license_statistics_charts = [];
	license_tbl_row_slug: string = "license_id";
	license_tbl_row_url: string = "/administrator/licenses/";
	licenses_to_export: any = [];
	loading_statistics = { activity: true, status: true, connection: true, screen: true };
	no_advertisers = false;
	no_case: boolean = true;
	no_hosts = false;
	no_licenses = false;
	no_record: boolean = false;
	paging_data: any;
	paging_data_advertiser: any;
	paging_data_license: any;
	pi_updating: boolean = false;
	remote_update_disabled = false;
	remote_reboot_disabled = false;
	search_data: string = "";
	search_data_advertiser: string = "";
	search_data_license: string = "";
	searching = false;
	searching_advertiser = false;
	searching_license = false;
	selected_index: number;
	show_admin_buttons: boolean = false
	single_info: Array<any>;
	sort_column: string = "";
	sort_order: string = "";
	statistics: API_LICENSE_STASTICS;
	subscription: Subscription = new Subscription;
	temp_array: any = [];
	timeout_duration: number;
	timeout_message: string;
	title: string = "The Dealer";
	workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

	_socket: any;

	adv_table_col = [
		'#',
		'Name',
		'Region',
		'State',
		'Status',
		'Assigned User'
	];

	host_table_col = [ 
		'#',
		'Hostname',
		'Address',
		'City',
		'Postal Code',
		'License Count',
		'Status'
	];

	license_table_columns = [
		{ name: 'License Key', sortable: true, column:'LicenseKey', key: 'licenseKey'},
		{ name: 'Type', sortable: false, key: 'screenType'},
		{ name: 'Host', sortable: true, column:'HostName', key: 'hostName'},
		{ name: 'Alias', sortable: true, column:'Alias', key: 'alias'},
		{ name: 'Last Push', sortable: true, column:'ContentsUpdated', key:'contentsUpdated'},
		{ name: 'Last Online', sortable: true, column:'TimeIn', key:'timeIn'},
		{ name: 'Connection Type', sortable: true, column:'InternetType', key:'internetType'},
		{ name: 'Connection Speed', sortable: false, key:'internetSpeed'},
		{ name: 'Anydesk', sortable: true, column:'AnydeskId', key:'anydeskId'},
		{ name: 'Screen', sortable: false, column:'Screen', key:'screenName' },
		{ name: 'Template', sortable: true, column:'TemplateName', key:'templateName'},
		{ name: 'Install Date', sortable: true, column:'InstallDate', key:'installDate'},
		{ name: 'Create Date', sortable: false, key:'dateCreated'},
	];

	constructor(
		private _advertiser: AdvertiserService,
		private _date: DatePipe,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _host: HostService,
		private _license: LicenseService,
		private _location: Location,
		private _params: ActivatedRoute,
		private _role: RoleService,
		private _titlecase: TitleCasePipe,
		private _substring: SubstringPipe,
		private _user: UserService
	) { 
		this._socket = io(environment.socket_server, {
			transports: ['websocket']
		});
	}

	ngOnInit() {
		this._socket.on('connect', () => {
			console.log('#SingleDealerComponent - Connected to Socket Server');
		})
		
		this._socket.on('disconnect', () => {
			console.log('#SingleDealerComponent - Disconnnected to Socket Server');
		})

		if (this._role.get_user_role() == UI_ROLE_DEFINITION_TEXT.administrator) {
			this.show_admin_buttons = true;
		}

		this.subscription.add(
			this._params.paramMap.subscribe(
				() => {
					this.dealer_id = this._params.snapshot.params.data;
					this.getDealerInfo(this.dealer_id);
					this.getDealerAdvertiser(1);
					this.getDealerHost(1);
					this.getLicensesofDealer(1);
					this.getLicenseTotalCount(this.dealer_id);
					this.getAdvertiserTotalCount(this.dealer_id);
					this.getHostTotalCount(this.dealer_id);
					this.adminButton();
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
		// this.subscribeToLicenseSort();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.destroyCharts();
		this._socket.disconnect();
	}

	activateLicense(e): void {
		this.subscription.add(
			this._license.activate_license(e).subscribe(
				() => console.log('License is Activated -', e),
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
				localStorage.removeItem(`${this.dealer_id}`);
			} else {
				this.remote_update_disabled = true;
				this.remote_reboot_disabled = true;
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
		let count = 1;
		return data.map(
			i => {
				return new DEALER_UI_TABLE_ADVERTISERS(
					{ value: i.id, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: i.name, link: '/administrator/advertisers/' + i.id, editable: false, hidden: false},
					{ value: i.region ? i.region : '--', link: null , editable: false, hidden: false},
					{ value: i.state, link: null , editable: false, hidden: false},
					{ value: i.status, link: null , editable: false, hidden: false},
					{ value: i.firstName != null && i.lastName != null ? i.firstName + " " + i.lastName: 'Unassigned', link: null , editable: false, hidden: false},
				)
			}
		);
	}

	deactivateLicense(e): void {
		this.subscription.add(
			this._license.deactivate_license(e).subscribe(
				() => console.log('License is Deactivated -', e),
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
						basis_label: 'Advertisers',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive'
					}
				},
				error => console.log('Error retrieving total advertiser count', error)
			)
		);
	}

	getDealerAdvertiser(page): void {
		this.searching_advertiser = true;
		this.subscription.add(
			this._advertiser.get_advertisers_by_dealer_id(this.dealer_id, page, this.search_data_advertiser).subscribe(
				data => {
					this.initial_load_advertiser = false;
					this.searching_advertiser = false;

					if (!data.message) {
						this.advertiser_data = this.advertiser_mapToUI(data.advertisers);
						this.advertiser_filtered_data = this.advertiser_mapToUI(data.advertisers);
					} else {
						if (this.search_data_advertiser == "") {
							this.no_advertisers = true;
						}
						this.advertiser_data=[];
						this.advertiser_filtered_data = [];
					}

					this.paging_data_advertiser = data.paging;
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
			this._host.get_host_by_dealer_id(this.dealer_id, page, this.search_data).subscribe(
				data => {
					this.initial_load = false;
					this.searching = false;
					if(!data.message) {
						data.hosts.map (
							i => {
								var x = Object.assign({},i.host,i.hostStats);
								this.temp_array.push(x)
							}
						)
						this.host_data = this.hostTable_mapToUI(this.temp_array);
						this.host_filtered_data = this.hostTable_mapToUI(this.temp_array);
					} else {
						if(this.search_data == "") {
							this.no_hosts = true;
						}
						this.host_data=[];
						this.host_filtered_data = [];
					}
					this.paging_data = data.paging;
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
					this.getDealerUserData(response.userId);
				},
				error => console.log('Error retrieving dealer info', error)
			)
		);
	}

	getDealerUserData(id): void {
		this.subscription.add(
			this._user.get_user_alldata_by_id(id).subscribe(
				data => this.dealer_user_data = Object.assign({},data.user, data.dealer[0]),
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
						basis_label: 'Hosts',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive'
					}
				},
				error => console.log('Error retrieving total host count', error)
			)
		);
	}

	getLicensesofDealer(page: number, reload = false): void {
		this.searching_license = true;
		this.subscription.add(
			this._license.sort_license_by_dealer_id(this.dealer_id, page, this.search_data_license, this.sort_column, this.sort_order).subscribe(
				(response: { licenses, paging, statistics, message? }) => {	
					if (response.message) {
						if (this.search_data_license == "") {
							this.no_licenses = true;
						}
						this.license_data = [];
						this.license_filtered_data = [];
					} else {
						this.license_data_api = response.licenses;
						this.statistics = response.statistics;
						if (this.isLicenseTabOnLoad && this.initial_load_charts) {
							setTimeout(() => {
								this.generateCharts();
								Object.entries(Chart.instances).forEach(entries => {
									entries.forEach(chartData => {
										if (typeof chartData === 'object') this.license_statistics_charts.push(chartData);
									})
								});
			
							}, 1000);
						}

						if (reload) this.updateCharts();
						const mappedLicenses = this.licenseTable_mapToUI(this.license_data_api);
						this.license_data = mappedLicenses;
						this.license_filtered_data = mappedLicenses;
						this.paging_data_license = response.paging;
					}

					this.initial_load_license = false;
					this.searching_license = false;
				},
				error => {
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
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						online_value: data.totalOnline,
						online_value_label: 'Online',
						offline_value: data.totalOffline,
						offline_value_label: 'Offline'
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
		let count = 1;
		return data.map(
			(h: any) => {
				return new UI_DEALER_HOST(
					{ value: h.hostId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: h.name, link: '/administrator/hosts/' + h.hostId, editable: false, hidden: false},
					{ value: h.address, link: null, editable: false, hidden: false},
					{ value: h.city, link: null, editable: false, hidden: false},
					{ value: h.postalCode, link: null, editable: false, hidden: false},
					{ value: h.totalLicenses, link: null, editable: false, hidden: false},
					{ value: h.status, link: null, editable: false, hidden: false},
					{ value: this._date.transform(h.installDate), link: null, editable: false, hidden: false},	
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
		let count = 1;
		return data.map(
			(l: any) => {
				const table = new UI_DEALER_LICENSE(
					{ value: l.license.licenseId, link: null , editable: false, hidden: true, key: true, table: 'license'},
					{ value: l.license.licenseKey, link: '/administrator/licenses/' + l.license.licenseId, editable: false, hidden: false, status: true},
					{ value: l.screenType && l.screenType.name ? this._titlecase.transform(l.screenType.name) : '--', editable: false, hidden: false },
					{ value: l.host ? l.host.name : '--', link: l.host ? '/administrator/hosts/' + l.host.hostId : null, editable: false, hidden: false },
					{ value: l.license.alias ? l.license.alias : '--', link: '/administrator/licenses/' + l.license.licenseId, editable: true, label: 'License Alias', id: l.license.licenseId, hidden: false },
					{ value: l.license.contentsUpdated ? l.license.contentsUpdated : '--', label: 'Last Push', hidden: false },
					{ value: l.license.timeIn ? this._date.transform(l.license.timeIn, 'MMM dd, y h:mm a') : '--', hidden: false },
					{ value: l.license.internetType ? this.getInternetType(l.license.internetType) : '--', link: null, editable: false, hidden: false },
					{ value: l.license.internetSpeed ? (l.license.internetSpeed == 'Fast' ? 'Good' : l.license.internetSpeed) : '--', link: null, editable: false, hidden: false },
					{ value: l.license.anydeskId ? l.license.anydeskId : '--', link: null, editable: false, hidden: false },
					{ value: l.screen.templateName ? l.screen.templateName : '--', link: null, editable: false, hidden: false },
					{ value: l.license.installDate && !l.license.installDate.includes('Invalid') ? this._date.transform(l.license.installDate, 'MMM dd, y') : '--', link: null, editable: true, label: 'Install Date', hidden: false, id: l.license.licenseId },
					{ value: l.license.createDate ? this._date.transform(l.license.dateCreated, 'MMM dd, y') : '--', link: null, editable: false, hidden: false },
					{ value: l.license.isActivated, link: null , editable: false, hidden: true },
					{ value: l.host ? true : false, link: null , editable: false, hidden: true },
					{ value: l.license.piStatus, link: null , editable: false, hidden: true },
					{ value: l.screen.screenName ? l.screen.screenName : '--', link: `/administrator/screens/${l.screen.screenId}` , editable: false },
				);
				return table;
			}
		);
	}

	onSelectTab(event: { index: number }): void {
		switch (event.index) {
			case 1:
				this.current_tab = 'advertisers';
				break;
			case 2:
				this.current_tab = 'licenses';
				if (!this.no_licenses && this.initial_load_charts) {
					setTimeout(() => {
						this.generateCharts();
						Object.entries(Chart.instances).forEach(entries => {
							entries.forEach(chartData => {
								if (typeof chartData === 'object') this.license_statistics_charts.push(chartData);
							})
						});
	
					}, 1000);	
				}
				break;
			default:
				this.current_tab = 'hosts';
		}

	}

	sortList(order): void {
		var filter = {
			column: 'PiStatus',
			order: order
		}
		this.getColumnsAndOrder(filter)
		this.getLicensesofDealer(1);
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
		this.getLicensesofDealer(1, true);
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
					this.license_data_api.forEach(
						i => {
							this._socket.emit('D_system_update_by_license', i.license.licenseId);
						}
					)
					break;
				case 'reboot':
					this.license_data_api.forEach(
						i => {
							this._socket.emit('D_pi_restart', i.license.licenseId);
						}
					)
					break;
				case 'reboot_player':
					this.license_data_api.forEach(
						i => {
							this._socket.emit('D_player_restart', i.license.licenseId);
						}
					)
					break;
				case 'license_delete':
					this.subscription.add(
						this._license.delete_license(this.array_to_delete).subscribe(
							data => {
								this.reloadLicense();
							}
						)
					);
					break;
				case 'upgrade_to_v2': 
					this.license_data_api.forEach(
						i => {
							this._socket.emit('D_upgrade_to_v2_by_license', i.license.licenseId);
						}
					)
					break;
				default:
			}
			const now = moment().format('MMMM Do YYYY, h:mm:ss a');
			localStorage.setItem(`${this.dealer_id}`, now);
			this.timeout_duration = 0;
			this.timeout_message = `Will be available after ${10 - this.timeout_duration} minutes`;
			this.remote_reboot_disabled = true;
			this.remote_update_disabled = true;
		});
	}

	private get isLicenseTabOnLoad(): boolean {
		return this._location.path().includes('tab=2');
	}

	private compare(a: any, b: any, type = 'asc'): number {
		if (a === b) return 0;
		if (!a) return 1;
		if (!b) return -1;
		if (typeof a === 'string') a = a.toLowerCase();
		if (typeof b === 'string') b = b.toLowerCase();
		if (type === 'asc') return a < b ? -1 : 1;
		return a < b ? 1 : -1;
	}

	private destroyCharts(): void {
		if (this.license_statistics_charts.length <= 0) return;
		this.license_statistics_charts.forEach(chart => chart.destroy());
	}

	private generateCharts(): void {
		this.initial_load_charts = false;
		this.generatePieChart('activity');
		this.generatePieChart('connection');
		this.generatePieChart('screen');
		this.generatePieChart('status');
	}

	private generatePieChart(type: string): void {
		if (!type) return;
		type = type.toLowerCase();
		let canvasId: string;
		let data: number[];
		let labels: string[];
		let title: string;

		switch (type) {
			case 'activity':
				const { activityActive, activityInactive } = this.statistics;
				canvasId = 'activityStatistics';
				data = [ parseInt(activityActive), parseInt(activityInactive) ];
				labels = [ `Active: ${activityActive}`, `Inactive: ${activityInactive}` ];
				title = 'Activity';
				this.loading_statistics.activity = false;
				break;

			case 'connection':
				const { connectionTypeLan, connectionTypeWifi } = this.statistics;
				canvasId = 'connectionStatistics';
				data = [ parseInt(connectionTypeLan), parseInt(connectionTypeWifi) ];
				labels = [ `LAN: ${connectionTypeLan}`, `WiFi: ${connectionTypeWifi}` ];
				title = 'Connection Type';
				this.loading_statistics.connection = false;
				break;

			case 'screen':
				const { screenTypeAd, screenTypeMenu, screenTypeClosed } = this.statistics;
				canvasId = 'screenStatistics';
				data = [ parseInt(screenTypeAd), parseInt(screenTypeMenu), parseInt(screenTypeClosed) ];
				labels = [ `Ad: ${screenTypeAd}`, `Menu: ${screenTypeMenu}`, `Closed: ${screenTypeClosed}` ]
				title = 'Screen Type';
				this.loading_statistics.screen = false;
				break;

			default:
				const { statusOffline, statusOnline } = this.statistics;
				canvasId = 'statusStatistics';
				data = [ parseInt(statusOnline), parseInt(statusOffline) ];
				labels = [ `Online: ${statusOnline}`, `Offline: ${statusOffline}` ];
				title = 'Status';
				this.loading_statistics.status = false;

		}

		const canvas = document.getElementById(canvasId);
		if (!canvas) return;

		new Chart(canvas, {
			type: 'doughnut',
			data: {
				labels: labels,
				datasets: [{
					data: data,
					backgroundColor: [ 'rgba(91, 155, 213, 0.8)', 'rgba(237, 125, 49, 0.8)', ],
					borderColor: [ 'rgba(91, 155, 213, 1)', 'rgba(237, 125, 49, 1)', ],
				}],
			},
			options: {
				tooltips: false,
				title: { text: title, display: true },
				responsive: true,
				maintainAspectRatio: false
			}
		});

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

	private updateCharts(): void {
		setTimeout(() => {
			const config = { duration: 800, easing: 'easeOutBounce' };
			const activityChart = this.license_statistics_charts.filter(chart => chart.canvas.id === 'activityStatistics')[0];
			const connectionChart = this.license_statistics_charts.filter(chart => chart.canvas.id === 'connectionStatistics')[0];
			const screenChart = this.license_statistics_charts.filter(chart => chart.canvas.id === 'screenStatistics')[0];
			const statusChart = this.license_statistics_charts.filter(chart => chart.canvas.id === 'statusStatistics')[0];
	
			const { activityActive, activityInactive, connectionTypeLan, connectionTypeWifi, screenTypeAd, screenTypeClosed, screenTypeMenu, 
				statusOffline, statusOnline } = this.statistics;
	
			activityChart.data.labels = [ `Active: ${activityActive}`, `Inactive: ${activityInactive}` ];
			activityChart.data.datasets[0].data = [ parseInt(activityActive), parseInt(activityInactive) ];
	
			connectionChart.data.labels = [ `LAN: ${connectionTypeLan}`, `WiFi: ${connectionTypeWifi}` ];
			connectionChart.data.datasets[0].data = [ parseInt(connectionTypeLan), parseInt(connectionTypeWifi) ];
	
			screenChart.data.labels = [ `Ad: ${screenTypeAd}`, `Menu: ${screenTypeMenu}`, `Closed: ${screenTypeClosed}` ];
			screenChart.data.datasets[0].data = [ parseInt(screenTypeAd), parseInt(screenTypeMenu), parseInt(screenTypeClosed) ];
	
			statusChart.data.labels = [ `Online: ${statusOnline}`, `Offline: ${statusOffline}` ];
			statusChart.data.datasets[0].data = [ parseInt(statusOnline), parseInt(statusOffline) ];
				
			activityChart.update(config);
			connectionChart.update(config);
			screenChart.update(config);
			statusChart.update(config);
		}, 1000);
	}

	getMultipleDeleteData(data) {
		this.array_to_delete = data;
	}	

	multipleDeleteLicense() {
		this.warningModal('warning', 'Delete Licenses', 'Are you sure you want to delete ' + this.array_to_delete.length + ' licenses?','','license_delete', this.array_to_delete)
	}

	// Update Player to Version 2 Trigger
	updateToVersion2(): void {
		this.warningModal('warning', 'Upgrade Players to Version 2', 'Upgrade players with licenses below  to version 2?', 'Click OK to apply updates to licences below', 'upgrade_to_v2')
	}

	getColumnsAndOrder(data) {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.getLicensesofDealer(1);
	}

	getDataForExport(id): void {
		this.subscription.add(
			this._license.get_license_to_export(id).subscribe(
				data => {
					const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
					this.licenses_to_export = data.licenses;
					this.licenses_to_export.forEach((item, i) => {
						this.modifyItem(item);
						this.worksheet.addRow(item).font ={
							bold: false
						};
					});
					let rowIndex = 1;
					for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
						this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
					}
					this.workbook.xlsx.writeBuffer()
						.then((file: any) => {
							const blob = new Blob([file], { type: EXCEL_TYPE });
							const filename = this.dealer_user_data.businessName	+ '.xlsx';
							FileSaver.saveAs(blob, filename);
						}
					);
					this.workbook_generation = false;
				}
			)
		);
	}

	modifyItem(item) {
		item.screenType =  this._titlecase.transform(item.screenType);
		item.contentsUpdated = this._date.transform(item.contentsUpdated, 'MMM dd, yyyy h:mm a');
		item.timeIn = item.timeIn ? this._date.transform(item.timeIn, 'MMM dd, yyyy h:mm a'): '';
		item.installDate = this._date.transform(item.installDate, 'MMM dd, yyyy h:mm a');
		item.createDate = this._date.transform(item.createDate, 'MMM dd, yyyy');
		item.internetType = this.getInternetType(item.internetType);
		item.internetSpeed = item.internetSpeed == 'Fast' ? 'Good' : item.internetSpeed;
		item.isActivated = item.isActivated == 0 ? 'No' : 'Yes'
	}

	exportTable() {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Excel.Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('Licenses');
		Object.keys(this.license_table_columns).forEach(key => {
			if(this.license_table_columns[key].name) {
				header.push({ header: this.license_table_columns[key].name, key: this.license_table_columns[key].key, width: 30, style: { font: { name: 'Arial', bold: true}}});
			}
		});
		header.push({ header: 'Activated', key: 'isActivated', width: 30, style: { font: { name: 'Arial', bold: true, color: '8EC641' }}});
		this.worksheet.columns = header;
		this.getDataForExport(this.dealer_id);		
	}
}
