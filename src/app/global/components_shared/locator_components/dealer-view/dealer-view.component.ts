import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AgmInfoWindow } from '@agm/core';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

import { API_HOST } from '../../../models/api_host.model';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { API_LICENSE, API_LICENSE_PROPS } from '../../../models/api_license.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { UI_DEALER_LOCATOR_EXPORT, UI_HOST_LOCATOR_MARKER_DEALER_MODE } from 'src/app/global/models/ui_host-locator.model';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSelect } from '@angular/material';

@Component({
  selector: 'app-dealer-view',
  templateUrl: './dealer-view.component.html',
  styleUrls: ['./dealer-view.component.scss']
})
export class DealerViewComponent implements OnInit, OnDestroy {
	@ViewChild('dealerMultiSelect', { static: false }) dealerMultiSelect: MatSelect;
	current_host_id_selected = '';
	clicked_marker_id: string;
	clicked_dealer_id: string;
	dealers: API_DEALER[];
	filteredDealers = new ReplaySubject<API_DEALER[]>(1);
	dealers_data: Array<any> = [];
	expansion_id: string;
	host_licenses: API_LICENSE_PROPS[] = [];
	is_search: boolean = false;
	lat: number = 39.7395247;
	license_card:any;
	lng: number = -105.1524133;
	loading_data: boolean = true;
	loading_hosts: boolean = true;
	loading_license_count: boolean = false;
	loading_search: boolean = false;
	location_selected: boolean = false;
	map_marker: UI_HOST_LOCATOR_MARKER_DEALER_MODE[];
	selected_dealer: API_DEALER[];
	unfiltered_selected_dealer: API_DEALER[];
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
	selected_hosts: Array<any> = [];
	isFiltered: any = false;
	online_licenses: number = 0;
	offline_licenses: number = 0;
	host_online_licenses: any;
	host_offline_licenses: any;
	exported_map_marker: UI_DEALER_LOCATOR_EXPORT[];
	markStoreHours: any;
	form = this._form_builder.group({ selectedDealers: [ [], Validators.required ]});
	selectedDealersControl = this.form.get('selectedDealers');
	dealerFilterControl = new FormControl(null);

	labelOptions = {
		color: 'black',
		fontFamily: '',
		fontSize: '14px',
		fontWeight: 'bold',
		text: "some text"
	};

	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _license: LicenseService,
		private _form_builder: FormBuilder,
	) { }

	ngOnInit() {
		this.getDealers(1);
		this.online_licenses = 0;
		this.offline_licenses = 0;
		this.subscribeToDealerSearch();

        this.form.valueChanges.subscribe(() => {
            if (!this.form.invalid && !this.isFiltered) {
                this.onSubmit()
            }
        })
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

	onMarkerClick(hostId: string, dealerId: string, window: AgmInfoWindow): void {
		this.getLicenseByHost(hostId);
		this.clicked_dealer_id = dealerId;
		this.clicked_marker_id = hostId;
		this.expansion_id = hostId;
		if (this.previous_marker) this.previous_marker.close();
		this.previous_marker = window;
	}

	searchBoxTrigger(event: { is_search: boolean, page: number }): void {
		this.is_search = event.is_search;
		this.getDealers(event.page);
	}

	searchData(key: string): void {
		this.loading_search = true;
			
		this._dealer.get_search_dealer_with_host(key)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { dealers: API_DEALER[], paging: { entities: any[] }}) => {

					const { dealers, paging } = response;
					const { entities } = paging;

					this.paging = paging;

					if (entities.length <= 0) {
						this.dealers_data = [];					
						return;
					}

					this.dealers_data = dealers;
					const merged = this.selectedDealersControl.value.concat(dealers);
					const unique = merged.filter((dealer, index, merged) => merged.findIndex(mergedDealer => (mergedDealer.dealerId === dealer.dealerId)) === index);
					this.dealers = unique;
					this.filteredDealers.next(unique);
				},
				error => console.log('Error searching dealer with host', error)
			)
			.add(() => this.loading_search = false);

	}

	setLink(licenseId: string) {
		return [`/${this.currentRole}/licenses/${licenseId}`];
	}

	private get currentRole() {
		return this._auth.current_role;
	}

	private getDealers(page: number): void {

		if (page > 1) this.loading_data = true;
		else this.loading_search = true;

		this._dealer.get_dealers_with_host(page, '')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { dealers: API_DEALER[], paging: { entities: any[] }}) => {
					const { dealers, paging } = response;
					this.paging = paging;
					const merged = this.selectedDealersControl.value.concat(dealers);
					const unique = merged.filter((dealer, index, merged) => merged.findIndex(mergedDealer => (mergedDealer.dealerId === dealer.dealerId)) === index);
					this.dealers = unique;
					this.filteredDealers.next(unique);
					this.dealers_data = dealers;
					this.loading_data = false;
				},
				error => console.log('Error retrieving dealers with host', error)
			)
			.add(() => {
				this.loading_search = false;
				this.loading_hosts = false;
				this.loading_data = false;
			});
	}

	private getLicenseByHost(id: string): void {
		this.loading_license_count = true;

		this._license.get_licenses_by_host_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: any) => {

					let online = 0;
					const statistics = {
						basis: 0,
						basis_label: 'Licenses',
						good_value: 0,
						good_value_label: 'Online',
						bad_value: 0,
						bad_value_label: 'Offline'
					};

					if (response.message) {
						this.host_licenses = [];
						this.license_card = statistics;
						return;
					}

					const licenses: API_LICENSE_PROPS[] = response;
					this.host_licenses = response;

					if(this.filterStatus !== null){
						this.host_licenses.filter(x => x.piStatus === this.filterStatus);
					}

					licenses.forEach(
						license => {
							if (license.piStatus == 1) online += 1;
						}
					);
					this.host_online_licenses = online;
					this.host_offline_licenses = licenses.length - online;
					statistics.basis = licenses.length;
					statistics.good_value = online;
					statistics.bad_value = licenses.length - online;
					this.license_card = statistics;

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
		this.selected_dealer.forEach(dealer => {
			dealer.hosts = this.selected_dealer_hosts.filter(x => x.dealerId === dealer.dealerId);
			dealer.licenses = this.selected_licenses.filter(x => x.dealerId === dealer.dealerId);
			dealer.onlineLicenseCount = dealer.licenses.filter(x => x.piStatus === 1).length;
			dealer.offlineLicenseCount = dealer.licenses.length - dealer.onlineLicenseCount;
		});
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
		this.selected_dealer_hosts = this.selected_dealer_hosts.filter(x => this.selected_hosts.includes(x.hostId));
		this.selected_dealer.forEach(dealer => {
			dealer.hosts = dealer.hosts.filter(x => this.selected_hosts.includes(x.hostId));
			dealer.licenses = dealer.licenses.filter(x => x.piStatus === value);
			dealer.onlineLicenseCount = value == 1 ? dealer.licenses.length : 0;
			dealer.offlineLicenseCount =  value == 0 ? dealer.licenses.length : 0;
		});

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
		this.selected_dealer.forEach(dealer => {
			dealer.hosts = this.selected_dealer_hosts.filter(x => x.dealerId === dealer.dealerId);
			dealer.licenses = this.selected_licenses.filter(x => x.dealerId === dealer.dealerId);
			dealer.onlineLicenseCount = dealer.licenses.filter(x => x.piStatus === 1).length;
			dealer.offlineLicenseCount = dealer.licenses.length - dealer.onlineLicenseCount;
		});

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
				let businessName = this.selected_dealer.find(dealer => dealer.dealerId === license.dealerId).businessName;
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
		var dealers = "";
		this.selected_dealer.forEach(dealer => dealers += dealer.businessName + "_");
		let fileName = dealers + "MapLocator.csv";
		saveAs(blob, fileName);
	}

	onRemoveDealer(index: number)
	{
		this.selectedDealersControl.value.splice(index,1);
		this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
		this.onSubmit();
	}

	private subscribeToDealerSearch(): void {

		const control = this.dealerFilterControl;

		control.valueChanges
			.pipe(
				takeUntil(this._unsubscribe), 
				debounceTime(1000), 
				map(
					keyword => {
						if (control.invalid) return;

						if (keyword && keyword.trim().length > 0) this.searchData(keyword);
						else {
							this.getDealers(1);
						};
					}
				)
			)
			.subscribe(() => this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId);
	}

	onSubmit(){
		const dealers = this.selectedDealersControl.value as API_DEALER[];
		const selectedDealers = dealers.map(
			dealer => {
				const {dealerId } = dealer;
				return dealerId;
			}
		);

		this.onSelectDealer(selectedDealers)
	}

	onSelectDealer(selectedDealers): void {
		this.online_licenses = 0;
		this.offline_licenses = 0;
		this.selected_dealer_hosts = [];
		this.selected_licenses = [];
		this.selected_dealer = this.dealers.filter(dealer => selectedDealers.includes(dealer.dealerId));
		this.unfiltered_selected_dealer = this.dealers.filter(dealer => selectedDealers.includes(dealer.dealerId));
		this.selected_dealer.forEach(dealer => {
			 dealer.hosts.map(host => {
				 this.selected_dealer_hosts.push(host);
			 });
			 dealer.licenses.map(license => {
				 this.selected_licenses.push(license);
			 });
		});

		this.selected_licenses.forEach(
			license => {
				if (license.piStatus == 1) this.online_licenses += 1;
			}
		);

		this.offline_licenses = this.selected_licenses.length - this.online_licenses;

		this.selected_dealer_hosts.forEach(x => {
			x.storeHours ? x.parsedStoreHours = JSON.parse(x.storeHours) : x.parsedStoreHours = "-";
			x.latitude ? x.latitude = parseFloat(x.latitude).toFixed(5) : "-";
			x.longitude ? x.longitude = parseFloat(x.longitude).toFixed(5) : "-";
			let selectedLicense = new API_LICENSE;
			x.licenses = [];
			this.selected_licenses.forEach((license :API_LICENSE_PROPS) => {
				if(license.hostId === x.hostId){
					selectedLicense.license = license;
					x.licenses.push(selectedLicense);
				}
			});
		});

		this.unfiltered_dealer_hosts = this.selected_dealer_hosts;
		this.unfiltered_licenses = this.selected_licenses;
		this.map_marker = this.mapMarkersToUI(this.selected_dealer_hosts, this.selected_licenses);
		this.selected_dealer_hosts.forEach(x => {x.icon_url = this.map_marker.filter(y => y.hostId === x.hostId)[0].icon_url});
		this.location_selected = true;
		if(this.isFiltered)
		{
			this.filterDealerHosts(this.filterStatus);
		}
	}
}
