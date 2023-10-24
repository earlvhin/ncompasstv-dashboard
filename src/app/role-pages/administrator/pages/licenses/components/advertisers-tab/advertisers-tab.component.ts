import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { API_ADVERTISER, API_FILTERS, DEALER_UI_TABLE_ADVERTISERS, PAGING } from 'src/app/global/models';
import { AdvertiserService, ExportService } from 'src/app/global/services';

@Component({
	selector: 'app-advertisers-tab',
	templateUrl: './advertisers-tab.component.html',
	styleUrls: ['./advertisers-tab.component.scss']
})
export class AdvertisersTabComponent implements OnInit, OnDestroy {
	currentTableData: DEALER_UI_TABLE_ADVERTISERS[] = [];
	filters: API_FILTERS = { page: 1, pageSize: 15 };
	hasNoData = false;
	isExporting = false;
	isPageReady = false;
	isPreloadDataReady = false;
	searchControl = new FormControl(null);
	tableColumns = this._tableColumns;

	private currentPaging: PAGING = null;
	private queuedForReset: DEALER_UI_TABLE_ADVERTISERS[] = [];
	private queuedTableData: DEALER_UI_TABLE_ADVERTISERS[] = [];
	protected _unsubscribe = new Subject<void>();

	constructor(private _advertiser: AdvertiserService, private _export: ExportService) {}

	ngOnInit() {
		this.loadAdvertisers().add(() => (this.queuedForReset = Array.from(this.currentTableData)));
		this.subscribeToAdvertiserSearch();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	addToTable() {
		this.isPreloadDataReady = false;
		this.currentTableData = this.currentTableData.concat(this.queuedTableData);
		this.preloadAdvertisers();
	}

	exportTable() {
		this.isExporting = true;

		this.getAdvertisers('export').subscribe(async (response) => {
			const exportConfig = this._exportConfig;
			exportConfig[0].data = response.paging.entities;

			try {
				await this._export.generate('advertisers', exportConfig);
			} catch (error) {
				console.error(error);
			}

			this.isExporting = false;
		});
	}

	sortTable(data: { column: string; order: string }) {
		this.resetFilters();
		this.filters.sortColumn = data.column;
		this.filters.sortOrder = data.order;
		this.loadAdvertisers();
	}

	private getAdvertisers(type = 'default') {
		let filters = type === 'export' ? { page: 1, pageSize: 0 } : this.filters;
		return this._advertiser.get_advertisers(filters).pipe(takeUntil(this._unsubscribe));
	}

	private loadAdvertisers() {
		this.isPageReady = false;

		return this.getAdvertisers().subscribe((response) => {
			if (response.paging.entities.length === 0) {
				this.hasNoData = true;
				return;
			}

			this.currentPaging = response.paging;
			this.currentTableData = this.mapToDataTable(response.paging.entities);
			this.filters.page = response.paging.page;
			this.isPageReady = true;
			this.preloadAdvertisers();
		});
	}

	private mapToDataTable(data: API_ADVERTISER[]) {
		let count = this.currentPaging.pageStart;
		return data.map((i) => {
			return new DEALER_UI_TABLE_ADVERTISERS(
				{ value: i.id, link: null, editable: false, hidden: true },
				{ value: count++, link: null, editable: false, hidden: false },
				{ value: i.name ? i.name : '--', link: `/administrator/advertisers/${i.id}`, editable: false, hidden: false, new_tab_link: true },
				{ value: i.region, link: null, editable: false, hidden: false },
				{ value: i.state, link: null, editable: false, hidden: false },
				{ value: i.status, link: null, editable: false, hidden: false },
				{
					value: i.businessName ? i.businessName : '--',
					link: i.businessName ? `/administrator/dealers/${i.dealerId}` : null,
					new_tab_link: true,
					editable: false,
					hidden: false
				}
			);
		});
	}

	private preloadAdvertisers() {
		this.filters.page++;

		return this.getAdvertisers().subscribe((response) => {
			if (response.paging.entities.length === 0) {
				this.isPreloadDataReady = true;
				this.hasNoData = true;
				return;
			}

			this.currentPaging = response.paging;
			this.queuedTableData = this.mapToDataTable(response.paging.entities);
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

	private searchAdvertisers() {
		this.getAdvertisers().subscribe((response) => {
			if (response.paging.entities.length === 0) {
				this.isPageReady = true;
				this.hasNoData = true;
				return;
			}

			this.currentPaging = response.paging;
			this.currentTableData = this.mapToDataTable(response.paging.entities);
			this.isPageReady = true;
		});
	}

	private subscribeToAdvertiserSearch() {
		const control = this.searchControl;

		control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000)).subscribe((keyword: string) => {
			this.hasNoData = false;
			this.isPageReady = false;
			this.resetFilters();

			if (!keyword || keyword.trim().length === 0) {
				delete this.filters.search;
				this.currentTableData = [...this.queuedForReset];
				this.resetFilters();
				this.preloadAdvertisers();
				this.isPageReady = true;
				return;
			}

			this.filters.search = keyword;
			this.searchAdvertisers();
			this.preloadAdvertisers();
		});
	}

	protected get _exportConfig() {
		const columns = this._tableColumns
			.filter((column) => !column.exclude_from_export)
			.map((column) => {
				return {
					name: column.name,
					key: column.key
				};
			});

		return [{ name: 'advertisers', columns, data: [] }];
	}

	protected get _tableColumns() {
		return [
			{ name: '#', sortable: false, exclude_from_export: true },
			{ name: 'Name', sortable: true, column: 'Name', key: 'name' },
			{ name: 'Region', sortable: true, column: 'Region', key: 'region' },
			{ name: 'State', sortable: true, column: 'City', key: 'city' },
			{ name: 'Status', sortable: true, column: 'Status', key: 'status' },
			{ name: 'Dealer', sortable: true, column: 'BusinessName', key: 'businessName' }
		];
	}
}
