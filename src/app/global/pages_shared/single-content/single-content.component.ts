import { Component, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment';
import * as Excel from 'exceljs';
import { environment as env } from '../../../../environments/environment';
import { AuthService, ContentService, PlaylistService } from '../../../global/services';
import { API_CONTENT, API_CONTENT_PLAY_COUNT, UI_PLAYINGWHERE_CONTENT, UI_ROLE_DEFINITION } from '../../../global/models';

interface CONTENT_LOGS_REPORT {
	durationTime: string,
	endDate: string,
	hostId: string,
	hostName: string,
	playlistName: string,
	startDate: string,
	totalDuration: number,
	totalPlay: number
}

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
	in_playlist: any[] = [];
	queried_date = moment();
	realtime_data: EventEmitter<any> = new EventEmitter();
	update_chart: EventEmitter<any> = new EventEmitter();
	yearly_chart_updating = true;

	host_count: number = 0;
	license_count: number = 0;
	screen_count: number = 0;

	generating_report: boolean = false;
	report_generated: boolean = false;
	start_date: Date;
	end_date: Date;
	content_logs_report: any[] = [];
	content_logs_report_table_columns = [
		'#',
		'Host',
		'Playlist',
		'Total Play',
		'Total Duraton',
		'Date Started',
		'Date Ended'
	];

	role: any;
	fs_screenshot: string = `${env.third_party.filestack_screenshot}`

    table_columns = [
		'#',
		'License Alias',
		'Host',
        'Screen Name'
    ];

	in_playlist_table_columns = [
		'#',
		'Playlist Name',
		'Business Name'
    ];

	workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

	content_metrics_table_column = [
        { name: 'Host', key:'hostName'},
        { name: 'Playlist', key:'hostPlaysTotal'},
        { name: 'Total Play', key:'hostDurationsTotal'},
		{ name: 'Total Duration', key:'hostName'},
        { name: 'Date Started', key:'hostPlaysTotal'},
        { name: 'End Date', key:'hostDurationsTotal'},
	];

	private content_id: string;
	private current_date: string = this._date.transform(new Date(), 'y-MMM-dd');

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
        private _auth: AuthService,
		private _content: ContentService,
		private _playlist: PlaylistService,
		private _date: DatePipe,
		private _params: ActivatedRoute,
	) { }

	ngOnInit() {
		this.getPageParam();

		this.role = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);
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
		// this.getYearlyStats(this.content_id, this._date.transform(value, 'y-MMM-dd'));
	}

	/**
	 * Content Logs Report: Export Generated Report to Excel File
	 * requires content_logs_report?
	 */
	exportAsFile() {
		alert("EXPORTING :)");
	}

	/**
	 * Content Logs Report: Generates Content Logs Report
	 * requires startDate, endDate, contentId
	 */
	generateReport() {
		this.report_generated = false;
		this.generating_report = true;
		if (this.start_date && this.end_date) {
			this._content.generate_content_logs_report({
				contentId: this.content_id,
				start: this.start_date.toString(),
				end: this.end_date.toString() 
			}).subscribe((data: {total: number, contentLogsByHosts: CONTENT_LOGS_REPORT[]}) => {
				this.generating_report = false;
				this.report_generated = true;

				if (data.total > 0) {
					let count = 1;

					this.content_logs_report = data.contentLogsByHosts.map(
						i => {
							return (
								[
									{ value: count++, link: null , editable: false, hidden: false },
									{ value: i.hostName, link: i.hostId ? `/${this.role}/hosts/${i.hostId}` : null, editable: false, hidden: false },
									{ value: i.playlistName, link: null, hidden: false },
									{ value: i.totalPlay, link: null , hidden: false },
									{ value: moment.utc(i.totalDuration*1000).format('HH:mm:ss'), link: null , hidden: false },
									{ value: i.startDate ? moment(new Date(i.startDate)).format('MMMM DD, YYYY') : 'No Data', link: null , hidden: false },
									{ value: i.endDate ? moment(new Date(i.endDate)).format('MMMM DD, YY') : 'No Data', link: null , hidden: false }
								]
							)
						}
					);
				}
			})
		}
	}

	/** Content Logs Report: StarDate Picker */
	onSelectStartDate(e) {
		this.start_date = e.format('YYYY-MM-DD');
	}

	/** Content Logs Report: EndDate Picker */
	onSelectEndDate(e){
		this.end_date = e.format('YYYY-MM-DD');
	}

	private getPlaylistsOfContent(id: string) {
		this._playlist.get_playlist_by_content_id(id).subscribe(
			(data: any) => {
				const role = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);

				if (data) {
					let count = 1;

					this.in_playlist = data.map(
						i => {
							return (
								[
									{ value: i.playlistId, link: null , editable: false, hidden: true },
									{ value: count++, link: null , editable: false, hidden: false },
									{ value: i.playlistName, link: i.playlistId ? `/${role}/playlists/${i.playlistId}` : null , hidden: false },
									{ value: i.businessName, link: i.dealerId ? `/${role}/dealers/${i.dealerId}` : null , hidden: false },
								]
							);
						}
					);
				}
			}
		)
	}

	exportTable() {
		
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
					if (response) {
						this.content_daily_count = response.contentPlaysListCount;
						this.daily_chart_updating = false;
					}
				},
				error => console.log('Error retrieving daily stats', error)
			);
	}

	private getPageParam(): void {

		this._params.paramMap.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.content_id = this._params.snapshot.params.data;
					this.getPlaylistsOfContent(this.content_id);
					this.getMonthlyStats(this.content_id, this.current_date);
					this.getDailyStats(this.content_id, this.current_date);
					// this.getYearlyStats(this.content_id, this.current_date);
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
		if (data && data.length > 0) {
			this.license_count = data.length;

			this.screen_count = [...new Set(data.map(i => i.screenId))].length;

			this.host_count = [...new Set(data.map(i => i.hostId))].length

			let count = 1;

			const role = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);
	
			return data.map(
				i => {
					return new UI_PLAYINGWHERE_CONTENT(
						{ value: i.licenseId, link: null , editable: false, hidden: true },
						{ value: count++, link: null , editable: false, hidden: false },
						{ value: i.licenseAlias ? i.licenseAlias : i.licenseId, link: i.licenseId ? `/${role}/licenses/${i.licenseId}` : null , hidden: false },
						{ value: i.hostName, link: i.hostId ? `/${role}/hosts/${i.hostId}` : null , hidden: false },
						{ value: i.screenName, link: i.screenId ? `/${role}/screens/${i.screenId}` : null , hidden: false },
					);
				}
			);
		}

		return [];
    }

	protected get currentUser() {
		return this._auth.current_user_value;
	}
}
