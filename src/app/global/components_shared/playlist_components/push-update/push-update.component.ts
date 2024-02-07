import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { API_LICENSE_PROPS } from 'src/app/global/models/api_license.model';

@Component({
    selector: 'app-push-update',
    templateUrl: './push-update.component.html',
    styleUrls: ['./push-update.component.scss'],
})
export class PushUpdateComponent implements OnInit {
    licenses: API_LICENSE_PROPS[];

    constructor(@Inject(MAT_DIALOG_DATA) public _dialog_data: any) {}

    ngOnInit() {
        this.licenses = this._dialog_data;
    }
}
