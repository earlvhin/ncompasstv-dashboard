import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

import { AuthService, AdvertiserService } from 'src/app/global/services';
import { API_ADVERTISER, PAGING, UI_ADVERTISER } from 'src/app/global/models';
@Component({
	selector: 'app-advertisers',
	templateUrl: './advertisers.component.html',
	styleUrls: ['./advertisers.component.scss']
})
export class AdvertisersComponent implements OnInit, OnDestroy {
	@Input() no_header: boolean = false;
	advertiser_stats: any;
	advertisers_to_export: any = [];
	base_url = `/${this.currentRole}/advertisers`;
	initial_load_advertiser = true;
	is_searching = false;
	is_view_only = false;
	no_advertisers = false;
	paging_data: PAGING;
	tab: any = { tab: 2 };
	table = { columns: [], data: [] as UI_ADVERTISER[] };
	title: string = 'Advertisers';
	workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

	private keyword = '';
	protected _unsubscribe = new Subject<void>();

	constructor(private _advertiser: AdvertiserService, private _auth: AuthService) {}

	ngOnInit() {
		this.table.columns = [
			{ name: '#', no_export: true },
			{ name: 'Name', key: 'name', column: 'name' },
			{ name: 'Total Assets', key: 'category' },
			{ name: 'Address', key: 'address' },
			{ name: 'City', key: 'city' },
			{ name: 'State', key: 'state' },
			{ name: 'Status', key: 'status' },
			{ name: 'Postal Code', key: 'postalCode' }
		];
		this.getAdvertiserByDealer(1);
		this.getAdvertiserTotal(this.currentDealerId);
		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	exportTable(): void {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('ADVERTISERS');

		Object.keys(this.table.columns).forEach((key) => {
			if (this.table.columns[key].name && !this.table.columns[key].no_export) {
				header.push({
					header: this.table.columns[key].name,
					key: this.table.columns[key].key,
					width: 30,
					style: { font: { name: 'Arial', bold: true } }
				});
			}
		});

		this.worksheet.columns = header;
		this.getDataForExport();
	}

	private getDataForExport(): void {
		this.getAdvertiserByDealer(1, 0);
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

	getAdvertiserByDealer(page, pageSize = 15) {
		if (pageSize != 0) {
			this.is_searching = true;
		}

		this._advertiser.get_advertisers_by_dealer_id(this.currentDealerId, page, this.keyword, '', '', pageSize).subscribe((data) => {
			if (data.message) {
				if (pageSize === 0) {
					this.advertisers_to_export = [];
				} else {
					this.initial_load_advertiser = false;
					this.table.data = [];
					if (this.keyword === '') this.no_advertisers = true;
					return;
				}
			} else {
				if (pageSize === 0) {
					this.advertisers_to_export = [...data.advertisers];
				} else {
					this.paging_data = data.paging;
					const advertisers = this.mapToDataTable(data.advertisers);
					this.table.data = [...advertisers];
				}
			}
			if (pageSize === 0) {
				this.exportProcess();
			} else {
				this.initial_load_advertiser = false;
				this.is_searching = false;
			}
		});
	}

	onSearchAdvertiser(keyword: string) {
		if (keyword) this.keyword = keyword;
		else this.keyword = '';
		this.getAdvertiserByDealer(1);
	}

	private getAdvertiserTotal(id) {
		this._advertiser
			.get_advertisers_total_by_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data) => {
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
			});
	}

	private mapToDataTable(data: API_ADVERTISER[]): UI_ADVERTISER[] {
		let count = this.paging_data.pageStart;

		return data.map((advertiser) => {
			return {
				advertiserId: { value: advertiser.id, link: null, editable: false, hidden: true },
				index: { value: count++, link: null, editable: false, hidden: false },
				name: { value: advertiser.name, link: `${this.base_url}/${advertiser.id}`, editable: false, hidden: false },
				totalAssets: { value: advertiser.totalAssets },
				address: { value: advertiser.address },
				city: { value: advertiser.city ? advertiser.city : '--', link: null, editable: false, hidden: false },
				state: { value: advertiser.state ? advertiser.state : '--', link: null, editable: false, hidden: false },
				status: { value: advertiser.status, link: null, editable: false, hidden: false },
				postalCode: { value: advertiser.postalCode }
			};
		});
	}

	private get currentDealerId() {
		return this._auth.current_user_value.roleInfo.dealerId;
	}

	protected get currentRole() {
		return this._auth.current_role;
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}
}
