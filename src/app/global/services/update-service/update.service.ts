import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({
	providedIn: 'root'
})

export class UpdateService {

    httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}` }
		)
	};

    constructor(
        private _http: HttpClient,
		private _auth: AuthService
    ) {}

    /**
     * Add New App for Player
     * API POST Method to AWS
     * @param data - Add App Version Form Data
    */ 
    add_app(data: any) {
        return this._http.post<any>(`${environment.base_uri}${environment.create.api_new_app}`, data, this.httpOptions)
    }

    /**
     * Add New App Version for Player
     * API POST Method to AWS
     * @param data - Add App Version Form Data
    */
    add_app_version(data: any) {
        return this._http.post<any>(`${environment.base_uri}${environment.create.api_new_app_version}`, data, this.httpOptions);
    }

    /**
     * Get Apps from API
     * API GET Method to AWS
    */
    get_apps() {
        return this._http.get<any>(`${environment.base_uri}${environment.getters.api_apps}`, this.httpOptions);
    }

    /**
     * Get App Version by App ID
     * API GET Method to AWS
     * @param data - App ID
    */
    get_app_version(data: string) {
        return this._http.get<any>(`${environment.base_uri}${environment.getters.api_apps_version}${data}`, this.httpOptions);
    }

    /**
     * Get All App Versions
     * API GET Method to AWS
    */
    get_app_versions() {
        return this._http.get<any>(`${environment.base_uri}${environment.getters.api_apps_versions}`, this.httpOptions);
    }

    /**
     * Remove Player Apps
     * API POST Method to AWS
     * @param data - App ID
    */
    remove_app(data: any) {
        return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_player_app}`, data, this.httpOptions);
    }

    /**
     * Remove Player Apps
     * API POST Method to AWS
     * @param data - Version ID
    */
    remove_app_version(data: any) {
        return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_player_app_version}`, data, this.httpOptions);
    }
}