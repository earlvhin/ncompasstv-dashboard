import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as io from 'socket.io-client';

import { environment } from 'src/environments/environment';
import { AuthService, PlaylistService } from 'src/app/global/services';
import { API_PLAYLIST, CREATE_PLAYLIST, UI_TABLE_PLAYLIST } from 'src/app/global/models';
import { CreatePlaylistDialogComponent } from 'src/app/global/components_shared/playlist_components/create-playlist-dialog/create-playlist-dialog.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

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
    playlist_table_column = this._playlistTableColumns;
    playlist_table_column_for_export = this._playlistExportColumns;

    protected _socket: any;
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _playlist: PlaylistService,
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _titlecase: TitleCasePipe,
    ) {}

    ngOnInit() {
        this.initializeSocketConnection();
        this.getTotalPlaylist();
        this.getPlaylists(1);
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    exportPlaylist(data: any) {
        const header = [];
        this.workbook_generation = true;
        this.workbook = new Workbook();
        this.workbook.creator = 'NCompass TV';
        this.workbook.useStyles = true;
        this.workbook.created = new Date();
        this.worksheet = this.workbook.addWorksheet('Dealers');

        Object.keys(this.playlist_table_column_for_export).forEach((key) => {
            if (
                this.playlist_table_column_for_export[key].name &&
                !this.playlist_table_column_for_export[key].no_export
            ) {
                header.push({
                    header: this.playlist_table_column_for_export[key].name,
                    key: this.playlist_table_column_for_export[key].key,
                    width: 50,
                    style: { font: { name: 'Arial', bold: true } },
                });
            }
        });

        this.worksheet.columns = header;
        this.getDataForExport(data);
    }

    filterData(keyword = '') {
        this.search_data = keyword;
        this.getPlaylists(1);
    }

    fromDelete() {
        this.ngOnInit();
    }

    getPlaylists(page: number) {
        this.searching = true;
        this.playlist_data = [];

        this._playlist
            .get_all_playlists(page, this.search_data, this.sort_column, this.sort_order)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                this.initial_load = false;
                this.searching = false;
                this.paging_data = data.paging;

                if (data.paging.entities.length <= 0) {
                    if (this.search_data.length <= 0) {
                        this.no_playlist = true;
                        return;
                    }

                    this.filtered_data = [];
                    this.no_playlist = false;
                    return;
                }

                const getPlaylistResult = this.mapToPlaylistTable(data.paging.entities);
                this.playlist_data = [...getPlaylistResult];
                this.filtered_data = [...getPlaylistResult];
            });
    }

    getColumnsAndOrder(data: { column: string; order: string }) {
        this.sort_column = data.column;
        this.sort_order = data.order;
        this.getPlaylists(1);
    }

    getTotalPlaylist() {
        this._playlist
            .get_playlists_total()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe({
                next: (data) => {
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
                },
            });
    }

    getDataForExport(data: { id: string; name: string }): void {
        this._playlist
            .export_playlist(data.id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe({
                next: (response) => {
                    if ('message' in response) {
                        this.showResponseDialog(
                            'error',
                            'Export Failed',
                            'Could not retreive data, please contact customer support',
                        );
                        return;
                    }

                    const EXCEL_TYPE =
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                    this.playlist_to_export = response.playlistContents;

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
                        const filename = data.name + '.xlsx';
                        saveAs(blob, filename);
                    });

                    this.workbook_generation = false;
                },
            });
    }

    mapToPlaylistTable(data: API_PLAYLIST[]) {
        let count = this.paging_data.pageStart;
        return data.map((p) => {
            return new UI_TABLE_PLAYLIST(
                { value: p.playlistId, link: null, editable: false, hidden: true },
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: p.name,
                    data_label: 'playlist_name',
                    is_migrated: p.isMigrated,
                    link: p.isMigrated
                        ? `/administrator/playlists/v2/${p.playlistId}`
                        : `/administrator/playlists/${p.playlistId}`,
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
                { value: p.totalScreens > 0 ? true : false, link: null, hidden: true },
                {
                    value: p.totalContents,
                    data_label: 'total_content',
                    link: null,
                    editable: false,
                    hidden: false,
                },
            );
        });
    }

    modifyItem(item) {
        item.duration = item.duration != null ? item.duration + ' s' : '20 s';
        item.fileType = this._titlecase.transform(item.fileType);
    }

    onPushAllLicenseUpdates(licenseIds: string[]): void {
        licenseIds.forEach((id) => this._socket.emit('D_update_player', id));
    }

    showCreatePlaylistDialog() {
        const width = '576px';
        const configs: MatDialogConfig = { width, disableClose: true };
        this._dialog
            .open(CreatePlaylistDialogComponent, configs)
            .afterClosed()
            .subscribe({
                next: (response) => {
                    if (!response || response === 'close') return;
                    this.createPlaylist(response);
                },
            });
    }

    private async createPlaylist(data: CREATE_PLAYLIST) {
        try {
            const playlist = await this._playlist.create_playlist(data).pipe(takeUntil(this._unsubscribe)).toPromise();

            await this.showResponseDialog('success', 'Success', 'Your changes have been saved');

            const newPlaylistUrl = `/${this.roleRoute}/playlists/v2/${playlist.playlist.playlistId}`;
            window.open(newPlaylistUrl, '_blank');
            this.getTotalPlaylist();
            this.getPlaylists(1);
        } catch (error) {
            console.error('Error creating playlist', error);
            await this.showResponseDialog(
                'error',
                'Error Saving Playlist',
                'Something went wrong, please contact customer support',
            );
        }
    }

    private initializeSocketConnection(): void {
        this._socket = io(environment.socket_server, {
            transports: ['websocket'],
            query: 'client=Dashboard__PlaylistsPage',
        });
    }

    private showResponseDialog(type: string, title = '', message = '') {
        let data = { status: type, message: title, data: message };
        const config = { disableClose: true, width: '500px', data };
        return this._dialog.open(ConfirmationModalComponent, config).afterClosed();
    }

    protected get roleRoute() {
        return this._auth.roleRoute == 'dealeradmin' ? 'administrator' : this._auth.roleRoute;
    }

    protected get _playlistExportColumns() {
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

    protected get _playlistTableColumns() {
        return [
            { name: '#', sortable: false, no_export: true },
            { name: 'Playlist Name', sortable: true, column: 'Name' },
            { name: 'Publish Date', sortable: true, column: 'DateCreated' },
            { name: 'Assigned To', sortable: true, column: 'BusinessName' },
            { name: 'Total Content', sortable: true, column: 'TotalContents' },
        ];
    }
}
