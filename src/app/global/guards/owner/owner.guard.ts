import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import {
    API_ADVERTISER,
    API_LICENSE,
    API_SINGLE_HOST,
    API_SINGLE_PLAYLIST,
    API_SINGLE_SCREEN,
    API_USER_DATA,
    TAG,
} from 'src/app/global/models';

import {
    AdvertiserService,
    HelperService,
    HostService,
    LicenseService,
    PlaylistService,
    ScreenService,
    UserService,
} from 'src/app/global/services';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Injectable({
    providedIn: 'root',
})
export class OwnerGuard implements CanActivate {
    constructor(
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _helper: HelperService,
        private _host: HostService,
        private _license: LicenseService,
        private _playlist: PlaylistService,
        private _router: Router,
        private _screen: ScreenService,
        private _user: UserService,
    ) {}

    canActivate(next: ActivatedRouteSnapshot) {
        const { parent, url } = next;
        const page = parent.url[0].path;
        const id = url[0].path;

        return this.isAllowed(page, id).map((response: boolean) => {
            if (!response) {
                this._router.navigate([`/${this.roleRoute}/${page}`]);
                return false;
            }

            return true;
        });
    }

    private isAllowed(page: string, id: string) {
        let request: Observable<any>;
        let result: any;

        switch (page) {
            case 'advertisers':
                request = this._advertiser.get_advertiser_by_id(id);
                break;

            case 'hosts':
                request = this._host.get_host_by_id(id);
                break;

            case 'licenses':
                request = this._license.get_license_by_id(id);
                break;

            case 'playlists':
                request = this._playlist.get_playlist_by_id(id);
                break;

            case 'screens':
                request = this._screen.get_screen_by_id(id);
                break;

            case 'users':
                request = this._user.get_user_by_id(id);
                break;
        }

        return request.pipe(
            map((response: any) => {
                switch (page) {
                    case 'advertisers':
                        result = response as { advertiser: API_ADVERTISER; tags: TAG[] };
                        const { advertiser, tags } = result;
                        advertiser.tags = tags;
                        this._helper.singleAdvertiserData = advertiser;
                        return result.advertiser.dealerId === this.ownerId;

                    case 'hosts':
                        result = response as API_SINGLE_HOST;
                        this._helper.singleHostData = result;
                        return result.host.dealerId === this.ownerId;

                    case 'licenses':
                        result = response as API_LICENSE;
                        this._helper.singleLicenseData = result;
                        return result.license.dealerId === this.ownerId;

                    case 'playlists':
                        result = response as API_SINGLE_PLAYLIST;
                        this._helper.singlePlaylistData = result;
                        return result.playlist.dealerId === this.ownerId;

                    case 'screens':
                        result = response as API_SINGLE_SCREEN;
                        this._helper.singleScreenData = result;
                        return result.dealer.dealerId === this.ownerId;

                    case 'users':
                        result = response as API_USER_DATA;
                        this._helper.singleUserData = result;
                        return result.ownerId === this.ownerId;
                }
            }),
        );
    }

    protected get currentUser() {
        return this._auth.current_user_value;
    }

    protected get currentRole() {
        return this._auth.current_role;
    }

    protected get ownerId() {
        const role = this.currentRole;
        const user = this.currentUser;
        let id = user.user_id;

        if (role !== 'admin') id = user.roleInfo.dealerId;
        return id;
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
