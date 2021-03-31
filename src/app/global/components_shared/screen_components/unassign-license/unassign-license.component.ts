import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'
import { Socket } from 'ngx-socket-io';
import { Subscription } from 'rxjs';
import { API_LICENSE_PROPS } from 'src/app/global/models/api_license.model';
import { ScreenService } from '../../../../global/services/screen-service/screen.service';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-unassign-license',
	templateUrl: './unassign-license.component.html',
	styleUrls: ['./unassign-license.component.scss']
})

export class UnassignLicenseComponent implements OnInit {

	licenses = [];
	to_unassign = [];
	unassigning_licenses: boolean = false;
	no_selected_license:boolean = true;
	subscription: Subscription = new Subscription();
	display_warning: boolean;

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _screen: ScreenService,
		private _dialog: MatDialog,
		public dialogRef: MatDialogRef<UnassignLicenseComponent>,
		private _socket: Socket,
	) { }

	ngOnInit() {
		console.log(this._dialog_data);
		this.licenses = this._dialog_data.licenses;
		this._socket.connect();
	}

	ngOnDestroy() {
		this.to_unassign = [];
		this.subscription.unsubscribe();
	}

	licenseSelected(e, licenseId) {
		if (e.checked) {
			this.to_unassign.push(licenseId)
		} else {
			this.to_unassign = this.to_unassign.filter(
				i => i != licenseId
			)
		}
	}

	displayWarning() {
		this.display_warning = true;
	}

	unassignLicense() {
		this.display_warning = false;
		this.unassigning_licenses = true;

		let toUnassign = [];

		this.to_unassign.forEach(
			i => {
				toUnassign.push(
					{
						licenseId: i,
						screenId: this._dialog_data.screen_id
					}
				)

				this._socket.emit('D_reset_pi', i);
			}
		)

		this._screen.unassign_license(toUnassign).subscribe(
			data => {
				this.to_unassign = [];
				this.dialogRef.close(true);
			}, 
			error => {
				console.log(error)
			}
		)
	}
}
