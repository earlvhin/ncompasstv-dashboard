import { Component, OnInit, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ContentService } from '../../services/content-service/content.service';
import { Subscription, Observable } from 'rxjs';
import { API_CONTENT, API_CONTENT_PLAY_COUNT } from '../../models/api_content.model';
import { UI_PLAYINGWHERE_CONTENT } from 'src/app/global/models/ui_content.model';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { AuthService } from '../../services/auth-service/auth.service';

@Component({
	selector: 'app-single-content',
	templateUrl: './single-content.component.html',
	styleUrls: ['./single-content.component.scss'],
	providers: [DatePipe]
})

export class SingleContentComponent implements OnInit {
	
	content$: Observable<API_CONTENT>;
	content_id: string;
	content_monthly_count: API_CONTENT_PLAY_COUNT[] = [];
	content_monthly_count_label: Array<string> = [];
	content_monthly_count_value: Array<number> = [];

	content_daily_count: API_CONTENT_PLAY_COUNT[] = [];
	content_daily_count_label: Array<string> = [];
	content_daily_count_value: Array<number> = [];

	content_yearly_count: API_CONTENT_PLAY_COUNT[] = [];
	content_yearly_count_label: Array<string> = [];
	content_yearly_count_value: Array<number> = [];
	
    playing_where: any = [];
	subscription: Subscription = new Subscription;
	realtime_data: EventEmitter<any> = new EventEmitter();
	current_date: string = this._date.transform(new Date(), 'y-MMM-dd');
	queried_date: string = this._date.transform(new Date(), 'longDate');
	update_chart: EventEmitter<any> = new EventEmitter();
	daily_chart_updating: boolean = true;
	yearly_chart_updating: boolean = true;
	monthly_chart_updating: boolean = true;

    playing_where_columns = [
		'#',
		'License Alias',
        'Screen Name'
    ]

	constructor(
		private _content: ContentService,
		private _date: DatePipe,
		private _params: ActivatedRoute,
        private _auth: AuthService,
	) { }

	ngOnInit() {
		this.getPageParam();
	}

	OnDateChange(e) {
		this.daily_chart_updating = true;
		this.yearly_chart_updating = true;
		this.monthly_chart_updating = true;
		this.queried_date = this._date.transform(e, 'longDate')
		this.getMonthlyStats(this.content_id, this._date.transform(e, 'y-MMM-dd'));
		this.getDailyStats(this.content_id, this._date.transform(e, 'y-MMM-dd'));
		this.getYearlyStats(this.content_id, this._date.transform(e, 'y-MMM-dd'));
	}

	getPageParam() {
		this.subscription.add(
			this._params.paramMap.subscribe(
				data => {
					this.content_id = this._params.snapshot.params.data;
					this.getMonthlyStats(this.content_id, this.current_date);
					this.getDailyStats(this.content_id, this.current_date);
					this.getYearlyStats(this.content_id, this.current_date);
					this.getContentInfo(this.content_id);
					this.getPlayWhere(this.content_id);
				},
				error => {
					console.log(error)
				}
			)
		)
	}

    getPlayWhere(id) {
        this.subscription.add(
			this._content.get_contents_playing_where(id).subscribe(
                data => {
                    this.playing_where = this.playwhere_mapToUI(data.licenses);
                }
            )
        )
    }

    playwhere_mapToUI(data): any[] {
        let count: number = 1;
        const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		return data.map(
            i => {
				return new UI_PLAYINGWHERE_CONTENT(
					{ value: i.licenseId, link: null , editable: false, hidden: true },
                    { value: count++, link: null , editable: false, hidden: false},
					{ value: i.licenseAlias ? i.licenseAlias : i.licenseId, link: i.licenseId ? `/${route}/licenses/` +  i.licenseId : null , hidden: false },
					{ value: i.screenId ? i.screenId : '--', link: null , hidden: true },
					{ value: i.screenName ? i.screenName : '--', link: i.licenseId ? `/${route}/screens/` +  i.screenId : null , hidden: false },
                )
                }
        )
    }

	getMonthlyStats(content_id, date) {
		let monthly_stat = {
			contentId: content_id,
			from: date
		}

		this.subscription.add(
			this._content.get_content_monthly_count(monthly_stat).subscribe(
				(data: API_CONTENT) => {
					this.content_monthly_count = data.contentPlaysListCount;
					this.monthly_chart_updating = false;
				}
			)
		)
	}

	getYearlyStats(content_id, date) {
		let yearly_stat = {
			contentId: content_id,
			from: date
		}

		this.subscription.add(
			this._content.get_content_yearly_count(yearly_stat).subscribe(
				(data: API_CONTENT) => {
					this.content_yearly_count = data.contentPlaysListCount;
					this.yearly_chart_updating = false;
				}
			)
		)
	}

	getDailyStats(content_id, date) {
		let daily_stat = {
			contentId: content_id,
			from: date
		}
		
		this.subscription.add(
			this._content.get_content_daily_count(daily_stat).subscribe(
				(data: API_CONTENT) => {
					this.content_daily_count = data.contentPlaysListCount;
					this.daily_chart_updating = false;
				}
			)
		)
	}

	getContentInfo(data) {
		this.content$ = this._content.get_content_by_id(data);
	}

    getFileSize(bytes, decimals = 2) {
		if (bytes === 0 || bytes === null) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}

    removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}
}
