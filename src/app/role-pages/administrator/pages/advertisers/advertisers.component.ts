import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Workbook } from 'exceljs';
import { Subject, Subscription } from 'rxjs';
import { saveAs } from 'file-saver';
import { takeUntil } from 'rxjs/operators';

import { DEALER_UI_TABLE_ADVERTISERS, UI_DEALER_ADVERTISERS } from 'src/app/global/models';
import { AdvertiserService, DealerService, HelperService } from 'src/app/global/services';

@Component({
	selector: 'app-advertisers',
	templateUrl: './advertisers.component.html',
	styleUrls: ['./advertisers.component.scss']
})
export class AdvertisersComponent implements OnInit, OnDestroy {
	@Input() call_to_other_page: boolean = false;

	advertiser_table_column: any = {};
	advertiser_stats: any;
	advertisers_to_export: any = [];
	current_status_filter = 'active';
	title: string = 'Advertisers';
	paging_data: any;
	table_loading: boolean = true;
	no_advertiser: boolean = false;
	dealers_with_advertiser: any = [];
	subscription: Subscription = new Subscription();
	tab: any = { tab: 2 };
	filtered_data: any = [];
	searching: boolean = false;
	initial_load: boolean = true;
	search_data: string = '';
	search_field_placeholder = !this.call_to_other_page
		? 'Search Dealer Alias, Business Name, Contact Person or #Tag'
		: 'Search Advertiser Name or Business Name';
	sort_column: string = '';
	sort_order: string = '';
	workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

	protected _unsubscribe = new Subject<void>();

	constructor(private _advertiser: AdvertiserService, private _dealer: DealerService, private _helper: HelperService) {}

	ngOnInit() {
		this.pageRequested(1);
		this.getAdvertiserTotal();
		this.subscribeToStatusFilterClick();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getAdvertiserTotal() {
		this.subscription.add(
			this._advertiser.get_advertisers_total().subscribe((data) => {
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
					new_last_week_description: 'New last week'
				};
			})
		);
	}

	getColumnsAndOrder(data) {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.pageRequested(1);
	}

	pageRequested(page: number, pageSize?: number) {
		if (pageSize != 0) {
			this.searching = true;
			this.dealers_with_advertiser = [];
		}

		let status = this.current_status_filter === 'active' ? 'A' : 'I';
		if (this.current_status_filter === 'all') status = '';

		const filters = { page, status, search: this.search_data, sortColumn: this.sort_column, sortOrder: this.sort_order, pageSize: 15 };

		if (this.call_to_other_page) {
			this.advertiser_table_column = [
				{ name: '#', sortable: false, no_export: true },
				{ name: 'Name', sortable: true, column: 'Name', key: 'name' },
				{ name: 'Region', sortable: true, column: 'Region', key: 'region' },
				{ name: 'State', sortable: true, column: 'City', key: 'city' },
				{ name: 'Status', sortable: true, column: 'Status', key: 'status' },
				{ name: 'Dealer', sortable: true, column: 'BusinessName', key: 'businessName' }
			];
			this.subscription.add(
				this._advertiser.get_advertisers(filters).subscribe(
					(data) => {
						this.paging_data = data.paging;
						if (data.advertisers) {
							if (pageSize === 0) {
								this.advertisers_to_export = [...data.advertisers];
							} else {
								this.dealers_with_advertiser = this.advertiser_mapToUI(data.advertisers);
								this.filtered_data = this.advertiser_mapToUI(data.advertisers);
							}
						} else {
							if (pageSize === 0) {
								this.advertisers_to_export = [];
							} else {
								if (this.search_data == '') {
									this.no_advertiser = true;
								}
								this.filtered_data = [];
							}
						}
						if (pageSize === 0) {
							this.exportProcess();
						} else {
							this.searching = false;
							this.initial_load = false;
						}
					},
					(error) => {
						console.error(error);
					}
				)
			);
		} else {
			this.advertiser_table_column = [
				{ name: '#', sortable: false, no_export: true },
				{ name: 'Dealer Alias', sortable: true, column: 'DealerIdAlias', key: 'dealerIdAlias' },
				{ name: 'Business Name', sortable: true, column: 'BusinessName', key: 'businessName' },
				{ name: 'Contact Person', sortable: true, column: 'ContactPerson', key: 'contactPerson' },
				{ name: 'Advertiser Count', sortable: true, column: 'totalAdvertisers', key: 'totalAdvertisers' }
			];
			this.subscription.add(
				this._dealer.get_dealers_with_advertiser(page, this.search_data, this.sort_column, this.sort_order, pageSize).subscribe(
					(data) => {
						this.paging_data = data.paging;
						if (data.dealers) {
							if (pageSize === 0) {
								this.advertisers_to_export = [...data.dealers];
							} else {
								this.dealers_with_advertiser = this.dealer_mapToUI(data.dealers);
								this.filtered_data = this.dealer_mapToUI(data.dealers);
							}
						} else {
							if (pageSize === 0) {
								this.advertisers_to_export = [];
							} else {
								if (this.search_data == '') {
									this.no_advertiser = true;
								}
								this.filtered_data = [];
							}
						}
						if (pageSize === 0) {
							this.exportProcess();
						} else {
							this.searching = false;
							this.initial_load = false;
						}
					},
					(error) => {
						console.error(error);
					}
				)
			);
		}
	}

	exportProcess() {
		const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
		this.advertisers_to_export.forEach((item) => {
			this.worksheet.addRow(item).font = { bold: false };
		});

		let rowIndex = 1;

		for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
			this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
		}

		this.workbook.xlsx.writeBuffer().then((file: any) => {
			const blob = new Blob([file], { type: EXCEL_TYPE });
			const filename = 'Advertisers' + '.xlsx';
			saveAs(blob, filename);
		});

		this.workbook_generation = false;
	}

	filterData(data) {
		if (data) {
			this.search_data = data;
			this.pageRequested(1);
		} else {
			this.search_data = '';
			this.pageRequested(1);
		}
	}

	dealer_mapToUI(data) {
		let count = this.paging_data.pageStart;
		return data.map((i) => {
			return new UI_DEALER_ADVERTISERS(
				{ value: i.dealerId, link: null, editable: false, hidden: true },
				{ value: count++, link: null, editable: false, hidden: false },
				{
					value: i.dealerIdAlias ? i.dealerIdAlias : '--',
					link: '/administrator/dealers/' + i.dealerId,
					query: '2',
					editable: false,
					hidden: false,
					new_tab_link: true
				},
				{ value: i.businessName, link: '/administrator/dealers/' + i.dealerId, editable: false, hidden: false, new_tab_link: true },
				{ value: i.contactPerson, link: null, editable: false, hidden: false },
				{ value: i.totalAdvertisers, link: null, editable: false, hidden: false }
			);
		});
	}

	advertiser_mapToUI(data) {
		let count = this.paging_data.pageStart;
		return data.map((i) => {
			return new DEALER_UI_TABLE_ADVERTISERS(
				{ value: i.id, link: null, editable: false, hidden: true },
				{ value: count++, link: null, editable: false, hidden: false },
				{ value: i.name ? i.name : '--', link: '/administrator/advertisers/' + i.id, editable: false, hidden: false, new_tab_link: true },
				{ value: i.region, link: null, editable: false, hidden: false },
				{ value: i.state, link: null, editable: false, hidden: false },
				{ value: i.status, link: null, editable: false, hidden: false },
				{
					value: i.businessName ? i.businessName : '--',
					link: i.businessName ? '/administrator/dealers/' + i.dealerId : null,
					new_tab_link: true,
					editable: false,
					hidden: false
				}
			);
		});
	}

	getSearchLabel() {
		if (this.call_to_other_page) {
			return 'Search Advertiser Name or Business Name';
		} else {
			return 'Search Dealer Alias, Business Name, or #Tag';
		}
	}

	exportTable() {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('Advertisers View');
		Object.keys(this.advertiser_table_column).forEach((key) => {
			if (this.advertiser_table_column[key].name && !this.advertiser_table_column[key].no_export) {
				header.push({
					header: this.advertiser_table_column[key].name,
					key: this.advertiser_table_column[key].key,
					width: 30,
					style: { font: { name: 'Arial', bold: true } }
				});
			}
		});
		this.worksheet.columns = header;
		this.getDataForExport();
	}

	getDataForExport() {
		this.pageRequested(1, 0);
	}

	private subscribeToStatusFilterClick() {
		this._helper.onClickCardByStatus.pipe(takeUntil(this._unsubscribe)).subscribe((response) => {
			if (response.page !== 'advertisers') return;
			this.current_status_filter = response.value;
			this.pageRequested(1);
		});
	}
}
