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

@Component({
    selector: 'app-user-sort-modal',
    templateUrl: './user-sort-modal.component.html',
    styleUrls: ['./user-sort-modal.component.scss'],
})
export class UserSortModalComponent implements OnInit {
    advertiser_id: string;
    advertisers: API_ADVERTISER[] = [];
    advertisers_data: Array<any> = [];
    dealers: API_DEALER[];
    dealerid: string;
    dealer_id: string;
    dealer_name: string;
    dealers_data: Array<any> = [];
    filter_data: any = {
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
    host_id: string;
    hosts: API_HOST[] = [];
    hosts_data: Array<any> = [];
    initial_load: boolean = false;
    initial_load_advertiser: boolean = false;
    is_dealer: boolean = false;
    is_search: boolean = false;
    is_license: boolean = false;
    loading_data: boolean = true;
    loading_data_advertiser: boolean = true;
    loading_data_host: boolean = true;
    loading_search: boolean = false;
    loading_search_advertiser: boolean = false;
    loading_search_host: boolean = false;
    no_dealers: boolean;
    paging: any;
    paging_advertiser: any;
    paging_host: any;
    search_advertiser_data: string = '';
    search_host_data: string = '';
    selected_dealer: any;
    subscription: Subscription = new Subscription();
    temp_array: any = [];

    constructor(
        private _dealer: DealerService,
        private _host: HostService,
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit() {
        if (this.data && (this.data == 'license' || this.data.view == 'license')) {
            this.is_license = true;

            if (this.data.is_dealer) {
                this.is_dealer = true;
                this.dealer_id = this.data.dealer_id;
                this.dealer_name = this.data.dealer_name;
                this.dealerSelected(this.data.dealer_id);
            }
        }

        const roleId = this._auth.current_user_value.role_id;
        const dealerRole = UI_ROLE_DEFINITION.dealer;
        const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

        if (roleId === dealerRole || roleId === subDealerRole) {
            this.is_dealer = true;
            this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
            this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
            this.dealerSelected(this.dealer_id);
        }

        this.getDealers(1);
    }

    advertiserSelected(e) {
        this.advertiser_id = e;
        this.filter_data.advertiser.id = e;
        this.subscription.add(
            this._advertiser.get_advertiser_by_id(e).subscribe((data) => {
                this.filter_data.advertiser.name = data.advertiser.name;
            }),
        );
    }

    dealerSelected(e) {
        if (!this.is_dealer) {
            var dealer_selected = this.dealers.filter((i) => {
                return i.dealerId == e;
            });
            this.dealer_id = e;
            this.selected_dealer = dealer_selected[0];
            this.filter_data.dealer.id = this.selected_dealer.dealerId;
            this.filter_data.dealer.name = this.selected_dealer.businessName;
        } else {
            this.subscription.add(
                this._dealer.get_dealer_by_id(e).subscribe((data) => {
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

    hostSelected(e) {
        this.host_id = e;
        this.filter_data.host.id = e;
        this.subscription.add(
            this._host.get_host_by_id(e).subscribe((data: any) => {
                this.filter_data.host.name = data.host.name;
            }),
        );
    }

    searchData(e) {
        this.loading_search = true;
        this.subscription.add(
            this._dealer.get_search_dealer(e).subscribe((data) => {
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

    getDealers(e) {
        this.loading_data = true;
        if (e > 1) {
            this.subscription.add(
                this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
                    data.dealers.map((i) => {
                        this.dealers.push(i);
                    });
                    this.paging = data.paging;
                    this.loading_data = false;
                }),
            );
        } else {
            if (this.is_search) {
                this.loading_search = true;
            }
            this.subscription.add(
                this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
                    this.dealers = data.dealers;
                    this.dealers_data = data.dealers;
                    this.paging = data.paging;
                    this.loading_data = false;
                    this.loading_search = false;
                }),
            );
        }
    }

    searchBoxTrigger(event) {
        this.is_search = event.is_search;
        if (this.paging.hasNextPage || this.is_search) {
            this.getDealers(event.page);
        }
    }

    hostSearchBoxTrigger(event) {
        this.is_search = event.is_search;
        if (this.is_search) {
            this.search_host_data = '';
        }
        if (this.paging_host.hasNextPage || this.is_search) {
            this.getHostByDealer(event.page);
        }
    }

    advertiserSearchBoxTrigger(event) {
        this.is_search = event.is_search;
        if (this.is_search) {
            this.search_advertiser_data = '';
        }
        if (this.paging_advertiser.hasNextPage || this.is_search) {
            this.getAdvertiserByDealer(event.page);
        }
    }

    searchHostData(e) {
        this.search_host_data = e;
        this.getHostByDealer(1);
    }

    searchAdvertiserData(e) {
        this.search_advertiser_data = e;
        this.getAdvertiserByDealer(1);
    }

    getHostByDealer(e) {
        this.loading_data_host = true;
        if (e > 1) {
            this.subscription.add(
                this._host
                    .get_host_by_dealer_id(this.dealer_id, e, this.search_host_data)
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
            if (this.is_search || this.search_host_data != '') {
                this.loading_search_host = true;
            }
            if (this.search_host_data.length == 0) {
                this.hosts = [];
            }
            this.subscription.add(
                this._host
                    .get_host_by_dealer_id(this.dealer_id, e, this.search_host_data)
                    .subscribe((data) => {
                        if (!data.message) {
                            if (this.search_host_data == '') {
                                data.paging.entities.map((i) => {
                                    this.hosts.push(i);
                                    this.hosts_data.push(i);
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

    getAdvertiserByDealer(page: number) {
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
                    data.advertisers.map((i) => {
                        this.advertisers.push(i);
                        this.advertisers_data.push(i);
                    });
                    this.paging_advertiser = data.paging;
                    this.loading_data_advertiser = false;
                }),
            );
        } else {
            this.advertisers_data = [];
            this.initial_load_advertiser = false;
            if (this.is_search || this.search_advertiser_data != '') {
                this.loading_search_advertiser = true;
            } else {
                this.advertisers = [];
            }
            if (this.search_advertiser_data.length == 0) {
                this.advertisers = [];
            }
            this.subscription.add(
                this._advertiser.get_advertisers_by_dealer_id(filters).subscribe((data) => {
                    if (!data.message) {
                        if (this.search_advertiser_data == '') {
                            data.advertisers.map((i) => {
                                this.advertisers.push(i);
                                this.advertisers_data.push(i);
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
}
