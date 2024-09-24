import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { environment } from 'src/environments/environment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as io from 'socket.io-client';

import { AuthService, PlaylistService } from 'src/app/global/services';
import { UI_DEALER_PLAYLIST, CREATE_PLAYLIST, UI_COUNT_DETAILS, DataTableColumn } from 'src/app/global/models';
import { CreatePlaylistDialogComponent } from 'src/app/global/components_shared/playlist_components/create-playlist-dialog/create-playlist-dialog.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-playlists',
    templateUrl: './playlists.component.html',
    styleUrls: ['./playlists.component.scss'],
    providers: [DatePipe, TitleCasePipe],
})
export class PlaylistsComponent implements OnInit, OnDestroy {
    dealer_id: string;
    dealers_info: string;
    filtered_data: UI_DEALER_PLAYLIST[] = [];
    initial_load = true;
    no_playlist = false;
    paging_data: any;
    playlist_data: UI_DEALER_PLAYLIST[] = [];
    playlist_details: UI_COUNT_DETAILS;
    playlist_table_column = this._playlistColumns;
    playlist_table_column_for_export = this._playlistExportColumns;
    playlist_to_export: any = [];
    playlists_details: any;
    search_data = '';
    searching = false;
    workbook: any;
    workbook_generation = false;
    worksheet: any;

    protected _socket: any;
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _playlist: PlaylistService,
        private _title: TitleCasePipe,
    ) {}

    ngOnInit() {
        this.initializeSocketConnection();
        this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
        this.getPlaylist(1);
        this.getTotalCount(this.dealer_id);
        this.dealers_info = this._auth.current_user_value.roleInfo.businessName;
        this.getTotalPlaylist();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    getTotalCount(id: string) {
        this._playlist
            .get_playlists_total_by_dealer(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    this.playlist_details = {
                        basis: response.total,
                        basis_label: 'Playlist(s)',
                        good_value: response.totalActive,
                        good_value_label: 'Active',
                        bad_value: response.totalInActive,
                        bad_value_label: 'Inactive',
                        new_this_week_value: response.newPlaylistsThisWeek,
                        new_this_week_label: 'Playlist(s)',
                        new_this_week_description: 'New this week',
                        new_last_week_value: response.newPlaylistsLastWeek,
                        new_last_week_label: 'Playlist(s)',
                        new_last_week_description: 'New last week',
                    };
                },
                (err) => console.error('Error retrieving playlist count details', err),
            );
    }

    getPlaylist(page: number): void {
        this.searching = true;
        this.playlist_data = [];

        this._playlist
            .get_playlist_by_dealer_id_table(page, this.dealer_id, this.search_data)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    this.initial_load = false;
                    this.paging_data = response.paging;

                    if (response.playlists.length <= 0) {
                        this.filtered_data = [];
                        this.no_playlist = true;
                        return;
                    }

                    const allPlaylists = [...response.playlists.map((p) => p.playlist)];

                    if (allPlaylists.length <= 0) {
                        this.filtered_data = this.search_data.length > 0 ? [] : this.filtered_data;
                        this.no_playlist = !this.filtered_data;
                        return;
                    }

                    const mapped = this.playlist_mapToUI(allPlaylists);
                    this.playlist_data = [...mapped];
                    this.filtered_data = [...mapped];
                },
                (e) => console.error('Error retriving dealer playlist', e),
            )
            .add(() => (this.searching = false));
    }

    playlist_mapToUI(data: any[]) {
        let count = this.paging_data.pageStart;
        return data.map((playlist) => {
            let playlistUrl = '/dealer/playlists';
            const {
                playlistId,
                dateCreated,
                playlistDescription,
                isMigrated,
                playlistName,
                totalContents,
                totalScreens,
            } = playlist;
            const parsedDateCreated = this._date.transform(dateCreated, 'MMM d, y, h:mm a');
            const parsedDescription = this._title.transform(playlistDescription);
            playlistUrl += isMigrated ? `/v2/${playlistId}` : `/${playlistId}`;

            return new UI_DEALER_PLAYLIST(
                { value: playlistId, link: null, editable: false, hidden: true },
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: playlistName,
                    data_label: 'playlist_name',
                    is_migrated: isMigrated,
                    link: playlistUrl,
                    editable: false,
                    hidden: false,
                    new_tab_link: true,
                },
                {
                    value: parsedDescription,
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: parsedDateCreated,
                    link: null,
                    editable: false,
                    hidden: false,
                },
                { value: totalScreens > 0, link: null, hidden: true },
                { value: totalContents, data_label: 'total_content', link: null, editable: false, hidden: false },
            );
        });
    }

    filterData(keyword: string) {
        this.search_data = keyword;
        this.getPlaylist(1);
    }

    fromDelete() {
        this.ngOnInit();
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
        item.fileType = this._title.transform(item.fileType);
    }

    exportPlaylist(data) {
        this.workbook_generation = true;
        const header = [];
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

    onPushAllLicenseUpdates(licenseIds: string[]): void {
        licenseIds.forEach((id) => this._socket.emit('D_update_player', id));
    }

    showCreatePlaylistDialog() {
        const width = '576px';
        const configs: MatDialogConfig = { width, disableClose: true, data: { dealerId: this.dealer_id } };
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
            const newPlaylistUrl = `/${this.roleRoute}/playlists/v2/${playlist.playlist.playlistId}`;
            this.showResponseDialog('success', 'Success', 'Your changes have been saved');
            window.open(newPlaylistUrl, '_blank');
            this.getTotalPlaylist();
            this.getPlaylist(1);
        } catch (error) {
            console.error('Error creating playlist', error);
            this.showResponseDialog(
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
        return this._auth.roleRoute;
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
