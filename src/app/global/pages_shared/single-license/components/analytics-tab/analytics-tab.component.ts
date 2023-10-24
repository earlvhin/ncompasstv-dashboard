import { Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as moment from 'moment';

import { API_CONTENT, UI_CONTENT_PER_ZONE, UI_SINGLE_SCREEN } from '../../../../../global/models';
import { ContentService } from '../../../../../global/services';

@Component({
	selector: 'app-analytics-tab',
	templateUrl: './analytics-tab.component.html',
	styleUrls: ['./analytics-tab.component.scss']
})
export class AnalyticsTabComponent implements OnInit, OnDestroy {
	@Input() content_per_zone: UI_CONTENT_PER_ZONE[] = [];
	@Input() license_id: string;
	@Input() screen: UI_SINGLE_SCREEN;
	@Input() realtime_data: EventEmitter<any>;

	analytics_reload: Subject<any> = new Subject();
	current_date_display = moment().format('MMMM D, YYYY');
	daily_chart_updating = false;
	default_selected_month: string = moment().format('YYYY-MM');
	destroy_daily_charts = false;
	destroy_monthly_charts = false;
	monthly_chart_updating = true;
	queried_date: string;
	selected_display_mode: string;
	selected_month = this.default_selected_month;
	selected_zone: number = -1;
	yearly_chart_updating = false;

	daily_content_count: API_CONTENT[];
	monthly_content_count: API_CONTENT[];
	yearly_content_count: API_CONTENT[];

	private current_year = new Date().getFullYear();

	display_mode = [
		{ value: 'daily', viewValue: 'Daily' },
		{ value: 'monthly', viewValue: 'Monthly' }
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

	constructor(private _content: ContentService) {}

	ngOnInit() {
		this.onSelectDisplayMode('daily');
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	inZone(cc: API_CONTENT) {
		if (this.selected_zone == -1) return true;

		if (this.content_per_zone[this.selected_zone].contents.filter((i) => i.content_id === cc.contentId).length > 0) {
			return true;
		} else {
			return false;
		}
	}

	onSelectDate(value: any): void {
		const currentDate = moment(value);
		this.current_date_display = currentDate.format('MMMM D, YYYY');

		if (this.selected_display_mode === 'daily') {
			this.monthly_chart_updating = true;
			this.daily_chart_updating = true;
			this.getDailyContentReport(currentDate.format('YYYY-MM-DD'));
			return;
		}

		this.yearly_chart_updating = true;
		this.getYearlyContentReport();
	}

	onSelectDisplayMode(value: string): void {
		let currentDateResult: string;
		const currentDate = moment();

		this.destroy_monthly_charts = true;
		this.destroy_daily_charts = true;
		this.selected_display_mode = value;
		this.queried_date = currentDate.format('MMMM D, YYYY');

		switch (value) {
			case 'daily':
				this.destroy_daily_charts = false;
				this.getDailyContentReport(currentDate.format('YYYY-MM-DD'));
				this.queried_date = moment().format();
				currentDateResult = currentDate.format('MMMM D, YYYY');
				break;

			case 'yearly':
				break;

			default:
				this.destroy_monthly_charts = false;
				this.getMonthlyContentReport(currentDate.format('YYYY-MM'));
				currentDateResult = currentDate.format('MMMM, YYYY');
		}

		this.current_date_display = currentDateResult;
	}

	onSelectMonth(value: any): void {
		const currentDate = moment(value);
		this.monthly_chart_updating = true;
		this.getMonthlyContentReport(currentDate.format('YYYY-MM'));
		this.queried_date = currentDate.format('MMMM D, YYYY');
		this.current_date_display = currentDate.format('MMMM YYYY');
	}

	private getDailyContentReport(date: string): void {
		const data = { licenseId: this.license_id, from: date };
		this.daily_chart_updating = true;

		this._content
			.get_content_daily_count_by_license(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT[]) => {
					this.daily_content_count = response;
					this.daily_chart_updating = false;
					this.destroy_daily_charts = false;

					setTimeout(() => {
						this.analytics_reload.next();
					}, 1000);
				},
				(error) => {
					console.error(error);
				}
			);
	}

	private getMonthlyContentReport(date: string): void {
		const data = { licenseId: this.license_id, from: date };
		this.monthly_chart_updating = true;

		this._content
			.get_content_monthly_count_by_license(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT[]) => {
					this.monthly_content_count = response;
					this.monthly_chart_updating = false;
					this.destroy_monthly_charts = false;

					setTimeout(() => {
						this.analytics_reload.next();
					}, 1000);
				},
				(error) => {
					console.error(error);
				}
			);
	}

	private getYearlyContentReport(): void {
		const data = { licenseId: this.license_id };

		this._content
			.get_content_yearly_count_by_license(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT[]) => {
					this.yearly_content_count = response;
					this.yearly_chart_updating = false;
				},
				(error) => {
					console.error(error);
				}
			);
	}
}
