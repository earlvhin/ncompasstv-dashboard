import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LicenseService } from 'src/app/global/services';
@Component({
	selector: 'app-assign-license-modal',
	templateUrl: './assign-license-modal.component.html',
	styleUrls: ['./assign-license-modal.component.scss']
})
export class AssignLicenseModalComponent implements OnInit, OnDestroy {
	assign_status: boolean = false;
	assign_success: boolean = false;
	assigned_licenses = [];
	available_licenses = [];
	finish_fetching: boolean = false;
	is_submitted: boolean = false;
	license_handler: any;
	license_page_count: number = 1;
	licenses: any[] = [];
	loading_data: boolean = true;
	no_available_licenses: boolean = false;
	timeOutDuration = 1000;

	protected _unsubscribe = new Subject<void>();

	constructor(private _license: LicenseService, @Inject(MAT_DIALOG_DATA) public _dialog_data: any) {}

	ngOnInit() {
		this.getLicense(this.license_page_count++);
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

		this._license
			.assign_licenses_to_host(license_host_data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => (this.assign_success = true),
				(error) => {
					throw new Error(error);
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

	/**
	 * Get License By Dealer Id
	 * GET Method to AWS
	 * @param page - Page Number for API Pagination
	 */
	private getLicense(page: number): void {
		// Show spinner on UI incase user scrolled too
		// fast and data is not ready
		this.loading_data = true;

		this._license
			.get_license_by_dealer_id(this._dialog_data.dealer_id, page, '', 'online')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					// Save page count returned from API
					if (!data.message) {
						const page_count = data.paging.pages;

						// available_licenses - are filtered licenses returned from API where hostId is null
						const available_licenses = data.paging.entities.filter((i) => i.hostId === null);

						// If "available_licenses" is more than 0, loop thru it then store
						// each of its items to "licenses" array which is being used on the html side
						if (available_licenses.length > 0) {
							available_licenses.map((license) => this.licenses.push(license));
						}

						// Continue looking for licenses with host == null
						// until number of page exhausted
						if (this.license_page_count <= page_count) {
							this.getLicense(this.license_page_count++);
						} else {
							// Hide Spinner on UI
							this.loading_data = false;

							// If number of page exhausted and "licenses" array's length is still 0
							// meaning there's no available license with host == null
							this.no_available_licenses = this.licenses.length > 0 ? false : true;
						}
					} else {
						this.no_available_licenses = true;
					}
				},
				(error) => {
					throw new Error(error);
				}
			);
	}
}
