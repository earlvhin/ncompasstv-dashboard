import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { AuthService, AdvertiserService, ContentService, HostService, LicenseService, DealerService } from 'src/app/global/services';
import { UI_CURRENT_USER, UI_ROLE_DEFINITION } from 'src/app/global/models';

@Component({
    selector: 'app-profile-setting',
    templateUrl: './profile-setting.component.html',
    styleUrls: ['./profile-setting.component.scss']
})

export class ProfileSettingComponent implements OnInit {
    advertiser_details: any = {}; 
    content_details: any = {}; 
	current_user: UI_CURRENT_USER;
	dealer_id: string;
    host_details: any = {}; 
    is_dealer: boolean = false;
    license_details: any = {}; 
    loading_advertiser: boolean = true;
	loading_content: boolean = true;
	loading_host: boolean = true;
	loading_license: boolean = true;
	show_cart_button: boolean = false;
    subscription: Subscription = new Subscription;

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _content: ContentService,
        private _host: HostService,
        private _license: LicenseService, 
        private _dealer: DealerService,
    ) { }

    ngOnInit() {
        if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
            this.is_dealer = true;
			this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
			this.current_user = this._auth.current_user_value;
            this.getTotalLicenses(this._auth.current_user_value.roleInfo.dealerId);
            this.getTotalAdvertisers(this._auth.current_user_value.roleInfo.dealerId);
            this.getTotalHosts(this._auth.current_user_value.roleInfo.dealerId);
            this.getTotalContents(this._auth.current_user_value.roleInfo.dealerId);
            this.getDealerValuesById(this._auth.current_user_value.roleInfo.dealerId);
        } else {
            this.is_dealer = false;
        }

        
    }

    getDealerValuesById(id) {
		this.subscription.add(
			this._dealer.get_dealer_values_by_id(id).pipe(takeUntil(this._unsubscribe)).subscribe(
				response => {
				    console.log(response)
                    if(response) {
                        this.show_cart_button = true;
                    } else {
                        this.show_cart_button = false;
                    }
                }
            )
        )
    };

    getTotalLicenses(id) {
        this._license.get_license_total_per_dealer(id).pipe(takeUntil(this._unsubscribe)).subscribe(
            (data: any) => {
                this.license_details.basis = data.total;
                this.loading_license = false;
            },
            error => console.log('Error retrieving total licenses by dealer ', error)
        );
    }

    getTotalAdvertisers(id) {
        this._advertiser.get_advertisers_total_by_dealer(id).pipe(takeUntil(this._unsubscribe)).subscribe(
            data => {
                this.advertiser_details.basis = data.total;
                this.loading_advertiser = false;
            },
            error => console.log('Error retrieving total advertisers by dealer', error)
        );
    }

    getTotalHosts(id) {
        this._host.get_host_total_per_dealer(id).pipe(takeUntil(this._unsubscribe)).subscribe(
            data => {
                this.host_details.basis = data.total;
                this.loading_host = false;
            },
            error => console.log('Error retrieving total hosts by dealer ', error)
        );
    }

    getTotalContents(id) {
        this._content.get_contents_total_by_dealer(id).pipe(takeUntil(this._unsubscribe)).subscribe(
            (data: any) => {
                this.content_details.basis = data.total;
                this.content_details.images = data.totalImages;
                this.content_details.videos =  data.totalVideos;
                this.content_details.feeds = data.totalFeeds;
                this.loading_content = false;
            },
            error => console.log('Error retrieving content total by dealer ', error)
        );
    }

    tabSelected(event: { index: number }): void {
        let tab = '';
        switch (event.index) {
            case 1:
                tab = 'Content';
        }
    }

    goToUrl(): void {
        window.open("https://shop.n-compass.online", "_blank");
    }
}