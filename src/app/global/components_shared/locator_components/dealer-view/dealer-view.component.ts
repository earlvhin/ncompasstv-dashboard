import { Component, OnDestroy, OnInit } from '@angular/core';
import { AgmInfoWindow } from '@agm/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_HOST } from '../../../models/api_host.model';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { API_LICENSE_PROPS } from '../../../models/api_license.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { UI_HOST_LOCATOR_MARKER_DEALER_MODE } from 'src/app/global/models/ui_host-locator.model';

@Component({
  selector: 'app-dealer-view',
  templateUrl: './dealer-view.component.html',
  styleUrls: ['./dealer-view.component.scss']
})
export class DealerViewComponent implements OnInit, OnDestroy {

	current_host_id_selected = '';
	clicked_marker_id: string;
	dealers: API_DEALER[];
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
	selected_dealer: API_DEALER;
	selected_dealer_hosts: API_HOST[];
	storehours: any;
	paging: any;
	previous_marker: AgmInfoWindow;

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
		private _license: LicenseService
	) { }

	ngOnInit() {
		this.getDealers(1);
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

	onSelectDealer(id: string): void {
		this.selected_dealer = this.dealers.filter(dealer => dealer.dealerId === id)[0];
		this.selected_dealer_hosts = this.selected_dealer.hosts;
		this.map_marker = this.mapMarkersToUI(this.selected_dealer_hosts, this.selected_dealer.licenses);
		this.location_selected = true;
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
					this.dealers = dealers;
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
					this.dealers = dealers;
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

		this._license.get_license_by_host_id(id)
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

					licenses.forEach(
						license => {
							if (license.piStatus == 1) online += 1;
						}
					);

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
					);
				}
			)
		}
	}

}
