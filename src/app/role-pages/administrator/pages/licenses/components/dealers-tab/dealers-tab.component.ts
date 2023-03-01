import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { API_DEALER, API_FILTERS, PAGING, UI_TABLE_LICENSE_BY_DEALER } from 'src/app/global/models';
import { DealerService } from 'src/app/global/services';

@Component({
	selector: 'app-dealers-tab',
	templateUrl: './dealers-tab.component.html',
	styleUrls: ['./dealers-tab.component.scss']
})
export class DealersTabComponent implements OnInit, OnDestroy {
	currentTableData: UI_TABLE_LICENSE_BY_DEALER[] = [];
	filters: API_FILTERS = { page: 1, pageSize: 15 };
	hasNoData = false;
	hasScrolled = false;
	isExporting = false;
	isPageReady = false;
	isPreloadDataReady = false;
	searchControl = new FormControl(null);
	tableColumns = this._tableColumns;

	private currentPaging: PAGING = null;
	private queuedForReset: UI_TABLE_LICENSE_BY_DEALER[] = [];
	private queuedTableData: UI_TABLE_LICENSE_BY_DEALER[] = [];
	protected _unsubscribe = new Subject<void>();

	constructor(private _datePipe: DatePipe, private _dealer: DealerService, private _titlePipe: TitleCasePipe) {}

	ngOnInit() {
		this.loadDealers().add(() => (this.queuedForReset = Array.from(this.currentTableData)));
		this.subscribeToDealerSearch();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	addToTable() {
		this.isPreloadDataReady = false;
		this.currentTableData = this.currentTableData.concat(this.queuedTableData);
		this.preloadDealers();
	}

	private loadDealers() {
		this.isPageReady = false;

		return this.getDealers().subscribe(
			(response) => {
				if ('message' in response || response.dealers.length === 0) {
					this.hasNoData = true;
					return;
				}

				this.currentPaging = response.paging;
				const mapped = this.mapToTableData(response.dealers);
				this.currentTableData = [...mapped];
				this.preloadDealers();
				this.isPageReady = true;
			},
			(error) => {
				this.isPageReady = true;
				throw new Error(error);
			}
		);
	}

	private getDealers() {
		return this._dealer.get_dealers_with_license(this.filters.page, this.filters.search).pipe(takeUntil(this._unsubscribe));
	}

	private mapToTableData(data: API_DEALER[]) {
		let count = this.currentPaging.pageStart;
		return data
			.filter((i) => i.licenses.length > 0)
			.map((dealer: API_DEALER) => {
				return new UI_TABLE_LICENSE_BY_DEALER(
					{ value: dealer.dealerId, link: null, editable: false, hidden: true },
					{ value: count++, link: null, editable: false, hidden: false },
					{
						value: dealer.dealerIdAlias ? dealer.dealerIdAlias : '--',
						link: `/administrator/dealers/${dealer.dealerId}`,
						query: '2',
						editable: false,
						hidden: false,
						new_tab_link: true
					},
					{
						value: this._titlePipe.transform(dealer.businessName),
						link: `/administrator/dealers/${dealer.dealerId}`,
						editable: false,
						hidden: false,
						new_tab_link: true
					},
					{ value: this._titlePipe.transform(dealer.contactPerson), link: null, editable: false, hidden: false },
					{ value: dealer.region, link: null, editable: false, hidden: false },
					{ value: dealer.city, link: null, editable: false, hidden: false },
					{ value: dealer.state, link: null, editable: false, hidden: false },
					{ value: dealer.licenses.length, link: null, editable: false, hidden: false },
					{
						value: dealer.licenses.length > 0 ? dealer.licenses.filter((i) => i.hostId != null).length : 0,
						link: null,
						editable: false,
						hidden: false
					},
					{
						value: dealer.licenses.length > 0 ? dealer.licenses.filter((i) => i.hostId == null).length : 0,
						link: null,
						editable: false,
						hidden: false
					},
					{
						value: dealer.licenses.length > 0 ? dealer.licenses.filter((i) => i.piStatus === 1).length : 0,
						link: null,
						editable: false,
						hidden: false,
						online_field: true
					},
					{
						value: dealer.licenses.length > 0 ? dealer.licenses.filter((i) => i.piStatus !== 1).length : 0,
						link: null,
						editable: false,
						hidden: false,
						offline_field: true
					},
					{
						value: dealer.licenses.length > 0 ? this._datePipe.transform(dealer.licenses[0].dateCreated) : '--',
						link: null,
						editable: false,
						hidden: false
					},
					{
						value:
							dealer.licenses.length > 0
								? dealer.licenses.filter(
										(i) => this._datePipe.transform(i.dateCreated) == this._datePipe.transform(dealer.licenses[0].dateCreated)
								  ).length
								: 0,
						link: null,
						editable: false,
						hidden: false
					}
				);
			});
	}

	private preloadDealers() {
		this.filters.page++;

		return this.getDealers().subscribe((response) => {
			if ('message' in response || response.dealers.length === 0) {
				this.isPreloadDataReady = true;
				return;
			}

			this.currentPaging = response.paging;
			this.queuedTableData = this.mapToTableData(response.dealers);
			this.filters.page = response.paging.page;
			this.isPreloadDataReady = true;
		});
	}

	private resetFilters(): void {
		this.filters = {
			page: 1,
			pageSize: 15
		};
	}

	private searchDealers() {
		this.getDealers().subscribe((response) => {
			if (response.dealers.length === 0) {
				this.hasNoData = true;
				return;
			}

			this.currentPaging = response.paging;
			this.currentTableData = this.mapToTableData(response.dealers);
			this.isPageReady = true;
		});
	}

	private subscribeToDealerSearch() {
		const control = this.searchControl;

		control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000)).subscribe((keyword: string) => {
			this.hasNoData = false;
			this.isPageReady = false;
			this.resetFilters();

			if (!keyword || keyword.trim().length === 0) {
				delete this.filters.search;
				this.currentTableData = [...this.queuedForReset];
				this.resetFilters();
				this.preloadDealers();
				setTimeout(() => (this.isPageReady = true), 1000);
				return;
			}

			this.filters.search = keyword;
			this.searchDealers();
			this.preloadDealers();
		});
	}

	protected get _tableColumns() {
		return [
			{ name: '#' },
			{ name: 'Dealer Alias' },
			{ name: 'Business Name' },
			{ name: 'Contact Person' },
			{ name: 'Region' },
			{ name: 'City' },
			{ name: 'State' },
			{ name: 'Total' },
			{ name: 'Active' },
			{ name: 'Inactive' },
			{ name: 'Online' },
			{ name: 'Offline' },
			{ name: 'Recent Purchase Date' },
			{ name: 'Quantity' }
		];
	}
}
