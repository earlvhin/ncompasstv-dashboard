import { Component, OnInit, Input } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { DealerService } from '../../services/dealer-service/dealer.service';
import { HelperService } from '../../services/helper-service/helper.service';
import { UI_TABLE_DEALERS } from '../../models/ui_table_dealers.model';

@Component({
	selector: 'app-dealers-table',
	templateUrl: './dealers-table.component.html',
	styleUrls: ['./dealers-table.component.scss']
})

export class DealersTableComponent implements OnInit {

	@Input() update_info: boolean;
	active_tab: string = 'DateCreated';
	active_filter_tab: string;
	dealers_data: UI_TABLE_DEALERS[];
	no_dealer: boolean = false;
	filtered_data:  UI_TABLE_DEALERS[] = [];
	items_per_page: number = 25;
	pagination: number;
	searching: boolean = false;
	paging_data: any;
	initial_load: boolean = true;
	search_data: string = '';
	sortColumn: string = '';
	sortOrder: string = 'desc';
	tooltip: string = '';

	filter = [
		{min_value: '0', max_value: '5', viewValue: '0-5'},
		{min_value: '6', max_value: '10', viewValue: '6-10'},
		{min_value: '11', max_value: '', viewValue: '11 and Above'},
		{min_value: '0', max_value: '', viewValue: 'Clear Filters for'}
	];

	selected_filter = {
		min_value: '',
		max_value: '',
		filter_column: '',
		status: ''
	};

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _dealer: DealerService,
		private _helper: HelperService,
	) { }

	ngOnInit() {
		this.getDealers();
		this.subscribeToDealerStatusFilter();
	}

	ngOnChanges() {
		if (this.update_info) this.ngOnInit();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	filterByColumnName(column: string, min, max?, status?: string): void {
		this.active_filter_tab = column;

		this.selected_filter = {
			filter_column: column,
			min_value: min,
			max_value: max,
			status: status
		};

		if (column != '') {

			if (max != '') this.tooltip = `Filtered by ${min} to ${max}`;
			else this.tooltip = `Filtered by ${min} and above`;

		}

		if (min == 0  && max == '') this.active_filter_tab = '';

		this.pageRequested(1);

	}

	filterData(key: string): void {

		let keyword = '';

		if (key) {
			keyword = key;
		}
		
		this.search_data = keyword;
		this.pageRequested(1);

	}

	getDealers(): void {
		this.pageRequested(1);
	}

	onPageChange(page: number): void {
		this.pagination = page;
		window.scrollTo(0, 0);
	}

	pageRequested(page: number): void {

		this.searching = true;
		this.dealers_data = [];
		const data = this.search_data;
		const sort = this.sortColumn;
		const order = this.sortOrder;
		const filter_column = this.selected_filter.filter_column;
		const min = this.selected_filter.min_value;
		const max = this.selected_filter.max_value;
		const status = this.selected_filter.status;

		this._dealer.get_dealers_with_sort(page, data, sort, order, filter_column, min, max, status)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					this.initial_load = false;
					this.paging_data = response.paging;

					if (!response.dealers) {
						this.filtered_data = [];
						this.no_dealer = true;
						return;
					}

					this.dealers_data = this.mapToUIFormat(response.dealers);
					this.filtered_data = this.dealers_data;

				},
				error => console.log('Error retrieving dealers', error)
			).add(
				() => this.searching = false
			);

	}

	sortByColumnName(column: string, order: string): void {
		this.active_tab = column;
		this.sortColumn = column;
		this.sortOrder = order;
		this.pageRequested(1);
	}


	private mapToUIFormat(data: any[]): UI_TABLE_DEALERS[] {
        let count = this.paging_data.pageStart;

		return data.map(
			dealer => {	
				// Formula for Offline Licenses
				// let inactive_count = (dealer.licenses.length - dealer.licenses.filter(i => i.hostId == null).length) -  dealer.licenses.filter(i => i.piStatus == 1).length;
				
				return new UI_TABLE_DEALERS(
                    count++,
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
		);
	}

	private subscribeToDealerStatusFilter(): void {

		this._helper.onClickActiveDealers.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					if (this.searching) return;
					this.selected_filter.status = 'A';
					this.pageRequested(1);
				}
			);

		this._helper.onClickInactiveDealers.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					if (this.searching) return;
					this.selected_filter.status = 'C';
					this.pageRequested(1);
				}
			);

		this._helper.onClickAllDealers.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					if (this.searching) return;
					this.selected_filter.status = '';
					this.pageRequested(1);
				}
			);

	}
}
