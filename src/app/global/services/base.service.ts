import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from './auth-service/auth.service';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class BaseService {

	protected headers = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this.currentUser.jwt.token}`},
		),
	}

	constructor(
		private _auth: AuthService,
		private _http: HttpClient,
	) { }

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected getRequest(endpoint: string): Observable<any> {
		const url = `${this.baseUri}${endpoint}`;
		return this._http.get(url, this.headers);
	}

	protected postRequest(endpoint: string, body: object): Observable<any> {
		const url = `${this.baseUri}${endpoint}`;
		return this._http.post(url, body, this.headers);
	}

	protected get baseUri() {
		return `${environment.base_uri}`;
	}

	protected get creators() {
		return environment.create;
	}

	protected get getters() {
		return environment.getters;
	}

	protected get updaters() {
		return environment.update;
	}

	protected get deleters() {
		return environment.delete;
	}

}