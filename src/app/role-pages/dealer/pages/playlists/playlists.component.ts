import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { environment } from 'src/environments/environment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
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
	dealers_info: string;
	dealer_id: string;
	initial_load = true;
	playlist_data: UI_DEALER_PLAYLIST[] = [];
	filtered_data: any = [];
	no_playlist = false;
	paging_data: any;
	playlist_to_export: any = [];
	search_data = '';
	searching = false;
	workbook: any;
	workbook_generation = false;
	worksheet: any;

	playlist_table_column = [
		'#',
		'Name',
		'Description',
		'Creation Date'
		// 'Last Update'
	];

	playlist_table_column_for_export = [
		{ name: 'Host Name', key: 'hostName' },
		{ name: 'Content Title', key: 'title' },
		{ name: 'Screen Name', key: 'screenName' },
		{ name: 'Template', key: 'templateName' },
		{ name: 'Zone', key: 'zoneName' },
		{ name: 'Duration', key: 'duration' },
		{ name: 'File Type', key: 'fileType' }
	];

	protected _socket: any;
	protected _unsubscribe = new Subject<void>();

	constructor(private _playlist: PlaylistService, private _auth: AuthService, private _date: DatePipe, private _title: TitleCasePipe) {}

	ngOnInit() {
		this.initializeSocketConnection();
		this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
		this.getPlaylist(1);
		this.getTotalCount(this.dealer_id);
		this.dealers_info = this._auth.current_user_value.roleInfo.businessName;
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getTotalCount(id: string) {
		this._playlist
			.get_playlists_total_by_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
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
				};
			});
	}

	getPlaylist(page: any) {
		this.searching = true;
		this.playlist_data = [];

		this._playlist
			.get_playlist_by_dealer_id_table(page, this.dealer_id, this.search_data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data) => {
				this.paging_data = data.paging;
				this.initial_load = false;
				if (data.playlists.length > 0) {
					this.playlist_data = this.playlist_mapToUI(data.paging.entities);
					this.filtered_data = this.playlist_mapToUI(data.paging.entities);
				} else {
					if (this.search_data.length > 0) {
						this.filtered_data = [];
						this.no_playlist = false;
					} else {
						this.no_playlist = true;
					}
				}
				this.searching = false;
			});
	}

	playlist_mapToUI(data): UI_DEALER_PLAYLIST[] {
		let count = this.paging_data.pageStart;
		return data.map((playlist) => {
			return new UI_DEALER_PLAYLIST(
				{ value: playlist.playlistId, link: null, editable: false, hidden: true },
				{ value: count++, link: null, editable: false, hidden: false },
				{ value: playlist.name, link: '/dealer/playlists/' + playlist.playlistId, editable: false, hidden: false, new_tab_link: true, },
				{ value: this._title.transform(playlist.description), link: null, editable: false, hidden: false },
				{ value: this._date.transform(playlist.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false },
				{ value: playlist.totalScreens > 0 ? true : false, link: null, hidden: true }
			);
		});
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

	getDataForExport(data): void {
		let filter = data;

		this._playlist
			.export_playlist(filter.id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data) => {
				if (!data.message) {
					const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
					this.playlist_to_export = data.playlistContents;
					this.playlist_to_export.forEach((item, i) => {
						this.modifyItem(item);
						this.worksheet.addRow(item).font = {
							bold: false
						};
					});
					let rowIndex = 1;
					for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
						this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
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
			if (this.playlist_table_column_for_export[key].name && !this.playlist_table_column_for_export[key].no_export) {
				header.push({
					header: this.playlist_table_column_for_export[key].name,
					key: this.playlist_table_column_for_export[key].key,
					width: 50,
					style: { font: { name: 'Arial', bold: true } }
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
			query: 'client=Dashboard__PlaylistsPage'
		});
	}
}
