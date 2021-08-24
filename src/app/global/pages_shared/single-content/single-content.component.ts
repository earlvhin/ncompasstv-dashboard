import { Component, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment';

import { AuthService, ContentService } from 'src/app/global/services';
import { API_CONTENT, API_CONTENT_PLAY_COUNT, UI_PLAYINGWHERE_CONTENT, UI_ROLE_DEFINITION } from 'src/app/global/models';

@Component({
	selector: 'app-single-content',
	templateUrl: './single-content.component.html',
	styleUrls: ['./single-content.component.scss'],
	providers: [ DatePipe ]
})

export class SingleContentComponent implements OnInit, OnDestroy {
	
	content$: Observable<API_CONTENT>;
	content_monthly_count: API_CONTENT_PLAY_COUNT[] = [];
	content_daily_count: API_CONTENT_PLAY_COUNT[] = [];
	content_yearly_count: API_CONTENT_PLAY_COUNT[] = [];
	daily_chart_updating = true;
	date_selected = this._date.transform(new Date(), 'longDate');
	monthly_chart_updating = true;
    playing_where: any[] = [];
	queried_date = this._date.transform(new Date(), 'longDate');
	realtime_data: EventEmitter<any> = new EventEmitter();
	update_chart: EventEmitter<any> = new EventEmitter();
	yearly_chart_updating = true;

    table_columns = [
		'#',
		'License Alias',
        'Screen Name'
    ];

	private content_id: string;
	private current_date: string = this._date.transform(new Date(), 'y-MMM-dd');

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
        private _auth: AuthService,
		private _content: ContentService,
		private _date: DatePipe,
		private _params: ActivatedRoute,
	) { }

	ngOnInit() {
		this.getPageParam();
		this.queried_date = moment().format('MM-DD-YYYY');
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getFileSize(bytes: number, decimals = 2) {

		if (bytes === 0 || bytes === null) return '0 Bytes';

		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];

	}

	onSelectDate(value: moment.Moment): void {
		this.daily_chart_updating = true;
		this.yearly_chart_updating = true;
		this.monthly_chart_updating = true;
		this.date_selected = value.format('MMMM DD, YYYY');
		this.getMonthlyStats(this.content_id, this._date.transform(value, 'y-MMM-dd'));
		this.getDailyStats(this.content_id, this._date.transform(value, 'y-MMM-dd'));
		this.getYearlyStats(this.content_id, this._date.transform(value, 'y-MMM-dd'));
	}

	private getContentInfo(content_id: string): void {
		this.content$ = this._content.get_content_by_id(content_id);
	}

	private getDailyStats(content_id: string, date: string): void {

		const daily_stat = { contentId: content_id, from: date };

		this._content.get_content_daily_count(daily_stat)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT) => {
					this.content_daily_count = response.contentPlaysListCount;
					this.daily_chart_updating = false;
				},
				error => console.log('Error retrieving daily stats', error)
			);

	}

	private getPageParam(): void {

		this._params.paramMap.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.content_id = this._params.snapshot.params.data;
					this.getMonthlyStats(this.content_id, this.current_date);
					this.getDailyStats(this.content_id, this.current_date);
					this.getYearlyStats(this.content_id, this.current_date);
					this.getContentInfo(this.content_id);
					this.getPlayWhere(this.content_id);
				}
			);

	}

    private getPlayWhere(id: string): void {

		this._content.get_contents_playing_where(id).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => this.playing_where = this.mapToUIFormat(response.licenses),
				error => console.log('Error retrieving PlayWhere contents', error)
			);

    }

	private getMonthlyStats(content_id: string, date: string): void {

		const monthly_stat = { contentId: content_id, from: date };

		this._content.get_content_monthly_count(monthly_stat).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT) => {
					this.content_monthly_count = response.contentPlaysListCount;
					this.monthly_chart_updating = false;
				},
				error => console.log('Error retrieving monthly stats', error)
			);

	}

	private getYearlyStats(content_id: string, date: string): void {

		const yearly_stat = { contentId: content_id, from: date };

		this._content.get_content_yearly_count(yearly_stat).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT) => {
					this.content_yearly_count = response.contentPlaysListCount;
					this.yearly_chart_updating = false;
				},
				error => console.log('Error retrieving yearly stats', error)
			);

	}

	private mapToUIFormat(data: any[]): any[] {
        let count = 1;
        const role = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);

		return data.map(
            i => {
				return new UI_PLAYINGWHERE_CONTENT(
					{ value: i.licenseId, link: null , editable: false, hidden: true },
                    { value: count++, link: null , editable: false, hidden: false },
					{ value: i.licenseAlias ? i.licenseAlias : i.licenseId, link: i.licenseId ? `/${role}/licenses/${i.licenseId}` : null , hidden: false },
					{ value: i.screenId ? i.screenId : '--', link: null , hidden: true },
					{ value: i.screenName ? i.screenName : '--', link: i.licenseId ? `/${role}/screens/${i.screenId}` : null , hidden: false },
                );
			}
        );
    }

	protected get currentUser() {
		return this._auth.current_user_value;
	}

}
