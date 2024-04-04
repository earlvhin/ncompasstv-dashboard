import { Component, OnInit } from '@angular/core';
import { AdvertiserService } from '../../../services/advertiser-service/advertiser.service';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { HostService } from '../../../services/host-service/host.service';
import { Observable, Subscription } from 'rxjs';
import { API_DEALER } from '../../../models/api_dealer.model';
import { API_HOST } from 'src/app/global/models/api_host.model';
import { API_ADVERTISER } from 'src/app/global/models/api_advertiser.model';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { HelperService } from 'src/app/global/services/helper-service/helper.service';
import { UI_AUTOCOMPLETE, UI_AUTOCOMPLETE_DATA } from 'src/app/global/models';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-user-sort-modal',
    templateUrl: './user-sort-modal.component.html',
    styleUrls: ['./user-sort-modal.component.scss'],
})
export class UserSortModalComponent implements OnInit {
    advertiserId = '';
    advertisers: any = [];
    advertisersData: UI_AUTOCOMPLETE;
    dealers: API_DEALER[];
    dealerId = '';
    dealerName = '';
    dealers_data: Array<any> = [];
    filterData: any = {
        dealer: {
            id: null,
            name: null,
        },
        host: {
            id: null,
            name: null,
        },
        advertiser: {
            id: null,
            name: null,
        },
    };
    hostId = '';
    hosts: API_HOST[] = [];
    hosts_data: Array<any> = [];
    hostDataAvailable = false;
    hostDataSearch = '';
    isDealer = false;
    is_search: boolean = false;
    is_license: boolean = false;
    loading_data: boolean = true;
    loading_data_host: boolean = true;
    loading_search: boolean = false;
    loading_search_advertiser: boolean = false;
    loading_search_host: boolean = false;
    modalTitle: string;
    modalSubTitle: string;
    no_dealers: boolean;
    paging: any;
    paging_advertiser: any;
    paging_host: any;
    advertiserDataSearch = '';
    selected_dealer: any;
    subscription: Subscription = new Subscription();
    temp_array: any = [];

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _dealer: DealerService,
        private _host: HostService,
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _helper: HelperService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit() {
        if (this.data && (this.data == 'license' || this.data.view == 'license')) {
            this.is_license = true;
            this.modalTitle = 'Filter Licenses by User';
            this.modalSubTitle = 'Select Dealer, Host';

            if (this.data.isDealer) {
                this.isDealer = true;
                this.dealerId = this.data.dealer_id;
                this.dealerName = this.data.dealer_name;
                this.dealerSelected({ id: this.dealerId, value: this.dealerName });
                this.modalSubTitle = 'Select Host';
            }
        } else if (this.data.dealerOnly) {
            this.modalTitle = 'Filter by Dealer';
            this.modalSubTitle = 'Select Dealer';
        } else {
            this.modalTitle = 'Filter Media Files by User';
            this.modalSubTitle = 'Select Dealer, Host and Advertiser';
        }

        const roleId = this._auth.current_user_value.role_id;
        const dealerRole = UI_ROLE_DEFINITION.dealer;
        const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

        if (roleId === dealerRole || roleId === subDealerRole) {
            this.isDealer = true;
            this.dealerId = this._auth.current_user_value.roleInfo.dealerId;
            this.dealerName = this._auth.current_user_value.roleInfo.businessName;
            this.dealerSelected({ id: this.dealerId, value: this.dealerName });
        }
    }

    advertiserSelected(selectedadvertiser: { id: string; value: string }) {
        this.advertiserId = selectedadvertiser.id;
        this.filterData.advertiser.id = selectedadvertiser.id;
        this.filterData.advertiser.name = selectedadvertiser.value;
    }

    dealerSelected(selectedDealer: { id: string; value: string }) {
        this.dealerId = selectedDealer.id;
        this.selected_dealer = {
            dealerId: selectedDealer.id,
            businessName: selectedDealer.value,
        };
        this.filterData.dealer.id = this.selected_dealer.dealerId;
        this.filterData.dealer.name = this.selected_dealer.businessName;
        this.getAdvertiserByDealer(1);
        this._helper.onDealerSelected$.next(selectedDealer);
    }

    hostSelected(selectedHost: { id: string; value: string }) {
        this.hostId = selectedHost.id;
        this.filterData.host.id = selectedHost.id;
        this.filterData.host.name = selectedHost.value;
    }

    getAdvertiserByDealer(page: number) {
        const filters = {
            dealer_id: this.dealerId,
            page,
            search: this.advertiserDataSearch,
            sortColumn: '',
            sortOrder: '',
            pageSize: 0,
        };

        this._advertiser
            .get_advertisers_by_dealer_id(filters)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    this.advertisers = [];
                    if (!response.message) {
                        response.advertisers.map((advertiser) =>
                            this.advertisers.push({ id: advertiser.id, value: advertiser.name }),
                        );
                    }
                    this.setAdvertiserAutocomplete();
                },
                (error) => console.error(error),
            );
    }

    setAdvertiserAutocomplete(): void {
        this.advertisersData = {
            label: 'Select Advertiser Name',
            placeholder: 'Ex. NCompassTV Advertiser',
            data: this.advertisers,
        };
    }
}
