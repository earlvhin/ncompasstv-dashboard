import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { FormControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Workbook, Worksheet } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import {
    API_CONTENT,
    API_PLAYLIST_MINIFIED,
    CONTENT_HISTORY,
    CONTENT_LOGS_REPORT,
    LICENSE_PLAYING_WHERE,
    PAGING,
    TABLE_ROW_FORMAT,
    UI_CONTENT_HISTORY,
    UI_PLAYING_WHERE_CONTENT,
    UI_ROLE_DEFINITION,
    UI_ROLE_DEFINITION_TEXT,
} from 'src/app/global/models';

import { environment as env } from 'src/environments/environment';
import { AuthService, ContentService, PlaylistService } from 'src/app/global/services';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-single-content',
    templateUrl: './single-content.component.html',
    styleUrls: ['./single-content.component.scss'],
    providers: [DatePipe],
})
export class SingleContentComponent implements OnInit, OnDestroy {
    content$: Observable<{ content: API_CONTENT }>;
    contentHistory: UI_CONTENT_HISTORY[] = [];
    contentHistoryTableColumns = this._contentHistoryTableColumns;
    contentLogsReport: TABLE_ROW_FORMAT[][] = [];
    contentLogsReportTableColumns = this._contentLogsReportTableColumns;
    endDate: string;
    hasGeneratedReport = false;
    hostCount = 0;
    isExporting = false;
    isGeneratingReport = false;
    inPlaylist: TABLE_ROW_FORMAT[][] = [];
    inPlaylistTableColumns = ['#', 'Playlist Name', 'Business Name'];
    licenseCount = 0;
    pagingDataHistory: PAGING;
    playingWhere: UI_PLAYING_WHERE_CONTENT[] = [];
    playingWhereTableColumns = ['#', 'License Alias', 'Host', 'Screen Name'];
    role: string;
    screenCount = 0;
    screenshotUrl = `${env.third_party.filestack_screenshot}`;
    searchField = new FormControl(null);
    startDate: string;
    totalDuration: string;
    totalPlayCount: number;

    private contentId: string;
    private contentToExport: CONTENT_LOGS_REPORT[] = [];
    private filename: string;
    private worksheet: Worksheet;
    private workbook: Workbook;
    protected ngUnsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _content: ContentService,
        private _playlist: PlaylistService,
        private _date: DatePipe,
        private _params: ActivatedRoute,
        private _dialog: MatDialog,
    ) {}

    ngOnInit() {
        this.role = Object.keys(UI_ROLE_DEFINITION).find((key) => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);
        if (this.role === UI_ROLE_DEFINITION_TEXT.dealeradmin) this.role = UI_ROLE_DEFINITION_TEXT.administrator;
        this.getPageParam();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * Content Logs Report: Generates Content Logs Report
     * requires startDate, endDate, contentId
     */
    public generateReport(): void {
        if (!this.startDate || !this.endDate) return;
        this.hasGeneratedReport = false;
        this.isGeneratingReport = true;
        const errorMessage = 'Error Generating Report. Try changing the dates selected.';

        const request = this._content.generate_content_logs_report({
            contentId: this.contentId,
            start: this.startDate.toString(),
            end: this.endDate.toString(),
        });

        request.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
            next: (data: { total: number; contentLogsByHosts: CONTENT_LOGS_REPORT[] }) => {
                this.isGeneratingReport = false;
                this.hasGeneratedReport = true;
                this.contentToExport = [...data.contentLogsByHosts];
                this.getTotalDurationAndPlayCount(data.contentLogsByHosts);

                if (data.total <= 0) {
                    this.contentLogsReport = [];
                    this.showConfirmationDialog('error', errorMessage);
                    return;
                }

                this.contentLogsReport = this.mapForContentLogReport(data.contentLogsByHosts);
            },
            error: () => {
                this.contentLogsReport = [];
                this.hasGeneratedReport = false;
                this.isGeneratingReport = false;
                this.showConfirmationDialog('error', errorMessage);
            },
        });
    }

    private mapForContentLogReport(data: CONTENT_LOGS_REPORT[]): TABLE_ROW_FORMAT[][] {
        let count = 1;

        return data.map((i) => {
            return [
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: i.hostName,
                    link: i.hostId ? `/${this.role}/hosts/${i.hostId}` : null,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                { value: i.playlistName, link: null, hidden: false },
                { value: i.totalPlay, link: null, hidden: false },
                {
                    value: i.totalDuration != 0 ? this.msToTime(i.totalDuration) : '0',
                    link: null,
                    hidden: false,
                },
                {
                    value: i.startDate ? moment(new Date(i.startDate)).format('ll') : '--',
                    link: null,
                    hidden: false,
                },
                {
                    value: i.endDate ? moment(new Date(i.endDate)).format('ll') : '--',
                    link: null,
                    hidden: false,
                },
            ];
        });
    }

    public searchHostReport(): void {
        this.searchField.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
            next: (e) => {
                let count = 1;
                let filtered: CONTENT_LOGS_REPORT[];

                if (e === '') filtered = [...this.contentToExport];
                else
                    filtered = [
                        ...this.contentToExport.filter((i) => i.hostName.toLowerCase().includes(e.toLowerCase())),
                    ];

                this.contentLogsReport = filtered.map((i) => {
                    return [
                        { value: count++, link: null, editable: false, hidden: false },
                        {
                            value: i.hostName,
                            link: i.hostId ? `/${this.role}/hosts/${i.hostId}` : null,
                            new_tab_link: true,
                            editable: false,
                            hidden: false,
                        },
                        { value: i.playlistName, link: null, hidden: false },
                        { value: i.totalPlay, link: null, hidden: false },
                        {
                            value: this.getTotalDuration(i.totalDuration),
                            link: null,
                            hidden: false,
                        },
                        {
                            value: i.startDate ? moment(new Date(i.startDate)).format('ll') : '--',
                            link: null,
                            hidden: false,
                        },
                        {
                            value: i.endDate ? moment(new Date(i.endDate)).format('ll') : '--',
                            link: null,
                            hidden: false,
                        },
                    ];
                });
            },
        });
    }

    private showConfirmationDialog(type: 'error' | 'success', message: string): void {
        const dialog = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status: type, message, data: '' },
        });

        dialog.afterClosed().subscribe(() => {
            this.hasGeneratedReport = false;
            this.isGeneratingReport = false;
            this.startDate = '';
            this.endDate = '';
        });
    }

    private getTotalDurationAndPlayCount(data: CONTENT_LOGS_REPORT[]): void {
        let count = 0;
        let playCount = 0;

        data.map((i) => {
            count = count + i.totalDuration;
            playCount = playCount + i.totalPlay;
        });

        this.totalDuration = this.msToTime(count);
        this.totalPlayCount = playCount;
    }

    private msToTime(input: number): string {
        let totalSeconds = input;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    /**
     * Updates the start/end date datepickers with the provided data.
     * Datepicker for Content Logs Report.
     *
     * @param {string} data The new start/end date in string format.
     * @returns {void}
     */
    public selectStartOrEndDate(data: string, type = 'start'): void {
        const DEFAULT_FORMAT = 'YYYY-MM-DD';
        const result = moment(data).format(DEFAULT_FORMAT);
        type === 'start' ? (this.startDate = result) : (this.endDate = result);
    }

    private getPlaylistsOfContent(id: string) {
        this._playlist.getPlaylistByContentId(id).subscribe({
            next: (response) => {
                if ('message' in response) return;

                const playlists = response.playlists as API_PLAYLIST_MINIFIED[];

                let count = 1;

                this.inPlaylist = playlists.map((i) => {
                    return [
                        { value: i.playlistId, link: null, editable: false, hidden: true },
                        { value: count++, link: null, editable: false, hidden: false },
                        {
                            value: i.playlistName,
                            link: i.playlistId ? `/${this.role}/playlists/${i.playlistId}` : null,
                            new_tab_link: true,
                            hidden: false,
                        },
                        {
                            value: i.businessName,
                            link: i.dealerId ? `/${this.role}/dealers/${i.dealerId}` : null,
                            new_tab_link: true,
                            hidden: false,
                        },
                    ];
                });
            },
            error: (e) => {
                console.error('Failed to retrieve playlists of content', e);
            },
        });
    }

    public exportTable(): void {
        const header = [];
        this.workbook = new Workbook();
        this.workbook.creator = 'NCompass TV';
        this.workbook.created = new Date();
        this.worksheet = this.workbook.addWorksheet(this.startDate + ' - ' + this.endDate);
        this.isExporting = true;

        Object.keys(this.contentLogsReportTableColumns).forEach((key) => {
            if (this.contentLogsReportTableColumns[key].name && !this.contentLogsReportTableColumns[key].no_export) {
                header.push({
                    header: this.contentLogsReportTableColumns[key].name,
                    key: this.contentLogsReportTableColumns[key].key,
                    width: 30,
                    style: { font: { name: 'Arial', bold: true } },
                });
            }
        });

        const firstColumn = ['Filename', this.filename];
        const secondColumn = ['', '', 'Total Count', 'Total Duration'];
        const thirdColumn = ['', '', this.totalPlayCount, this.totalDuration];
        this.worksheet.columns = header;
        this.worksheet.getRow(1).values = [];
        this.worksheet.getRow(1).values = firstColumn;
        this.worksheet.getRow(2).values = [];
        this.worksheet.getRow(2).values = secondColumn;
        this.worksheet.getRow(2).height = 20;
        this.worksheet.getRow(3).values = thirdColumn;
        this.worksheet.getRow(3).height = 20;
        this.worksheet.getRow(4).values = [];
        this.worksheet.getRow(4).height = 20;
        this.worksheet.getRow(5).values = ['Host', 'Playlist', 'Play Count', 'Play Duration', 'Start Date', 'End Date'];
        this.worksheet.getRow(5).height = 20;
        this.worksheet.getCell('A1').alignment = { vertical: 'top', horizontal: 'left' };
        this.worksheet.getRow(2).font = {
            bold: true,
            name: 'Arial',
            size: 11,
        };
        this.worksheet.mergeCells('B1:F1');
        this.worksheet.getCell('B1').alignment = { horizontal: 'left' };
        this.getDataForExport();
    }

    private getDataForExport(): void {
        this.contentToExport.forEach((item) => {
            this.modifyItem(item);
            this.worksheet.addRow(item).font = { bold: false };
        });

        this.generateExcel();
    }

    private modifyItem(item: { totalDuration: number | string; startDate: string; endDate: string }): void {
        item.totalDuration = this.msToTime(item.totalDuration as number);
        item.startDate = item.startDate ? moment(new Date(item.startDate)).format('MM/DD/YYYY') : '';
        item.endDate = item.endDate ? moment(new Date(item.endDate)).format('MM/DD/YYYY') : '';
    }

    public generateExcel(): void {
        const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        let filename = '';
        let rowIndex = 1;

        for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
            this.worksheet.getRow(rowIndex).alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true,
            };
        }
        this.workbook.xlsx.writeBuffer().then((file: any) => {
            const blob = new Blob([file], { type: EXCEL_TYPE });
            filename = `${this.filename}-_reports.xlsx`;
            saveAs(blob, filename);
        });

        this.isExporting = false;
    }

    private getContentInfo(content_id: string): void {
        this.content$ = this._content.get_content_by_id(content_id);
        this.content$.subscribe((val) => (this.filename = val.content.title));
    }

    private getPageParam(): void {
        this._params.paramMap.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
            this.contentId = this._params.snapshot.params.data;
            this.getPlaylistsOfContent(this.contentId);
            this.getContentInfo(this.contentId);
            this.getPlayWhere(this.contentId);
            this.getContentHistory(this.contentId, 1);

            const startDate = this._params.snapshot.queryParamMap.get('start_date');
            const endDate = this._params.snapshot.queryParamMap.get('end_date');
            this.startDate = startDate ? moment(new Date(startDate)).format('YYYY-MM-DD') : null;
            this.endDate = endDate ? moment(new Date(endDate)).format('YYYY-MM-DD') : null;
            if (this.startDate && this.endDate) this.generateReport();
        });
    }

    private getPlayWhere(id: string): void {
        this._content
            .get_contents_playing_where(id)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response) => {
                    this.playingWhere = this.mapToUIFormat(response.licenses);
                },
                (error) => {
                    console.error('Error retrieving data where contents are playing', error);
                },
            );
    }

    private getContentHistory(id: string, page: number): void {
        this._content
            .get_contents_history(id, page)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response) => {
                    if ('message' in response) {
                        this.pagingDataHistory = null;
                        return;
                    }

                    const data = response as PAGING;
                    this.pagingDataHistory = data;
                    this.contentHistory = this.mapToUIContentHistoryFormat([...data.entities]);
                },
                (error) => {
                    console.error('Error retrieving content history', error);
                    this.pagingDataHistory = null;
                },
            );
    }

    /**
     * Returns the total duration formatted as a human-readable string.
     *
     * @param {number} data The total duration in milliseconds.
     * @returns {string} The formatted total duration.
     * @needsRefactoring This method needs refactoring for clarity and readability.
     */
    private getTotalDuration(data: number): string {
        return data != 0 && typeof data === 'number' ? this.msToTime(data) : data ? data : '0';
    }

    public onClickPageNumber(page: number): void {
        this.getContentHistory(this.contentId, page);
    }

    private mapToUIFormat(data: LICENSE_PLAYING_WHERE[]): UI_PLAYING_WHERE_CONTENT[] {
        if (typeof data === 'undefined' || data.length <= 0) return [];

        this.licenseCount = data.length;
        this.screenCount = [...new Set(data.map((i) => i.screenId))].length;
        this.hostCount = [...new Set(data.map((i) => i.hostId))].length;

        let count = 1;
        return data.map((i) => {
            return new UI_PLAYING_WHERE_CONTENT(
                { value: i.licenseId, link: null, editable: false, hidden: true },
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: i.licenseAlias ? i.licenseAlias : i.licenseId,
                    link: i.licenseId ? `/${this.role}/licenses/${i.licenseId}` : null,
                    new_tab_link: true,
                    hidden: false,
                },
                {
                    value: i.hostName,
                    link: i.hostId ? `/${this.role}/hosts/${i.hostId}` : null,
                    new_tab_link: true,
                    hidden: false,
                },
                {
                    value: i.screenName,
                    link: i.screenId ? `/${this.role}/screens/${i.screenId}` : null,
                    new_tab_link: true,
                    hidden: false,
                },
            );
        });
    }

    private mapToUIContentHistoryFormat(data: CONTENT_HISTORY[]): UI_CONTENT_HISTORY[] {
        if (!data || data.length <= 0) return [];

        let count = this.pagingDataHistory.pageStart;

        return data.map((i) => {
            return new UI_CONTENT_HISTORY(
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: i.playlistContentId,
                    link: i.playlistId ? `/${this.role}/playlists/${i.playlistId}` : null,
                    new_tab_link: true,
                    hidden: true,
                },
                {
                    value: i.playlistId,
                    link: i.playlistId ? `/${this.role}/playlists/${i.playlistId}` : null,
                    new_tab_link: true,
                    hidden: true,
                },
                {
                    value: i.playlistName,
                    link: i.playlistName ? `/${this.role}/playlists/${i.playlistId}` : null,
                    new_tab_link: true,
                    hidden: false,
                },
                { value: i.logAction, link: null, editable: false, hidden: false },
                {
                    value: i.userId != '0' && i.userId != null ? `${i.firstName} ${i.lastName}` : 'System',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: this._date.transform(i.logDate, 'MMM dd, y h:mm a'),
                    link: null,
                    editable: false,
                    hidden: false,
                },
            );
        });
    }

    protected get currentUser() {
        return this._auth.current_user_value;
    }

    protected get _contentHistoryTableColumns() {
        return [
            { name: '#', no_export: true },
            { name: 'Playlist Name', key: 'playlistName' },
            { name: 'Log Action', key: 'logAction' },
            { name: 'Log User', key: 'logUser' },
            { name: 'Log Date', key: 'logDate' },
        ];
    }

    protected get _contentLogsReportTableColumns() {
        return [
            { name: '#', no_export: true },
            { name: 'Host Name', key: 'hostName' },
            { name: 'Playlist', key: 'playlistName' },
            { name: 'Total Play', key: 'totalPlay' },
            { name: 'Total Duration', key: 'totalDuration' },
            { name: 'Start Date', key: 'startDate' },
            { name: 'End Date', key: 'endDate' },
        ];
    }
}
