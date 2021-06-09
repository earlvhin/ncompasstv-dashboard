import { Component, OnInit } from '@angular/core';
import { AdvertiserService } from '../../../../global/services/advertiser-service/advertiser.service'
import { Subscription } from 'rxjs';
import { UI_TABLE_ADVERTISERS } from 'src/app/global/models/ui_table_advertisers.model';
import { AuthService } from '../../../../global/services/auth-service/auth.service';

@Component({
	selector: 'app-advertisers',
	templateUrl: './advertisers.component.html',
	styleUrls: ['./advertisers.component.scss']
})
export class AdvertisersComponent implements OnInit {
	advertiser_data:any = [];
	advertiser_filtered_data: any = [];
	advertiser_stats:any;
	advertiser_table_column = [
		'#',
		'Business Name',
		'Region',
		'City',
		'State',
		'Status'
	]
	filtered_data: UI_TABLE_ADVERTISERS[] = [];
	initial_load_advertiser: boolean = true;
	no_advertisers: boolean = false;
	table_loading: boolean = true;
	paging_data_advertiser: any;
	searching_advertiser: boolean = false;
	search_data_advertiser: string = "";
	subscription: Subscription = new Subscription;
	tab: any = { tab: 2 };
	title: string = "Advertisers";
	
	constructor(
		private _advertiser: AdvertiserService,
		private _auth: AuthService
	) { }

	ngOnInit() {
		this.getAdvertiserByDealer(1);
		this.getAdvertiserTotal(this._auth.current_user_value.roleInfo.dealerId);
	}

	getAdvertiserTotal(id) {
		this.subscription.add(
			this._advertiser.get_advertisers_total_by_dealer(id).subscribe(
				data => {
					console.log(data)
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
	
	advertiserFilterData(e) {
		if (e) {
			this.search_data_advertiser = e;
			this.getAdvertiserByDealer(1);
		} else {
			this.search_data_advertiser = "";
			this.getAdvertiserByDealer(1);
		}
	}

	getAdvertiserByDealer(page) {
		this.searching_advertiser = true;
		this.subscription.add(
			this._advertiser.get_advertisers_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_data_advertiser).subscribe(
				data => {
					this.initial_load_advertiser = false;
					this.searching_advertiser = false;
                    this.paging_data_advertiser = data.paging;
					if(!data.message) {
						this.advertiser_data = this.advertiser_mapToUI(data.advertisers);
						this.advertiser_filtered_data = this.advertiser_mapToUI(data.advertisers);
					} else {
						if(this.search_data_advertiser == "") {
							this.no_advertisers = true;
						}
						this.advertiser_data=[];
						this.advertiser_filtered_data = [];
					}
				}
			)
		)
	}

	advertiser_mapToUI(data): UI_TABLE_ADVERTISERS[]  {
		let count = this.paging_data_advertiser.pageStart;
		return data.map(
			i => {
				return new UI_TABLE_ADVERTISERS(
					{ value: i.id, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: i.name, link: '/sub-dealer/advertisers/' + i.id, editable: false, hidden: false},
					{ value: i.region ? i.region : '--', link: null, editable: false, hidden: false},
					{ value: i.city ? i.city : '--', link: null, editable: false, hidden: false},
					{ value: i.state ? i.state : '--', link: null, editable: false, hidden: false},
					{ value: i.status, link: null, editable: false, hidden: false},
				)
			}
		)
	}
}
