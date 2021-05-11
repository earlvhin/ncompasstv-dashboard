import { Component, OnInit } from '@angular/core';
import { PlaylistService } from '../../../../global/services/playlist-service/playlist.service';
import { API_SINGLE_PLAYLIST } from '../../../../global/models/api_single-playlist.model';
import { Subscription } from 'rxjs';
import { UI_DEALER_PLAYLIST } from 'src/app/global/models/ui_dealer-playlist.model';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { DatePipe, TitleCasePipe } from '@angular/common';

@Component({
	selector: 'app-playlists',
	templateUrl: './playlists.component.html',
	styleUrls: ['./playlists.component.scss'],
	providers: [DatePipe, TitleCasePipe]
})
export class PlaylistsComponent implements OnInit {
	playlist_details: any;
	dealers_info;
	dealer_id: string;
	initial_load: boolean = true;
	playlist_data: UI_DEALER_PLAYLIST[] = [];
	filtered_data: any = [];
	no_playlist: boolean = false;
	paging_data: any;
	playlist_table_column = [
		'#',
		'Name',
		'Description',
		'Creation Date',
		// 'Last Update'
	]
	search_data: string = "";
	searching: boolean = false;
	subscription: Subscription = new Subscription;

	constructor(
		private _playlist: PlaylistService,
		private _auth: AuthService,
		private _date: DatePipe, 
		private _title: TitleCasePipe
	) { }

	ngOnInit() {
		this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
		this.getPlaylist(1);
		this.getTotalCount(this.dealer_id)
		this.dealers_info = this._auth.current_user_value.roleInfo.businessName;
	}

	getTotalCount(id) {
		this.subscription.add(
			this._playlist.get_playlists_total_by_dealer(id).subscribe(
				(data: any) => {
					this.playlist_details = {
						basis: data.total,
						basis_label: 'Playlist(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						new_this_week_value: data.newPlaylistsThisWeek,
						new_this_week_label: 'Playlist(s)',
						new_this_week_description: 'New this week',
						new_last_week_value: data.newPlaylistsLastWeek,
						new_last_week_label: 'Playlist(s)',
						new_last_week_description: 'New last week'
					}
				}
			)
		)
	}

	getPlaylist(page) {
		this.searching = true;
		this.playlist_data = [];
		this.subscription.add(
			this._playlist.get_playlist_by_dealer_id_table(page, this.dealer_id, this.search_data).subscribe(
				data => {
					this.initial_load = false;
					if (data.playlists.length > 0) {
						this.playlist_data = this.playlist_mapToUI(data.playlists)
						this.filtered_data = this.playlist_mapToUI(data.playlists)
					} else {
						if(this.search_data.length > 0) {
							this.filtered_data = [];
							this.no_playlist = false;
						} else {
							this.no_playlist = true;
						}
					}
					this.paging_data = data.paging;
					this.searching = false;
				}
			)
		)
	}

	playlist_mapToUI(data): UI_DEALER_PLAYLIST[] {
		let count = 1;
		return data.map(
			({playlist}) => {
				return new UI_DEALER_PLAYLIST(
					{ value: playlist.playlistId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: playlist ? playlist.playlistName : '', link: '/dealer/playlists/' +  playlist.playlistId, editable: false, hidden: false},
					{ value: this._title.transform(playlist.playlistDescription), link: null, editable: false, hidden: false},
					{ value: this._date.transform(playlist.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false},
				)
			}
		)
	}

	filterData(data) {
		if (data) {
			this.search_data = data;
			this.getPlaylist(1);
		} else {
			this.search_data = "";
			this.getPlaylist(1);
		}
	}

	fromDelete() {
		// this.searching = true;
		this.ngOnInit();
	}
}

