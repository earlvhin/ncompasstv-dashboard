import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { environment } from 'src/environments/environment';
import { finalize, takeUntil } from 'rxjs/operators';
import * as io from 'socket.io-client';

import { PlaylistService } from 'src/app/global/services';
import { API_PLAYLIST, DataTableColumn, UI_TABLE_PLAYLIST } from 'src/app/global/models';

@Component({
    selector: 'app-playlists',
    templateUrl: './playlists.component.html',
    styleUrls: ['./playlists.component.scss'],
    providers: [DatePipe, TitleCasePipe],
})
export class PlaylistsComponent implements OnInit, OnDestroy {
    filtered_data: UI_TABLE_PLAYLIST[] = [];
    initial_load = true;
    no_playlist: boolean;
    paging_data: any;
    playlist_data: UI_TABLE_PLAYLIST[] = [];
    playlists_details: any;
    playlist_to_export: any = [];
    search_data = '';
    searching = false;
    sort_column = '';
    sort_order = '';
    title = 'Playlists';
    workbook: any;
    workbook_generation = false;
    worksheet: any;
    playlistTableColumn = this._playlistColumns;

    private playlistExportColumns = this._playlistExportColumns;
    protected _socket: any;
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _playlist: PlaylistService,
        private _date: DatePipe,
        private _titlecase: TitleCasePipe,
    ) {}

    ngOnInit() {
        this.initializeSocketConnection();
        this.getTotalPlaylist();
        this.pageRequested(1);
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    fromDelete() {
        // this.searching = true;
        this.ngOnInit();
    }

    /**
     * Retrieves playlist data per page
     *
     * @param {number} page - The page number to request.
     */
    public pageRequested(page: number): void {
        this.searching = true;
        this.playlist_data = [];

        this._playlist
            .get_all_playlists(page, this.search_data, this.sort_column, this.sort_order)
            .pipe(
                takeUntil(this._unsubscribe),
                finalize(() => {
                    this.initial_load = false;
                    this.searching = false;
                }),
            )
            .subscribe(
                (res) => {
                    this.initial_load = false;
                    this.paging_data = res.paging;

                    // if no results
                    if ('message' in res) {
                        // if no results and has search keyword
                        if (this.search_data.length) {
                            this.filtered_data = [];
                            this.no_playlist = false;
                            return;
                        }

                        this.no_playlist = true;
                        return;
                    }

                    // map playlists to table ui
                    const mappedPlaylists = this.mapToTableData(res.paging.entities);
                    this.playlist_data = [...mappedPlaylists];
                    this.filtered_data = [...mappedPlaylists];
                },
                (e) => console.error('Failed to retrieve playlists', e),
            );
    }

    getColumnsAndOrder(data) {
        this.sort_column = data.column;
        this.sort_order = data.order;
        this.pageRequested(1);
    }

    getTotalPlaylist() {
        this._playlist
            .get_playlists_total()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data: any) => {
                this.playlists_details = {
                    basis: data.total,
                    basis_label: 'Playlist(s)',
                    good_value: data.totalActive,
                    good_value_label: 'Active',
                    bad_value: data.totalInActive,
                    bad_value_label: 'Inactive',
                    new_this_week_value: data.newPlaylistsThisWeek,
                    new_this_week_value_label: 'Playlist(s)',
                    new_this_week_value_description: 'New this week',
                    new_last_week_value: data.newPlaylistsLastWeek,
                    new_last_week_value_label: 'Playlist(s)',
                    new_last_week_value_description: 'New last week',
                };
            });
    }

    private mapToTableData(data: API_PLAYLIST[]): UI_TABLE_PLAYLIST[] {
        let count = this.paging_data.pageStart;
        return data.map((p) => {
            return new UI_TABLE_PLAYLIST(
                { value: p.playlistId, link: null, editable: false, hidden: true },
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: p.name,
                    link: `/administrator/playlists/${p.playlistId}`,
                    editable: false,
                    hidden: false,
                    new_tab_link: true,
                },
                {
                    value: this._date.transform(p.dateCreated, 'MMM d, y, h:mm a'),
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: p.businessName ? p.businessName : '--',
                    link: `/administrator/dealers/${p.dealerId}`,
                    editable: false,
                    hidden: false,
                    new_tab_link: true,
                },
                { value: p.totalContents, hidden: false },
                { value: p.totalScreens > 0, link: null, hidden: true },
            );
        });
    }

    filterData(data) {
        if (data) {
            this.search_data = data;
            this.pageRequested(1);
        } else {
            this.search_data = '';
            this.pageRequested(1);
        }
    }

    getDataForExport(data): void {
        let filter = data;

        this._playlist
            .export_playlist(filter.id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                if (!data.message) {
                    const EXCEL_TYPE =
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                    this.playlist_to_export = data.playlistContents;
                    this.playlist_to_export.forEach((item, i) => {
                        this.modifyItem(item);
                        this.worksheet.addRow(item).font = {
                            bold: false,
                        };
                    });
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
                        const filename = filter.name + '.xlsx';
                        saveAs(blob, filename);
                    });
                    this.workbook_generation = false;
                }
            });
    }

    modifyItem(item) {
        item.duration = item.duration != null ? item.duration + ' s' : '20 s';
        item.fileType = this._titlecase.transform(item.fileType);
    }

    exportPlaylist(data) {
        this.workbook_generation = true;
        const header = [];
        this.workbook = new Workbook();
        this.workbook.creator = 'NCompass TV';
        this.workbook.useStyles = true;
        this.workbook.created = new Date();
        this.worksheet = this.workbook.addWorksheet('Dealers');
        Object.keys(this.playlistExportColumns).forEach((key) => {
            if (this.playlistExportColumns[key].name && !this.playlistExportColumns[key].no_export) {
                header.push({
                    header: this.playlistExportColumns[key].name,
                    key: this.playlistExportColumns[key].key,
                    width: 50,
                    style: { font: { name: 'Arial', bold: true } },
                });
            }
        });
        this.worksheet.columns = header;
        this.getDataForExport(data);
    }

    onPushAllLicenseUpdates(licenseIds: string[]): void {
        licenseIds.forEach((id) => this._socket.emit('D_update_player', id));
    }

    private initializeSocketConnection(): void {
        this._socket = io(environment.socket_server, {
            transports: ['websocket'],
            query: 'client=Dashboard__PlaylistsPage',
        });
    }

    protected get _playlistColumns(): DataTableColumn[] {
        return [
            { name: '#', sortable: false, no_export: true },
            { name: 'Playlist Name', sortable: true, column: 'Name' },
            { name: 'Publish Date', sortable: true, column: 'DateCreated' },
            { name: 'Assigned To', sortable: true, column: 'BusinessName' },
            { name: 'Total Contents', sortable: true, column: 'TotalContents' },
        ];
    }

    protected get _playlistExportColumns(): DataTableColumn[] {
        return [
            { name: 'Host Name', key: 'hostName' },
            { name: 'Content Title', key: 'title' },
            { name: 'Screen Name', key: 'screenName' },
            { name: 'Template', key: 'templateName' },
            { name: 'Zone', key: 'zoneName' },
            { name: 'Duration', key: 'duration' },
            { name: 'File Type', key: 'fileType' },
        ];
    }
}
