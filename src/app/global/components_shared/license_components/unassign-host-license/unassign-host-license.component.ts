import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_LICENSE_PROPS } from 'src/app/global/models';
import { HOST_ACTIVITY_LOGS } from 'src/app/global/models/api_host_activity_logs.model';
import { AuthService, HostService, LicenseService } from 'src/app/global/services';

@Component({
	selector: 'app-unassign-host-license',
	templateUrl: './unassign-host-license.component.html',
	styleUrls: ['./unassign-host-license.component.scss']
})
export class UnassignHostLicenseComponent implements OnInit, OnDestroy {
	licenses: API_LICENSE_PROPS[];
	show_warning: boolean = false;
	show_success: boolean = false;
	show_license_warning: boolean = false;
	unassigning_licenses = [];
	unassigning: boolean = false;

	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _licenses: LicenseService,
		private _host: HostService,
		private _auth: AuthService
	) {}

	ngOnInit() {
		this.licenses = this._dialog_data;
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	addToUnassigningLicenses(licenseId: string) {
		if (!this.unassigning_licenses.includes(licenseId)) {
			this.unassigning_licenses.push(licenseId);
			return;
		}

		this.unassigning_licenses = this.unassigning_licenses.filter((i) => i != licenseId);
	}

	checkIfAssignedToLicense(): void {
		this.show_warning = true;
		const license_filter = this.licenses.filter((license) => this.unassigning_licenses.includes(license.licenseId));
		const license_with_screen = license_filter.filter((license) => license.screenId != null);
		if (license_with_screen.length > 0) this.show_license_warning = true;
	}

	unassignLicenses(): void {
		this.unassigning = true;

		const newHostActivityLog = new HOST_ACTIVITY_LOGS(this.licenses[0].hostId, 'unassign_license', this._auth.current_user_value.user_id);

		this._licenses
			.unassign_host_license(this.unassigning_licenses)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.show_success = true;
					this.unassigning = false;
				},
				(error) => {
					console.error(error);
				}
			);

		this._host
			.create_host_activity_logs(newHostActivityLog)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					return data;
				},
				(error) => {
					console.error(error);
				}
			);
	}
}
