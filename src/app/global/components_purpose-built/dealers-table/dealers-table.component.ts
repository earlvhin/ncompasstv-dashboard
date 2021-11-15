import { Component, OnInit, Input } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { DealerService } from '../../services/dealer-service/dealer.service';
import { HelperService } from '../../services/helper-service/helper.service';
import { UI_TABLE_DEALERS } from '../../models/ui_table_dealers.model';
import { ActivatedRoute } from '@angular/router';

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
    inactive_filter: boolean = false;
	items_per_page: number = 25;
    offline_filter: boolean = false;
	pagination: number;
	searching: boolean = false;
	paging_data: any;
	initial_load: boolean = true;
	search_data: string = '';
	sortColumn: string = '';
	sortOrder: string = 'desc';
	tooltip: string = '';
    ongoing_filter: boolean = false;

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

    filters: any = {
        label_age:"",
        label_inactive:"",
        label_offline: "",
        percentage:"",
        percentage_min:"",
        percentage_max:""
    }


	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _route: ActivatedRoute,
		private _dealer: DealerService,
		private _helper: HelperService,
	) { }

	ngOnInit() {
		this.subscribeToDealerStatusFilter();
		// Saved Page on URL
		this._route.queryParams.subscribe(params => {
			let saved_page = params['page'];
			this.getDealers(parseInt(saved_page));
		})
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

    filterTable(type: string, min: any, max: any, label?) {
        this.ongoing_filter = true;
        switch(type) {
            case 'monthAsDealer':
                this.filters.label_age = label;
                this.filterByColumnName(type, min, max);
                break;
            case 'inactiveLicensesPercent':
                this.filters.percentage = type;
                this.filters.percentage_min = min;
                this.filters.percentage_max = max;
                this.filters.label_inactive = label;
                this.inactive_filter = true;
                break;
            case 'offlineLicensesPercent':
                this.filters.percentage = type;
                this.filters.percentage_min = min;
                this.filters.percentage_max = max;
                this.filters.label_offline = label;
                this.offline_filter = true;
                break;
            default:
        }

        this.getDealers(1);
    }

    clearFilter() {
        this.filters = {
            label_age:"",
            label_inactive:"",
            label_offline: "",
            percentage:"",
            percentage_min:"",
            percentage_max:""
        }
        this.offline_filter = false;
        this.inactive_filter = false;
        this.active_filter_tab = "";
        this.selected_filter = {
            min_value: '',
            max_value: '',
            filter_column: '',
            status: ''
        };
        this.getDealers(1);
    }

	getDealers(page?: number): void {
		if (page) {
			this.pageRequested(page);
			return
		}

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
        const percentage_column = this.filters.percentage;
        const percentage_min = this.filters.percentage_min;
        const percentage_max = this.filters.percentage_max;

		this._dealer.get_dealers_with_sort(page, data, sort, order, filter_column, min, max, status, percentage_column, percentage_min, percentage_max)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
                    this.ongoing_filter = false;
					this.initial_load = false;
					this.paging_data = response.paging;

					if (!response.paging.entities) {
						this.filtered_data = [];
						this.no_dealer = true;
						return;
					}

					this.dealers_data = this.mapToUIFormat(response.paging.entities);
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
					dealer.totalLicenses,
					dealer.totalLicensesInactive,
					dealer.totalLicensesOnline,
					dealer.totalLicensesOffline,
					dealer.totalScheduled,
					dealer.totalHosts,
					dealer.totalHostsActive,
					dealer.totalAdvertisers,
					dealer.totalAdvertisersActive,
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
