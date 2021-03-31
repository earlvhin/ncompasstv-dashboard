import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { PlaylistService } from '../../../../global/services/playlist-service/playlist.service';
import { API_PLAYLIST } from '../../../../global/models/api_playlists.model';
import { UI_TABLE_PLAYLIST } from 'src/app/global/models/ui_table-playlist.model';

@Component({
	selector: 'app-playlists',
	templateUrl: './playlists.component.html',
	styleUrls: ['./playlists.component.scss'],
	providers: [DatePipe]
})
export class PlaylistsComponent implements OnInit {

	filtered_data: UI_TABLE_PLAYLIST[] = [];
	initial_load: boolean = true;
	no_playlist: boolean;
	paging_data: any;
	playlist_data: UI_TABLE_PLAYLIST[] = [];
	playlists_details: any;
	playlist_table_column = [
		'#',
		'Playlist Name',
		// 'Playlist Description',
		'Publish Date',
		'Assigned To'
	]
	search_data: string = "";
	searching: boolean = false;
	subscription: Subscription = new Subscription;
	title: string = "Playlists"

	constructor(
		private _playlist: PlaylistService,
		private _date: DatePipe
	) { }

	ngOnInit() {
		this.getTotalPlaylist();
		this.pageRequested(1);
	}

	fromDelete() {
		// this.searching = true;
		this.ngOnInit();
	}

	pageRequested(page) {
		this.searching = true;
		this.playlist_data = [];
		this.subscription.add(
			this._playlist.get_playlists(page, this.search_data).subscribe(
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

	getTotalPlaylist() {
		this.subscription.add(
			this._playlist.get_playlists_total().subscribe(
				(data: any) => {
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
						new_last_week_value_description: 'New last week'
					}
				}
			)
		)
	}

	playlist_mapToUI(data: API_PLAYLIST[]): UI_TABLE_PLAYLIST[] {
		let count = 1;
		return data.map(
			p => {
				return new UI_TABLE_PLAYLIST(
					{ value: p.playlistId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: p.playlistName, link: '/administrator/playlists/' +  p.playlistId, editable: false, hidden: false},
					// { value: p.playlistDescription || 'No Description', link: null, editable: false, hidden: false},
					{ value: this._date.transform(p.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false},
					{ value: p.businessName, link: '/administrator/dealers/' + p.dealerId, editable: false, hidden: false},
				)
			}
		)
	}

	filterData(data) {
		if (data) {
			this.search_data = data;
			this.pageRequested(1);
		} else {
			this.search_data = "";
			this.pageRequested(1);
		}
	}
}
