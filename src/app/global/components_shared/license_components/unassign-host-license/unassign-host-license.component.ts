import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material'
import { Subscription } from 'rxjs';
import { API_LICENSE_PROPS } from '../../../../global/models/api_license.model';
import { LicenseService } from '../../../../global/services/license-service/license.service';

@Component({
  selector: 'app-unassign-host-license',
  templateUrl: './unassign-host-license.component.html',
  styleUrls: ['./unassign-host-license.component.scss']
})
export class UnassignHostLicenseComponent implements OnInit {

	licenses: API_LICENSE_PROPS[];
	show_warning: boolean = false;
	show_success: boolean = false;
	show_license_warning: boolean = false;
	subscription: Subscription = new Subscription();
	unassigning_licenses = [];
	unassigning: boolean = false;

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _licenses: LicenseService,
	) { }

	ngOnInit() {
		this.licenses = this._dialog_data;
		// console.log("LICENSES", this.licenses)
	}

	addToUnassigningLicenses(license) {
		if (!this.unassigning_licenses.includes(license)) {
			this.unassigning_licenses.push(license)
		} else {
			this.unassigning_licenses = this.unassigning_licenses.filter(i => i != license)
		}
	}

	checkIfAssignedToLicense() {
		this.show_warning = true;
		// console.log("LICENSE", this.unassigning_licenses)
		var license_filter = this.licenses.filter(
			d =>
				this.unassigning_licenses.includes(d.licenseId)
		)
		var license_with_screen = license_filter.filter(
			e =>
				e.screenId != null
		)

		if(license_with_screen.length > 0) {
			this.show_license_warning = true;
		}
	}

	unassignLicenses() {
		// console.log('#unassignLicenses', this.unassigning_licenses);
		this.unassigning = true;

		this.subscription.add(
			this._licenses.unassign_host_license(this.unassigning_licenses).subscribe(
				data => {
					this.show_success = true;
					this.unassigning = false;
				},
				error => {
					console.log(error)
				}
			)
		)
	}
}
