import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import * as uuid from 'uuid';

import { UI_OPERATION_DAYS } from 'src/app/global/models/ui_operation-hours.model';
import { MatDialogRef } from '@angular/material';

@Component({
	selector: 'app-bulk-edit-business-hours',
	templateUrl: './bulk-edit-business-hours.component.html',
	styleUrls: ['./bulk-edit-business-hours.component.scss']
})
export class BulkEditBusinessHoursComponent implements OnInit {

	form: FormGroup;
	has_selected_all_days = false;
	selectedDayIds: number[] = [];
	timeStart: any;
	timeEnd: any;
	title = 'Bulk Edit Business Hours';

	days = [
		{ id: 0, day: 'Sunday', label: 'Sn' },
		{ id: 1, day: 'Monday', label: 'M' },
		{ id: 2, day: 'Tuesday', label: 'T' },
		{ id: 3, day: 'Wednesday', label: 'W' },
		{ id: 4, day: 'Thursday', label: 'Th' },
		{ id: 5, day: 'Friday', label: 'F' },
		{ id: 6, day: 'Saturday', label: 'St' },
	];
	
	constructor(
		private _form_builder: FormBuilder,
		private _dialog_ref: MatDialogRef<BulkEditBusinessHoursComponent>) { }
	
	ngOnInit() {
		this.initializeForm();
	}

	get from(): string {
		return this.form.get('from').value;
	}

	get isFormInvalid(): boolean {
		return this.form.invalid || this.selectedDayIds.length === 0;
	}

	get to(): string {
		return this.form.get('to').value;
	}

	set from(value: string) {
		this.form.get('from').setValue(value);
	}

	set to(value: string) {
		this.form.get('to').setValue(value);
	}

	onSelectAllDays(event: any): void {
		event.preventDefault();
		this.has_selected_all_days = !this.has_selected_all_days;

		if (!this.has_selected_all_days) {
			this.selectedDayIds = [];
			return;
		}
		
		this.selectedDayIds = [ 0,1,2,3,4,5,6 ];
	}

	onSelectDay(id: number): void {
			
		if (this.selectedDayIds.indexOf(id) > -1 && this.selectedDayIds.length > 0) {
			const indexToRemove = this.selectedDayIds.indexOf(id);
			this.selectedDayIds.splice(indexToRemove, 1);
			return;
		}

		this.selectedDayIds.push(id);

	}

	onSubmit(): void {
		let toSubmit = [];

		this.days.forEach(
			day => {
				let data = new UI_OPERATION_DAYS(day.id, day.label, day.day, [], false);

				if (this.selectedDayIds.includes(day.id)) {

					data = new UI_OPERATION_DAYS(
						day.id,
						day.label,
						day.day,
						[
							{
								id: uuid.v4(),
								day_id: day.id,
								open: moment(this.from).format('hh:mm A'),
								close: moment(this.to).format('hh:mm A')
							}
						],
						true
					);

				}

				toSubmit.push(data);

			}
		);

		this._dialog_ref.close(toSubmit);
	}

	private initializeForm(): void {
		this.form = this._form_builder.group({
			from: [ {hour: 9, minute: 0, second: 0}, Validators.required ],
			to: [ {hour: 17, minute: 0, second: 0}, Validators.required ]
		});
	}
	
}
