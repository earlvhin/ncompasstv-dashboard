import { Component, Input, OnInit } from '@angular/core';
import { API_CONTENT_BLACKLISTED_CONTENTS, API_SCREEN_OF_PLAYLIST, API_SINGLE_PLAYLIST } from '../../models/api_single-playlist.model';
import { API_SINGLE_SCREEN } from '../../models/api_single-screen.model';
import { UI_PLAYLIST_SCREENS_NEW } from '../../models/ui_single-playlist.model';
import { API_LICENSE_PROPS } from '../../models/api_license.model';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PlaylistService } from '../../services/playlist-service/playlist.service';
import { Observable, Subscription } from 'rxjs';
import { ClonePlaylistComponent } from '../../components_shared/playlist_components/clone-playlist/clone-playlist.component';
import { PlaylistEditModalComponent } from '../../components_shared/playlist_components/playlist-edit-modal/playlist-edit-modal.component';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import * as io from 'socket.io-client';
import { environment } from '../../../../environments/environment';
import { RoleService } from '../../services/role-service/role.service';
import { PlaylistDemoComponent } from '../../components_shared/playlist_components/playlist-demo/playlist-demo.component';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { AuthService } from '../../services/auth-service/auth.service';

@Component({
	selector: 'app-single-playlist',
	templateUrl: './single-playlist.component.html',
	styleUrls: ['./single-playlist.component.scss']
})

export class SinglePlaylistComponent implements OnInit {

	@Input() reload: Observable<void>;

	description: string;
	host_url: string;
	license_to_update = [];
	license_url: string;
	playlist: API_SINGLE_PLAYLIST;
	playlist_content_and_blacklist: any[];
	playlist_host_and_license: any;
	playlist_licenses: API_LICENSE_PROPS[] = [];
	playlist_screens: API_SCREEN_OF_PLAYLIST[] = [];
	playlist_screen_table: any;
	playlist_updating: boolean = true;
	subscription: Subscription = new Subscription;
	title: string;

	_socket: any;
	
	screen_table_column = [
		'#',
		'Screen Title',
		'Dealer',
		'Host',
		'Type',
		'Template',
		'Created By'
	]
	
	constructor(
		private _params: ActivatedRoute,
		private _playlist: PlaylistService,
		private _dialog: MatDialog,
		private _role: RoleService,
		private _auth: AuthService,
	) {}

	ngOnInit() {
		localStorage.removeItem('playlist_data');
		this.playlistRouteInit();

		// If changes made
		if (this.reload) {
			this.reload.subscribe(
				data => {
					this.playlistRouteInit();
				}
			)
		}

		this.host_url = `/${this._role.get_user_role()}/hosts/`
		this.license_url = `/${this._role.get_user_role()}/licenses/`
		
		this._socket = io(environment.socket_server, {
			transports: ['websocket']
		});

		this._socket.on('connect', () => {
			console.log('#SinglePlaylistComponent - Connected to Socket Server');
		})
		
		this._socket.on('disconnect', () => {
			console.log('#SinglePlaylistComponent - Disconnnected to Socket Server');
		})
	}
	
	ngOnDestroy() {
		this.subscription.unsubscribe();
		this._socket.disconnect();
	}

	addToLicenseToPush(e, licenseId) {
		if (e.checked == true && !this.license_to_update.includes(licenseId)) {
			this.license_to_update.push({licenseId: licenseId});
		} else {
			this.license_to_update = this.license_to_update.filter(i => {
				return i.licenseId !== licenseId;
			})
		}
	}

	clonePlaylist() {
		this._dialog.open(ClonePlaylistComponent, {
			width: '600px',
			data: this.playlist
		})
	}

	getPlaylistData(id) {
		this.playlist_updating = true;
		this.subscription.add(
			this._playlist.get_playlist_by_id(id).subscribe(
				data => {
					this.playlist = data;
					this.title = this.playlist.playlist.playlistName;
					this.description = this.playlist.playlist.playlistDescription;
					this.playlist_content_and_blacklist = this.playlist.playlistContents;
					this.playlist_host_and_license = this.playlist.hostLicenses;
					this.playlist_updating = false;
				},
				error => {
					console.log('#getPlaylistData', error);
				}
			)
		)

		this.subscription.add(
			this._playlist.get_screens_of_playlist(id).subscribe(
				data => {
					this.playlist_screens = data.screens;
					this.screensMapToTable(this.playlist_screens);
				},
				error => {
					console.log(error);
				}
			)
		)
	}

	openUpdatePlaylistInfoModal() {
		let dialog = this._dialog.open(PlaylistEditModalComponent, {
			width: '600px',
			data: this.playlist
		})

		dialog.afterClosed().subscribe((data: any) => {
			this.ngOnInit();
		})
	}

	playlistRouteInit() {
		this._params.paramMap.subscribe(
			() => {
				this.getPlaylistData(this._params.snapshot.params.data);
			}
		)
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
		if(e) {
			let dialogRef = this._dialog.open(PlaylistDemoComponent, {
				data: this.playlist.playlist.playlistId,
				width: '768px',
				height: '432px',
				panelClass: 'no-padding'
			})
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
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		if (screens) {
			this.playlist_screen_table = screens.map(
				i => {
					return new UI_PLAYLIST_SCREENS_NEW(
						{ value: i.screenId, link: null , editable: false, hidden: true},
						{ value: counter++, link: null , editable: false, hidden: false},
						{ value: i.screenName, link: `/${route}/screens/` + i.screenId, editable: false, hidden: false},
						{ value: i.businessName, link: null, editable: false, hidden: false},
						{ value: i.hostName, link: null, editable: false, hidden: false},
						{ value: i.screenTypeName || '--', link: null, editable: false, hidden: false},
						{ value: i.templateName, link: null, editable: false, hidden: false},
						{ value: i.createdBy, link: null, editable: false, hidden: false}
					)
				}
			)
		} else {
			this.playlist_screen_table = {
				message: 'No Screens Available'
			}
		}
	}

	reloadPlaylist() {
		this.ngOnInit();
	}

	reloadDemo(e) {
		if (e) {
			this.playlist_updating = true;
			setTimeout(() => {
				this.playlist_updating = false;
			}, 2000)
		}
	}

	warningModal(status, message, data, return_msg, action, licenses): void {
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
		})

		dialogRef.afterClosed().subscribe(result => {
			if(result === 'update') {
				licenses.forEach(
					p => {
						this._socket.emit('D_update_player', p.licenseId);
					}
				)

				this.ngOnInit();
			}
		});
	}
}
