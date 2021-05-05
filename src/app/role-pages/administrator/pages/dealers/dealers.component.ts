import { Component, OnInit} from '@angular/core';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { MatDialog } from '@angular/material';
import { StatisticsService } from '../../../../global/services/statistics-service/statistics.service';
import { Subscription } from 'rxjs';
import { LicenseModalComponent } from '../../../../global/components_shared/license_components/license-modal/license-modal.component';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver';

@Component({
	selector: 'app-dealers',
	templateUrl: './dealers.component.html',
	styleUrls: ['./dealers.component.scss']
})

export class DealersComponent implements OnInit {
	subscription: Subscription = new Subscription();
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

	constructor(
		private _stats: StatisticsService,
		private _dialog: MatDialog,
		private _dealer: DealerService
	) { }

	ngOnInit() {
		this.getAdminStatistics();
	}

	getAdminStatistics() {
		this.subscription.add(
			this._stats.api_get_dealer_total().subscribe(
				(data: any) => {
					this.dealer_stats = {
						basis: data.total,
						basis_label: 'Dealer(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInactive,
						bad_value_label: 'Inactive',
						this_week_value: data.newDealersThisWeek,
						this_week_value_label: 'Dealer(s)',
						this_week_value_description: 'New this week',
						last_week_value: data.newDealersLastWeek,
						last_week_value_label: 'Dealer(s)',
						last_week_value_description: 'New Last Week'
					}					
				}
			)
		)
	}

	openGenerateLicenseModal(): void {
		let dialogRef = this._dialog.open(LicenseModalComponent, {
			height: '400px',
			width: '500px'
		});

		dialogRef.afterClosed().subscribe(result => {
			this.update_info = true;
		});
	}

	getDataForExport(): void {
		this.subscription.add(
			this._dealer.export_dealers().subscribe(
				data => {
					const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
					this.dealers_to_export = data;
					this.dealers_to_export.forEach((item, i) => {
						this.modifyItem(item);
						this.worksheet.addRow(item).font ={
							bold: false
						};
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
				}
			)
		);
	}

	modifyItem(item) {
		item.totalScheduled = 0;
		item.monthAsDealer = item.monthAsDealer + " month(s)"
	}

	exportTable() {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Excel.Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('Dealers');
		Object.keys(this.dealers_table_column_for_export).forEach(key => {
			if(this.dealers_table_column_for_export[key].name && !this.dealers_table_column_for_export[key].no_export) {
				header.push({ header: this.dealers_table_column_for_export[key].name, key: this.dealers_table_column_for_export[key].key, width: 30, style: { font: { name: 'Arial', bold: true}}});
			}
		});
		var first_column = ['Dealer Alias','Business Name','Contact Person','Age','Licenses','','','', 'Hosts','','', 'Advertisers']
		this.worksheet.columns = header;
		this.worksheet.duplicateRow(1, true);
		this.worksheet.getRow(1).values = [];
		this.worksheet.getRow(1).values = first_column;
		this.worksheet.getRow(1).height = 25;
		this.worksheet.getRow(2).height = 20;
		this.worksheet.getCell('A1').alignment = { vertical: 'top', horizontal: 'left' };
		this.worksheet.mergeCells('E1:H1');
		this.worksheet.mergeCells('I1:K1');
		this.worksheet.mergeCells('L1:M1');
		this.worksheet.mergeCells('A1:A2');
		this.worksheet.mergeCells('B1:B2');
		this.worksheet.mergeCells('C1:C2');
		this.worksheet.mergeCells('D1:D2');
		this.worksheet.getRow(1).font =  {
			bold: true,
			name: 'Arial',
			size: 11,
		};
		this.getDataForExport();		
	}
}
