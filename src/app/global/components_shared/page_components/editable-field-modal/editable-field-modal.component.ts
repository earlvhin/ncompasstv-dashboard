import { Component, OnInit, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs';
import * as moment from 'moment';

import { ScreenService } from '../../../services/screen-service/screen.service';

@Component({
	selector: 'app-editable-field-modal',
	templateUrl: './editable-field-modal.component.html',
	styleUrls: ['./editable-field-modal.component.scss']
})
export class EditableFieldModalComponent implements OnInit {
	message: string;
	status: any;
	data: string;
	date: any;
	screen_init: string;
	screen_types: Array<any> = [];
	screen_selected: string = null;
	reset_screen: boolean = false;
	subscription: Subscription = new Subscription();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		public dialogRef: MatDialogRef<EditableFieldModalComponent>,
		private _screen: ScreenService
	) {}

	ngOnInit() {
		this.status = this._dialog_data.status;
		this.message = this._dialog_data.message;
		this.data = this._dialog_data.data;

		if (this.status.dropdown_edit && this.status.label == 'Screen Type') {
			this.getScreenType();
		}

		if (this.status.label.includes('Date')) {
			const data = this.data;
			let value: any = moment(data).toDate();
			if (!data || data.trim().length <= 0 || data.includes('--')) value = moment();
			this.date = value;
		}
	}

	updateField(value: any): void {
		if (this.status.label.includes('Date')) value = moment(this.date).format('MM/DD/YYYY');
		this.dialogRef.close(value);
	}

	onSelectDate(value: any): void {
		this.date = moment(value, 'YYYY-MM-DD').toDate();
	}

	getScreenType() {
		this.subscription.add(
			this._screen.get_screens_type().subscribe((data) => {
				this.screen_types = data;
				this.screen_init = this.status.value;
				this.setScreenType(this.status.id);
			})
		);
	}

	setScreenType(type) {
		this.screen_selected = type;
		this.reset_screen = false;
	}

	clearScreenType() {
		this.screen_selected = null;
		this.reset_screen = true;
	}

	updateDropdown() {
		this.dialogRef.close(this.screen_selected);
	}
}
