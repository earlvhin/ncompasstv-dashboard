import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as moment from 'moment';
import { LicenseService } from '../../../global/services';

@Component({
    selector: 'app-upcoming-install-modal',
    templateUrl: './upcoming-install-modal.component.html',
    styleUrls: ['./upcoming-install-modal.component.scss'],
})
export class UpcomingInstallModalComponent implements OnInit {
    isChecked: boolean = false;
    installation_stats: any = [];

    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialog_data: any,
        public dialogRef: MatDialogRef<UpcomingInstallModalComponent>,
        private _license: LicenseService,
    ) {}

    ngOnInit() {
        this.getInstallationStats();
    }

    closeDialog() {
        var item = { value: this.isChecked, timestamp: moment().toDate() };
        localStorage.setItem('installation_ischecked', JSON.stringify(item));
        this.dialogRef.close(this.isChecked);
    }

    getInstallationStats() {
        this._license.get_installation_statistics().subscribe((data: any) => {
            this.installation_stats = {
                total:
                    data.licenseInstallationStats.total === 0
                        ? '0'
                        : data.licenseInstallationStats.total,
                today: data.licenseInstallationStats.today,
                tomorrow: data.licenseInstallationStats.tomorrow,
                nextThreeDays: data.licenseInstallationStats.nextThreeDays,
            };
        });
    }
}
