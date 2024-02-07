import { Component, Inject, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { AdvertiserService } from '../../../services/advertiser-service/advertiser.service';
import { API_ADVERTISER } from 'src/app/global/models/api_advertiser.model';
import { API_DEALER } from '../../../models/api_dealer.model';
import { API_HOST } from 'src/app/global/models/api_host.model';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { HelperService } from 'src/app/global/services/helper-service/helper.service';
import { HostService } from '../../../services/host-service/host.service';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-select-owner',
    templateUrl: './select-owner.component.html',
    styleUrls: ['./select-owner.component.scss'],
})
export class SelectOwnerComponent implements OnInit {
    advertisers: API_ADVERTISER[] = [];
    advertisers_data: any[] = [];
    dealer_name: string;
    dealers: API_DEALER[];
    dealers_data: any[] = [];
    hosts: API_HOST[] = [];
    hosts_data: any[] = [];
    initial_load = false;
    initial_load_advertiser = false;
    is_advertiser_field_selected: boolean;
    is_dealer = true;
    is_floating_selected: boolean;
    is_host_field_selected: boolean;
    loading_data = true;
    loading_data_advertiser = true;
    loading_data_host = true;
    loading_search = false;
    loading_search_advertiser = false;
    loading_search_host = false;
    no_dealers: boolean;
    owner_type: any;
    paging: any;
    paging_advertiser: any;
    paging_host: any;

    filter_data = {
        dealer: { id: null, name: null },
        host: { id: null, name: null },
        advertiser: { id: null, name: null },
        type: null,
    };

    owner_types = [
        { name: 'Host', type: 2 },
        { name: 'Advertiser', type: 3 },
        { name: 'Floating', type: 4 },
    ];

    private advertiser_id: string;
    private dealer_id: string;
    private host_id: string;
    private is_search: boolean = false;
    private search_advertiser_data = '';
    private search_host_data = '';
    private selected_dealer: any;
    private subscription: Subscription = new Subscription();

    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialog_data: { dealerId: string; dealerName: string },
        private _dealer: DealerService,
        private _helper: HelperService,
        private _host: HostService,
        private _advertiser: AdvertiserService,
    ) {}

    ngOnInit() {
        this.setDealer();
        this.getDealers(1);
    }

    get isValidForm(): boolean {
        if (!this.owner_type) return false;

        switch (this.owner_type) {
            case 2:
                return this.isHostIdSet;
            case 3:
                return this.isAdvertiserIdSet;
            default:
                return !this.isHostIdSet && !this.isAdvertiserIdSet;
        }
    }

    get isAdvertiserIdSet(): boolean {
        const id = this.advertiser_id;
        return id && typeof id !== 'undefined' && id.trim().length > 0;
    }

    get isHostIdSet(): boolean {
        const id = this.host_id;
        return id && typeof id !== 'undefined' && id.trim().length > 0;
    }

    advertiserSearchBoxTrigger(event: { page: number; is_search: boolean }): void {
        this.is_search = event.is_search;
        if (this.is_search) this.search_advertiser_data = '';
        if (this.paging_advertiser.hasNextPage || this.is_search)
            this.getAdvertiserByDealer(event.page);
    }

    advertiserSelected(value: string): void {
        this.advertiser_id = value;
        this.filter_data.advertiser.id = value;

        this.subscription.add(
            this._advertiser
                .get_advertiser_by_id(value)
                .subscribe((data) => (this.filter_data.advertiser.name = data.advertiser.name)),
        );
    }

    dealerSelected(value: string): void {
        if (!this.is_dealer) {
            const dealer_selected = this.dealers.filter((dealer) => dealer.dealerId == value);
            this.dealer_id = value;
            this.selected_dealer = dealer_selected[0];
            this.filter_data.dealer.id = this.selected_dealer.dealerId;
            this.filter_data.dealer.name = this.selected_dealer.businessName;
        } else {
            this.subscription.add(
                this._dealer.get_dealer_by_id(value).subscribe((data) => {
                    this.dealer_id = data.dealerId;
                    this.filter_data.dealer.id = data.dealerId;
                    this.filter_data.dealer.name = data.businessName;
                }),
            );
        }

        this.initial_load = true;
        this.initial_load_advertiser = true;
        this.getHostByDealer(1);
        this.getAdvertiserByDealer(1);
    }

    hostSearchBoxTrigger(event: { page: number; is_search: boolean }): void {
        this.is_search = event.is_search;
        if (this.is_search) this.search_host_data = '';
        if (this.paging_host.hasNextPage || this.is_search) this.getHostByDealer(event.page);
    }

    hostSelected(value: string): void {
        this.host_id = value;
        this.filter_data.host.id = value;

        this.subscription.add(
            this._host
                .get_host_by_id(value)
                .subscribe((data) => (this.filter_data.host.name = data.host.name)),
        );
    }

    searchBoxTrigger(event: { page: number; is_search: boolean }): void {
        this.is_search = event.is_search;
        if (this.paging.hasNextPage || this.is_search) this.getDealers(event.page);
    }

    searchData(value: any) {
        this.loading_search = true;

        this.subscription.add(
            this._dealer.get_search_dealer(value).subscribe((data) => {
                if (data.paging.entities.length > 0) {
                    this.dealers = data.paging.entities;
                    this.dealers_data = data.paging.entities;
                    this.loading_search = false;
                } else {
                    this.dealers_data = [];
                    this.loading_search = false;
                }

                this.paging = data.paging;
            }),
        );
    }

    searchHostData(value: string): void {
        this.search_host_data = value;
        this.getHostByDealer(1);
    }

    searchAdvertiserData(value: string): void {
        this.search_advertiser_data = value;
        this.getAdvertiserByDealer(1);
    }

    onSelectOwnerType(event: { value: any }): void {
        this.owner_type = event.value;
        this.filter_data.type = this.owner_type;
        const { dealer, host, advertiser } = this.filter_data;

        switch (event.value) {
            case 2: // host selected
                this.is_host_field_selected = true;
                this.is_advertiser_field_selected = false;
                this.is_floating_selected = false;
                if (advertiser.id && advertiser.id.length > 0)
                    this.resetAutcompleteField('advertiser');

                break;
            case 3: // advertiser selected
                this.is_host_field_selected = false;
                this.is_advertiser_field_selected = true;
                this.is_floating_selected = false;
                if (host.id && host.id.length > 0) this.resetAutcompleteField('host');

                break;
            default: // floating selected
                this.is_host_field_selected = false;
                this.is_advertiser_field_selected = false;
                this.is_floating_selected = true;
                if (dealer.id && dealer.id.trim().length > 0) this.resetAutcompleteField('dealer');
                if (advertiser.id && advertiser.id.length > 0)
                    this.resetAutcompleteField('advertiser');
                if (host.id && host.id.length > 0) this.resetAutcompleteField('host');
        }
    }

    toggleHostField(event: { checked: boolean }): void {
        this.is_host_field_selected = event.checked;
    }

    private getAdvertiserByDealer(page: number): void {
        this.loading_data_advertiser = true;

        const filters = {
            dealer_id: this.dealer_id,
            page,
            search: this.search_advertiser_data,
            sortColumn: '',
            sortOrder: '',
            pageSize: 15,
        };

        if (page > 1) {
            this.subscription.add(
                this._advertiser.get_advertisers_by_dealer_id(filters).subscribe((data) => {
                    data.advertisers.map((advertiser) => {
                        this.advertisers.push(advertiser);
                        this.advertisers_data.push(advertiser);
                    });

                    this.paging_advertiser = data.paging;
                    this.loading_data_advertiser = false;
                }),
            );
        } else {
            this.advertisers_data = [];
            this.initial_load_advertiser = false;

            if (this.is_search || this.search_advertiser_data != '')
                this.loading_search_advertiser = true;
            else this.advertisers = [];

            if (this.search_advertiser_data.length == 0) this.advertisers = [];

            this.subscription.add(
                this._advertiser.get_advertisers_by_dealer_id(filters).subscribe((data) => {
                    if (!data.message) {
                        if (this.search_advertiser_data == '') {
                            data.advertisers.map((advertiser) => {
                                this.advertisers.push(advertiser);
                                this.advertisers_data.push(advertiser);
                            });
                        } else {
                            if (data.paging.entities.length > 0) {
                                this.advertisers_data = data.paging.entities;
                                this.loading_search_advertiser = false;
                            }
                        }

                        this.paging_advertiser = data.paging;
                    } else {
                        this.filter_data.advertiser.name = '';

                        if (this.search_advertiser_data != '') {
                            this.advertisers_data = [];
                            this.loading_search_advertiser = false;
                        }
                    }

                    this.loading_data_advertiser = false;
                    this.loading_search_advertiser = false;
                }),
            );
        }
    }

    private getDealers(page: number) {
        this.loading_data = true;

        if (page > 1) {
            this.subscription.add(
                this._dealer.get_dealers_with_page(page, '').subscribe((data) => {
                    data.dealers.map((dealer) => {
                        this.dealers.push(dealer);
                    });

                    this.paging = data.paging;
                    this.loading_data = false;
                }),
            );
        } else {
            if (this.is_search) this.loading_search = true;

            this.subscription.add(
                this._dealer.get_dealers_with_page(page, '').subscribe((data) => {
                    this.dealers = data.dealers;
                    this.dealers_data = data.dealers;
                    this.paging = data.paging;
                    this.loading_data = false;
                    this.loading_search = false;
                }),
            );
        }
    }

    private getHostByDealer(page: number): void {
        this.loading_data_host = true;

        if (page > 1) {
            this.subscription.add(
                this._host
                    .get_host_by_dealer_id(this.dealer_id, page, this.search_host_data)
                    .subscribe((data) => {
                        data.paging.entities.map((i) => {
                            this.hosts.push(i);
                            this.hosts_data.push(i);
                        });
                        this.paging_host = data.paging;
                        this.loading_data_host = false;
                    }),
            );
        } else {
            this.hosts_data = [];
            this.initial_load = false;

            if (this.is_search || this.search_host_data != '') this.loading_search_host = true;
            if (this.search_host_data.length == 0) this.hosts = [];

            this.subscription.add(
                this._host
                    .get_host_by_dealer_id(this.dealer_id, page, this.search_host_data)
                    .subscribe((data) => {
                        if (!data.message) {
                            if (this.search_host_data == '') {
                                data.paging.entities.map((host) => {
                                    this.hosts.push(host);
                                    this.hosts_data.push(host);
                                });
                            } else {
                                if (data.paging.entities.length > 0) {
                                    this.hosts_data = data.paging.entities;
                                    this.loading_search = false;
                                }
                            }

                            this.paging_host = data.paging;
                        } else {
                            this.filter_data.host.name = '';

                            if (this.search_host_data != '') {
                                this.hosts_data = [];
                                this.loading_search = false;
                            }
                        }
                        this.loading_data_host = false;
                        this.loading_search_host = false;
                    }),
            );
        }
    }

    private resetAutcompleteField(name: string): void {
        switch (name) {
            case 'host':
                this.host_id = null;
                this.filter_data.host.id = null;
                this.filter_data.host.name = null;
                this._helper.onResetAutocompleteField.next('host');
                break;
            case 'advertiser':
                this.advertiser_id = null;
                this.filter_data.advertiser.id = null;
                this.filter_data.advertiser.name = null;
                this._helper.onResetAutocompleteField.next('advertiser');
                break;
            default:
                this.dealer_id = null;
                this.filter_data.dealer.id = null;
                this.filter_data.dealer.id = null;
                this._helper.onResetAutocompleteField.next('dealer');
        }
    }

    private setDealer(): void {
        const { dealerId, dealerName } = this._dialog_data;
        this.dealer_id = dealerId;
        this.dealer_name = dealerName;
        this.dealerSelected(dealerId);
    }
}
