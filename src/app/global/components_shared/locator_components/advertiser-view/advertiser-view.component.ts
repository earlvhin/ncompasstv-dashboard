import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AdvertiserService } from '../../../services/advertiser-service/advertiser.service';
import { API_LICENSE_PROPS } from '../../../models/api_license.model';
import { UI_ADVERTISER_LOCATOR_MARKER } from '../../../models/ui_advertiser-locator.model';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';
import { Router } from '@angular/router';


@Component({
  selector: 'app-advertiser-view',
  templateUrl: './advertiser-view.component.html',
  styleUrls: ['./advertiser-view.component.scss']
})

export class AdvertiserViewComponent implements OnInit {
	
	advertiser: Array<any> = [];
	advertiser_data: Array<any> = [];
	entered_advertiser_data: any;
	host_license: API_LICENSE_PROPS[];
	initial_load_advertiser: boolean = false;
	is_dealer: boolean = false;
	is_search_advertiser: boolean = false;
	lat: number = 39.7395247;
	license_card:any;
	lng: number = -105.1524133;
	loading_advertisers: boolean = true;
	loading_data_advertiser: boolean = false;
	loading_license_count: boolean = false;
	loading_search_advertiser: boolean = false;
	location_selected: boolean = false;
	map_markers: UI_ADVERTISER_LOCATOR_MARKER;
	no_advertiser_found: boolean = true;
	paging_advertiser: any;
	search_advertiser_data: string = "";
	storehours: any;
	subscription: Subscription = new Subscription;

	constructor(
		private _advertiser: AdvertiserService,
		private _auth: AuthService,
		private _router: Router,
	) { }

	ngOnInit() {
		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
			this.getDealerAdvertisers(1);
		}
	}

	getDealerAdvertisers(e) {
		if(e > 1) {
			this.loading_data_advertiser = true;
			this.subscription.add(
				this._advertiser.get_advertisers_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, e, this.search_advertiser_data).subscribe(
					data => {
						data.advertisers.map (
							i => {
								this.advertiser.push(i);
								this.advertiser_data.push(i);
							}
						)
						this.paging_advertiser = data.paging;
						this.loading_data_advertiser = false;
						this.loading_search_advertiser = false;
					}
				)
			)
		} else {
			if(this.search_advertiser_data != "") {
				this.loading_search_advertiser = true;
				this.advertiser_data = [];
			}
			this.subscription.add(
				this._advertiser.get_advertisers_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, e, this.search_advertiser_data).subscribe(
					data => {
						if(!data.message) {
							data.advertisers.map (
								i => {
									this.advertiser.push(i);
									this.advertiser_data.push(i);
								}
							)
							this.paging_advertiser = data.paging;
							this.no_advertiser_found = false;
						}
						this.loading_data_advertiser = false;
						this.loading_search_advertiser = false;
						this.loading_advertisers = false;
					}
				)
			)
		}
	}

	advertiserSearchBoxTrigger (event) {
		this.is_search_advertiser = event.is_search;
		if(this.is_search_advertiser) {
			this.search_advertiser_data = "";
			this.advertiser_data = [];
			this.loading_search_advertiser = true;
		}
		if(this.paging_advertiser.hasNextPage || this.is_search_advertiser) {
			this.getDealerAdvertisers(event.page);
		}
	}

	searchAdvertiserData(e) {
		this.search_advertiser_data = e;
		this.getDealerAdvertisers(1);
	}

	advertiserEntered(e) {
		this.storehours = [];
		this.subscription.add(
			this._advertiser.get_advertiser_by_id(e).subscribe(
				(data: any) => {
					this.entered_advertiser_data = data;
					this.location_selected = true;
					this.map_markers = this.markers_mapToUI();
				}
			)
		)
	}

	createAdvertiserProfile() {
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this._router.navigate([`/${route}/create-advertiser/`]);
	}

	markers_mapToUI() {
		let icon_url = 'assets/media-files/markers/offline.png';
		return new UI_ADVERTISER_LOCATOR_MARKER(
			this.entered_advertiser_data.name,
			this.entered_advertiser_data.latitude,
			this.entered_advertiser_data.longitude,
			icon_url
		)
	}
}
