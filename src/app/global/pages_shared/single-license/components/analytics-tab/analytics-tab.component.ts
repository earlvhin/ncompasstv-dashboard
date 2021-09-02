import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UI_SINGLE_SCREEN } from 'src/app/global/models';
import { ContentService } from 'src/app/global/services';

@Component({
	selector: 'app-analytics-tab',
	templateUrl: './analytics-tab.component.html',
	styleUrls: ['./analytics-tab.component.scss'],
	providers: [ DatePipe ]
})
export class AnalyticsTabComponent implements OnInit, OnDestroy {

	@Input() current_tab: string;
	@Input() license_id: string;
	@Input() screen: UI_SINGLE_SCREEN;
	@Input() realtime_data: EventEmitter<any>;
	
	current_month = new Date().getMonth() + 1;
	current_year = new Date().getFullYear();
	queried_date: string;
	selected_display_mode: string;
	destroy_monthly_charts = false;
	destroy_daily_charts = false;
	current_display_mode: string;
	daily_chart_updating = false;
	monthly_chart_updating = false;
	yearly_chart_updating = false;
	default_selected_month: string = this._date.transform(`${this.current_year}-${this.current_month}`, 'y-MM');
	selected_month = this.default_selected_month;
	monthly_content_count;
	daily_content_count;
	yearly_content_count;
	analytics_reload: Subject<any> = new Subject();

	display_mode = [
		{ value: 'daily', viewValue: 'Daily' },
		{ value: 'monthly', viewValue: 'Monthly' },
		{ value: 'yearly', viewValue: 'Yearly' }
	];

	months = [
		{ value: `${this.current_year}-01`, viewValue: 'January' },
		{ value: `${this.current_year}-02`, viewValue: 'February' },
		{ value: `${this.current_year}-03`, viewValue: 'March' },
		{ value: `${this.current_year}-04`, viewValue: 'April' },
		{ value: `${this.current_year}-05`, viewValue: 'May' },
		{ value: `${this.current_year}-06`, viewValue: 'June' },
		{ value: `${this.current_year}-07`, viewValue: 'July' },
		{ value: `${this.current_year}-08`, viewValue: 'August' },
		{ value: `${this.current_year}-09`, viewValue: 'September' },
		{ value: `${this.current_year}-10`, viewValue: 'October' },
		{ value: `${this.current_year}-11`, viewValue: 'November' },
		{ value: `${this.current_year}-12`, viewValue: 'December' }
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _content: ContentService,
		private _date: DatePipe
	) { }
	
	ngOnInit() {
		// this._helper.onSelectAnalyticsTab.emit();
		// this.monthly_chart_updating = true;
		// this.daily_chart_updating = true;

		// if (this.current_display_mode == 'monthly') {
		// 	this.getContentReport_monthly(this._date.transform(this.queried_date, 'y-MM-dd'));
		// } else if (this.current_display_mode == 'daily') {
		// 	this.getContentReport_daily(this._date.transform(this.queried_date, 'y-MM-dd'));
		// } else {
		// 	this.getContentReport_monthly(this._date.transform(this.queried_date, 'y-MM-dd'));
		// }

		this.displayModeSelected('monthly');
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	displayModeSelected(e): void {
		this.destroy_monthly_charts = true;
		this.destroy_daily_charts = true;
		this.current_display_mode = e;
		this.selected_display_mode = e;

		if (e === 'monthly') {
			this.queried_date = this._date.transform(new Date(), 'longDate');
			this.destroy_monthly_charts = false;
			this.getContentReport_monthly(this._date.transform(new Date(), 'y-MM'))
		} else {
			this.destroy_daily_charts = false;
			this.queried_date = this._date.transform(new Date(), 'longDate');
			this.getContentReport_daily(this._date.transform(new Date(), 'y-MM-dd'))
		}
	}

	monthSelected(value: any): void {
		console.log('month select', value);
		// if (this.current_tab !== 'Analytics') return;
		
		// if (this.selected_month == this.default_selected_month) {
		// 	console.log('1');
		// 	this.monthly_chart_updating = true;
		// 	this.getContentReport_monthly(this._date.transform(value, 'y-MM'));
		// } else {
		// 	console.log('2');
		// 	this.monthly_chart_updating = true;
		// 	this.daily_chart_updating = true;
		// 	this.getContentReport_monthly(this._date.transform(value, 'y-MM'));
		// 	// this.getContentReport_daily(this._date.transform(`${this.selected_month}-01`, 'y-MM-dd'))
		// 	this.queried_date = this._date.transform(`${this.selected_month}-01`, 'longDate');
		// }

		this.monthly_chart_updating = true;
		this.getContentReport_monthly(this._date.transform(value, 'y-MM'));
		this.queried_date = this._date.transform(`${this.selected_month}-01`, 'longDate');
	}

	onDateChange(value: any): void {
		if (this.selected_display_mode === 'daily') {

			this.queried_date = this._date.transform(value, 'longDate');
			this.monthly_chart_updating = true;
			this.daily_chart_updating = true;
			this.getContentReport_daily(this._date.transform(value, 'y-MM-dd'));
			this.getContentReport_monthly(this._date.transform(value, 'y-MM-dd'));

		} else if (this.selected_display_mode === 'yearly') {

			this.queried_date = this._date.transform(new Date(), 'longDate');
			this.yearly_chart_updating = true;
			this.getContentReport_yearly();

		}
	}

	private getContentReport_daily(date): void {
		const data = { licenseId: this.license_id, from: date };
		this.daily_chart_updating = true;

		this._content.get_content_daily_count_by_license(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
					this.daily_content_count = data;
					this.daily_chart_updating = false;
					this.destroy_daily_charts = false;

					setTimeout(() => {
						this.analytics_reload.next();
					}, 1000)
				},
				error => console.log('Error getting daily content count', error)
			);
	}

	private getContentReport_monthly(date): void {
		const data = { licenseId: this.license_id, from: date };
		this.monthly_chart_updating = true;
		
		this._content.get_content_monthly_count_by_license(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
					this.monthly_content_count = data;
					this.monthly_chart_updating = false;
					this.destroy_monthly_charts = false;

					setTimeout(() => {
						this.analytics_reload.next();
					}, 1000)
				},
				error => console.log('Error getting monthly content count', error)
			);
	}

	private getContentReport_yearly(): void {
		const data = { licenseId: this.license_id };

		this._content.get_content_yearly_count_by_license(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
					this.yearly_content_count = data;
					this.yearly_chart_updating = false;
				},
				error => console.log('Error getting yearly content count', error)
			);

	}
	
}
