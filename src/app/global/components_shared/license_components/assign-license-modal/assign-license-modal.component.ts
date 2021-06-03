import { Component, OnInit, Inject } from '@angular/core';
import { LicenseService } from '../../../services/license-service/license.service';
import { MAT_DIALOG_DATA } from '@angular/material'
import { API_LICENSE } from 'src/app/global/models/api_license.model';
import { Observable, Subscription } from 'rxjs';

@Component({
	selector: 'app-assign-license-modal',
	templateUrl: './assign-license-modal.component.html',
	styleUrls: ['./assign-license-modal.component.scss']
})

export class AssignLicenseModalComponent implements OnInit {
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
	subscription: Subscription = new Subscription;
	timeOut;
	timeOutDuration = 1000;

	constructor(
		private _license: LicenseService,
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any
	) { }

	ngOnInit() {
		this.getLicense(this.license_page_count++);
	}

	/**
	 * Get License By Dealer Id
	 * GET Method to AWS
	 * @param page - Page Number for API Pagination
	*/
	getLicense(page) {
		// Show spinner on UI incase user scrolled too 
		// fast and data is not ready
		this.loading_data = true;

		// Subscription to API
		this.subscription.add(
			this._license.get_license_by_dealer_id(this._dialog_data.dealer_id, page, '', 'online').subscribe(
				data => {
                    console.log("DATA", data)
					// Save page count returned from API
					if(!data.message) {
						const page_count = data.paging.pages;

						// available_licenses - are filtered licenses returned from API where hostId is null 
						const available_licenses = data.paging.entities.filter(i => i.hostId === null);
						
						// If "available_licenses" is more than 0, loop thru it then store
						// each of its items to "licenses" array which is being used on the html side
						if (available_licenses.length > 0) {
							available_licenses.map(
								l => {
									this.licenses.push(l);
								}
							)
						}

						// Continue looking for licenses with host == null
						// until number of page exhausted
						if (this.license_page_count <= page_count) {
							this.getLicense(this.license_page_count++)
						} else {
							// Hide Spinner on UI
							this.loading_data = false;

							// If number of page exhausted and "licenses" array's length is still 0
							// meaning there's no available license with host == null
							this.no_available_licenses = this.licenses.length > 0 ? false : true;
						}
						// console.log('current_page:',page, 'returned_licenses:',data.paging.entitites.length, 'unassigned_found:',available_licenses.length);
					} else {
						this.no_available_licenses = true;
					}
				},
				error => {
					console.log(error);
				}
			)
		)
	}

	scrollHandler(event) {
		if (event.target.offsetHeight + event.target.scrollTop == event.target.scrollHeight && event.target.scrollHeight != 0) {
			if(this.license_handler.paging) {
				// console.log(this.license_handler.paging.hasNextPage)
				if(this.license_handler.paging.hasNextPage == true) {
					this.timeOut = setTimeout(() => {
						// console.log("DITO")
						this.getLicense(this.license_handler.paging.page + 1);
					}, 1500);
				}
			}
		}
	}

	licenseAssigned(license, e) {
		console.log(e)
		setTimeout(() => {
			if(e.checked === false) {
				this.assigned_licenses.splice(this.assigned_licenses.indexOf(license), 1);
			} else {
				if (!this.assigned_licenses.includes(license)) {
					this.assigned_licenses.push(license)
				}
			}

			console.log("ThisAssigned", this.assigned_licenses);
		}, 0)
	}

	assignLicenses() {
		this.is_submitted = true;

		const license_host_data = {
			host: {
				hostid: this._dialog_data.host_id
			},
			licenses: this.assigned_licenses.map(
				d => {
					return {licenseid: d}
				}
			)
		}

		console.log(license_host_data)

		this._license.assign_licenses_to_host(license_host_data).subscribe(
			data => {
				console.log(data);
				this.assign_success = true;
			},
			error => {
				console.log(error);
			}
		)
	}
}
