import { Component, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { FormControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import { environment as env } from '../../../../environments/environment';
import { AuthService, ContentService, PlaylistService } from '../../../global/services';
import {
	API_CONTENT,
	API_CONTENT_PLAY_COUNT,
	UI_CONTENT_HISTORY,
	UI_PLAYINGWHERE_CONTENT,
	UI_ROLE_DEFINITION,
	UI_ROLE_DEFINITION_TEXT
} from '../../../global/models';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

interface CONTENT_LOGS_REPORT {
	durationTime: string;
	endDate: string;
	hostId: string;
	hostName: string;
	playlistName: string;
	startDate: string;
	totalDuration: number;
	totalPlay: number;
}

@Component({
	selector: 'app-single-content',
	templateUrl: './single-content.component.html',
	styleUrls: ['./single-content.component.scss'],
	providers: [DatePipe]
})
export class SingleContentComponent implements OnInit, OnDestroy {
	content$: Observable<{ content: API_CONTENT }>;
	content_monthly_count: API_CONTENT_PLAY_COUNT[] = [];
	content_daily_count: API_CONTENT_PLAY_COUNT[] = [];
	content_yearly_count: API_CONTENT_PLAY_COUNT[] = [];
	daily_chart_updating = true;
	date_selected = this._date.transform(new Date(), 'longDate');
	monthly_chart_updating = true;
	playing_where: any[] = [];
	content_history: any[] = [];
	in_playlist: any[] = [];
	queried_date = moment();
	realtime_data: EventEmitter<any> = new EventEmitter();
	update_chart: EventEmitter<any> = new EventEmitter();
	yearly_chart_updating = true;
	paging_data_history: any;
	role: any;
	host_count: number = 0;
	license_count: number = 0;
	screen_count: number = 0;
	generating_report: boolean = false;
	report_generated: boolean = false;
	start_date: any;
	end_date: any;
	content_logs_report: any[] = [];
	content_logs_report_filtered: any[] = [];
	fs_screenshot: string = `${env.third_party.filestack_screenshot}`;
	total_duration: any;
	total_playcount: any;
	workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;
	content_to_export: any = [];
	content_logs: any[] = [];
	file_title: any;
	table_columns = ['#', 'License Alias', 'Host', 'Screen Name'];
	in_playlist_table_columns = ['#', 'Playlist Name', 'Business Name'];
	search_field = new FormControl(null);

	content_logs_report_table_columns = [
		{ name: '#', no_export: true },
		{ name: 'Host Name', key: 'hostName' },
		{ name: 'Playlist', key: 'playlistName' },
		{ name: 'Total Play', key: 'totalPlay' },
		{ name: 'Total Duration', key: 'totalDuration' },
		{ name: 'Start Date', key: 'startDate' },
		{ name: 'End Date', key: 'endDate' }
	];

	content_history_table_columns = [
		{ name: '#', no_export: true },
		{ name: 'Playlist Name', key: 'playlistName' },
		{ name: 'Log Action', key: 'logAction' },
		{ name: 'Log User', key: 'logUser' },
		{ name: 'Log Date', key: 'logDate' }
	];

	content_metrics_table_column = [
		{ name: 'Host', key: 'hostName' },
		{ name: 'Playlist', key: 'hostPlaysTotal' },
		{ name: 'Total Play', key: 'hostDurationsTotal' },
		{ name: 'Total Duration', key: 'hostName' },
		{ name: 'Date Started', key: 'hostPlaysTotal' },
		{ name: 'End Date', key: 'hostDurationsTotal' }
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
		private _dialog: MatDialog
	) {}

	ngOnInit() {
		this.role = Object.keys(UI_ROLE_DEFINITION).find((key) => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);
		if (this.role === UI_ROLE_DEFINITION_TEXT.dealeradmin) this.role = UI_ROLE_DEFINITION_TEXT.administrator;
		this.getPageParam();
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
		// this.getDailyStats(this.content_id, this._date.transform(value, 'y-MMM-dd'));
		// this.getYearlyStats(this.content_id, this._date.transform(value, 'y-MMM-dd'));
	}

	/**
	 * Content Logs Report: Generates Content Logs Report
	 * requires startDate, endDate, contentId
	 */
	generateReport() {
		this.report_generated = false;
		this.generating_report = true;
		if (this.start_date && this.end_date) {
			this._content
				.generate_content_logs_report({
					contentId: this.content_id,
					start: this.start_date.toString(),
					end: this.end_date.toString()
				})
				.subscribe((data: { total: number; contentLogsByHosts: CONTENT_LOGS_REPORT[] }) => {
					this.generating_report = false;
					this.report_generated = true;
					this.content_to_export = [...data.contentLogsByHosts];
					if (data.total > 0) {
						let count = 1;

						this.content_logs_report = data.contentLogsByHosts.map((i) => {
							return [
								{ value: count++, link: null, editable: false, hidden: false },
								{
									value: i.hostName,
									link: i.hostId ? `/${this.role}/hosts/${i.hostId}` : null,
									new_tab_link: true,
									editable: false,
									hidden: false
								},
								{ value: i.playlistName, link: null, hidden: false },
								{ value: i.totalPlay, link: null, hidden: false },
								{ value: i.totalDuration != 0 ? this.msToTime(i.totalDuration) : '0', link: null, hidden: false },
								{ value: i.startDate ? moment(new Date(i.startDate)).format('ll') : '--', link: null, hidden: false },
								{ value: i.endDate ? moment(new Date(i.endDate)).format('ll') : '--', link: null, hidden: false }
							];
						});

						this.content_logs_report_filtered = [...this.content_logs_report];

						this.searchHostReport();
					} else {
						this.content_logs_report = [];
						this.showConfirmationDialog('error', 'Error Generating Report, Try changing the dates selected');
					}
					this.getTotalDurationAndPlayCount(data.contentLogsByHosts);
				});
		}
	}

	searchHostReport() {
		this.search_field.valueChanges.subscribe({
			next: (e) => {
				let count = 1;
				let filtered;

				if (e === '') filtered = [...this.content_to_export];
				else filtered = [...this.content_to_export.filter((i) => i.hostName.toLowerCase().includes(e.toLowerCase()))];

				this.content_logs_report_filtered = filtered.map((i) => {
					return [
						{ value: count++, link: null, editable: false, hidden: false },
						{
							value: i.hostName,
							link: i.hostId ? `/${this.role}/hosts/${i.hostId}` : null,
							new_tab_link: true,
							editable: false,
							hidden: false
						},
						{ value: i.playlistName, link: null, hidden: false },
						{ value: i.totalPlay, link: null, hidden: false },
						{
							value:
								i.totalDuration != 0 && typeof i.totalDuration === 'number'
									? this.msToTime(i.totalDuration)
									: i.totalDuration.length
									? i.totalDuration
									: '0',
							link: null,
							hidden: false
						},
						{ value: i.startDate ? moment(new Date(i.startDate)).format('ll') : '--', link: null, hidden: false },
						{ value: i.endDate ? moment(new Date(i.endDate)).format('ll') : '--', link: null, hidden: false }
					];
				});
			}
		});
	}

	private showConfirmationDialog(type: 'error' | 'success', message: string): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status: type, message, data: '' }
		});

		dialog.afterClosed().subscribe(() => {
			this.report_generated = false;
			this.generating_report = false;
			this.start_date = '';
			this.end_date = '';
		});
	}

	getTotalDurationAndPlayCount(data) {
		var count = 0;
		var play_count = 0;
		data.map((i) => {
			count = count + i.totalDuration;
			play_count = play_count + i.totalPlay;
		});
		this.total_duration = this.msToTime(count);
		this.total_playcount = play_count;
	}

	msToTime(input) {
		let totalSeconds = input;
		let hours = Math.floor(totalSeconds / 3600);
		totalSeconds %= 3600;
		let minutes = Math.floor(totalSeconds / 60);
		let seconds = totalSeconds % 60;

		return hours + 'h ' + minutes + 'm ' + seconds + 's ';
	}

	/** Content Logs Report: StarDate Picker */
	onSelectStartDate(e) {
		this.start_date = moment(e).format('YYYY-MM-DD');
	}

	/** Content Logs Report: EndDate Picker */
	onSelectEndDate(e) {
		this.end_date = moment(e).format('YYYY-MM-DD');
	}

	private getPlaylistsOfContent(id: string) {
		this._playlist.get_playlist_by_content_id(id).subscribe((data: any) => {
			if (data) {
				let count = 1;

				this.in_playlist = data.map((i) => {
					return [
						{ value: i.playlistId, link: null, editable: false, hidden: true },
						{ value: count++, link: null, editable: false, hidden: false },
						{
							value: i.playlistName,
							link: i.playlistId ? `/${this.role}/playlists/${i.playlistId}` : null,
							new_tab_link: true,
							hidden: false
						},
						{ value: i.businessName, link: i.dealerId ? `/${this.role}/dealers/${i.dealerId}` : null, new_tab_link: true, hidden: false }
					];
				});
			}
		});
	}

	exportTable() {
		const header = [];
		this.workbook = new Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet(this.start_date + ' - ' + this.end_date);
		this.workbook_generation = true;
		Object.keys(this.content_logs_report_table_columns).forEach((key) => {
			if (this.content_logs_report_table_columns[key].name && !this.content_logs_report_table_columns[key].no_export) {
				header.push({
					header: this.content_logs_report_table_columns[key].name,
					key: this.content_logs_report_table_columns[key].key,
					width: 30,
					style: { font: { name: 'Arial', bold: true } }
				});
			}
		});

		const first_column = ['Filename', this.file_title];
		this.worksheet.columns = header;
		this.worksheet.getRow(1).values = [];
		this.worksheet.getRow(1).values = first_column;
		this.worksheet.getRow(2).values = [];
		const second_column = ['', '', 'Total Count', 'Total Duration'];
		this.worksheet.getRow(2).values = second_column;
		this.worksheet.getRow(2).height = 20;
		const third_column = ['', '', this.total_playcount, this.total_duration];
		// const third_column = ['',this.selected_content_count,this.selected_content_duration];
		this.worksheet.getRow(3).values = third_column;
		this.worksheet.getRow(3).height = 20;
		this.worksheet.getRow(4).values = [];
		this.worksheet.getRow(4).height = 20;
		this.worksheet.getRow(5).values = ['Host', 'Playlist', 'Play Count', 'Play Duration', 'Start Date', 'End Date'];
		this.worksheet.getRow(5).height = 20;
		this.worksheet.getCell('A1').alignment = { vertical: 'top', horizontal: 'left' };
		this.worksheet.getRow(2).font = {
			bold: true,
			name: 'Arial',
			size: 11
		};
		this.worksheet.mergeCells('B1:F1');
		this.worksheet.getCell('B1').alignment = { horizontal: 'left' };
		this.getDataForExport();
	}

	getDataForExport() {
		this.content_to_export.forEach((item, i) => {
			this.modifyItem(item);
			this.worksheet.addRow(item).font = {
				bold: false
			};
		});
		this.generateExcel();
	}

	modifyItem(item) {
		item.totalDuration = this.msToTime(item.totalDuration);
		item.startDate = item.startDate ? moment(new Date(item.startDate)).format('MM/DD/YYYY') : '';
		item.endDate = item.endDate ? moment(new Date(item.endDate)).format('MM/DD/YYYY') : '';
	}

	generateExcel() {
		const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
		var filename = '';
		let rowIndex = 1;
		for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
			this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
		}
		this.workbook.xlsx.writeBuffer().then((file: any) => {
			const blob = new Blob([file], { type: EXCEL_TYPE });
			filename = this.file_title + '-_reports' + '.xlsx';
			saveAs(blob, filename);
		});
		this.workbook_generation = false;
	}

	private getContentInfo(content_id: string): void {
		this.content$ = this._content.get_content_by_id(content_id);
		this.content$.subscribe((val) => (this.file_title = val.content.title));
	}

	private getDailyStats(content_id: string, date: string): void {
		const daily_stat = { contentId: content_id, from: date };

		this._content
			.get_content_daily_count(daily_stat)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT) => {
					if (response) {
						this.content_daily_count = response.contentPlaysListCount;
						this.daily_chart_updating = false;
					}
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private getPageParam(): void {
		this._params.paramMap.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
			this.content_id = this._params.snapshot.params.data;
			this.getPlaylistsOfContent(this.content_id);
			this.getMonthlyStats(this.content_id, this.current_date);
			// this.getDailyStats(this.content_id, this.current_date);
			// this.getYearlyStats(this.content_id, this.current_date);
			this.getContentInfo(this.content_id);
			this.getPlayWhere(this.content_id);
			this.getContentHistory(this.content_id, 1);

			this.start_date = this._params.snapshot.queryParamMap.get('start_date')
				? moment(new Date(this._params.snapshot.queryParamMap.get('start_date'))).format('YYYY-MM-DD')
				: null;

			this.end_date = this._params.snapshot.queryParamMap.get('end_date')
				? moment(new Date(this._params.snapshot.queryParamMap.get('end_date'))).format('YYYY-MM-DD')
				: null;

			if (this.start_date && this.end_date) {
				this.generateReport();
			}
		});
	}

	private getPlayWhere(id: string): void {
		this._content
			.get_contents_playing_where(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => (this.playing_where = this.mapToUIFormat(response.licenses)),
				(error) => {
					throw new Error(error);
				}
			);
	}

	private getContentHistory(id: string, page): void {
		this._content
			.get_contents_history(id, page)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					this.paging_data_history = response;
					this.content_history = this.mapToUIContentHistoryFormat(response.entities);
				},
				(error) => {
					this.paging_data_history = [];
				}
			);
	}

	public onClickPageNumber(page: number) {
		this.getContentHistory(this.content_id, page);
	}

	private getMonthlyStats(content_id: string, date: string): void {
		const monthly_stat = { contentId: content_id, from: date };

		this._content
			.get_content_monthly_count(monthly_stat)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT) => {
					this.content_monthly_count = response && response.contentPlaysListCount;
					this.monthly_chart_updating = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private getYearlyStats(content_id: string, date: string): void {
		const yearly_stat = { contentId: content_id, from: date };

		this._content
			.get_content_yearly_count(yearly_stat)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_CONTENT) => {
					this.content_yearly_count = response.contentPlaysListCount;
					this.yearly_chart_updating = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private mapToUIFormat(data: any[]): any[] {
		if (data && data.length > 0) {
			this.license_count = data.length;

			this.screen_count = [...new Set(data.map((i) => i.screenId))].length;

			this.host_count = [...new Set(data.map((i) => i.hostId))].length;

			let count = 1;
			return data.map((i) => {
				return new UI_PLAYINGWHERE_CONTENT(
					{ value: i.licenseId, link: null, editable: false, hidden: true },
					{ value: count++, link: null, editable: false, hidden: false },
					{
						value: i.licenseAlias ? i.licenseAlias : i.licenseId,
						link: i.licenseId ? `/${this.role}/licenses/${i.licenseId}` : null,
						new_tab_link: true,
						hidden: false
					},
					{ value: i.hostName, link: i.hostId ? `/${this.role}/hosts/${i.hostId}` : null, new_tab_link: true, hidden: false },
					{ value: i.screenName, link: i.screenId ? `/${this.role}/screens/${i.screenId}` : null, new_tab_link: true, hidden: false }
				);
			});
		}

		return [];
	}

	private mapToUIContentHistoryFormat(data: any[]): any[] {
		if (data && data.length > 0) {
			let count = this.paging_data_history.pageStart;
			return data.map((i) => {
				return new UI_CONTENT_HISTORY(
					{ value: count++, link: null, editable: false, hidden: false },
					{
						value: i.playlistContentId,
						link: i.playlistId ? `/${this.role}/playlists/${i.playlistId}` : null,
						new_tab_link: true,
						hidden: true
					},
					{ value: i.playlistId, link: i.playlistId ? `/${this.role}/playlists/${i.playlistId}` : null, new_tab_link: true, hidden: true },
					{
						value: i.playlistName,
						link: i.playlistName ? `/${this.role}/playlists/${i.playlistId}` : null,
						new_tab_link: true,
						hidden: false
					},
					{ value: i.logAction, link: null, editable: false, hidden: false },
					{
						value: i.userId != '0' && i.userId != null ? `${i.firstName} ${i.lastName}` : 'System',
						link: null,
						editable: false,
						hidden: false
					},
					{ value: this._date.transform(i.logDate, 'MMM dd, y h:mm a'), link: null, editable: false, hidden: false }
				);
			});
		}

		return [];
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}
}
