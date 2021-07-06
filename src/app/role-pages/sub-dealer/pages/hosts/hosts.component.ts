import { Component, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common'
import { Observable, Subscription } from 'rxjs';

import { API_HOST } from '../../../../global/models/api_host.model';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { API_DEALER } from '../../../../global/models/api_dealer.model';
import { HostService } from '../../../../global/services/host-service/host.service';
import { UI_DEALER_HOSTS } from '../../../../global/models/ui_dealer_hosts.model';

@Component({
	selector: 'app-hosts',
	templateUrl: './hosts.component.html',
	styleUrls: ['./hosts.component.scss'],
	providers: [TitleCasePipe]
})

export class HostsComponent implements OnInit {
	dealers_info: API_DEALER;
	dealers$: Observable<API_DEALER[]>;
	combined_data: API_HOST[];
	combined_data_array = [];
	hosts_data: UI_DEALER_HOSTS[] = [];
	filtered_data: any = [];
	hosts$: Observable<API_HOST[]>;
	subscription: Subscription = new Subscription();
	host_count: any;
	no_host: boolean = false;

	searching: boolean = false;
	host_data: any = [];
	host_filtered_data: any = [];
	temp_array: any = [];
	search_data: string = "";
	initial_load: boolean = true;
	no_hosts: boolean = false;
	paging_data: any;
	is_view_only = false;

	// UI Table Column Header
	host_table_column: string[] = [
		'#',
		'Name',
		'Address',
		'City',
		'Postal Code',
		'Number of Licenses',
		'Category',
		'Status',
	];

	constructor(
		private _auth: AuthService,
		private _host: HostService,
		private _title: TitleCasePipe
	) { }

	ngOnInit() {
		this.getHosts(1);
		this.getTotalCount(this._auth.current_user_value.roleInfo.dealerId);
		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	filterData(data) {
		this.filtered_data = data;
	}

	getTotalCount(id) {
		this.subscription.add(
			this._host.get_host_total_per_dealer(id).subscribe(
				(data: any) => {
					this.host_count = {
						basis: data.total,
						basis_label: 'Host(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						new_this_week_value: data.newHostsThisWeek,
						new_this_week_label: 'Host(s)',
						new_this_week_description: 'New this week',
						new_last_week_value: data.newHostsLastWeek,
						new_last_week_label: 'Host(s)',
						new_last_week_description: 'New last week'
					}
				}
			)
		)
	}

	hostFilterData(e) {
		if (e) {
			this.search_data = e;
			this.getHosts(1);
		} else {
			this.search_data = "";
			this.getHosts(1);
		}
	}

	getHosts(page) {
		this.searching = true;
		this.host_data = [];
		this.host_filtered_data = [];
		this.temp_array = [];

		this.subscription.add(
			this._host.get_host_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_data).subscribe(
				data => {
					this.initial_load = false;
					this.searching = false;
                    this.paging_data = data.paging;
					if(!data.message) {
						this.host_data = this.hosts_mapToUIFormat(data.paging.entities);
						this.host_filtered_data = this.hosts_mapToUIFormat(data.paging.entities);
					} else {
						if(this.search_data == "") {
							this.no_hosts = true;
						}
						this.host_data=[];
						this.host_filtered_data = [];
					}
				}
			)
		);
	}

	hosts_mapToUIFormat(data) {
		let count = this.paging_data.pageStart;
		return data.map(
			hosts => {
				return new UI_DEALER_HOSTS(
					{ value: hosts.hostId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: hosts.name, link: '/sub-dealer/hosts/' + hosts.hostId, editable: false, hidden: false},
					{ value: hosts.address, link: null, editable: false, hidden: false},
					{ value: hosts.city, link: null, editable: false, hidden: false},
					{ value: hosts.postalCode, link: null, editable: false, hidden: false},
					{ value: hosts.totalLicenses, link: null, editable: false, hidden: false},
					{ value: hosts.category ? this._title.transform(hosts.category.replace(/_/g , " ")) : '--', link: null, editable: false, hidden: false},
					{ value: hosts.status ? (hosts.status === 'A' ? 'Active' : 'Inactive') : 'Inactive', link: null, editable: false, hidden: false},
				)
			}
		)
	}

	private get currentUser() {
		return this._auth.current_user_value;
	}
}