import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import * as uuid from 'uuid';

import { MatDialogRef } from '@angular/material';
import { UI_STORE_HOUR } from 'src/app/global/models';

@Component({
    selector: 'app-bulk-edit-business-hours',
    templateUrl: './bulk-edit-business-hours.component.html',
    styleUrls: ['./bulk-edit-business-hours.component.scss'],
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
        private _dialog_ref: MatDialogRef<BulkEditBusinessHoursComponent>,
    ) {}

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

        this.selectedDayIds = [0, 1, 2, 3, 4, 5, 6];
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
        let toSubmit: UI_STORE_HOUR[] = [];

        this.days.forEach((day) => {
            let data: UI_STORE_HOUR = {
                id: day.id,
                label: day.label,
                day: day.day,
                periods: [],
                status: false,
            };

            if (this.selectedDayIds.includes(day.id)) {
                const setHourData = (hour: string) => {
                    const hourSplit = hour.split(':');

                    return {
                        hour: parseInt(hourSplit[0]),
                        minute: parseInt(hourSplit[1]),
                        second: 0,
                    };
                };

                const opening = {
                    '12hr': moment(this.from).format('hh:mm A'),
                    '24hr': moment(this.from).format('HH:mm'),
                    destructured: null,
                };

                opening.destructured = setHourData(opening['24hr']);

                const closing = {
                    '12hr': moment(this.to).format('hh:mm A'),
                    '24hr': moment(this.to).format('HH:mm'),
                    destructured: null,
                };

                closing.destructured = setHourData(closing['24hr']);

                data.periods.push({
                    id: uuid.v4(),
                    day_id: day.id,
                    open: opening['12hr'],
                    close: closing['12hr'],
                    openingHourData: opening.destructured,
                    closingHourData: closing.destructured,
                });

                data.status = true;
            }

            toSubmit.push(data);
        });

        this._dialog_ref.close(toSubmit);
    }

    private initializeForm(): void {
        this.form = this._form_builder.group({
            from: [{ hour: 9, minute: 0, second: 0 }, Validators.required],
            to: [{ hour: 17, minute: 0, second: 0 }, Validators.required],
        });
    }
}
