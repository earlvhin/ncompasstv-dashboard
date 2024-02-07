import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from '../auth-service/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ToolsService {
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

    deleteScreenshots() {
        return this._http.post(
            `${environment.base_uri}${environment.delete.api_delete_screenshot}`,
            null,
            this.httpOptions,
        );
    }

    resetSocketConnection() {
        return this._http.get(
            `${environment.base_uri}${environment.getters.api_renewsocket}`,
            this.httpOptions,
        );
    }

    createActivity(data) {
        return this._http.post(
            `${environment.base_uri}${environment.create.api_new_activity}`,
            data,
            this.httpOptions,
        );
    }

    saveGlobalSettings(data) {
        return this._http.post(
            `${environment.base_uri}${environment.create.api_create_global_settings}`,
            data,
            this.httpOptions,
        );
    }

    getActivities() {
        return this._http.get(
            `${environment.base_uri}${environment.getters.api_get_activities}`,
            this.httpOptions,
        );
    }

    getGlobalSettings() {
        return this._http.get(
            `${environment.base_uri}${environment.getters.api_get_global_settings}`,
            this.httpOptions,
        );
    }
}
