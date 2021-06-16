import { Component, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { API_HOST } from '../../../../global/models/api_host.model';
import { API_DEALER } from '../../../../global/models/api_dealer.model';
import { HostService } from '../../../../global/services/host-service/host.service';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { UI_TABLE_HOSTS_BY_DEALER } from '../../../../global/models/ui_table_hosts-by-dealer.model';

@Component({
	selector: 'app-hosts',
	templateUrl: './hosts.component.html',
	styleUrls: ['./hosts.component.scss']
})

export class HostsComponent implements OnInit {
	dealers_data: UI_TABLE_HOSTS_BY_DEALER[] = [];
	filtered_data: any = [];
	hosts$: Observable<API_HOST[]>;
	no_dealer: boolean = false;
	subscription: Subscription = new Subscription();
	tab: any = { tab: 1 };
	title: string = "Hosts by Dealer";
	host_details : any;
	paging_data: any;
	searching: boolean = false;
	initial_load: boolean = true;
	search_data: string = "";

	// UI Table Column Header
	host_table_column: string[] = [
		'#',
		'Dealer Alias',
		'Business Name',
		'Contact Person',
		// 'Region',
		// 'City',
		// 'State',
		'Total',
		'Active',
		'To Install',
		'Recently Added Host'
	]

	constructor(
		private _host: HostService,
		private _dealer: DealerService
	) { }

	ngOnInit() {
		this.pageRequested(1);
		this.getHostTotal();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	filterData(key) {
		if (key) {
			this.search_data = key;
			this.pageRequested(1);
		} else {
			this.search_data = "";
			this.pageRequested(1);
		}
	}

	getHostTotal() {
		this.subscription.add(
			this._host.get_host_total().subscribe(
				(data: any) => {
					this.host_details = {
						basis: data.total,
						basis_label: 'Host(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						new_this_week_value: data.newHostsThisWeek,
						new_this_week_value_label: 'Host(s)',
						new_this_week_value_description: 'New this week',
						new_last_week_value: data.newHostsLastWeek,
						new_last_week_value_label: 'Host(s)',
						new_last_week_value_description: 'New last week'
					}					
				}
			)
		)
	}

	pageRequested(e) {
		this.dealers_data = [];
		this.searching = true;
		this.subscription.add(
			this._dealer.get_dealers_with_host(e, this.search_data).subscribe(
				data => {
					this.initial_load = false;
					this.searching = false;
					this.setData(data)
				}
			)
		)
	}

	setData(data) {
        this.paging_data = data.paging;
		if (data.dealers) {
			this.dealers_data = this.dealers_mapToUIFormat(data.dealers);
			this.filtered_data = this.dealers_mapToUIFormat(data.dealers);
		} else {
			this.no_dealer = true;
			this.filtered_data = [];
		}
	}

	dealers_mapToUIFormat(data: API_DEALER[]): UI_TABLE_HOSTS_BY_DEALER[] {
		let count = this.paging_data.pageStart;
		return data.filter(
			(dealer: API_DEALER) => {
				if (dealer.hosts.length > 0) {
					return dealer;
        		}
			}
		).map(
			(dealer: API_DEALER) => {
				if(dealer.hosts) {
					return new UI_TABLE_HOSTS_BY_DEALER(
						{ value: dealer.dealerId, link: null , editable: false, hidden: true},
						{ value: count++, link: null , editable: false, hidden: false},
						{ value: dealer.dealerIdAlias ? dealer.dealerIdAlias : '--', link: '/administrator/dealers/' +  dealer.dealerId, editable: false, hidden: false},
						{ value: dealer.businessName, link: '/administrator/dealers/' +  dealer.dealerId, editable: false, hidden: false},
						{ value: dealer.contactPerson, link: null, editable: false, hidden: false},
						// { value: dealer.region, link: null, editable: false, hidden: false},
						// { value: dealer.city, link: null, editable: false, hidden: false},
						// { value: dealer.state, link: null, editable: false, hidden: false},
						{ value: dealer.hosts.length, link: null, editable: false, hidden: false},
						{ value: dealer.activeHost, link: null, editable: false, hidden: false},
						{ value: dealer.forInstallationHost, link: null, editable: false, hidden: false},
						{ value: dealer.hosts[0] ? dealer.hosts[0].name : '---', link: dealer.hosts[0] ? '/administrator/hosts/' +  dealer.hosts[0].hostId : null, editable: false, hidden: false},
					)
				} else {
					return new UI_TABLE_HOSTS_BY_DEALER(
						{ value: dealer.dealerId, link: null , editable: false, hidden: true},
						{ value: count++, link: null , editable: false, hidden: false},
						{ value: dealer.dealerIdAlias ? dealer.dealerIdAlias : '--', link: '/administrator/dealers/' + dealer.dealerId, editable: false, hidden: false},
						{ value: dealer.businessName, link: '/administrator/dealers/' +  dealer.dealerId, editable: false, hidden: false},
						{ value: dealer.contactPerson, link: null, editable: false, hidden: false},
						// { value: dealer.region, link: null, editable: false, hidden: false},
						// { value: dealer.city, link: null, editable: false, hidden: false},
						// { value: dealer.state, link: null, editable: false, hidden: false},
						{ value: 0, link: null , editable: false, hidden: false},
						{ value: dealer.activeHost, link: null, editable: false, hidden: false},
						{ value: dealer.forInstallationHost, link: null, editable: false, hidden: false},
						{ value: '--', link: null, editable: false, hidden: false},
					)
				}
			}
		)
	}
}
