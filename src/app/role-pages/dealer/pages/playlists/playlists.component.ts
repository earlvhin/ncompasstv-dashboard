import { Component, OnInit } from '@angular/core';
import { PlaylistService } from '../../../../global/services/playlist-service/playlist.service';
import { API_SINGLE_PLAYLIST } from '../../../../global/models/api_single-playlist.model';
import { Subscription } from 'rxjs';
import { UI_DEALER_PLAYLIST } from 'src/app/global/models/ui_dealer-playlist.model';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { DatePipe, TitleCasePipe } from '@angular/common';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver';

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
    playlist_to_export: any = [];
	search_data: string = "";
	searching: boolean = false;
	subscription: Subscription = new Subscription;
    workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

    playlist_table_column_for_export = [
		{ name: 'Host Name', key: 'hostName'},
		{ name: 'Content Title', key: 'title'},
		{ name: 'Screen Name', key: 'screenName'},
		{ name: 'Template', key: 'templateName'},
		{ name: 'Zone', key: 'zoneName'},
		{ name: 'Duration', key: 'duration'},
		{ name: 'File Type', key: 'fileType'},
	]

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
                    this.paging_data = data.paging;
					this.initial_load = false;
					if (data.playlists.length > 0) {
						this.playlist_data = this.playlist_mapToUI(data.paging.entities)
						this.filtered_data = this.playlist_mapToUI(data.paging.entities)
					} else {
						if(this.search_data.length > 0) {
							this.filtered_data = [];
							this.no_playlist = false;
						} else {
							this.no_playlist = true;
						}
					}
					this.searching = false;
				}
			)
		)
	}

	playlist_mapToUI(data): UI_DEALER_PLAYLIST[] {
        console.log("DATA", data)
		let count = this.paging_data.pageStart;
		return data.map(
			playlist => {
				return new UI_DEALER_PLAYLIST(
					{ value: playlist.playlistId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: playlist.name, link: '/dealer/playlists/' +  playlist.playlistId, editable: false, hidden: false},
					{ value: this._title.transform(playlist.description), link: null, editable: false, hidden: false},
					{ value: this._date.transform(playlist.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false},
                    { value: playlist.totalScreens > 0 ? true: false, link: null, hidden: true}
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

    getDataForExport(data): void {
		var filter = data;
		this.subscription.add(
			this._playlist.export_playlist(filter.id).subscribe(
				data => {
                    console.log("DATA", data)
					if(!data.message) {
						const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
						this.playlist_to_export = data.playlistContents;
						this.playlist_to_export.forEach((item, i) => {
							this.modifyItem(item);
							this.worksheet.addRow(item).font ={
								bold: false
							};
						});
						let rowIndex = 1;
						for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
							this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
						}
						this.workbook.xlsx.writeBuffer()
							.then((file: any) => {
								const blob = new Blob([file], { type: EXCEL_TYPE });
								const filename = filter.name +'.xlsx';
								FileSaver.saveAs(blob, filename);
							}
						);
						this.workbook_generation = false;
					}
				}
			)
		);
	}

	modifyItem(item) {
		item.duration = item.duration != null ? item.duration + " s" : "20 s";
		item.fileType = this._title.transform(item.fileType);
	}

	exportPlaylist(data) {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Excel.Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('Dealers');
		Object.keys(this.playlist_table_column_for_export).forEach(key => {
			if(this.playlist_table_column_for_export[key].name && !this.playlist_table_column_for_export[key].no_export) {
				header.push({ header: this.playlist_table_column_for_export[key].name, key: this.playlist_table_column_for_export[key].key, width: 50, style: { font: { name: 'Arial', bold: true}}});
			}
		});
		this.worksheet.columns = header;
		this.getDataForExport(data);		
	}
}

