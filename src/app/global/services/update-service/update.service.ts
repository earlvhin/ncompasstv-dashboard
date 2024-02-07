import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs-compat/Observable';

import { AuthService } from '../auth-service/auth.service';
import { API_PLAYER_APP } from 'src/app/global/models';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class UpdateService {
    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            credentials: 'include',
            Accept: 'application/json',
        }),
    };

    constructor(
        private _http: HttpClient,
        private _auth: AuthService,
    ) {}

    /**
     * Add New App for Player
     * API POST Method to AWS
     * @param data - Add App Version Form Data
     */
    add_app(data: any) {
        return this._http.post<any>(
            `${environment.base_uri}${environment.create.api_new_app}`,
            data,
            this.httpOptions,
        );
    }

    /**
     * Add New App Version for Player
     * API POST Method to AWS
     * @param data - Add App Version Form Data
     */
    add_app_version(data: any) {
        return this._http.post<any>(
            `${environment.base_uri}${environment.create.api_new_app_version}`,
            data,
            this.httpOptions,
        );
    }

    /**
     * Get Apps from API
     * API GET Method to AWS
     */
    get_apps(): Observable<API_PLAYER_APP[]> {
        return this._http.get<any>(
            `${environment.base_uri}${environment.getters.api_apps}`,
            this.httpOptions,
        );
    }

    /**
     * Get App Version by App ID
     * API GET Method to AWS
     * @param data - App ID
     */
    get_app_version(data: string) {
        return this._http.get<any>(
            `${environment.base_uri}${environment.getters.api_apps_version}${data}`,
            this.httpOptions,
        );
    }

    /**
     * Get All App Versions
     * API GET Method to AWS
     */
    get_app_versions() {
        return this._http.get<any>(
            `${environment.base_uri}${environment.getters.api_apps_versions}`,
            this.httpOptions,
        );
    }

    /**
     * Remove Player Apps
     * API POST Method to AWS
     * @param data - App ID
     */
    remove_app(data: any) {
        return this._http.post<any>(
            `${environment.base_uri}${environment.delete.api_remove_player_app}`,
            data,
            this.httpOptions,
        );
    }

    /**
     * Remove Player Apps
     * API POST Method to AWS
     * @param data - Version ID
     */
    remove_app_version(data: any) {
        return this._http.post<any>(
            `${environment.base_uri}${environment.delete.api_remove_player_app_version}`,
            data,
            this.httpOptions,
        );
    }
}
