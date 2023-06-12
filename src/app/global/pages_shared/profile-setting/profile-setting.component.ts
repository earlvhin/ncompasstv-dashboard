import { Component, OnInit } from '@angular/core';
import { MatTab } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { AuthService, AdvertiserService, ContentService, HostService, LicenseService, DealerService } from 'src/app/global/services';
import { UI_CURRENT_USER, UI_ROLE_DEFINITION } from 'src/app/global/models';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-profile-setting',
	templateUrl: './profile-setting.component.html',
	styleUrls: ['./profile-setting.component.scss']
})
export class ProfileSettingComponent implements OnInit {
	advertiser_details: any = {};
	content_details: any = {};
	current_user: UI_CURRENT_USER;
	dealer_email: string;
	dealer_id: string;
	host_details: any = {};
	is_dealer: boolean = false;
	license_details: any = {};
	loading_advertiser: boolean = true;
	loading_content: boolean = true;
	loading_host: boolean = true;
	loading_license: boolean = true;
	show_cart_button: boolean = false;
	no_credit_card: boolean = false;
	no_dealer_values: boolean = false;
	subscription: Subscription = new Subscription();
	tab_selected: string = 'Dealer';
	is_prod: boolean = false;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _advertiser: AdvertiserService,
		private _auth: AuthService,
		private _content: ContentService,
		private _host: HostService,
		private _license: LicenseService,
		private _dealer: DealerService
	) {}

	ngOnInit() {
		if (!environment.production) {
			this.is_prod = false;
		} else {
			this.is_prod = true;
		}
		if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
			this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
			this.current_user = this._auth.current_user_value;
			this.getTotalLicenses(this._auth.current_user_value.roleInfo.dealerId);
			this.getTotalAdvertisers(this._auth.current_user_value.roleInfo.dealerId);
			this.getTotalHosts(this._auth.current_user_value.roleInfo.dealerId);
			this.getTotalContents(this._auth.current_user_value.roleInfo.dealerId);
			this.getDealerValuesById(this._auth.current_user_value.roleInfo.dealerId);
			// this.getCreditCardsId(this._auth.current_user_value.roleInfo.dealerId);
			this.checkIfEnableShop();
		} else {
			this.is_dealer = false;
		}
	}

	checkIfEnableShop() {
		if (this.no_credit_card || this.no_dealer_values) {
			this.show_cart_button = false;
		} else {
			this.show_cart_button = true;
		}
	}

	getDealerValuesById(id) {
		this.subscription.add(
			this._dealer
				.get_dealer_values_by_id(id)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe((response: any) => {
					if (!response.message) {
						this.no_dealer_values = false;
					} else {
						this.no_dealer_values = true;
					}
				})
		);
	}

	// getCreditCardsId(id) {
	// 	this.subscription.add(
	//         this._dealer.get_credit_cards(id).pipe(takeUntil(this._unsubscribe)).subscribe(
	// 			(response:any) => {
	//                 if(!response.message) {
	//                     this.no_credit_card = false;
	//                     this.dealer_email = response.email;
	//                 } else {
	//                     this.no_credit_card = true;
	//                 }
	//             }
	//         )
	//     )
	// };

	getTotalLicenses(id) {
		this._license
			.get_licenses_total_by_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					this.license_details.basis = data.total;
					this.loading_license = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	getTotalAdvertisers(id) {
		this._advertiser
			.get_advertisers_total_by_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					this.advertiser_details.basis = data.total;
					this.loading_advertiser = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	getTotalHosts(id) {
		this._host
			.get_host_total_per_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					this.host_details.basis = data.total;
					this.loading_host = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	getTotalContents(id) {
		this._content
			.get_contents_total_by_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					this.content_details.basis = data.total;
					this.content_details.images = data.totalImages;
					this.content_details.videos = data.totalVideos;
					this.content_details.feeds = data.totalFeeds;
					this.loading_content = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	tabSelected(event: { index: number }): void {
		let tab = '';
		switch (event.index) {
			case 0:
				this.tab_selected = 'Dealer';
				break;
			case 1:
				this.tab_selected = 'Billing';
				break;
			case 2:
				this.tab_selected = 'Security';
				break;
			case 3:
				this.tab_selected = 'Payment';
				break;
			case 4:
				this.tab_selected = 'Transactions';
				break;
			default:
		}
	}

	goToUrl(): void {
		if (this.is_prod) {
			window.open('https://shop.n-compass.online', '_blank');
		} else {
			window.open('http://dev.shop.n-compass.online', '_blank');
		}
	}
}
