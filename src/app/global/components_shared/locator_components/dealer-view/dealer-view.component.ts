import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { API_HOST } from '../../../models/api_host.model';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { API_LICENSE_PROPS } from '../../../models/api_license.model';
import { UI_HOST_LOCATOR_MARKER, UI_HOST_LOCATOR_MARKER_DEALER_MODE } from 'src/app/global/models/ui_host-locator.model';

@Component({
  selector: 'app-dealer-view',
  templateUrl: './dealer-view.component.html',
  styleUrls: ['./dealer-view.component.scss']
})
export class DealerViewComponent implements OnInit {

	clicked_marker_id: string;
	dealers: API_DEALER[];
	dealers_data: Array<any> = [];
	host_license: API_LICENSE_PROPS[];
	selected_dealer: API_DEALER[];
	selected_dealer_hosts: API_HOST[];
	lat: number = 39.7395247;
	license_card:any;
	lng: number = -105.1524133;
	loading_hosts: boolean = true;
	loading_license_count: boolean = false;
	location_selected: boolean = false;
	storehours: any;
	subscription: Subscription = new Subscription;
	expansion_id: string;
	previous_marker: any;
	map_marker: UI_HOST_LOCATOR_MARKER[];
	paging: any;
	loading_data: boolean = true;
	loading_search: boolean = false;
	is_search: boolean = false;
	labelOptions = {
		color: 'black',
		fontFamily: '',
		fontSize: '14px',
		fontWeight: 'bold',
		text: "some text"
	}
	
	constructor(
		private _dealer: DealerService,
		private _license: LicenseService
	) { }

	ngOnInit() {
		this.getDealers(1);
	}

	searchData(e) {
		console.log('#SEARCHDATA')
		this.loading_search = true;
		this.subscription.add(
			this._dealer.get_search_dealer_with_host(e).subscribe(
				data => {
					console.log("DATA", data)
					if (data.paging.entities.length > 0) {
						this.dealers = data.dealers;
						this.dealers_data = data.dealers;
						this.loading_search = false;
					} else {
						this.dealers_data = [];
						this.loading_search = false;
					}
					this.paging = data.paging;
				}
			)
		)
	}

	getDealers(e) {
		console.log('#GETDEALERS')
		if(e > 1) {
			this.loading_data = true;
			this.subscription.add(
				this._dealer.get_dealers_with_host(e, "").subscribe(
					data => {
						data.dealers.map (
							i => {
								this.dealers.push(i)
							}
						)
						console.log("DATA DEALERS", this.dealers)
						this.paging = data.paging
						this.loading_data = false;
					}
				)
			)
		} else {
			if(this.is_search) {
				this.loading_search = true;
			}
			this.subscription.add(
				this._dealer.get_dealers_with_host(e, "").subscribe(
					data => {
						this.dealers = data.dealers;
						this.dealers_data = data.dealers;
						this.paging = data.paging
						this.loading_data = false;
						this.loading_hosts = false;
						this.loading_search = false;
					}
				)
			)
		}
	}

	searchBoxTrigger (event) {
		this.is_search = event.is_search;
		this.getDealers(event.page);	
		console.log(event)
	}

	dealerSelected(e) {
		this.selected_dealer = this.dealers.filter(i => { return i.dealerId == e });
		this.selected_dealer_hosts = this.selected_dealer[0].hosts;
		this.map_marker = this.markers_mapToUI(this.selected_dealer_hosts, this.selected_dealer[0].licenses);
		this.location_selected = true;


		console.log('#dealerSelected', this.selected_dealer);
	}

	markers_mapToUI(hosts, licenses) {
		console.log(hosts);

		if (hosts) {
			return hosts.map(
				(h: API_HOST) => {
					let icon_url;
					let online;
					let license_online_percentage;
	
					let host_license = licenses.filter(
						(i:API_LICENSE_PROPS) => i.hostId == h.hostId
					)
	
					if (host_license.length > 0) {
						online = host_license.filter(
							(i: API_LICENSE_PROPS) => i.piStatus == 1
						)
	
						license_online_percentage = (online.length / host_license.length) * 100
					} else {
						online = 0;
					}
	
					// console.log(h.name, license_online_percentage)
	
					if (license_online_percentage == 100) {
						icon_url = 'assets/media-files/markers/online_all.png';
					} else if(license_online_percentage >= 75 && license_online_percentage < 100) {
						icon_url = 'assets/media-files/markers/online_many.png';
					} else if (license_online_percentage < 75 && license_online_percentage > 0) {
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
						icon_url
					)
				}
			)
		}
	}

	onMarkerClick(e, window) {
		this.getLicenseByHostId(e.hostId)
		this.clicked_marker_id = e.hostId;
		this.expansion_id = e.hostId;

		if (this.previous_marker) {
			this.previous_marker.close();
		}

		this.previous_marker = window;
	}

	hostExpansionClicked(e) {
		this.expansion_id = e;
		this.getLicenseByHostId(e.hostId)
	}

	getLicenseByHostId(id) {
		this.loading_license_count = true;

		this.subscription.add(
			this._license.get_license_by_host_id(id).subscribe(
				(data: API_LICENSE_PROPS[]) => {
					// console.log(data)
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
				}
			)
		)
	}
}
