import { Component, OnInit, OnDestroy, Input, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as moment from 'moment';

import { CONTENT_SCHEDULE_FORM_ERRORS, DAYS } from '../../constants';
import { SinglePlaylistService } from '../../services/single-playlist.service';
import { MatCheckboxChange } from '@angular/material';
import { API_CONTENT_V2, PlaylistContentSchedule } from 'src/app/global/models';
import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-content-scheduler-form',
    templateUrl: './content-scheduler-form.component.html',
    styleUrls: ['./content-scheduler-form.component.scss'],
})
export class ContentSchedulerFormComponent implements OnInit, OnDestroy {
    @Input() contents: API_CONTENT_V2[] = [];

    alternateWeek = 0;
    days = DAYS;
    dateYesterday = this.yesterday;
    hasAlternateWeekSet = false;
    hasCheckedAllDays = true;
    isCheckedToPlayAllDay = true;
    selectedScheduleType: { type: number; hasExistingSchedule: boolean } | null;

    schedulerForm: FormGroup = this._form_builder.group({
        alternateWeek: [0],
        startDate: ['', Validators.required],
        endDate: ['', Validators.required],
        days: ['', Validators.required],
        playTimeStartData: ['', Validators.required],
        playTimeEndData: ['', Validators.required],
        type: [3, Validators.required],
    });

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _form_builder: FormBuilder,
        private _playlist: SinglePlaylistService,
    ) {}

    ngOnInit() {
        this.resetDaySelection(); // Execute this first to ensure the default day selection
        this.subscribeToScheduleTypeSelection();
        this.subscribeToGetFormData();
        this.subscribeToFormChanges();
        this.setDefaultFormValues();
        this.subscribeToSetExistingFormData();
        this.getPlaylistContentSchedule();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    onCheckboxChange(event: MatCheckboxChange) {
        const dayChanged = event.source.value as any;
        let currentDaysValue = this.schedulerForm.get('days').value as {
            dayId: number;
            day: string;
            checked: boolean;
        }[];

        currentDaysValue = currentDaysValue.map((day) => {
            if (dayChanged.dayId === day.dayId) day.checked = event.checked;
            return day;
        });

        this.hasCheckedAllDays = currentDaysValue.filter((day) => day.checked).length === 7;
        this.schedulerForm.get('days').setValue(currentDaysValue);
    }

    public onToggleAllDays(): void {
        this.hasCheckedAllDays = !this.hasCheckedAllDays;
        const daysCtrl = this.schedulerForm.get('days');
        const currentDaysValue = daysCtrl.value as {
            dayId: number;
            day: string;
            checked: boolean;
        }[];
        let result: { dayId: number; day: string; checked: boolean }[] = [];

        result = currentDaysValue.map((day) => {
            day.checked = this.hasCheckedAllDays;
            return day;
        });

        daysCtrl.patchValue(result);
    }

    onSelectToPlayAllDay(event: MatCheckboxChange) {
        const form = this.schedulerForm;
        this.isCheckedToPlayAllDay = !this.isCheckedToPlayAllDay;
        const startTimeCtrl = form.get('playTimeStartData');
        const endTimeCtrl = form.get('playTimeEndData');

        if (event.checked) {
            startTimeCtrl.setValue({ hour: 0, minute: 0, second: 0 });
            endTimeCtrl.setValue({ hour: 23, minute: 59, second: 59 });
            return;
        }

        startTimeCtrl.setValue({ hour: 8, minute: 0, second: 0 });
        endTimeCtrl.setValue({ hour: 17, minute: 0, second: 59 });
    }

    selectAlternatingWeek() {
        const alternateWeekControl = this.schedulerForm.get('alternateWeek');
        this.hasAlternateWeekSet = !this.hasAlternateWeekSet;
        this.alternateWeek = this.hasAlternateWeekSet ? 1 : 0;
        alternateWeekControl.setValue(this.alternateWeek);
    }

    public getPlaylistContentSchedule(): void {
        if (!this.contents.length) return;

        this._playlist.getPlaylistScehduleByContentId(this.contents[0].playlistContentId).subscribe({
            next: (response) => {
                const contentSchedule = response[0];
                const days = response[0].days;
                const daysLength = days.split(',');

                this.setExistingScheduleFormValues(contentSchedule);
                this.hasCheckedAllDays = daysLength.length === 7;
            },
        });
    }

    private convertDateControlToISOString(form: FormGroup, controlName: string) {
        let controlValue: Date | string = form.value[controlName];

        if (typeof controlValue === 'undefined' || !controlValue) return;

        const isDateObject = Object.prototype.toString.call(controlValue) === '[object Date]';
        if (isDateObject) controlValue = (controlValue as Date).toISOString();

        form.get(controlName).setValue(controlValue, { emitEvent: false });
    }

    private isSetToPlayAllDay(start: NgbTimeStruct, end: NgbTimeStruct): boolean {
        const isNull = (value: any) => value == null;
        const hasInvalidStartTime = isNull(start) || isNull(start.hour) || isNull(start.minute);
        const hasInvalidEndTime = isNull(end) || isNull(end.hour) || isNull(end.minute);

        if (hasInvalidStartTime || hasInvalidEndTime) return false;

        const isStartOfDay = start.hour === 0 && start.minute === 0;
        const isEndOfDay = end.hour === 23 && end.minute === 59;
        return isStartOfDay && isEndOfDay;
    }

    private resetDaySelection() {
        this.days = this.days.map((day) => {
            day.checked = true;
            return day;
        });
    }

    private setExistingScheduleFormValues(data: PlaylistContentSchedule) {
        const { playTimeStart, playTimeEnd, from, to, alternateWeek, days } = data;
        this.alternateWeek = alternateWeek;
        this.hasAlternateWeekSet = alternateWeek === 1;
        const startDate = moment(from, 'YYYY-MM-DD hh:mm A').format();
        const endDate = moment(to, 'YYYY-MM-DD hh:mm A').format();
        const daysList = days.split(',');

        const parsedDays = this.days.map((data) => {
            data.checked = daysList.includes(`${data.dayId}`);
            return data;
        });

        const parsePlayTime = (data: string) => {
            // should be parsed to 24-hour format before assigning to timepicker
            const timeParsed = moment(data, 'hh:mm A').format('HH:mm').split(':');
            const hour = parseFloat(timeParsed[0]);
            const minute = parseFloat(timeParsed[1]);
            return { hour, minute, second: 0 };
        };

        const formData = {
            startDate,
            endDate,
            days: parsedDays,
            alternateWeek,
            playTimeStartData: parsePlayTime(playTimeStart),
            playTimeEndData: parsePlayTime(playTimeEnd),
        };

        const { playTimeStartData, playTimeEndData } = formData;
        this.isCheckedToPlayAllDay = this.isSetToPlayAllDay(playTimeStartData, playTimeEndData);
        this.form.patchValue(formData, { emitEvent: false });
    }

    private setDefaultFormValues() {
        const defaultStartDate = moment(new Date()).format();
        const defaultEndDate = moment(new Date()).add(5, 'years').format();

        this.startDateCtrl.setValue(defaultStartDate, { emitEvent: false });
        this.endDateCtrl.setValue(defaultEndDate, { emitEvent: false });
        this.daysCtrl.setValue(this.days, { emitEvent: false });
        this.startTimeCtrl.setValue({ hour: 0, minute: 0, second: 0 }, { emitEvent: false });
        this.endTimeCtrl.setValue({ hour: 23, minute: 59, second: 59 }, { emitEvent: false });
        this.isCheckedToPlayAllDay = true;
    }

    private subscribeToFormChanges() {
        const form = this.schedulerForm;

        form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe({
            next: () => {
                this.convertDateControlToISOString(form, 'startDate');
                this.convertDateControlToISOString(form, 'endDate');

                if (!this.selectedScheduleType || this.selectedScheduleType.type == 3)
                    this._playlist.schedulerFormUpdated.emit(form.value);

                const playStart = form.value.playTimeStartData as NgbTimeStruct;
                const playEnd = form.value.playTimeEndData as NgbTimeStruct;
                this.isCheckedToPlayAllDay = this.isSetToPlayAllDay(playStart, playEnd);
                this.validateRequiredFormData();
            },
        });
    }

    private subscribeToGetFormData() {
        this._playlist.requestSchedulerFormData.pipe(takeUntil(this._unsubscribe)).subscribe({
            next: () => {
                const form = this.schedulerForm;
                this._playlist.receiveSchedulerFormData.emit(form.value);
            },
        });
    }

    private subscribeToScheduleTypeSelection() {
        this._playlist.scheduleTypeSelected.pipe(takeUntil(this._unsubscribe)).subscribe({
            next: (response: { type: number; hasExistingSchedule: boolean }) => {
                this.selectedScheduleType = response;
                this._playlist.schedulerFormUpdated.emit(response);

                if (response.type === 3) {
                    if (!response.hasExistingSchedule) {
                        this.setDefaultFormValues();
                        return;
                    }

                    this.validateRequiredFormData();
                }
            },
        });
    }

    private subscribeToSetExistingFormData() {
        this._playlist.receiveExistingScheduleData.pipe(takeUntil(this._unsubscribe)).subscribe({
            next: (response) => {
                this.setExistingScheduleFormValues(response);
            },
        });
    }

    private validateRequiredFormData(): void {
        const errorCodes: string[] = [];
        const result = { isInvalid: true, errors: errorCodes };
        const currentDaysValue = this.daysCtrl.value as { dayId: string; day: string; checked: boolean }[];

        const validators = [
            {
                condition: currentDaysValue.every((day) => !day.checked),
                code: CONTENT_SCHEDULE_FORM_ERRORS.no_days_selected,
            },
            { condition: this.hasInvalidPlayTimes, code: CONTENT_SCHEDULE_FORM_ERRORS.invalid_play_times },
            { condition: this.hasInvalidDates, code: CONTENT_SCHEDULE_FORM_ERRORS.invalid_dates },
        ];

        validators.forEach(({ condition, code }) => {
            if (condition) errorCodes.push(code);
        });

        if (errorCodes.length === 0) {
            result.isInvalid = false;
            result.errors = null;
        }

        this._playlist.contentSchedulerFormValidity.emit(result);
    }

    private get hasInvalidDates(): boolean {
        const invalidStart = !moment(this.startDateCtrl.value).isSameOrBefore(this.endDateCtrl.value);
        const emptyStart = this.startDateCtrl.invalid;
        const invalidEnd = !moment(this.endDateCtrl.value).isSameOrAfter(this.startDateCtrl.value);
        const emptyEnd = this.endDateCtrl.invalid;

        return invalidStart || emptyStart || invalidEnd || emptyEnd;
    }

    private get hasInvalidPlayTimes(): boolean {
        return this.startTimeCtrl.invalid || this.endTimeCtrl.invalid;
    }

    protected get form() {
        return this.schedulerForm;
    }

    protected get startDateCtrl() {
        return this.form.get('startDate');
    }

    protected get endDateCtrl() {
        return this.form.get('endDate');
    }

    protected get yesterday() {
        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 1);
        return currentDate.toISOString();
    }

    protected get daysCtrl() {
        return this.form.get('days');
    }

    protected get startTimeCtrl() {
        return this.form.get('playTimeStartData');
    }

    protected get endTimeCtrl() {
        return this.form.get('playTimeEndData');
    }
}
