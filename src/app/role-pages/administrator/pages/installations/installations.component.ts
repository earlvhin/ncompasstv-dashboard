import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as moment from 'moment';
import { Installation } from 'src/app/global/models/installation.model';

import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Component({
	selector: 'app-installations',
	templateUrl: './installations.component.html',
	styleUrls: ['./installations.component.scss'],
	providers: [ TitleCasePipe ]
})
export class InstallationsComponent implements OnInit, OnDestroy {

	current_month = '';
	data_none = false;
	is_ready = { licenses: false, statistics: false };
	installations: Installation[] = [];
	loading = false;
	next_month = '';
	role: string;
	statistics = { total: 5, this_month: 2, next_month: 3 };
	table_data: { columns: { name: string }[], rows: any[] };
	total = { overall: 0, this_month: 0, next_month: 0 };

	form = this._form.group({ date: [ '', Validators.required ], });

	private _date = this.form.get('date');

	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _auth: AuthService,
		private _form: FormBuilder,
		private _license: LicenseService,
		private _titlecase: TitleCasePipe) { }
	
	ngOnInit() {
		this.role = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this.getLicenses(moment().format('MM/DD/YYYYY'));
		this.date = new Date();
		this.current_month = moment().format('MMMM');
		this.next_month = moment().add(1, 'month').format('MMMM');
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	get columns(): { name: string }[] {
		return [
			{ name: 'License Key' },
			{ name: 'Host' },
			{ name: 'Business' },
			{ name: 'License Type' },
			{ name: 'Screen' },
			{ name: 'Installation Date' },
		];
	}

	get date(): any {
		return this._date.value;
	}

	set date(value: any) {
		this._date.setValue(value);
	}

	onSelectDate(value: moment.Moment): void {
		this.getLicenses(value.format('MM/DD/YYYYY'))
	}
	
	private getLicenses(date: string): void {

		if (this.loading) return;

		this.loading = true;
		this._date.disable();
		this.is_ready.statistics = false;
		this.is_ready.licenses = false;
	
		this._license.get_licenses_by_install_date(date).pipe(takeUntil(this._unsubscribe)).subscribe(
			(response: { licenses: { host, license, screen, screenType }[], next_month: number, this_month: number }) => {

				if (!response.licenses || response.licenses.length <= 0) {
					this.is_ready.statistics = true;
					this.data_none = true;
					return;
				}

				const { licenses, this_month, next_month } = response;

				this.total = { overall: response.licenses.length, this_month, next_month };
				this.is_ready.statistics = true;

				this.installations = this.mapInstallationsToTable(licenses);
				this.table_data = { columns: this.columns, rows: this.installations };
				this.is_ready.licenses = true;
				this._date.enable();
				this.loading = false;

			},
			error => {
				console.log('Error retrieving licenses by install date', error);
				this.data_none = true;
				this.loading = false;
			}
		);

	}

	private mapInstallationsToTable(licenses: any[]): Installation[] {
		return licenses.map(
			data => {
				let dealer = '';
				let host = '';
				let licenseType = '';
				let screen = '';
				const { licenseKey, licenseId, installDate, hostId, dealerId } = data.license;
				const { screenId } = data.screen;

				host = data.host && data.host.name ? data.host.name : '--';
				dealer = data.host && data.host.businessName ? data.host.businessName : '--';
				licenseType = data.screenType && data.screenType.name ? this._titlecase.transform(data.screenType.name) : '--';
				screen = data.screen && data.screen.screenName ? data.screen.screenName : '--';

				const installation = new Installation(licenseId, licenseKey, host, dealer, licenseType, screen, installDate);
				installation.license_url = `/${this.role}/licenses/${licenseId}`;

				if (host !== '--') installation.host_url = `/${this.role}/hosts/${hostId}`;
				if (dealer !== '--') installation.dealer_url = `/${this.role}/dealers/${dealerId}`;
				if (screen !== '--') installation.screen_url = `/${this.role}/screens/${screenId}`;

				return installation;
			}
		);
	}
	
}
