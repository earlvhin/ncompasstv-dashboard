import { Component, OnInit, Input } from '@angular/core';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { API_DEALER } from '../../models/api_dealer.model';
import { Subscription } from 'rxjs';
import { UI_TABLE_DEALERS } from '../../models/ui_table_dealers.model';

@Component({
	selector: 'app-dealers-table',
	templateUrl: './dealers-table.component.html',
	styleUrls: ['./dealers-table.component.scss']
})

export class DealersTableComponent implements OnInit {

	active_tab: string ="DateCreated";
	active_filter_tab: string;
	dealers_data: UI_TABLE_DEALERS[];
	no_dealer: boolean = false;
	filtered_data:  UI_TABLE_DEALERS[] = [];
	items_per_page: number = 25;
	pagination: number;
	subscription: Subscription = new Subscription();
	searching: boolean = false;
	paging_data: any;
	initial_load: boolean = true;
	search_data: string = "";
	sortColumn: string = "";
	sortOrder: string = "desc";
	tooltip: string = "";

	filter = [
		{min_value: '0', max_value: '5', viewValue: '0-5'},
		{min_value: '6', max_value: '10', viewValue: '6-10'},
		{min_value: '11', max_value: '', viewValue: '11 and Above'},
		{min_value: '0', max_value: '', viewValue: 'Clear Filters for'}
	];

	selected_filter = {
		min_value: '',
		max_value: '',
		filter_column: ''
	}

	@Input() update_info: boolean;

	constructor(
		private _dealer: DealerService
	) { }

	ngOnInit() {
		this.getDealers();
		// this.sortByColumnName('DateCreated', 'desc');
	}

	ngOnChanges() {
		if(this.update_info) {
			this.ngOnInit();
		}
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	getDealers() {
		this.pageRequested(1);
	}

	pageRequested(e) {
		this.searching = true;
		this.dealers_data = [];
		this.subscription.add(
			this._dealer.get_dealers_with_sort(e, this.search_data, this.sortColumn, this.sortOrder, this.selected_filter.filter_column, this.selected_filter.min_value, this.selected_filter.max_value).subscribe(
				data => {
					this.initial_load = false;
					if (data.dealers) {
						this.dealers_data = this.mapToUIFormat(data.dealers);
						this.filtered_data = this.mapToUIFormat(data.dealers);
					} else {
						this.no_dealer = true;
						this.filtered_data = [];
					}
					this.paging_data = data.paging;
					this.searching = false;
				}
			)
		)
	}

	getPage(e) {
		this.pageRequested(e);
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

	mapToUIFormat(data): UI_TABLE_DEALERS[] {
		return data.map(
			dealer => {
				
				//Formula for Offline Licenses
				// let inactive_count = (dealer.licenses.length - dealer.licenses.filter(i => i.hostId == null).length) -  dealer.licenses.filter(i => i.piStatus == 1).length;
				
				return new UI_TABLE_DEALERS(
					dealer.dealerId,
					dealer.userId,
					dealer.dealerIdAlias ? dealer.dealerIdAlias : '--',
					dealer.businessName,
					dealer.owner,
					dealer.contactPerson,
					dealer.region,
					dealer.state,
					dealer.monthAsDealer,
					dealer.dealerStats.totalLicenses,
					dealer.dealerStats.totalLicensesInactive,
					dealer.dealerStats.totalLicensesOnline,
					dealer.dealerStats.totalLicensesOffline,
					0,
					dealer.dealerStats.totalHosts,
					dealer.dealerStats.totalHostsActive,
					dealer.dealerStats.totalAdvertisers,
					dealer.dealerStats.totalAdvertisersActive,
				)
			}
		)
	}
	
	onPageChange(page: number) {
		this.pagination = page;
		window.scrollTo(0, 0);
	}

	sortByColumnName(column, order) {
		this.active_tab = column;
		this.sortColumn = column;
		this.sortOrder = order;
		this.pageRequested(1);
	}

	filterByColumnName(column, min, max?) {
		console.log("COLUMN", column, min, max)
		this.active_filter_tab = column;
		this.selected_filter = {
			filter_column: column,
			min_value: min,
			max_value: max
		}
		if(column != "") {
			if(max != "") {
				this.tooltip = "Filtered by " + min + " to " + max;
			} else {
				this.tooltip = "Filtered by " + min + " and above ";
			}	
		}

		if(min == 0  && max == "") {
			this.active_filter_tab = "";
		}
		console.log("MAX",max)

		this.pageRequested(1);
	}
}
