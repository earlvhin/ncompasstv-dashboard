import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { takeUntil } from 'rxjs/operators';
import * as io from 'socket.io-client';

import { AuthService, PlaylistService } from 'src/app/global/services';
import { UI_DEALER_PLAYLIST } from 'src/app/global/models';

@Component({
	selector: 'app-playlists',
	templateUrl: './playlists.component.html',
	styleUrls: ['./playlists.component.scss'],
	providers: [DatePipe, TitleCasePipe]
})
export class PlaylistsComponent implements OnInit, OnDestroy {
	playlist_details: any;
	dealers_info;
	dealer_id: string;
	initial_load: boolean = true;
	is_view_only = false;
	playlist_data: UI_DEALER_PLAYLIST[] = [];
	filtered_data: any = [];
	no_playlist: boolean = false;
	paging_data: any;
	search_data: string = '';
	searching: boolean = false;

	playlist_table_column = ['#', 'Name', 'Description', 'Creation Date'];

	protected _socket: any;
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _playlist: PlaylistService, private _auth: AuthService, private _date: DatePipe, private _title: TitleCasePipe) {}

	ngOnInit() {
		this.dealer_id = this.currentUser.roleInfo.dealerId;
		this.getPlaylist(1);
		this.getTotalCount(this.dealer_id);
		this.dealers_info = this.currentUser.roleInfo.businessName;
		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
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
				(response: any) => {
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
						new_last_week_description: 'New last week'
					};
				},
				(error) => {
					console.error(error);
				}
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

					if (response.playlists.length > 0) {
						this.playlist_data = this.mapPlaylistToUI(response.playlists);
						this.filtered_data = this.mapPlaylistToUI(response.playlists);
					} else {
						if (this.search_data.length > 0) {
							this.filtered_data = [];
							this.no_playlist = false;
						} else {
							this.no_playlist = true;
						}
					}

					this.searching = false;
				},
				(error) => {
					console.error(error);
				}
			);
	}

	filterData(data) {
		if (data) {
			this.search_data = data;
			this.getPlaylist(1);
		} else {
			this.search_data = '';
			this.getPlaylist(1);
		}
	}

	fromDelete() {
		// this.searching = true;
		this.ngOnInit();
	}

	private get currentUser() {
		return this._auth.current_user_value;
	}

	private mapPlaylistToUI(data): UI_DEALER_PLAYLIST[] {
		let count = this.paging_data.pageStart;

		return data.map(({ playlist }) => {
			return new UI_DEALER_PLAYLIST(
				{ value: playlist.playlistId, link: null, editable: false, hidden: true },
				{ value: count++, link: null, editable: false, hidden: false },
				{
					value: playlist ? playlist.playlistName : '',
					link: '/sub-dealer/playlists/' + playlist.playlistId,
					editable: false,
					hidden: false
				},
				{ value: this._title.transform(playlist.playlistDescription), link: null, editable: false, hidden: false },
				{ value: this._date.transform(playlist.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false },
				{ value: playlist.totalScreens > 0 ? true : false, link: null, hidden: true }
			);
		});
	}

	onPushAllLicenseUpdates(licenseIds: string[]): void {
		licenseIds.forEach((id) => this._socket.emit('D_update_player', id));
	}

	private initializeSocketConnection(): void {
		this._socket = io(environment.socket_server, {
			transports: ['websocket'],
			query: 'client=Dashboard__PlaylistsPage'
		});
	}
}
