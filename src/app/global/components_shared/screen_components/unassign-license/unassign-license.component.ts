import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as io from 'socket.io-client';
import { Subscription } from 'rxjs';
import { API_LICENSE_PROPS } from 'src/app/global/models/api_license.model';
import { ScreenService } from '../../../../global/services/screen-service/screen.service';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-unassign-license',
    templateUrl: './unassign-license.component.html',
    styleUrls: ['./unassign-license.component.scss'],
})
export class UnassignLicenseComponent implements OnInit {
    licenses = [];
    to_unassign = [];
    unassigning_licenses: boolean = false;
    no_selected_license: boolean = true;
    subscription: Subscription = new Subscription();
    display_warning: boolean;
    _socket: any;

    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialog_data: any,
        private _screen: ScreenService,
        private _dialog: MatDialog,
        public dialogRef: MatDialogRef<UnassignLicenseComponent>,
    ) {
        this._socket = io(environment.socket_server, {
            transports: ['websocket'],
            query: 'client=Dashboard__UnassignLicenseComponent',
        });
    }

    ngOnInit() {
        this.licenses = this._dialog_data.licenses;

        this._socket.on('connect', () => {});

        this._socket.on('disconnect', () => {});
    }

    ngOnDestroy() {
        this.to_unassign = [];
        this.subscription.unsubscribe();
        this._socket.disconnect();
    }

    licenseSelected(e, licenseId) {
        if (e.checked) {
            this.to_unassign.push(licenseId);
        } else {
            this.to_unassign = this.to_unassign.filter((i) => i != licenseId);
        }
    }

    displayWarning() {
        this.display_warning = true;
    }

    unassignLicense() {
        this.display_warning = false;
        this.unassigning_licenses = true;

        let toUnassign = [];

        this.to_unassign.forEach((i) => {
            toUnassign.push({
                licenseId: i,
                screenId: this._dialog_data.screen_id,
            });

            this._socket.emit('D_reset_pi', i);
        });

        this._screen.unassign_license(toUnassign).subscribe(
            (data) => {
                this.to_unassign = [];
                this.dialogRef.close(true);
            },
            (error) => {
                console.error(error);
            },
        );
    }
}
