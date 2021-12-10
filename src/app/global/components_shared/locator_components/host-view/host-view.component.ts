import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_HOST } from '../../../models/api_host.model';
import { API_LICENSE_PROPS } from '../../../models/api_license.model';
import { AuthService } from '../../../services/auth-service/auth.service';
import { HostService } from '../../../services/host-service/host.service';
import { LicenseService } from '../../../services/license-service/license.service';
import { UI_HOST_LOCATOR_MARKER } from '../../../models/ui_host-locator.model';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';
import { PAGING } from 'src/app/global/models/paging.model';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { AgmInfoWindow } from '@agm/core';

@Component({
	selector: 'app-host-view',
	templateUrl: './host-view.component.html',
	styleUrls: ['./host-view.component.scss']
})

export class HostViewComponent implements OnInit, OnDestroy {
	
	currentRole: string;
	//HOSTS
	host_dealer: API_DEALER;
	hosts: API_HOST[] = [];
	hosts_data: API_HOST[] = [];
	lat = 39.7395247;
	is_dealer = false;
	host_licenses: API_LICENSE_PROPS[];
	selected_licenses: any[];
	lng = -105.1524133;
	loading_license_count = false;
	loading_hosts = true;
	location_selected: boolean = false;
	searchDealerId: string = "";

	//SEARCH BY HOST
	loading_data = false;
	loading_search = false;
	private is_search = false;
	private search_key = '';

	//SEARCH BY STATE
	state_selected = false;
	loading_state_data = false;
	loading_state_search = false;
	states_data: any[] = [];
	state_paging: PAGING;
	private is_state_search = false;
	private search_state_key = '';

	//SEARCH BY CATEGORY
	loading_category_data = false;
	loading_category_search = false;
	categories_data: any[] = [];
	category_paging: PAGING;
	private is_category_search = false;
	private search_category_key = '';


	map_markers: UI_HOST_LOCATOR_MARKER[];
	paging: PAGING;
	selected_host: API_HOST;
	unfiltered_host_results: API_HOST[] = [];
	host_results: API_HOST[] = [];
	storehours: any;
	primaryKeyword: string = "hostName";
	isOpened: any = true;
	currentSearchOption: string;
	filteredState: API_HOST[] = [];
	clicked_marker_id: string;
	expansion_id: string;
	current_host_id_selected: string;
	previous_marker: AgmInfoWindow;
	isFilteredHosts: any;
	online_licenses: number = 0;
	offline_licenses: number = 0;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _host: HostService,
		private _license: LicenseService,
		private _router: Router,
	) { }

	ngOnInit() {
		this.currentSearchOption = 'host';
		this.map_markers = [];
		this.selected_licenses = [];
		this.online_licenses = 0;
		this.offline_licenses = 0;
		if (this.currentUserIsDealer) this.is_dealer = true
		this.currentRole = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);
		if(this.currentRole === 'dealer'){
			this.primaryKeyword = "name";
		}
		this.getHosts(1);
		this.getHostCategories(1);
		this.getHostStates(1);
	}

	onExpandHost(hostId: string): void {
		if (hostId === this.current_host_id_selected) return;
		this.expansion_id = hostId;
		this.clicked_marker_id = hostId;
		this.current_host_id_selected = hostId;
		this.getLicenseByHostId(hostId);
	}

	setLink(licenseId: string) {
		return [`/${this.currentRole}/licenses/${licenseId}`];
	}

	onMarkerClick(hostId: string, window: AgmInfoWindow): void {
		this.getLicenseByHostId(hostId);
		this.clicked_marker_id = hostId;
		this.expansion_id = hostId;
		if (this.previous_marker) this.previous_marker.close();
		this.previous_marker = window;
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	createHostPlace() {
		this._router.navigate([`/${this.currentRole}/create-host/`]);
	}

	getLink(page: string, id: string) {
		return `/${this.currentRole}/${page}/${id}`;
	}

	getHostDealerLink(): string {
		return `/${this.currentRole}/dealers/${this.host_dealer.dealerId}`;
	}

	private getHosts(page: number) {
		let search = this.search_key ? this.search_key : this.search_category_key;
		search = search ? search : this.search_state_key;
		let getHostRequest = this._host.get_host_by_page(page, search);
		this.online_licenses = 0;
		this.offline_licenses = 0;
		this.host_results = [];
		this.unfiltered_host_results = [];
		this.selected_licenses = [];
		if (this.currentUserIsDealer) {
			const currentDealerId = this.currentUser.roleInfo.dealerId;
			getHostRequest = this._host.get_host_by_dealer_id(currentDealerId, page, search);
		}

		if (this.search_key) {
			this.loading_search = true;
			this.hosts_data = [];
		}
		else this.loading_data = true;

		getHostRequest.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { host: API_HOST[], paging: PAGING, distinctStates:API_HOST[], message?: string }) => {

					// no records found
					if (response.message) return;
					
					const { paging } = response;
					const { entities } = paging;
					const hosts: API_HOST[] = entities;

					hosts.map(
						host => {
							this.hosts.push(host);
							if(host.totalLicenses > 0){
								this.hosts_data.push(host);
								this.host_results.push(host);
								if (this.currentUserIsDealer) this.host_results[this.host_results.length-1].hostName = host.name;
								this.unfiltered_host_results.push(host);
							}	
						}
					);
					
					if(this.currentSearchOption === 'state' || this.currentSearchOption === 'category'){
						this.isFilteredHosts = true;
					
						 this.host_results.forEach(x => {
							 x.storeHours ? x.parsedStoreHours = JSON.parse(x.storeHours) : x.parsedStoreHours = "-";
						 	this.getLicenseByHostId(x.hostId);
						 });

						if(this.search_state_key){
							this.host_results = this.host_results.filter(x => x.state === this.search_state_key);
							this.map_markers = this.mapLocationMarkersToUI(this.host_results);
							this.host_results.forEach(x => {x.icon_url = this.map_markers.filter(y => y.hostId === x.hostId)[0].icon_url});
							this.location_selected = true;
						}
						else if(this.search_category_key){
							this.host_results = this.host_results.filter(x => x.category === this.search_category_key);
							this.map_markers = this.mapLocationMarkersToUI(this.host_results);
							this.host_results.forEach(x => {x.icon_url = this.map_markers.filter(y => y.hostId === x.hostId)[0].icon_url});
							this.location_selected = true;
						}

						this.host_results.forEach(host => {
							host.licenses.forEach(license => {
								this.selected_licenses.push(license);
							});
						});

						this.selected_licenses.forEach(
						license => {
							if (license.piStatus == 1) this.online_licenses += 1;
						}
						);

						this.offline_licenses = this.selected_licenses.length - this.online_licenses;
					}

					this.paging = paging;

				},
				error => console.log('Error retrieving hosts by page ', error)
			)
			.add(() => {
				this.loading_data = false;
				this.loading_search = false;
				this.loading_hosts = false;
				this.loading_category_search = false;
				this.loading_category_data = false;
				this.loading_state_search = false;
				this.loading_state_data = false;
			});
		
	}

	private getLicenseByHostId(id: string) {
		this.loading_license_count = true;
		this._license.get_licenses_by_host_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {

					if (!Array.isArray(response)) return;
					const data = response as API_LICENSE_PROPS[];

					let online = 0;
					this.host_licenses = data;

					if (this.host_licenses.length > 0) {

						this.host_licenses.map(
							i => {
								if (i.piStatus == 1) {
									online += 1;
								}
							}
						);
					}

					setTimeout(() => {
						this.loading_license_count = false;
					}, 1000)

					if(this.currentSearchOption === 'host'){						
						this.map_markers[0] = this.mapMarkersToUI(online);
						this.selected_host.icon_url = this.map_markers[0].icon_url;
					}
					
				},
				error => console.log('Error retrieving host license', error)
			);
	}

	private mapMarkersToUI(online: number): UI_HOST_LOCATOR_MARKER {

		let icon_url: string;
		const license_online_percentage = (online / this.host_licenses.length) * 100;

		if (license_online_percentage == 100) {
			icon_url = 'assets/media-files/markers/online_all.png';
		} else if(license_online_percentage >= 75 && license_online_percentage < 100) {
			icon_url = 'assets/media-files/markers/online_many.png';
		} else if (license_online_percentage < 75 && license_online_percentage > 0) {
			icon_url = 'assets/media-files/markers/online_few.png';
		} else {
			icon_url = 'assets/media-files/markers/offline.png';
		}

		return new UI_HOST_LOCATOR_MARKER(
			this.selected_host.hostId,
			this.selected_host.name,
			this.selected_host.latitude,
			this.selected_host.longitude,
			license_online_percentage,
			icon_url,
			this.selected_host.address,
			this.selected_host.category,
			this.storehours,
			this.selected_host.state,
			this.selected_host.postalCode,
			this.selected_host.city
		);

	}

	private mapLocationMarkersToUI(hosts:any[]): UI_HOST_LOCATOR_MARKER[] {
		if (hosts) {
			return hosts.map(
				(h: API_HOST) => {
					let icon_url;
					let online: any = 0;
					let license_online_percentage;
					const host_license = h.licenses;
	
					if (host_license.length > 0) {
						online = h.licenses.filter((i:any) => i.piStatus == 1);
						license_online_percentage = (online.length / host_license.length) * 100;
					}
		
					if (license_online_percentage == 100) {
						icon_url = 'assets/media-files/markers/online_all.png';
					} else if(license_online_percentage >= 75 && license_online_percentage < 100) {
						icon_url = 'assets/media-files/markers/online_many.png';
					} else if (license_online_percentage < 75 && license_online_percentage > 0) {
						icon_url = 'assets/media-files/markers/online_few.png';
					} else {
						icon_url = 'assets/media-files/markers/offline.png';
					}
	
					return new UI_HOST_LOCATOR_MARKER(
						h.hostId,
						h.hostName,
						h.latitude,
						h.longitude,
						license_online_percentage,
						icon_url,
						h.address,
						h.category,
						h.parsedStoreHours,
						h.state,
						h.postalCode,
						h.city
					);
				}
			)
			}
	}

    onSearchOption(key: string){
		if(key === 'host'){
			this.map_markers = [];
			this.selected_host = null;
			this.isFilteredHosts = false;
			this.currentSearchOption = 'host';
			this.search_state_key = "";
			this.search_key = "";
			this.search_category_key = "";
		}
		else if (key === 'state')
		{
			this.online_licenses = 0;
			this.offline_licenses = 0;
			this.host_results = [];
			this.selected_licenses = [];
			this.map_markers = [];
			this.currentSearchOption = 'state';
			this.getHostStates(1);
			this.search_state_key = "";
			this.search_key = "";
			this.search_category_key = "";
		}		
		else if (key === 'category')
		{
			this.online_licenses = 0;
			this.offline_licenses = 0;
			this.host_results = [];
			this.selected_licenses = [];
			this.map_markers = [];
			this.currentSearchOption = 'category';
			this.getHostCategories(1);
			this.search_state_key = "";
			this.search_key = "";
			this.search_category_key = "";
		}
	}

	//#region Search by Host

	onSelectHost(id: string) {
		this.storehours = [];

		this._host.get_host_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { dealer: API_DEALER, host: API_HOST }) => {

					const { dealer, host } = response;

					this.selected_host = host;
					this.host_dealer = dealer;			

					if (this.selected_host.storeHours) {
						this.storehours = JSON.parse(this.selected_host.storeHours);
					}

					this.selected_host.latitude ? this.selected_host.latitude = parseFloat(this.selected_host.latitude).toFixed(5) : 
					this.selected_host.latitude = "-";
					this.selected_host.longitude ? this.selected_host.longitude = parseFloat(this.selected_host.longitude).toFixed(5) :
					this.selected_host.longitude = "-";

					this.state_selected = true;
					this.isOpened = true;
					this.getLicenseByHostId(this.selected_host.hostId);

				},
				error => console.log('Error retrieving host data', error)
			);

	}

	searchBoxTrigger(event: { is_search: boolean, page: number,no_keyword: boolean }) {
		this.is_search = event.is_search;
		
		if (this.is_search) {
			this.search_key = '';
			this.hosts_data = [];
			this.loading_search = true;
		}

		if(event.no_keyword){
			this.search_key = "";
			this.getHosts(event.page); 
		}

		if (this.paging.hasNextPage || this.is_search) {
			this.getHosts(event.page);
		}	
	}

	searchData(keyword: string) {
		this.loading_search = true;
		this.search_key = keyword;
		this.getHosts(1);
	}

	//#endregion

	//#region Search by State
	getHostStates(page: number){
		this.searchDealerId = "";
		if (this.currentUserIsDealer) {
			this.searchDealerId = this.currentUser.roleInfo.dealerId;
		}

		this._host.get_host_states(page, this.search_state_key, this.searchDealerId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe
				((response: { state: any[], paging: PAGING, message?: string }) => {
					// no records found
					if (response.message) return;
					
					const { paging } = response;
					const { entities } = paging;
					const states: any[] = entities;
					this.states_data = [];

					states.map(
						state => {
							this.states_data.push(state);
						}
					);

					this.state_paging = paging;
			},
				error => console.log('Error retrieving hosts states', error)
			).add(() => {
				this.loading_state_search = false;
				this.loading_state_data = false;
			});;
	}

	searchState(keyword: string) {
		if(keyword.length < 3) keyword += "  ";
		this.loading_state_search = true;
		this.search_state_key = keyword;
		this.getHostStates(1);
	}

	searchBoxStateTrigger(event: { is_search: boolean, page: number, no_keyword: boolean }) {
		this.is_state_search = event.is_search;
		
		if (this.is_state_search) {
			this.search_state_key = '';
			this.states_data = [];
			this.loading_state_search = true;
		}

		if(event.no_keyword){
			this.search_state_key = '';
			this.getHostStates(event.page); 
		}

		if (this.state_paging.hasNextPage || this.is_state_search) {
			this.getHostStates(event.page);
		}	
	}

	onSelectState(state: string){
		this.loading_state_data = true;
		this.search_state_key = state;
		this.getHosts(1);
	}

	//#endregion

	//#region Filter by Category

	getHostCategories(page: number){
		this.searchDealerId = "";
		if (this.currentUserIsDealer) {
			this.searchDealerId = this.currentUser.roleInfo.dealerId;
		}
		this._host.get_host_categories(page,this.search_category_key, this.searchDealerId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe
				((response: { category: any[], paging: PAGING, message?: string }) => {

					// no records found
					if (response.message) return;
					
					const { paging } = response;
					const { entities } = paging;
					const categories: any[] = entities;
					this.categories_data = [];

					categories.map(
						category => {
							this.categories_data.push(category);
						}
					);

					this.category_paging = paging;
			},
				error => console.log('Error retrieving hosts categories', error)
			).add(() => {
				this.loading_category_search = false;
				this.loading_category_data = false;
			});;
	}

	onSelectCategory(category: string) {
		this.loading_category_data = true;
		this.search_category_key = category;
		this.getHosts(1);
	}

	searchCategory(keyword: string){
		this.loading_category_search = true;
		this.search_category_key = keyword;
		this.getHostCategories(1);
	}

	searchBoxCategoryTrigger(event: { is_search: boolean, page: number, no_keyword: boolean }) {
		this.is_category_search = event.is_search;
		
		if (this.is_category_search) {
			this.search_category_key = '';
			this.categories_data = [];
			this.loading_category_search = true;
		}

		if(event.no_keyword){
			this.search_category_key = '';
			this.getHostCategories(event.page); 
		}

		if (this.category_paging.hasNextPage || this.is_category_search) {
			this.getHostCategories(event.page);
		}	
	}
	//#endregion

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected get currentUserIsDealer() {
		return this.currentUser.role_id === UI_ROLE_DEFINITION.dealer;
	}
}
