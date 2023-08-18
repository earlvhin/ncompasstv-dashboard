import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { forkJoin, Observable, Subject } from 'rxjs';
import * as io from 'socket.io-client';

import { ClonePlaylistComponent } from '../../components_shared/playlist_components/clone-playlist/clone-playlist.component';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { PlaylistDemoComponent } from '../../components_shared/playlist_components/playlist-demo/playlist-demo.component';
import { PlaylistEditModalComponent } from '../../components_shared/playlist_components/playlist-edit-modal/playlist-edit-modal.component';
import {
	API_LICENSE_PROPS,
	API_SCREEN_OF_PLAYLIST,
	API_SINGLE_PLAYLIST,
	UI_ROLE_DEFINITION,
	UI_PLAYLIST_SCREENS_NEW,
	UI_CONFIRMATION_MODAL,
	UI_ROLE_DEFINITION_TEXT
} from 'src/app/global/models';
import { AuthService, HelperService, PlaylistService, RoleService } from 'src/app/global/services';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-single-playlist',
	templateUrl: './single-playlist.component.html',
	styleUrls: ['./single-playlist.component.scss']
})
export class SinglePlaylistComponent implements OnInit {
	@Input() reload: Observable<void>;

	description: string;
	host_url: string;
	is_admin = this.isAdmin;
	is_dealer = this.isDealer;
	is_initial_load = true;
	is_view_only = false;
	license_to_update = [];
	license_url: string;
	playlist: API_SINGLE_PLAYLIST;
	playlist_content_and_blacklist: any[];
	playlist_host_and_license: any;
	playlist_licenses: API_LICENSE_PROPS[] = [];
	playlist_screens: API_SCREEN_OF_PLAYLIST[] = [];
	playlist_screen_table: any;
	playlist_updating: boolean = true;
	title: string;

	_socket: any;

	screen_table_column = ['#', 'Screen Title', 'Dealer', 'Host', 'Type', 'Template', 'Created By'];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _helper: HelperService,
		private _params: ActivatedRoute,
		private _playlist: PlaylistService,
		private _role: RoleService
	) {}

	ngOnInit() {
		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
		localStorage.removeItem('playlist_data');
		this.playlistRouteInit();

		// If changes made
		if (this.reload) this.reload.subscribe(() => this.playlistRouteInit());

		let role = this.currentRole;
		if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
			role = UI_ROLE_DEFINITION_TEXT.administrator;
		}

		this.host_url = `/` + role + `/hosts/`;
		this.license_url = `/` + role + `/licenses/`;

		this._socket = io(environment.socket_server, {
			transports: ['websocket'],
			query: 'client=Dashboard__SinglePlaylistComponent'
		});

		this._socket.on('connect', () => {});

		this._socket.on('disconnect', () => {});

		this.subscribeToPushPlaylistUpdateToAllLicenses();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
		this._socket.disconnect();
	}

	addToLicenseToPush(e, licenseId) {
		if (e.checked == true && !this.license_to_update.includes(licenseId)) {
			this.license_to_update.push({ licenseId: licenseId });
		} else {
			this.license_to_update = this.license_to_update.filter((i) => {
				return i.licenseId !== licenseId;
			});
		}
	}

	clonePlaylist() {
		this._dialog.open(ClonePlaylistComponent, {
			width: '600px',
			data: this.playlist
		});
	}

	getPlaylistData(id: string) {
		this.playlist_updating = true;

		if (this.is_initial_load && (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer')) {
			this.setpageData(this._helper.singlePlaylistData);
			this.getPlaylistScreens(id).add(() => (this.playlist_updating = false));
			this.is_initial_load = false;
			return;
		}

		this.getPlaylistDataAndScreens(id).add(() => (this.playlist_updating = false));
	}

	openUpdatePlaylistInfoModal() {
		let dialog = this._dialog.open(PlaylistEditModalComponent, {
			width: '600px',
			data: this.playlist
		});

		dialog.afterClosed().subscribe((data: any) => {
			this.ngOnInit();
		});
	}

	playlistRouteInit() {
		this._params.paramMap.subscribe(() => {
			this.getPlaylistData(this._params.snapshot.params.data);
		});
	}

	pushUpdateToAllLicenses() {
		this.warningModal(
			'warning',
			'Push Playlist Updates',
			`You are about to push playlist updates to ${this.playlist.licenses.length} licenses?`,
			`Playlist Update will be pushed on ${this.playlist.licenses.length} licenses. Click OK to Continue.`,
			'update',
			this.playlist.licenses
		);
	}

	openPlaylistDemo(e) {
		if (e) {
			let dialogRef = this._dialog.open(PlaylistDemoComponent, {
				data: this.playlist.playlist.playlistId,
				width: '768px',
				height: '432px',
				panelClass: 'no-padding'
			});
		}
	}

	pushUpdateToSelectedLicenses() {
		this.warningModal(
			'warning',
			'Push Playlist Updates',
			`You are about to push playlist updates to ${this.license_to_update.length} licenses?`,
			`Playlist Update will be pushed on ${this.license_to_update.length} licenses. Click OK to Continue.`,
			'update',
			this.license_to_update
		);
	}

	screensMapToTable(screens) {
		let counter = 1;
		// const route = Object.keys(UI_ROLE_DEFINITION).find((key) => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		let role = this.currentRole;
		if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
			role = UI_ROLE_DEFINITION_TEXT.administrator;
		}
		if (screens) {
			this.playlist_screen_table = screens.map((i) => {
				return new UI_PLAYLIST_SCREENS_NEW(
					{ value: i.screenId, link: null, editable: false, hidden: true },
					{ value: counter++, link: null, editable: false, hidden: false },
					{ value: i.screenName, link: `/` + role + `/screens/` + i.screenId, editable: false, hidden: false, new_tab_link: true },
					{ value: i.businessName, link: null, editable: false, hidden: false },
					{ value: i.hostName, link: null, editable: false, hidden: false },
					{ value: i.screenTypeName || '--', link: null, editable: false, hidden: false },
					{ value: i.templateName, link: null, editable: false, hidden: false },
					{ value: i.createdBy, link: null, editable: false, hidden: false }
				);
			});
		} else {
			this.playlist_screen_table = {
				message: 'No Screens Available'
			};
		}
	}

	reloadPlaylist(dataOnly: boolean = false) {
		// if set to true, then it will only call the swapped content
		if (dataOnly) return this.getPlaylistDataAndScreens(this._params.snapshot.params.data);

		this.ngOnInit();
	}

	reloadDemo(e) {
		if (e) {
			this.playlist_updating = true;
			setTimeout(() => {
				this.playlist_updating = false;
			}, 2000);
		}
	}

	warningModal(status, message, data, return_msg, action, licenses: API_LICENSE_PROPS[]): void {
		this._dialog.closeAll();

		let dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			disableClose: true,
			data: {
				status: status,
				message: message,
				data: data,
				return_msg: return_msg,
				action: action
			}
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result === 'update') {
				licenses.forEach((p) => {
					this._socket.emit('D_update_player', p.licenseId);
				});

				this.ngOnInit();
			}
		});
	}

	private getPlaylistDataAndScreens(playlistId: string) {
		const requests = [this._playlist.get_playlist_by_id(playlistId), this._playlist.get_screens_of_playlist(playlistId)];

		return forkJoin(requests)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				([playlistResponse, screenResponse]) => {
					this.setpageData(playlistResponse);
					this.playlist_screens = screenResponse.screens;
					this.screensMapToTable(this.playlist_screens);
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private getPlaylistScreens(playlistId: string) {
		return this._playlist
			.get_screens_of_playlist(playlistId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					this.playlist_screens = response.screens;
					this.screensMapToTable(this.playlist_screens);
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private setpageData(data: API_SINGLE_PLAYLIST) {
		const { playlist, playlistContents, hostLicenses } = data;
		const { playlistName, playlistDescription } = playlist;
		this.playlist = data;
		this.title = playlistName;
		this.description = playlistDescription;
		this.playlist_content_and_blacklist = [...playlistContents];
		this.playlist_host_and_license = [...hostLicenses];
	}

	private subscribeToPushPlaylistUpdateToAllLicenses() {
		return this._playlist.onPushPlaylistUpdateToAllLicenses
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => this.playlist.licenses.forEach((license) => this._socket.emit('D_update_player', license.licenseId)));
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected get currentRole() {
		return this._auth.current_role;
	}

	protected get isAdmin() {
		return this._auth.current_role === 'administrator';
	}

	protected get isDealer() {
		return this._auth.current_role === 'dealer';
	}
}
