import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HostService } from '../../../services/host-service/host.service';
import { LicenseService } from '../../../services/license-service/license.service';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { API_HOST } from '../../../models/api_host.model';
import { API_LICENSE_PROPS } from '../../../models/api_license.model';
import { Router } from '@angular/router';
import { UI_HOST_LOCATOR_MARKER } from '../../../models/ui_host-locator.model';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';

@Component({
  selector: 'app-host-view',
  templateUrl: './host-view.component.html',
  styleUrls: ['./host-view.component.scss']
})

export class HostViewComponent implements OnInit {
	entered_host_data: API_HOST;
	host_license: API_LICENSE_PROPS[];
	hosts: Array<any> = [];
	hosts_data: Array<any> = [];
	is_dealer: boolean = false;
	is_search: boolean = false;
	lat: number = 39.7395247;
	license_card:any;
	lng: number = -105.1524133;
	loading_data: boolean = false;
	loading_hosts: boolean = true;
	loading_license_count: boolean = false;
	loading_search: boolean = false;
	location_selected: boolean = false;
	map_markers: UI_HOST_LOCATOR_MARKER;
	paging: any;
	search_key: string = "";
	storehours: any;
	subscription: Subscription = new Subscription;

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _host: HostService,
		private _license: LicenseService,
		private _router: Router,
	) { }

	ngOnInit() {
		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
		}
		this.getHosts(1);
	}

	createHostPlace() {
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this._router.navigate([`/${route}/create-host/`]);
	}

	getHosts(page) {
		if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			if(this.search_key != "") {
				this.loading_search = true;
				this.hosts_data = [];
			}
			if(page > 1) {
				this.loading_data = true;
				this.subscription.add(
					this._host.get_host_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_key).subscribe(
						data => {
							data.paging.entities.map (
								i => {
									if(this.search_key != "") {
										this.hosts.push(i)
									} else {
										this.hosts.push(i)
									}
									this.hosts_data.push(i)
								}
							)
							this.paging = data.paging
							this.loading_data = false;
						}
					)
				)
			} else {
				this.subscription.add(
					this._host.get_host_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_key).subscribe(
						data => {
							if(!data.message) {
								data.paging.entities.map (
									i => {
										if(this.search_key != "") {
											this.hosts.push(i)
										} else {
											this.hosts.push(i)
										}
										this.hosts_data.push(i)
									}
								)
								this.paging = data.paging
								}
							this.loading_data = false;
							this.loading_search = false;
							this.loading_hosts = false;
						}
					)
				)
			}
		} else {
			if(page > 1) {
				this.loading_data = true;
				this.subscription.add(
					this._host.get_host_by_page(page,this.search_key).subscribe(
						data => {
							data.host.map (
								i => {
									if(this.search_key != "") {
										this.hosts.push(i)
									} else {
										this.hosts.push(i)
									}
									this.hosts_data.push(i)
								}
							)
							this.paging = data.paging
							this.loading_data = false;
							this.loading_search = false;
						}
					)
				)
			} else {
				if(this.search_key != "") {
					this.loading_search = true;
					this.hosts_data = [];
				}
				this.subscription.add(
					this._host.get_host_by_page(page,this.search_key).subscribe(
						data => {
							if(!data.message) {
								data.host.map (
									i => {
										if(this.search_key != "") {
											this.hosts.push(i)
										} else {
											this.hosts.push(i)
										}
										this.hosts_data.push(i)
									}
								)
								this.paging = data.paging
							}
							
							this.loading_data = false;
							this.loading_search = false;
							this.loading_hosts = false;
						}
					)
				)
			}
		}
	}

	searchBoxTrigger(event) {
		this.is_search = event.is_search;
		if(this.is_search) {
			this.search_key = '';
			this.hosts_data = [];
			this.loading_search = true;
		}
		if(this.paging.hasNextPage || this.is_search) {
			this.getHosts(event.page);
		}	
	}

	searchData(e) {
		this.search_key = e;
		this.getHosts(1);
	}

	hostEntered(e) {
		this.storehours = [];
		this.subscription.add(
			this._host.get_host_by_id(e).subscribe(
				(data: any) => {
					this.entered_host_data = data.host;				
					if (this.entered_host_data.storeHours) {
						this.storehours = JSON.parse(this.entered_host_data.storeHours)
					}
					this.location_selected = true;
					this.getLicenseByHostId(this.entered_host_data.hostId);
				}
			)
		)
	}

	getLicenseByHostId(id) {
		this.loading_license_count = true;

		this.subscription.add(
			this._license.get_license_by_host_id(id).subscribe(
				(data: API_LICENSE_PROPS[]) => {
					this.host_license = data;
					let online = 0;

					if (this.host_license.length > 0) {
						this.host_license.map(
							i => {
								if(i.piStatus == 1) {
									online += 1;
								}
							}
						)
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

					this.map_markers = this.markers_mapToUI(online);
				}
			)
		)
	}

	markers_mapToUI(online) {
		const license_online_percentage = (online / this.host_license.length) * 100
		let icon_url;

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
			this.entered_host_data.name,
			this.entered_host_data.latitude,
			this.entered_host_data.longitude,
			license_online_percentage,
			icon_url
		)
	}
}
