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

@Component({
	selector: 'app-host-view',
	templateUrl: './host-view.component.html',
	styleUrls: ['./host-view.component.scss']
})

export class HostViewComponent implements OnInit, OnDestroy {
	
	currentRole: string;
	host_dealer: API_DEALER;
	hosts: API_HOST[] = [];
	hosts_data: API_HOST[] = [];
	lat = 39.7395247;
	is_dealer = false;
	license_card: any;
	licenses: API_LICENSE_PROPS[];
	lng = -105.1524133;
	loading_data = false;
	loading_hosts = true;
	loading_license_count = false;
	loading_search = false;
	location_selected = false;
	map_markers: UI_HOST_LOCATOR_MARKER;
	paging: PAGING;
	selected_host: API_HOST;
	storehours: any;
	primaryKeyword: string = "hostName";
	isOpened: any = true;

	private is_search = false;
	private search_key = '';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _host: HostService,
		private _license: LicenseService,
		private _router: Router,
	) { }

	ngOnInit() {
		if (this.currentUserIsDealer) this.is_dealer = true
		this.currentRole = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);
		if(this.currentRole === 'dealer'){
			this.primaryKeyword = "name";
		}
		this.getHosts(1);
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

					this.location_selected = true;
					this.isOpened = true;
					this.getLicenseByHostId(this.selected_host.hostId);

				},
				error => console.log('Error retrieving host data', error)
			);

	}

	searchBoxTrigger(event: { is_search: boolean, page: number }) {
		this.is_search = event.is_search;
		
		if (this.is_search) {
			this.search_key = '';
			this.hosts_data = [];
			this.loading_search = true;
		}

		if (this.paging.hasNextPage || this.is_search) {
			this.getHosts(event.page);
		}	
	}

	searchData(keyword: string) {
		this.search_key = keyword;
		this.getHosts(1);
	}

	private getHosts(page: number) {

		let getHostRequest = this._host.get_host_by_page(page, this.search_key);

		if (this.currentUserIsDealer) {
			const currentDealerId = this.currentUser.roleInfo.dealerId;
			getHostRequest = this._host.get_host_by_dealer_id(currentDealerId, page, this.search_key);
		}

		if (this.search_key) {
			this.loading_search = true;
			this.hosts_data = [];
		}
		else this.loading_data = true;

		getHostRequest.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { host: API_HOST[], paging: PAGING, message?: string }) => {

					// no records found
					if (response.message) return;
					
					const { paging } = response;
					const { entities } = paging;
					const hosts: API_HOST[] = entities;

					hosts.map(
						host => {
							this.hosts.push(host);
							this.hosts_data.push(host);
						}
					);

					this.paging = paging;

				},
				error => console.log('Error retrieving hosts by page ', error)
			)
			.add(() => {
				this.loading_data = false;
				this.loading_search = false;
				this.loading_hosts = false;
			});
		
	}

	private getLicenseByHostId(id: string) {
		this.loading_license_count = true;

		this._license.get_license_by_host_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: API_LICENSE_PROPS[]) => {

					let online = 0;
					this.licenses = data;

					if (this.licenses.length > 0) {

						this.licenses.map(
							i => {
								if (i.piStatus == 1) {
									online += 1;
								}
							}
						);
					}

					this.license_card = {
						basis: data.length || 0,
						basis_label: 'Licenses',
						good_value: online || 0,
						good_value_label: 'Online',
						bad_value: data.length - online || 0,
						bad_value_label: 'Offline'
					}

					setTimeout(() => {
						this.loading_license_count = false;
					}, 1000)

					this.map_markers = this.mapMarkersToUI(online);
					this.selected_host.icon_url = this.map_markers.icon_url;
				},
				error => console.log('Error retrieving host license', error)
			);
	}

	private mapMarkersToUI(online: number): UI_HOST_LOCATOR_MARKER {

		let icon_url: string;
		const license_online_percentage = (online / this.licenses.length) * 100;

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

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected get currentUserIsDealer() {
		return this.currentUser.role_id === UI_ROLE_DEFINITION.dealer;
	}
}
