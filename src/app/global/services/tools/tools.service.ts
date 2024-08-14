import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from '../auth-service/auth.service';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { API_XML_DATA, API_XML_SETTINGS } from 'src/app/global/models';

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
        return this._http.get(`${environment.base_uri}${environment.getters.api_renewsocket}`, this.httpOptions);
    }

    createActivity(data) {
        return this._http.post(`${environment.base_uri}${environment.create.api_new_activity}`, data, this.httpOptions);
    }

    createXml(data: API_XML_DATA): Observable<{ data: API_XML_SETTINGS }> {
        const endpoint = 'xml/settings/';
        return this._http.post<any>(`${environment.base_uri}${endpoint}`, data);
    }

    updateActivity(activityCode: string, data: any) {
        return this._http.put(`${environment.base_uri}activity/${activityCode}`, data, this.httpOptions);
    }

    deleteActivity(activityCode: string) {
        return this._http.delete(`${environment.base_uri}activity/${activityCode}`, this.httpOptions);
    }

    deleteXmlTag(id: string): Observable<{ message?: string }> {
        const endpoint = 'xml/settings/';
        return this._http.delete(`${environment.base_uri}${endpoint}${id}`, this.httpOptions);
    }

    updateXmlTag(id: string, data: any): Observable<{ message?: string }> {
        const endpoint = 'xml/settings/';
        return this._http.put(`${environment.base_uri}${endpoint}${id}`, data, this.httpOptions);
    }

    saveGlobalSettings(data) {
        return this._http.post(
            `${environment.base_uri}${environment.create.api_create_global_settings}`,
            data,
            this.httpOptions,
        );
    }

    getActivities() {
        return this._http.get(`${environment.base_uri}${environment.getters.api_get_activities}`, this.httpOptions);
    }

    getGlobalSettings() {
        return this._http.get(
            `${environment.base_uri}${environment.getters.api_get_global_settings}`,
            this.httpOptions,
        );
    }

    getAllXmlTag(sortColumn: string, sortOrder: string, page = 1, pageSize: number): Observable<API_XML_SETTINGS> {
        const endpoint = 'xml/settings?';
        return this._http.get<any>(
            `${environment.base_uri}${endpoint}sortColumn=${sortColumn}&sortOrder=${sortOrder}&page=${page}&pageSize=${pageSize}`,
            this.httpOptions,
        );
    }
}
