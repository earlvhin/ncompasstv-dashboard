import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { forkJoin, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment';

import { ContentService } from 'src/app/global/services/content-service/content.service';
import { PlaylistContentSchedule } from 'src/app/global/models/playlist-content-schedule.model';
import { PlaylistContentScheduleDialog } from 'src/app/global/models/playlist-content-schedule-dialog.model';

@Component({
	selector: 'app-playlist-content-scheduling-dialog',
	templateUrl: './playlist-content-scheduling-dialog.component.html',
	styleUrls: ['./playlist-content-scheduling-dialog.component.scss'],
	animations: [
		trigger(
		  'fade', [
			transition(':enter', [style({ height: 0, opacity: 0 }), animate('1s ease-out', style({ height: 0, opacity: 1 }))]),
			transition(':leave', [style({ height: 0, opacity: 1 }), animate('0.5s ease-in', style({ height: 0, opacity: 0 }))])
		  ]
		)
	]
})
export class PlaylistContentSchedulingDialogComponent implements OnDestroy, OnInit {

	days_list = [
		{ value: 1, name: 'Mon', checked: false },
		{ value: 2, name: 'Tue', checked: false },
		{ value: 3, name: 'Wed', checked: false },
		{ value: 4, name: 'Thu', checked: false },
		{ value: 5, name: 'Fri', checked: false },
		{ value: 6, name: 'Sat', checked: false },
		{ value: 7, name: 'Sun', checked: false },
	];

	form = this.form_builder.group(
		{
			'type': ['', Validators.required],
			'from': ['', Validators.required], 
			'to': ['', Validators.required],
			'days': ['', Validators.required ],
			'playTimeStart': ['', Validators.required],
			'playTimeEnd': ['', Validators.required],
		}
	);

	types = [
		{ value: 1, name: 'Default Play'},
		{ value: 2, name: 'Do Not Play'},
		{ value: 3, name: 'Custom Play'},
	];

	has_selected_all_days = false;
	has_selected_all_day_long = true;
	invalid_form = true;
	is_ready = false;
	selected_days: any[] = [];
	title = 'Set Schedule';
	warning_text = '';

	private _days: AbstractControl = this.form.get('days');
	private _type: AbstractControl = this.form.get('type');
	private _start_date: AbstractControl = this.form.get('from');
	private _end_date: AbstractControl = this.form.get('to');
	private _start_time: AbstractControl = this.form.get('playTimeStart');
	private _end_time: AbstractControl = this.form.get('playTimeEnd');
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public dialog_data: PlaylistContentScheduleDialog,
		private _content: ContentService,
		private dialog_reference: MatDialogRef<PlaylistContentSchedulingDialogComponent>,
		private form_builder: FormBuilder) { }
	
	ngOnInit() {
		this.setInitialFormValues();
		this.setWarningText();
		this.subscribeToFormChanges();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
        this._unsubscribe.complete();
	}
	
	get days(): string {
		return this._days.value;
	}

	get end_date(): any {
		return this._start_date.value;
	}

	get end_time(): string {
		return this._end_time.value;
	}

	get is_custom_play(): boolean {
		return this.type.name === this.types.filter(type => type.name === 'Custom Play')[0].name;
	}

	get is_default_play(): boolean {
		return this.type.name === this.types.filter(type => type.name === 'Default Play')[0].name;
	}

	get is_set_not_to_play(): boolean {
		return this.type.name === this.types.filter(type => type.name === 'Do Not Play')[0].name;
	}

	get start_date(): any {
		return this._start_date.value;
	}

	get start_time(): string {
		return this._start_time.value;
	}

	get type(): { value: number, name: string } {
		return this._type.value;
	}

	set days(data: string){
		this._days.setValue(data);
	}

	set end_time(data: string) {
		this._end_time.setValue(data);
	}

	set end_date(data: any) {
		this._end_date.setValue(data);
	}

	set start_date(data: any) {
		this._start_date.setValue(data);
	}

	set start_time(data: string) {
		this._start_time.setValue(data);
	}

	set type(data: { value: number, name: string }) {
		this._type.setValue(data);
	}

	onSelectDate(value: moment.Moment, type: string): void {

		if (!type) return;

		let date = value.format('YYYY-MM-DD');

		if (type === 'end') {
			this.end_date = date;
			return;
		}

		this.start_date = date;
	}

	onSelectAllDays(event: any): void {
		event.preventDefault();
		this.has_selected_all_days = !this.has_selected_all_days;

		if (!this.has_selected_all_days) {
			this.days_list.forEach(day => day.checked = false);
			this.days = '';
			return;
		}
		
		this.days_list.forEach(day => day.checked = true);
		this.days = '1,2,3,4,5,6,7';
	}

	onSelectAllDayLong(event: any): void {
		event.preventDefault();
		this.has_selected_all_day_long = !this.has_selected_all_day_long;
		
		if (this.has_selected_all_day_long) this.setPlayTimeToAllDay();
		else this.resetPlayTime();
	}

	onSelectDay(event: { checked: boolean }, index: number): void {

		let count = 0;
		this.days_list[index].checked = event.checked;
		this.has_selected_all_days = false;

		this.days = this.days_list.reduce((filtered, day) => {

			if (day.checked) {
				filtered.push(day.value);
				count++;
			}

			return filtered;

		}, []).join(',');

		if (count === 7) this.has_selected_all_days = true;

	}

	onSelectTime(value: string, type: string): void {

		if (!type) return;

		if (type === 'start') this.start_time = value;
		else this.end_time = value;

		if (this.start_time == '12:00 AM' && this.end_time == '11:59 PM') this.has_selected_all_day_long = true;
		else this.has_selected_all_day_long = false;

	}

	onSelectType(type: { value: number, name: string }): void {
		this.type = type;
	}

	onSubmit(): void {
		
		let forCreate: PlaylistContentSchedule[] = [];
		let forUpdate: PlaylistContentSchedule[] = [];
		const { days, from, to, type, playTimeStart, playTimeEnd } = this.form.value;
		const startDate = moment(from).format('YYYY-MM-DD');
		const endDate = moment(to).format('YYYY-MM-DD');
		
		// for creating schedule

		if (this.dialog_data.mode === 'create') {

			if (this.dialog_data.content_ids && this.dialog_data.content_ids.length > 0) {

				forCreate = this.dialog_data.content_ids.map(id => {
	
					let schedule = {} as PlaylistContentSchedule;

					if (this.is_custom_play) {
						schedule = {
							days,
							playTimeStart,
							playTimeEnd,
							from: moment(`${startDate} ${playTimeStart}`, 'YYYY-MM-DD hh:mm A').format(),
							to: moment(`${endDate} ${playTimeEnd}`, 'YYYY-MM-DD hh:mm A').format(),
							type: this.getTypeValue(type.name),
							playlistContentId: id,
						};
					} else {
						schedule = {
							days: '0',
							playTimeStart: null,
							playTimeEnd: null,
							from: null,
							to: null,
							type: this.getTypeValue(type.name),
							playlistContentId: id
						}
					}
	
					return schedule;
	
				});
				
			}

			if (this.dialog_data.schedules && this.dialog_data.schedules.length > 0) {

				forUpdate = this.dialog_data.schedules.map(schedule => {

					let playlistSchedule = {} as PlaylistContentSchedule;
	
					if (this.is_custom_play) {
						playlistSchedule = {
							playlistContentsScheduleId: schedule.id,
							days,
							playTimeStart,
							playTimeEnd,
							from: moment(`${startDate} ${playTimeStart}`, 'YYYY-MM-DD hh:mm A').format(),
							to: moment(`${endDate} ${playTimeEnd}`, 'YYYY-MM-DD hh:mm A').format(),
							type: this.getTypeValue(type.name),
							playlistContentId: schedule.content_id
						};
					} else {
						playlistSchedule = {
							playlistContentsScheduleId: schedule.id,
							days: '0',
							playTimeStart: null,
							playTimeEnd: null,
							from: null,
							to: null,
							type: this.getTypeValue(type.name),
							playlistContentId: schedule.content_id
						}
					}
	
					return playlistSchedule;
	
				});

			}

			this.submitAll(forCreate, forUpdate);

			return;
		}

		// for updating schedule

		let result = {} as PlaylistContentSchedule;
		const { playlistContentId, playlistContentsSchedule } = this.dialog_data.content;

		if (this.is_custom_play) {

			result = {
				days,
				playTimeStart,
				playTimeEnd,
				playlistContentId,
				playlistContentsScheduleId: playlistContentsSchedule.playlistContentsScheduleId,
				from: moment(`${startDate} ${playTimeStart}`, 'YYYY-MM-DD hh:mm A').format(),
				to: moment(`${endDate} ${playTimeEnd}`, 'YYYY-MM-DD hh:mm A').format(),
				type: this.getTypeValue(type.name),
			};

		} else {
			result = {
				playlistContentId,
				days: '0',
				playTimeStart: null,
				playTimeEnd: null,
				from: null,
				to: null,
				type: this.getTypeValue(type.name),
				playlistContentsScheduleId: playlistContentsSchedule.playlistContentsScheduleId,
			};
		}

		this.updateSchedule(result);
		return;		
	}

	private getTypeValue(data: string): number {
		
		switch (data) {
			case 'Do Not Play':
				return 2;
			case 'Custom Play':
				return 3;
			default:
				return 1;
		}

	}

	private isBlank(value: any): boolean {

		if (!value || typeof value === 'undefined') return true;

		if (typeof value === 'string' && value.trim().length === 0) return true;

		return false;

	}

	private get isFormValid(): boolean {

		if (this.isBlank(this.days)) return false;
		if (this.isBlank(this.start_date)) return false;
		if (this.isBlank(this.end_date)) return false;
		if (this.isBlank(this.start_time)) return false;
		if (this.isBlank(this.end_time)) return false;

		return true;
	}

	private resetPlayTime(): void {
		this.start_time = '';
		this.end_time = '';
	}

	private setDaysForUpdate(days: string): void {
		let dayCount = 0;
		const list = this.days_list;

		list.forEach(
			(day, index) => {
				if (days.includes(`${day.value}`)) {
					this.days_list[index].checked = true;
					dayCount++;
				}
			}
		);

		if (dayCount === 7) this.has_selected_all_days = true;
		
	}

	private setInitialFormValues(): void {

		const dialog = this.dialog_data;
		const { content, mode, content_ids, schedules } = dialog;

		// for create

		if (mode === 'create' || content_ids.length > 1) {
			this.type = this.types.filter(type => type.name === 'Default Play')[0];
			this.start_date = new Date();
			this.end_date = moment().add(5, 'years');
			this.setPlayTimeToAllDay();
			return;
		}

		// for update

		const { playlistContentsSchedule } = content;
		const { days, from, to, playTimeStart, playTimeEnd, type } = playlistContentsSchedule;
		this.type = this.types.filter(t => t.value == type)[0];

		if (typeof content.playlistContentsSchedule !== 'undefined' && content.playlistContentsSchedule) {

			this.start_date = from;
			this.end_date = to;

			if (schedules.length > 1) {
				this.start_date = new Date();
				this.end_date = moment().add(5, 'years');
			}

			this.days = days;
			this.setDaysForUpdate(days);
			this.start_time = playTimeStart;
			this.end_time = playTimeEnd;
			this.has_selected_all_day_long = (playTimeStart == '12:00 AM' && playTimeEnd == '11:59 PM') ? true : false;
			this.invalid_form = false;

		}

	}

	private setWarningText(): void {
		const schedules = this.dialog_data.schedules;
		if (schedules && schedules.length > 0) this.warning_text = 'Note: Saving will override content with existing schedules*';
	}

	private setPlayTimeToAllDay(): void {
		this.start_time = '12:00 AM';
		this.end_time = '11:59 PM';
	}

	private submitAll(create: PlaylistContentSchedule[], update: PlaylistContentSchedule[]): void {

		let message = 'create';
		let observables: Observable<any>[] = [];
		
		if (update.length > 0) message = 'update';

		if (create.length > 0) observables.push(this._content.create_content_schedule(create));
		
		update.forEach(data => {
			observables.push(this._content.update_content_schedule(data));
		});

		forkJoin(observables).pipe(takeUntil(this._unsubscribe)).subscribe(
			() => this.dialog_reference.close(message),
			error => console.log('Error submitting create/update schedules', error)
		);

	}

	private subscribeToFormChanges(): void {
		this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					if (!this.isFormValid) this.invalid_form = true;
					else this.invalid_form = false;
				},
				error => console.log('Error on form change subscription', error)
			);
	}

	private updateSchedule(data: PlaylistContentSchedule): void {

		this._content.update_content_schedule(data).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.dialog_reference.close('update'),
				error => console.log('Error updating content schedule', error)
			);

	}

}
