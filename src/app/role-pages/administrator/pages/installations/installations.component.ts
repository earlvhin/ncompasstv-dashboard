import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { MatDatepicker } from '@angular/material';
import { Subject } from 'rxjs';
import * as moment from 'moment';

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

	current_month = '';
	filtered_data = [];
	form = this._form.group({ date: [ '', Validators.required ], });
	initial_load: boolean = true;
	installations: INSTALLATION[] = [];
	installation_count: any;
	previous_month = '';
	loading = false;
	next_month = '';
	paging_data: any;
	searching: boolean = false;
	selected_date: any;
	sort_column: string = '';
	sort_order: string = '';

	private _date = this.form.get('date');
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _dates: DatePipe,
		private _form: FormBuilder,
		private _license: LicenseService,
		private _titlecase: TitleCasePipe
	) { }
	
	ngOnInit() {
		this.selected_date = moment().format('MM/DD/YYYYY');
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
		this.sort_column = '';
		this.sort_order = '';
		this.date = value;
		this.previous_month = moment(value).subtract(1, 'month').format('MMMM');
		this.current_month = moment(value).format('MMMM');
		this.next_month = moment(value).add(1, 'month').format('MMMM');
		this.datePicker.close();
		this.selected_date = value.format('MM/DD/YYYYY');
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
	
	getLicenses(page: number): void {

		this.searching = true;
		this.installations = [];

		this._license.get_licenses_by_install_date(page, this.selected_date, this.sort_column, this.sort_order)
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
}
