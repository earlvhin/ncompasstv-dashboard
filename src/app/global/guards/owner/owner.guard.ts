import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_HOST } from '../../models/api_host.model';

import { API_LICENSE } from '../../models/api_license.model';
import { API_SINGLE_PLAYLIST } from '../../models/api_single-playlist.model';
import { API_SINGLE_SCREEN } from '../../models/api_single-screen.model';
import { API_USER_DATA } from '../../models/api_user-data.model';
import { AuthService } from '../../services/auth-service/auth.service';
import { HostService } from '../../services/host-service/host.service';
import { LicenseService } from '../../services/license-service/license.service';
import { PlaylistService } from '../../services/playlist-service/playlist.service';
import { ScreenService } from '../../services/screen-service/screen.service';
import { UserService } from '../../services/user-service/user.service';

@Injectable({
	providedIn: 'root'
})
export class OwnerGuard implements CanActivate {

	constructor(
		private _auth: AuthService,
		private _host: HostService,
		private _license: LicenseService,
		private _playlist: PlaylistService,
		private _router: Router,
		private _screen: ScreenService,
		private _user: UserService,
	) { }

	canActivate(
		next: ActivatedRouteSnapshot,
	) {
		const { parent, url } = next;
		const page = parent.url[0].path;
		const id = url[0].path;

		return this.isAllowed(page, id)
			.map(
				(response: boolean) => {

					if (!response) {
						this._router.navigate([`/${this.currentRole}/${page}`]);
						return false;
					}

					return true;
				}
			);
	}

	private isAllowed(page: string, id: string) {

		let request: Observable<any>;
		let result: API_LICENSE | API_HOST | API_SINGLE_PLAYLIST | API_SINGLE_SCREEN | API_USER_DATA;

		switch (page) {

			case 'hosts':
				request = this._host.get_host_by_id(id);

			case 'licenses':
				request = this._license.get_license_by_id(id);

			case 'playlists':
				request = this._playlist.get_playlist_by_id(id);

			case 'screens':
				request = this._screen.get_screen_by_id(id);

			case 'users':
				request = this._user.get_user_alldata_by_id(id);

		}

		return request.pipe(
			map(
				(response: any) => {
					console.log('request response', response);

					switch (page) {

						case 'hosts':
							result = response as API_HOST;
							return result.dealerId === this.ownerId;

						case 'licenses':
							result = response as API_LICENSE;
							return result.license.dealerId === this.ownerId;

						case 'playlists':
							result = response as API_SINGLE_PLAYLIST;
							return result.playlist.dealerId === this.ownerId;

						case 'screens':
							result = response as API_SINGLE_SCREEN;
							return result.dealer.dealerId === this.ownerId;

						case 'users':
							result = response as API_USER_DATA;
							return result;
					}

				}
			)
		);

	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected get currentRole() {
		return this._auth.current_role;
	}

	protected get ownerId() {

		let id: string;
		const role = this.currentRole;
		const user = this.currentUser;

		switch (role) {
			case 'dealer':
			case 'sub-dealer':
				id = user.roleInfo.dealerId;
				break;

			case 'host':
				break;

			default:
				id = user.user_id;

		}

		return id;

	}
		
}
	