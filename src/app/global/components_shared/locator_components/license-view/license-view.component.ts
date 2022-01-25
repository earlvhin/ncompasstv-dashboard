import { Component, OnDestroy, OnInit } from '@angular/core';
import { AgmInfoWindow } from '@agm/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_HOST } from '../../../models/api_host.model';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { API_DEALER_LICENSE, API_LICENSE, API_LICENSE_PROPS } from '../../../models/api_license.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { UI_DEALER_LOCATOR_EXPORT, UI_HOST_LOCATOR_MARKER_DEALER_MODE } from 'src/app/global/models/ui_host-locator.model';
import { HostService } from '../../../services/host-service/host.service';

@Component({
  selector: 'app-license-view',
  templateUrl: './license-view.component.html',
  styleUrls: ['./license-view.component.scss']
})
export class LicenseViewComponent implements OnInit {
	current_host_id_selected = '';
	clicked_marker_id: string;
	dealers: API_DEALER[];
	dealer_licenses_data: Array<any> = [];
	expansion_id: string;
	host_licenses: API_LICENSE_PROPS[] = [];
	is_search: boolean = false;
	lat: number = 39.7395247;
	lng: number = -105.1524133;
	loading_data: boolean = true;
	loading_licenses: boolean = true;
	loading_license_count: boolean = false;
	loading_search: boolean = false;
	location_selected: boolean = false;
	map_marker: UI_HOST_LOCATOR_MARKER_DEALER_MODE[];
	selected_dealer: API_DEALER;
	selected_dealer_hosts: API_HOST[];
	unfiltered_dealer_hosts: API_HOST[];
	unfiltered_licenses: Array<any> = [];
	storehours: any;
	paging: any;
	previous_marker: AgmInfoWindow;
	filterStatus: any;
	filterLabelStatus: any;
	selected_licenses: Array<any> = [];
	filtered_licenses: Array<any> = [];
	search_license: any;
	search_license_id: any;
	selected_hosts: Array<any> = [];
	isFiltered: any = false;
	online_licenses: number = 0;
	offline_licenses: number = 0;
	host_online_licenses: any;
	host_offline_licenses: any;
	exported_map_marker: UI_DEALER_LOCATOR_EXPORT[];
	markStoreHours: any;
  	is_dealer: any;
	businessName: any;
	search_keyword: any = false;
	license_page_count: number = 1;


	labelOptions = {
		color: 'black',
		fontFamily: '',
		fontSize: '14px',
		fontWeight: 'bold',
		text: "some text"
	};

  	protected _unsubscribe: Subject<void> = new Subject<void>();

  	constructor(private _auth: AuthService,
    	private _host: HostService,
		private _license: LicenseService) { }

  	ngOnInit() {
    this.online_licenses = 0;
	this.offline_licenses = 0;
    this.selected_dealer_hosts = [];
    this.selected_licenses = [];
	this.dealer_licenses_data = [];
    this.getDealerHosts(1);
    this.getDealerLicenses(this.license_page_count++);
  	}

  	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onExpandHost(hostId: string): void {
		if (hostId === this.current_host_id_selected) return;
		this.host_licenses = [];
		this.expansion_id = hostId;
		this.clicked_marker_id = hostId;
		this.current_host_id_selected = hostId;
		this.getLicenseByHost(hostId);
	}

	onMarkerClick(hostId: string, window: AgmInfoWindow): void {
		this.getLicenseByHost(hostId)
		this.clicked_marker_id = hostId;
		this.expansion_id = hostId;
		if (this.previous_marker) this.previous_marker.close();
		this.previous_marker = window;
	}

	onSelectLicense(id: string): void {
		this.search_keyword = true;
		this.online_licenses = 0;
		this.offline_licenses = 0;
		this.search_license = this.selected_licenses.filter(license => license.licenseId === id);
		this.search_license_id = id;
		this.selected_licenses = this.search_license;
		this.selected_hosts = this.search_license.map(t => t.hostId);
		this.selected_dealer_hosts = this.selected_dealer_hosts.filter(x => this.selected_hosts.includes(x.hostId))
		this.selected_dealer_hosts.forEach(x => {
			this.getLicenseByHost(x.hostId);
		});
		this.selected_licenses.forEach(
			license => {
				if (license.piStatus == 1) this.online_licenses += 1;
			}
		);

		this.offline_licenses = this.selected_licenses.length - this.online_licenses;
		this.selected_dealer_hosts.forEach(x => {
			x.licenses = [];
			this.selected_licenses.forEach((license :API_LICENSE_PROPS) => {
				if(license.hostId === x.hostId){
					let selectedLicense = new API_LICENSE;
					selectedLicense.license = license;
					x.licenses.push(selectedLicense);
				}
				});
			});

		this.map_marker = this.mapMarkersToUI(this.selected_dealer_hosts, this.selected_licenses);
		this.selected_dealer_hosts.forEach(x => {x.icon_url = this.map_marker.filter(y => y.hostId === x.hostId)[0].icon_url});
		if(this.isFiltered)
		{
			this.filterDealerHosts(this.filterStatus);
		}
	}

	searchBoxTrigger(event: { is_search: boolean, page: number, no_keyword: boolean}): void {
		this.is_search = event.is_search;
		if(event.no_keyword){
			this.dealer_licenses_data = [];
			this.selected_licenses = [];
			this.selected_dealer_hosts = [];
			this.license_page_count = 1;
			this.clicked_marker_id = "";
			this.expansion_id = "";
			this.getDealerHosts(event.page);
			this.search_keyword = false;
			this.search_license = undefined;
		}
    	this.getDealerLicenses(this.license_page_count++);
	}

	searchData(key: string): void {
		this.loading_search = true;
		const currentDealerId = this.currentUser.roleInfo.dealerId;

		this._license.search_license(key)
		.pipe(takeUntil(this._unsubscribe))
				.subscribe((response: any) => {
			if(response){
				const { licenses } = response;

				if (licenses.length <= 0) {
					this.dealer_licenses_data = [];
					return;
				}
				const dealer_license: API_DEALER_LICENSE[] = licenses;
				this.dealer_licenses_data = [];
				
				dealer_license.map((h:any) => {
				if(h.dealerId === currentDealerId){
					let dealerLicense = new API_DEALER_LICENSE(h.dealerId, h.hostId, h.licenseAlias === null ? h.licenseKey : h.licenseAlias,
														h.licenseId, h.licenseKey)
					this.dealer_licenses_data.push(dealerLicense);
				}
				});
			}
		},
      	error => console.log('Error searching license', error)
      	)
     	 .add(() => this.loading_search = false);
	}

	setLink(licenseId: string) {
		return [`/${this.currentRole}/licenses/${licenseId}`];
	}

	private get currentRole() {
		return this._auth.current_role;
	}

	private getDealerHosts(page: number): void {
    const currentDealerId = this.currentUser.roleInfo.dealerId;
	this.businessName = this.currentUser.roleInfo.businessName;
	this.selected_dealer_hosts = [];
	this._host.get_host_by_dealer_id(currentDealerId, page, '')
		.pipe(takeUntil(this._unsubscribe))
		.subscribe(
			(response:any ) => {

		// no records found
		if (response.message) return;

		const { paging } = response;
		const { entities } = paging;
		const hosts: API_HOST[] = entities;

		this.paging = paging;
		hosts.map(
			host => {
				this.selected_dealer_hosts.push(host);
			}
		);
	
		this.selected_dealer_hosts.forEach(x => {
		x.storeHours ? x.parsedStoreHours = JSON.parse(x.storeHours) : x.parsedStoreHours = "-";
		x.latitude ? x.latitude = parseFloat(x.latitude).toFixed(5) : "-";
		x.longitude ? x.longitude = parseFloat(x.longitude).toFixed(5) : "-";
			});
		
		if(this.selected_licenses.length > 0){
			this.map_marker = this.mapMarkersToUI(this.selected_dealer_hosts, this.selected_licenses);
			this.selected_dealer_hosts.forEach(x => {x.icon_url = this.map_marker.filter(y => y.hostId === x.hostId)[0].icon_url});
		}
		},
			error => console.log('Error retrieving dealer with hosts', error)
		).add(() => {
				this.loading_licenses = false;
			});;;


	}

	private getDealerLicenses(page: number): void {
		if (page > 1) this.loading_data = true;
			else this.loading_search = true;

	    this.online_licenses = 0;
		this.offline_licenses = 0;
		const currentDealerId = this.currentUser.roleInfo.dealerId;
		this._license.get_license_by_dealer_id(currentDealerId, page, '')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
				// Save page count returned from API
			if (!data.message) {
			
			const page_count = data.paging.pages;

			//Dealer licenses
			const dealerLicenses = data.paging.entities;
			dealerLicenses.forEach(
				license => {
					if(license.hostId !== null && license.hostId !== ""){
						this.selected_licenses.push(license);
					}
			});
			
			this.selected_licenses.forEach(
				license => {
					if (license.piStatus == 1) this.online_licenses += 1;
			});

			dealerLicenses.map((h: any) => {
				let dealerLicense = new API_DEALER_LICENSE(h.dealerId, h.hostId, h.alias === null ? h.licenseKey : h.alias,
														h.licenseId, h.licenseKey)
				this.dealer_licenses_data.push(dealerLicense);
				}
			);

			this.loading_data = false;
			
			this.offline_licenses = this.selected_licenses.length - this.online_licenses;

			this.selected_dealer_hosts.forEach(x => {
			x.licenses = [];
			this.selected_licenses.forEach((license :API_LICENSE_PROPS) => {
				if(license.hostId === x.hostId){
					let selectedLicense = new API_LICENSE;
					selectedLicense.license = license;
					x.licenses.push(selectedLicense);
				}
				});
			});

			this.unfiltered_dealer_hosts = this.selected_dealer_hosts;
			this.unfiltered_licenses = this.selected_licenses;
			if(this.selected_dealer_hosts.length > 0){
				this.map_marker = this.mapMarkersToUI(this.selected_dealer_hosts, this.selected_licenses);
				this.selected_dealer_hosts.forEach(x => {x.icon_url = this.map_marker.filter(y => y.hostId === x.hostId)[0].icon_url});
			}

			this.location_selected = true;
			if(this.isFiltered){
				this.filterDealerHosts(this.filterStatus);
			}
			
			if (this.license_page_count <= page_count) {
				this.getDealerLicenses(this.license_page_count++)
			}
			} else {
				// Hide Spinner on UI
				this.loading_data = false;
			}			
			},
				error => console.log('Error retrieving licenses by dealer id', error)
			).add(() => {
				this.loading_search = false;
				this.loading_licenses = false;
				//this.loading_data = false;
			});;
	}

	private getLicenseByHost(id: string): void {
		this.loading_license_count = true;

		this._license.get_licenses_by_host_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: any) => {

					let online = 0;
					if (response.message) {
						this.host_licenses = [];
						return;
					}

					const licenses: API_LICENSE_PROPS[] = response;
					this.host_licenses = response;

					if(this.filterStatus !== undefined && this.filterStatus !== ""){
						this.host_licenses = this.host_licenses.filter(x => x.piStatus === this.filterStatus);
					}

					if(this.search_license !== undefined){
						this.host_licenses = this.host_licenses.filter(x => x.licenseId === this.search_license_id);
					}

					licenses.forEach(
						license => {
							if (license.piStatus == 1) online += 1;
						}
					);
					this.host_online_licenses = online;
					this.host_offline_licenses = licenses.length - online;
				},
				error => console.log('Error retrieving license by host ID', error)
			)
			.add(() => setTimeout(() => this.loading_license_count = false, 1000));
	}

	private mapMarkersToUI(hosts: any[], licenses: any[]): any[] {
		if (hosts) {
			return hosts.map(
				(h: API_HOST) => {
					let icon_url;
					let online: any = 0;
					let license_online_percentage;

					const host_license = licenses.filter((license :API_LICENSE_PROPS) => license.hostId === h.hostId)
	
					if (host_license.length > 0) {
						online = host_license.filter((i: API_LICENSE_PROPS) => i.piStatus == 1);
						license_online_percentage = (online.length / host_license.length) * 100;
					}
		
					if (license_online_percentage == 100) {
						icon_url = 'assets/media-files/markers/online_all.png';
					} else if(license_online_percentage >= 51 && license_online_percentage < 100) {
						icon_url = 'assets/media-files/markers/online_many.png';
					} else if (license_online_percentage < 51 && license_online_percentage > 0) {
						icon_url = 'assets/media-files/markers/online_few.png';
					} else {
						icon_url = 'assets/media-files/markers/offline.png';
					}
	
					return new UI_HOST_LOCATOR_MARKER_DEALER_MODE(
						h.hostId,
						h.name,
						h.latitude,
						h.longitude,
						license_online_percentage,
						icon_url,
						h.address,
						h.category,
						h.parsedStoreHours,
						h.state,
						h.postalCode,
						h.city,
						h.dealerId
					);
				}
			)
		}
	}

	public filterDealerHosts(value){
		this.online_licenses = 0;
		this.offline_licenses = 0;
		this.isFiltered = true;
		this.filterStatus = value;
		this.filterLabelStatus = value == 1? 'Online': 'Offline';
		this.selected_dealer_hosts = this.unfiltered_dealer_hosts;
		this.selected_licenses = this.unfiltered_licenses;
		this.selected_dealer_hosts.forEach(x => {
			this.getLicenseByHost(x.hostId);
		});
		this.filtered_licenses = this.selected_licenses.filter(x => x.piStatus === value);
		this.selected_licenses = this.filtered_licenses;
		if(value == 1){
			this.online_licenses = this.filtered_licenses.length;
		}
		else{
			this.offline_licenses = this.filtered_licenses.length;
		}

		this.selected_hosts = this.filtered_licenses.map(t => t.hostId);
		this.selected_dealer_hosts = this.selected_dealer_hosts.filter(x => this.selected_hosts.includes(x.hostId))
		this.selected_dealer_hosts.forEach(x => {
		 	this.getLicenseByHost(x.hostId);
		});
		this.map_marker = this.mapMarkersToUI(this.selected_dealer_hosts, this.filtered_licenses);
	}

	public clearFilter(){
		this.isFiltered = false;
		this.filterStatus = "";
		this.filterLabelStatus = "";
		this.selected_dealer_hosts = this.unfiltered_dealer_hosts;
		this.selected_licenses = this.unfiltered_licenses;
		this.selected_dealer_hosts.forEach(x => {
		 	this.getLicenseByHost(x.hostId);
		 });
		this.map_marker = this.mapMarkersToUI(this.selected_dealer_hosts, this.selected_licenses);
		this.online_licenses = 0;
		this.offline_licenses = 0;
		this.selected_licenses.forEach(
			license => {
				if (license.piStatus == 1) this.online_licenses += 1;
			}
		);

		this.offline_licenses = this.selected_licenses.length - this.online_licenses;
	}

	exportToCSV()
	{
		const replacer = (key, value) => value === null ? '' : value;
		this.exported_map_marker = [];
		let isStatus = true;
		this.map_marker.forEach(
			license => {
				const data = [...license.storeHours];
				this.markStoreHours = "";
				data.forEach(obj => {
					Object.entries(obj).forEach(([key,value]) => {
						if(key === 'day'){
							this.markStoreHours += value;
						}

						if(key === 'status'){
							if(value){
								isStatus = true;
							}
							else {
								isStatus = false;
							}
						}

						if(key === 'periods')
						{
							const periods = [...value];
							periods.forEach(x => {
								Object.entries(x).forEach(([key,value]) => {
									if(key === 'open'){
										if(value !== ""){
											this.markStoreHours += " (" + value + " - ";
										}
										else{
											if(isStatus){
												this.markStoreHours += " ( Open 24 hours ) ";
											}
											else{
												this.markStoreHours += " ( Closed ) ";
											}
										}
									}
									if(key === 'close'){
										if(value !== ""){
											this.markStoreHours += value + ") | "
										}
										else {
											this.markStoreHours += value + " | "
										}
									}
								});
							});
						}
				
					});
				});
				let locatorAddress = license.address + ', ' + license.city + ', ' + license.state + ' ' + license.postalCode;
				let businessName = this.currentUser.roleInfo.businessName;
				let marker = new UI_DEALER_LOCATOR_EXPORT(businessName, license.name, locatorAddress, license.category, this.markStoreHours,
															license.latitude, license.longitude);
				this.exported_map_marker.push(marker);
			}
		);

		const header = Object.keys(this.exported_map_marker[0]);
		let csv = this.exported_map_marker.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
		csv.unshift(header.join(','));
		let csvArray = csv.join('\r\n');

		var blob = new Blob([csvArray], {type: 'text/csv' });
		let fileName = this.businessName + "_MapLocator.csv";
		saveAs(blob, fileName);
	}

  	protected get currentUser() {
		return this._auth.current_user_value;
	}
}
