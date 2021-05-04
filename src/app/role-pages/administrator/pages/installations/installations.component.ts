import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import * as moment from 'moment';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { INSTALLATION } from 'src/app/global/models/installation.model';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { MatDatepicker } from '@angular/material';
import { GET_LICENSE_BY_INSTALL_DATE } from 'src/app/global/models/api_license_by_install_date.model';

@Component({
	selector: 'app-installations',
	templateUrl: './installations.component.html',
	styleUrls: ['./installations.component.scss'],
	providers: [ TitleCasePipe, DatePipe ]
})
export class InstallationsComponent implements OnInit, OnDestroy {
	@ViewChild('datePicker', { static: false }) datePicker: MatDatepicker<Date>;
	subscription: Subscription = new Subscription();

	current_month = '';
	filtered_data = [];
	initial_load: boolean = true;
	installations: INSTALLATION[] = [];
	installation_count: any;
	previous_month = '';
	loading = false;
	next_month = '';
	paging_data: any;
	searching: boolean = false;
	selected_date: any;
	sort_column: string = "";
	sort_order: string = "";
	
	form = this._form.group({ date: [ '', Validators.required ], });
	installation_table_columns = [
		{ name: '#', sortable: false, key: 'licenseKey', hidden: true},
		{ name: 'License Key', sortable: true, column: 'LicenseKey', key: 'licenseKey'},
		{ name: 'Host', sortable: true, column: 'HostName', key: 'hostName'},
		{ name: 'Dealer Alias', sortable: true, column: 'DealerIdAlias', key: 'dealerIdAlias'},
		{ name: 'Business Name', sortable: true, column: 'BusinessName', key: 'businessName'},
		{ name: 'License Type', sortable: true, column: 'ScreenTypeName', key: 'screenTypeName'},
		{ name: 'Screen', sortable: true, column: 'ScreenName', key: 'screenName'},
		{ name: 'Installation Date', sortable: true, column: 'InstallDate', key: 'installDate'},
	];

	private _date = this.form.get('date');
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _auth: AuthService,
		private _dates: DatePipe,
		private _form: FormBuilder,
		private _license: LicenseService,
		private _titlecase: TitleCasePipe
	) { }
	
	ngOnInit() {
		this.selected_date = moment().format('MM/DD/YYYYY');
		this.getLicenses(1);
		this.date = new Date();
		this.previous_month = moment().subtract(1, 'month').format('MMMM');
		this.current_month = moment().format('MMMM');
		this.next_month = moment().add(1, 'month').format('MMMM');
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getTotalCount(data) {
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

	get date(): any {
		return this._date.value;
	}

	set date(value: any) {
		this._date.setValue(value);
	}

	onSelectDate(value: moment.Moment): void {
		this.date = value;
		this.previous_month = moment(value).subtract(1, 'month').format('MMMM');
		this.current_month = moment(value).format('MMMM');
		this.next_month = moment(value).add(1, 'month').format('MMMM');
		this.datePicker.close();
		this.selected_date = value.format('MM/DD/YYYYY');
		this.sort_column = "";
		this.sort_order = "";
		this.getLicenses(1);
	}

	filterLicensesThisMonth(data: { host, license, screen, screenType }[]): { host, license, screen, screenType }[] {
		return data.filter(response => (!moment(response.license.installDate).isBefore(this.date, 'month')));
	}
	
	getLicenses(page) {
		if(page == 1 && this.sort_column == '') {
			this.installation_count = null;
		}
		this.searching = true;
		this.installations = [];
		this.subscription.add(
			this._license.get_licenses_by_install_date(page, this.selected_date, this.sort_column, this.sort_order).subscribe(
				data => {
					if(!data.message) {
						this.installations = this.installationTable_mapToUI(data.paging.entities);
						this.filtered_data = this.installationTable_mapToUI(data.paging.entities);
						this.getTotalCount(data.licenseInstallationStats)
					} else {
						this.installations=[];
						this.filtered_data = [];
						var no_count = {
							total: 0,
							previousMonth: 0,
							currentMonth: 0,
							nextMonth: 0
						}
						this.getTotalCount(no_count)
					}
					this.paging_data = data.paging;
					this.initial_load = false;
					this.searching = false;
				},	
				error => {
				}
			)
		)
	}

	installationTable_mapToUI(data) {
		let count = 1;
		return data.map(
			i => {
				return new INSTALLATION(
					{ value: i.licenseKey, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: i.licenseKey, link: '/administrator/licenses/' +  i.licenseId , editable: false, hidden: false},
					{ value: i.hostName != null ? i.hostName : '--', link: '/administrator/hosts/' +  i.hostId , editable: false, hidden: false},
					{ value: i.dealerIdAlias != null ? i.dealerIdAlias : '--', link: '/administrator/dealers/' +  i.dealerId  , editable: false, hidden: false},
					{ value: i.businessName, link: '/administrator/dealers/' +  i.dealerId , editable: false, hidden: false},
					{ value: i.screenTypeName != null ? this._titlecase.transform(i.screenTypeName) : '--', link: null , editable: false, hidden: false},
					{ value: i.screenName != null ? i.screenName : '--', link: i.screenName != null ? '/administrator/screens/' +  i.screenId : null , editable: false, hidden: false},
					{ value: this._dates.transform(i.installDate, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false},
				)
			}
		)
	}

	getColumnsAndOrder(data) {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.getLicenses(1);
	}
}
