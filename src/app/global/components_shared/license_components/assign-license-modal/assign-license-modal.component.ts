import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { Subject, forkJoin } from 'rxjs';

import { API_LICENSE_PROPS, PAGING } from 'src/app/global/models';
import { AuthService, HelperService, HostService, LicenseService } from 'src/app/global/services';
import { HOST_ACTIVITY_LOGS } from 'src/app/global/models/api_host_activity_logs.model';

@Component({
	selector: 'app-assign-license-modal',
	templateUrl: './assign-license-modal.component.html',
	styleUrls: ['./assign-license-modal.component.scss']
})
export class AssignLicenseModalComponent implements OnInit, OnDestroy {
	assign_status = false;
	assign_success = false;
	assigned_licenses = [];
	available_licenses = [];
	finish_fetching = false;
	is_submitted = false;
	license_handler: any;
	license_page_count = 1;
	licenses: any[] = [];
	licenses_loaded = false;
	no_available_licenses = false;
	timeOutDuration = 1000;

	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _license: LicenseService,
		private _helper: HelperService,
		private _host: HostService,
		private _auth: AuthService
	) {}

	ngOnInit() {
		this.getAvailableLicenses();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	assignLicenses(): void {
		this.is_submitted = true;

		const license_host_data = {
			host: { hostid: this._dialog_data.host_id },

			licenses: this.assigned_licenses.map((id) => {
				return { licenseid: id };
			})
		};

		const newHostActivityLog = new HOST_ACTIVITY_LOGS(this._dialog_data.host_id, 'assign_license', this._auth.current_user_value.user_id);

		this._license
			.assign_licenses_to_host(license_host_data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.assign_success = true;
					this._helper.onRefreshBannerData.next();
					this._host.emitActivity();
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

	licenseAssigned(license: string, e: { checked: boolean }): void {
		if (e.checked === false) {
			this.assigned_licenses.splice(this.assigned_licenses.indexOf(license), 1);
		} else {
			if (!this.assigned_licenses.includes(license)) {
				this.assigned_licenses.push(license);
			}
		}
	}

	private async getAvailableLicenses() {
		const dealerId = this._dialog_data.dealer_id;
		let totalRequests: number;
		let firstPageResult: { paging?: PAGING; message?: string; licenses?: API_LICENSE_PROPS[] };
		let getLicenseRequests = [];
		let merged = [];

		try {
			const firstPageRequest = await this._license
				.get_license_by_dealer_id(dealerId, 1, '', 'online', 15, '')
				.map((response) => {
					response.paging.entities = response.paging.entities.filter(
						(license: API_LICENSE_PROPS) => !license.hostId || (license.hostId && license.hostId.length <= 0)
					);
					return response;
				})
				.toPromise();

			firstPageResult = firstPageRequest;
		} catch (error) {
			console.error(error);
		}

		if ('message' in firstPageResult || firstPageResult.licenses.length === 0) {
			this.no_available_licenses = true;
			this.licenses_loaded = true;
			return;
		}

		merged = merged.concat(
			(firstPageResult.paging.entities as API_LICENSE_PROPS[]).filter(
				(license) => !license.hostId || (license.hostId && license.hostId.length <= 0)
			)
		);
		totalRequests = firstPageResult.paging.pages;

		if (totalRequests === 1) {
			this.licenses = [...merged];
			this.licenses_loaded = true;
			if (merged.length <= 0) this.no_available_licenses = true;
			return;
		}

		for (let i = 1; i < totalRequests; i++) {
			const page = i + 1;
			getLicenseRequests.push(this._license.get_license_by_dealer_id(dealerId, page, '', 'online', 15, ''));
		}

		forkJoin(getLicenseRequests)
			.pipe(takeUntil(this._unsubscribe), debounceTime(1000))
			.subscribe(
				(response: { paging: PAGING }[]) => {
					response.forEach((getLicenseResponse) => {
						const licenses = getLicenseResponse.paging.entities as API_LICENSE_PROPS[];
						merged = merged.concat(licenses.filter((license) => !license.hostId || (license.hostId && license.hostId.length <= 0)));
					});

					this.licenses = [...merged];
					this.licenses_loaded = true;
					if (merged.length <= 0) this.no_available_licenses = true;
				},
				(error) => {
					console.error(error);
				}
			);
	}
}
