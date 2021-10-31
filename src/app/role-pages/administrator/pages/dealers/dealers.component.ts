import { Component, OnDestroy, OnInit} from '@angular/core';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver';

import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { LicenseModalComponent } from '../../../../global/components_shared/license_components/license-modal/license-modal.component';
import { StatisticsService } from '../../../../global/services/statistics-service/statistics.service';

@Component({
	selector: 'app-dealers',
	templateUrl: './dealers.component.html',
	styleUrls: ['./dealers.component.scss']
})

export class DealersComponent implements OnInit, OnDestroy {
	title: string = "Dealers";
	dealer_stats: any;
	dealers_to_export: any = [];
	update_info: boolean = false;
	workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

	dealers_table_column_for_export = [
		{ name: 'Dealer Alias', key: 'dealerIdAlias'},
		{ name: 'Business Name', key: 'businessName'},
		{ name: 'Contact Person', key: 'contactPerson'},
		{ name: 'Age', key: 'monthAsDealer'},
		{ name: 'Player Count', key: 'playerCount', no_show: true},
		{ name: 'Total', key: 'totalLicenses'},
		{ name: 'Inactive', key: 'totalLicensesInactive'},
		{ name: 'Online', key: 'totalLicensesOnline'},
		{ name: 'Offline', key: 'totalLicensesOffline'},
		{ name: 'Scheduled', key: 'totalScheduled'},
		{ name: 'Total', key: 'totalHosts'},
		{ name: 'Active', key: 'totalHostsActive'},
		{ name: 'Total', key: 'totalAdvertisers'},
		{ name: 'Active', key: 'totalAdvertisersActive'},
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _stats: StatisticsService,
	) { }

	ngOnInit() {
		this.getAdminStatistics();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	exportTable(): void {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Excel.Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('Dealers');
		
		Object.keys(this.dealers_table_column_for_export).forEach(key => {

			if (this.dealers_table_column_for_export[key].name && !this.dealers_table_column_for_export[key].no_export) {

				header.push({ 
					header: this.dealers_table_column_for_export[key].name, 
					key: this.dealers_table_column_for_export[key].key, 
					width: 30, 
					style: { font: { name: 'Arial', bold: true } }
				});

			}

		});

		const first_column = ['Dealer Alias','Business Name','Contact Person','Age','Player Count','Licenses','','','', 'Hosts','','', 'Advertisers'];
		this.worksheet.columns = header;
		this.worksheet.duplicateRow(1, true);
		this.worksheet.getRow(1).values = [];
		this.worksheet.getRow(1).values = first_column;
		this.worksheet.getRow(1).height = 25;
		this.worksheet.getRow(2).height = 20;
		this.worksheet.getCell('A1').alignment = { vertical: 'top', horizontal: 'left' };
		this.worksheet.mergeCells('F1:I1');
		this.worksheet.mergeCells('J1:L1');
		this.worksheet.mergeCells('M1:N1');
		this.worksheet.mergeCells('A1:A2');
		this.worksheet.mergeCells('B1:B2');
		this.worksheet.mergeCells('C1:C2');
		this.worksheet.mergeCells('D1:D2');
		this.worksheet.mergeCells('E1:E2');

		this.worksheet.getRow(1).font =  {
			bold: true,
			name: 'Arial',
			size: 11,
		};

		this.getDataForExport();		
	}

	openGenerateLicenseModal(): void {

		const dialogRef = this._dialog.open(LicenseModalComponent, {
			height: '400px',
			width: '500px'
		});

		dialogRef.afterClosed().subscribe(() => this.update_info = true);

	}

	private getAdminStatistics(): void {

		this._stats.api_get_dealer_total().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: any) => {
					this.dealer_stats = {
						basis: response.total,
						basis_label: 'Dealer(s)',
						good_value: response.totalActive,
						good_value_label: 'Active',
						bad_value: response.totalInActive,
						bad_value_label: 'Inactive',
						this_week_value: response.newDealersThisWeek,
						this_week_value_label: 'Dealer(s)',
						this_week_value_description: 'New this week',
						last_week_value: response.newDealersLastWeek,
						last_week_value_label: 'Dealer(s)',
						last_week_value_description: 'New Last Week'
					};
				},
				error => console.log('Error retrieving dealer total', error)
			);

	}

	private getDataForExport(): void {

		this._dealer.export_dealers().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
					this.dealers_to_export = response;

					this.dealers_to_export.forEach((item, i) => {
						this.modifyItem(item);
						this.worksheet.addRow(item).font = { bold: false };
					});

					let rowIndex = 1;
					
					for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
						this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
					}

					this.workbook.xlsx.writeBuffer()
						.then((file: any) => {
							const blob = new Blob([file], { type: EXCEL_TYPE });
							const filename = 'Dealers.xlsx';
							FileSaver.saveAs(blob, filename);
						}
					);

					this.workbook_generation = false;
				},
				error => console.log('Error exporting dealers', error)
			);
	}

	private modifyItem(item: { totalScheduled: number, monthAsDealer: string }): void {
		item.totalScheduled = 0;
		item.monthAsDealer = `${item.monthAsDealer} month(s)`;
	}

}
