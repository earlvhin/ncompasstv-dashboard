import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { MatDatepicker } from '@angular/material';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver';

import { INSTALLATION } from 'src/app/global/models/installation.model';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { takeUntil } from 'rxjs/operators';
@Component({
	selector: 'app-installations',
	templateUrl: './installations.component.html',
	styleUrls: ['./installations.component.scss'],
	providers: [ TitleCasePipe, DatePipe ]
})
export class InstallationsComponent implements OnInit, OnDestroy {
	@ViewChild('datePicker', { static: false }) datePicker: MatDatepicker<Date>;
    subscription: Subscription = new Subscription();

    activeIndex: number;
	current_month = '';
	filtered_data = [];
	initial_load: boolean = true;
	installations: INSTALLATION[] = [];
	installation_count: any;
	previous_month = '';
    licenses_to_export: any = [];
	loading = false;
	next_month = '';
    pageSize: number;
	paging_data: any;
    search_data: string = "";
	searching: boolean = false;
	selected_date: any;
	sort_column: string = '';
	sort_order: string = '';
    type: number=0;
	view = '';
    workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

	form = this._form_builder.group({ 
		date: [ '', Validators.required ],
		view: [ '' ]
	});

    licenses_table_column_for_export = [
		{ name: 'License Key', key: 'licenseKey'},
		{ name: 'Host', key: 'hostName'},
		{ name: 'Dealer Alias', key: 'dealerIdAlias'},
		{ name: 'Business Name', key: 'businessName'},
		{ name: 'License Type', key: 'screenTypeName'},
		{ name: 'Screen', key: 'screenName'},
		{ name: 'Installation Date', key: 'installDate'},
	];

	private _date = this.form.get('date');
	protected _unsubscribe: Subject<void> = new Subject<void>();

    views = [ 
		{ name: 'Day', value: 'day', index: 1},
		{ name: 'Month', value: 'month', index: 2},
		{ name: 'Year', value: 'year', index: 3},
        { name: '', value: '', index: 0},
	];
	
	constructor(
		private _dates: DatePipe,
		private _form_builder: FormBuilder,
		private _license: LicenseService,
		private _titlecase: TitleCasePipe
	) { }
	
	ngOnInit() {
		this.selected_date = moment().format('MM-DD-YYYY');
		this.getLicenses(1);
		this.getLicenseStatistics();
		this.date = new Date();
		this.previous_month = moment().subtract(1, 'month').format('MMMM');
		this.current_month = moment().format('MMMM');
		this.next_month = moment().add(1, 'month').format('MMMM');
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	get date(): any {
		return this._date.value;
	}

	set date(value: any) {
		this._date.setValue(value);
	}

	get installation_table_columns() {
		return [
			{ name: '#', sortable: false, key: 'licenseKey', hidden: true },
			{ name: 'License Key', sortable: true, column: 'LicenseKey', key: 'licenseKey' },
			{ name: 'Host', sortable: true, column: 'HostName', key: 'hostName' },
			{ name: 'Dealer Alias', sortable: true, column: 'DealerIdAlias', key: 'dealerIdAlias' },
			{ name: 'Business Name', sortable: true, column: 'BusinessName', key: 'businessName' },
			{ name: 'License Type', sortable: true, column: 'ScreenTypeName', key: 'screenTypeName' },
			{ name: 'Screen', sortable: true, column: 'ScreenName', key: 'screenName' },
			{ name: 'Installation Date', sortable: true, column: 'InstallDate', key: 'installDate' },
		];
	}

	onSelectDate(value: moment.Moment): void {
		this.view = 'default';
		this.sort_column = '';
		this.sort_order = '';
		this.date = value;
		this.previous_month = moment(value).subtract(1, 'month').format('MMMM');
		this.current_month = moment(value).format('MMMM');
		this.next_month = moment(value).add(1, 'month').format('MMMM');
		this.datePicker.close();
		this.selected_date = value.format('MM-DD-YYYY');
		this.installation_count = null;
		this.getLicenseStatistics();
		this.getLicenses(1);
	}

	filterLicensesThisMonth(data: { host, license, screen, screenType }[]): { host, license, screen, screenType }[] {
		return data.filter(response => (!moment(response.license.installDate).isBefore(this.date, 'month')));
	}

	getColumnsAndOrder(data: { column: string, order: string }): void {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.getLicenses(1);
	}

    filterData(data) {
		if (data) {
			this.search_data = data;
			this.getLicenses(1);
		} else {
			this.search_data = "";
			this.getLicenses(1);
		}
	}
	
	getLicenses(page: number) {
        this.pageSize = 15;
		this.searching = true;
		this.installations = [];

		this._license.get_licenses_by_install_date(page, this.selected_date, this.sort_column, this.sort_order, this.type, this.pageSize, this.search_data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { message?: string, paging }) => {

					let installations = [];
					let filtered_data = [];

					if (!response.message) {
						this.paging_data = response.paging;
						installations = this.installationTable_mapToUI(response.paging.entities);
						filtered_data = installations;
					} 

					this.installations = installations;
					this.filtered_data = filtered_data;

				},	
				error => {
					console.log('Error retreiving licenses by install date', error);
					this.searching = false;
				}
			).add(
				() => {
					this.initial_load = false;
					this.searching = false;
				}
			);

	}

	onSelectView(type){
		if (this.searching) return;
        this.activeIndex = type;
        this.type = type;
		this.getLicenses(1);
	}

	private getLicenseStatistics(): void {

		this._license.get_statistics_by_installation(this.selected_date)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { licenseInstallationStats, message?: string }) => {
					let data = { total: 0, previousMonth: 0, currentMonth: 0, nextMonth: 0 }; 
					if (!response.message) data = response.licenseInstallationStats;
					this.getTotalCount(data);
				},
				error => console.log('Error retrieving statistics', error)
			);

	}
	
	private getTotalCount(data: { currentMonth: number, nextMonth: number, previousMonth: number, total: number }): void {
		this.installation_count = {
			scheduled: data.total,
			scheduled_label: 'Installation(s)',
			scheduled_description: 'Scheduled Installations',
			prev: data.previousMonth,
			prev_label: 'Installation(s)',
			prev_description: 'Last Month of ' + this.previous_month,
			current: data.currentMonth,
			current_label: 'Installation(s)',
			current_description: 'This Month of ' + this.current_month,
			next: data.nextMonth,
			next_label: 'Installation(s)',
			next_description: 'Next Month of ' + this.next_month,
		}
	}

	private installationTable_mapToUI(data): INSTALLATION[] {
		let count = 1;

		return data.map(
			license => {
				return new INSTALLATION(
					{ value: license.licenseKey, link: null , editable: false, hidden: true },
					{ value: count++, link: null , editable: false, hidden: false },
					{ value: license.licenseKey, link: `/administrator/licenses/${license.licenseId}` , editable: false, hidden: false },
					{ value: license.hostName != null ? license.hostName : '--', link: `/administrator/hosts/${license.hostId}`, editable: false, hidden: false },
					{ value: license.dealerIdAlias != null ? license.dealerIdAlias : '--', link: `/administrator/dealers/${license.dealerId}`, editable: false, hidden: false },
					{ value: license.businessName, link: `/administrator/dealers/${license.dealerId}`, editable: false, hidden: false },
					{ value: license.screenTypeName != null ? this._titlecase.transform(license.screenTypeName) : '--', link: null , editable: false, hidden: false },
					{ value: license.screenName != null ? license.screenName : '--', link: license.screenName != null ? `/administrator/screens/${license.screenId}` : null , editable: false, hidden: false },
					{ value: this._dates.transform(license.installDate, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false },
				)
			}
		);
	}

    getDataForExport(): void {
        this.pageSize = 0;
        this._license.get_licenses_by_install_date(1, this.selected_date, this.sort_column, this.sort_order, this.type, this.pageSize).subscribe(
            data => {
                if(!data.message) {
                    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                    this.licenses_to_export = data.paging.entities;
                    this.licenses_to_export.forEach((item, i) => {
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
                            const filename = 'Installations for ' + this.selected_date +'.xlsx';
                            FileSaver.saveAs(blob, filename);
                        }
                    );
                    this.workbook_generation = false;
                } else {
                    this.licenses_to_export = [];
                }
            }
        )
	}

	modifyItem(item) {
		item.screenTypeName = this._titlecase.transform(item.screenTypeName);
        item.installDate = this._dates.transform(item.installDate, 'MMM d, y, h:mm a')
	}

	exportTable() {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Excel.Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('Installations');
		Object.keys(this.licenses_table_column_for_export).forEach(key => {
			if(this.licenses_table_column_for_export[key].name && !this.licenses_table_column_for_export[key].no_export) {
				header.push({ header: this.licenses_table_column_for_export[key].name, key: this.licenses_table_column_for_export[key].key, width: 30, style: { font: { name: 'Arial', bold: true}}});
			}
		});
        this.worksheet.columns = header;
		this.getDataForExport();		
	}
}
