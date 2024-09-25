import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, PlaylistService } from 'src/app/global/services';
import { API_PLAYLIST, UI_DEALER_PLAYLIST, CREATE_PLAYLIST, UI_COUNT_DETAILS } from 'src/app/global/models';
import { CreatePlaylistDialogComponent } from 'src/app/global/components_shared/playlist_components/create-playlist-dialog/create-playlist-dialog.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-playlists',
    templateUrl: './playlists.component.html',
    styleUrls: ['./playlists.component.scss'],
    providers: [DatePipe, TitleCasePipe],
})
export class PlaylistsComponent implements OnInit, OnDestroy {
    playlist_details: UI_COUNT_DETAILS;
    dealer_id: string;
    initial_load = true;
    is_view_only = this.currentUser.roleInfo.permission === 'V';
    playlist_data: UI_DEALER_PLAYLIST[] = [];
    playlists_details: any;
    filtered_data: UI_DEALER_PLAYLIST[] = [];
    no_playlist = false;
    paging_data: any;
    search_data = '';
    searching = false;

    playlist_table_column = ['#', 'Name', 'Description', 'Creation Date', 'Total Content'];

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
        this.dealer_id = this.currentUser.roleInfo.dealerId;
        this.getPlaylist(1);
        this.getTotalCount(this.dealer_id);
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    getTotalCount(id: string): void {
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
                (err) => console.error(err, 'Error retrieving playlist count details', err),
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
                    const allPlaylists = [...response.playlists.map((p) => p.playlist)];

                    if (allPlaylists.length <= 0) {
                        this.filtered_data = this.search_data.length > 0 ? [] : this.filtered_data;
                        this.no_playlist = !this.filtered_data;
                        return;
                    }

                    const mapped = this.mapPlaylistToUI(allPlaylists);
                    this.playlist_data = [...mapped];
                    this.filtered_data = [...mapped];
                },
                (e) => console.error('Error retrieving dealer playlist', e),
            )
            .add(() => (this.searching = false));
    }

    filterData(keyword: string) {
        this.search_data = keyword;
        this.getPlaylist(1);
    }

    fromDelete() {
        this.ngOnInit();
    }

    onPushAllLicenseUpdates(licenseIds: string[]): void {
        licenseIds.forEach((id) => this._socket.emit('D_update_player', id));
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

    private get currentUser() {
        return this._auth.current_user_value;
    }

    private mapPlaylistToUI(data: any[]) {
        let count = this.paging_data.pageStart;

        return data.map((playlist) => {
            let playlistUrl = '/sub-dealer/playlists';
            const {
                playlistId,
                playlistName,
                dateCreated,
                playlistDescription,
                isMigrated,
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
                    value: playlist ? playlistName : '',
                    data_label: 'playlist_name',
                    is_migrated: isMigrated,
                    link: playlistUrl,
                    editable: false,
                    hidden: false,
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

    private showResponseDialog(type: string, title = '', message = '') {
        let data = { status: type, message: title, data: message };
        const config = { disableClose: true, width: '500px', data };
        return this._dialog.open(ConfirmationModalComponent, config).afterClosed();
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
