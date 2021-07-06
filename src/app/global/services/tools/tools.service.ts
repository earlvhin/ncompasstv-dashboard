import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root'
})

export class ToolsService {
    httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}` }
		)
	};

    constructor(
        private _http: HttpClient,
		private _auth: AuthService
    ) {}

	deleteScreenshots() {
		return this._http.post(`${environment.base_uri}${environment.delete.api_delete_screenshot}`, null, this.httpOptions);
	}

	resetSocketConnection() {
		return this._http.get(`${environment.base_uri}${environment.getters.api_renewsocket}`, this.httpOptions);
	}
}