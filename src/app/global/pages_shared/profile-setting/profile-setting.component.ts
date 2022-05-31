import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AdvertiserService } from '../../services/advertiser-service/advertiser.service';
import { AuthService } from '../../services/auth-service/auth.service';
import { ContentService } from '../../services/content-service/content.service';
import { HostService } from '../../services/host-service/host.service';
import { LicenseService } from '../../services/license-service/license.service';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';

@Component({
    selector: 'app-profile-setting',
    templateUrl: './profile-setting.component.html',
    styleUrls: ['./profile-setting.component.scss']
})

export class ProfileSettingComponent implements OnInit {
    advertiser_details: any = {}; 
    content_details: any = {}; 
	dealer_id: string;
    host_details: any = {}; 
    is_dealer: boolean = false;
    license_details: any = {}; 
    loading_advertiser: boolean = true;
	loading_content: boolean = true;
	loading_host: boolean = true;
	loading_license: boolean = true;

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _content: ContentService,
        private _host: HostService,
        private _license: LicenseService, 
    ) { }

    ngOnInit() {
        if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
            this.is_dealer = true;
			this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
            this.getTotalLicenses(this._auth.current_user_value.roleInfo.dealerId);
            this.getTotalAdvertisers(this._auth.current_user_value.roleInfo.dealerId);
            this.getTotalHosts(this._auth.current_user_value.roleInfo.dealerId);
            this.getTotalContents(this._auth.current_user_value.roleInfo.dealerId);
        } else {
            this.is_dealer = false;
        }

        
    }

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
}