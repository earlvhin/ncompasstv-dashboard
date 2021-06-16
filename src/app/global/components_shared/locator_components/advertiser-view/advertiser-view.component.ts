import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { AdvertiserService } from '../../../services/advertiser-service/advertiser.service';
import { API_LICENSE_PROPS } from '../../../models/api_license.model';
import { UI_ADVERTISER_LOCATOR_MARKER } from '../../../models/ui_advertiser-locator.model';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-advertiser-view',
  templateUrl: './advertiser-view.component.html',
  styleUrls: ['./advertiser-view.component.scss']
})

export class AdvertiserViewComponent implements OnInit, OnDestroy {
	
	advertiser: Array<any> = [];
	advertiser_data: Array<any> = [];
	entered_advertiser_data: any;
	host_license: API_LICENSE_PROPS[];
	initial_load_advertiser: boolean = false;
	is_dealer: boolean = false;
	is_search_advertiser: boolean = false;
	is_view_only = false;
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

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _advertiser: AdvertiserService,
		private _auth: AuthService,
		private _router: Router,
	) { }

	ngOnInit() {

		const roleId = this._auth.current_user_value.role_id; 
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
			this.getDealerAdvertisers(1);
		}

		this.is_view_only = this.currentUser.roleInfo.permission === 'V';

	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getDealerAdvertisers(page: number): void {

		if (page > 1) {
			this.loading_data_advertiser = true;

			this._advertiser.get_advertisers_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_advertiser_data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					response => {

						response.advertisers.map (
							i => {
								this.advertiser.push(i);
								this.advertiser_data.push(i);
							}
						);

						this.paging_advertiser = response.paging;
						this.loading_data_advertiser = false;
						this.loading_search_advertiser = false;
					},
					error => console.log('Error retrieving advertisers by dealer id', error)
				);

		} else {

			if (this.search_advertiser_data != '') {
				this.loading_search_advertiser = true;
				this.advertiser_data = [];
			}

			this._advertiser.get_advertisers_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_advertiser_data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					response => {
						if (!response.message) {

							response.advertisers.map(
								i => {
									this.advertiser.push(i);
									this.advertiser_data.push(i);
								}
							);
							this.paging_advertiser = response.paging;
							this.no_advertiser_found = false;
						}

						this.loading_data_advertiser = false;
						this.loading_search_advertiser = false;
						this.loading_advertisers = false;
					},
					error => console.log('Error retrieving advertiseres by dealer id', error)
				);
		}
	}

	advertiserSearchBoxTrigger(event): void {
		this.is_search_advertiser = event.is_search;

		if (this.is_search_advertiser) {
			this.search_advertiser_data = '';
			this.advertiser_data = [];
			this.loading_search_advertiser = true;
		}

		if (this.paging_advertiser.hasNextPage || this.is_search_advertiser) {
			this.getDealerAdvertisers(event.page);
		}
	}

	searchAdvertiserData(e): void {
		this.search_advertiser_data = e;
		this.getDealerAdvertisers(1);
	}

	advertiserEntered(e): void {
		this.storehours = [];

		this._advertiser.get_advertiser_by_id(e).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: any) => {
					this.entered_advertiser_data = response;
					this.location_selected = true;
					this.map_markers = this.mapMarkersToUI();
				},
				error => console.log('Error retrieving advertiser by id', error)
			);
	}

	createAdvertiserProfile(): void {
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);
		this._router.navigate([`/${route}/create-advertiser/`]);
	}

	mapMarkersToUI() {
		const icon_url = 'assets/media-files/markers/offline.png';
		
		return new UI_ADVERTISER_LOCATOR_MARKER(
			this.entered_advertiser_data.name,
			this.entered_advertiser_data.latitude,
			this.entered_advertiser_data.longitude,
			icon_url
		);
	}

	private get currentUser() {
		return this._auth.current_user_value;
	}
}
