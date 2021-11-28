import { Component, OnInit, Input } from '@angular/core';
import { AdvertiserService } from '../../../../global/services/advertiser-service/advertiser.service'
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { Subscription } from 'rxjs';
import { UI_DEALER_ADVERTISERS } from 'src/app/global/models/ui_table_dealer-advertisers.model';
import { DEALER_UI_TABLE_ADVERTISERS } from 'src/app/global/models/ui_table_advertisers.model';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { API_ADVERTISER } from 'src/app/global/models/api_advertiser.model';

@Component({
	selector: 'app-advertisers',
	templateUrl: './advertisers.component.html',
	styleUrls: ['./advertisers.component.scss']
})
export class AdvertisersComponent implements OnInit {
    @Input() call_to_other_page: boolean = false;

    advertiser_table_column: any = {};
	advertiser_stats: any;
	title: string = "Advertisers";
	paging_data: any;
	table_loading: boolean = true;
	no_advertiser: boolean = false;
	dealers_with_advertiser: any = [];
	subscription: Subscription = new Subscription;
	tab: any = { tab: 2 };
	filtered_data: any = [];
	searching: boolean = false;
	initial_load: boolean = true;
	search_data: string = "";
	search_field_placeholder = !this.call_to_other_page ? 'Search Dealer Alias, Business Name, or #Tag' : 'Search Advertiser Name or Business Name';
    sort_column: string = '';
	sort_order: string = '';

	constructor(
		private _advertiser: AdvertiserService,
		private _dealer: DealerService,
	) { }

	ngOnInit() {
        console.log("OTHER", this.call_to_other_page)
		this.pageRequested(1);
		this.getAdvertiserTotal();
	}

	getAdvertiserTotal() {
		this.subscription.add(
			this._advertiser.get_advertisers_total().subscribe(
				data => {
					this.advertiser_stats = {
						basis: data.total,
						basis_label: 'Advertiser(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						new_this_week_value: data.newAdvertisersThisWeek,
						new_this_week_label: 'Advertiser(s)',
						new_this_week_description: 'New this week',
						new_last_week_value: data.newAdvertisersLastWeek,
						new_last_week_label: 'Advertiser(s)',
						new_last_week_description: 'New last week',
					}
				}
			)
		);
	}

    getColumnsAndOrder(data) {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.pageRequested(1);
	}

	pageRequested(e) {
		this.searching = true;
		this.dealers_with_advertiser = [];
		
        if(this.call_to_other_page) {
            this.advertiser_table_column = [
                { name: '#', sortable: false},
                { name: 'Name', sortable: true, column:'Name'},
                { name: 'Region', sortable: true, column:'Region'},
                { name: 'State', sortable: true, column:'City'},
                { name: 'Status', sortable: true, column:'Status'},
                { name: 'Dealer', sortable: true, column:'BusinessName'},
            ]
            this.subscription.add(
                this._advertiser.get_advertisers(e, this.search_data, this.sort_column, this.sort_order).subscribe(
                    data => {
                        this.paging_data = data.paging;
                        if(data.advertisers) {
                            this.dealers_with_advertiser = this.advertiser_mapToUI(data.advertisers);
                            this.filtered_data = this.advertiser_mapToUI(data.advertisers);
                        } else {
                            if(this.search_data == "") {
                                this.no_advertiser = true;
                            }
                            this.filtered_data = [];
                        }
                        this.searching = false;
                        this.initial_load = false;
                    },
                    error => {
                        console.log(error)
                    }
                )
            )
        } else {
            this.advertiser_table_column = [
                { name: '#', sortable: false},
                { name: 'Dealer Alias', sortable: true, column:'DealerIdAlias'},
                { name: 'Business Name', sortable: true, column:'BusinessName'},
                { name: 'Contact Person', sortable: true, column:'ContactPerson'},
                { name: 'Advertiser Count', sortable: true, column:'totalAdvertisers'},
            ]
            this.subscription.add(
                this._dealer.get_dealers_with_advertiser(e, this.search_data, this.sort_column, this.sort_order).subscribe(
                    data => {
                        this.paging_data = data.paging;
                        if(data.dealers) {
                            this.dealers_with_advertiser = this.dealer_mapToUI(data.dealers);
                            this.filtered_data = this.dealer_mapToUI(data.dealers);
                        } else {
                            if(this.search_data == "") {
                                this.no_advertiser = true;
                            }
                            this.filtered_data = [];
                        }
                        this.searching = false;
                        this.initial_load = false;
                    },
                    error => {
                        console.log(error)
                    }
                )
            )
        }
		
	}

	filterData(data) {
		if (data) {
			this.search_data = data;
			this.pageRequested(1);
		} else {
			this.search_data = "";
			this.pageRequested(1);
		}
	}

	dealer_mapToUI(data) {
		let count = this.paging_data.pageStart;
		return data.map(
			i => {
				return new UI_DEALER_ADVERTISERS(
					{ value: i.dealerId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: i.dealerIdAlias ? i.dealerIdAlias : '--',  link: '/administrator/dealers/' + i.dealerId,  query: '2', editable: false, hidden: false},
					{ value: i.businessName, link: '/administrator/dealers/' + i.dealerId , editable: false, hidden: false},
					{ value: i.contactPerson, link: null , editable: false, hidden: false},
					// { value: i.region, link: null , editable: false, hidden: false},
					// { value: i.city, link: null , editable: false, hidden: false},
					// { value: i.state, link: null , editable: false, hidden: false},
					{ value: i.totalAdvertisers, link: null , editable: false, hidden: false},
				)
			}
		)
	}
	
    advertiser_mapToUI(data) {
		let count = this.paging_data.pageStart;
		return data.map(
			i => {
				return new DEALER_UI_TABLE_ADVERTISERS(
					{ value: i.id, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: i.name ? i.name : '--',  link: '/administrator/advertisers/' + i.id, editable: false, hidden: false},
					{ value: i.region, link: null , editable: false, hidden: false},
					{ value: i.state, link: null , editable: false, hidden: false},
					{ value: i.status, link: null , editable: false, hidden: false},
                    { value: i.businessName ? i.businessName: '--', link: null , editable: false, hidden: false},
                )
			}
		)
	}

    getSearchLabel() {
        if(this.call_to_other_page) {
            return 'Search Advertiser Name or Business Name'
        } else {
            return 'Search Dealer Alias, Business Name, or #Tag'
        }
    }
}
