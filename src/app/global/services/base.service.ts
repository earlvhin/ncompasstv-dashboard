import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_FILTERS } from '../models';
import { AuthService } from './auth-service/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root'
})
export class BaseService {
	protected headers = {
		headers: new HttpHeaders({
			'Content-Type': 'application/json',
			credentials: 'include',
			Accept: 'application/json'
		})
	};

	constructor(private _auth: AuthService, private _http: HttpClient) {}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected getRequest(endpoint: string, options: any = null): Observable<any> {
		let headers = this.headers;
		console.log('GETREQUEST ==>', endpoint, options, this.headers);
		if (options) headers = { ...this.headers, ...options };
		const url = `${this.baseUri}${endpoint}`;
		return this._http.get(url, { withCredentials: true });
	}

	protected postRequest(endpoint: string, body: object, options: any = null): Observable<any> {
		let headers = this.headers;
		if (options) headers = { ...this.headers, ...options };
		const url = `${this.baseUri}${endpoint}`;
		return this._http.post(url, body, headers);
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

	protected setUrlParams(filters: API_FILTERS, enforceTagSearchKey = false, allowBlanks = false) {
		let result = '';
		Object.keys(filters).forEach((key) => {
			if (!allowBlanks && (typeof filters[key] === 'undefined' || !filters[key])) return;
			if (!result.includes('?')) result += `?${key}=`;
			else result += `&${key}=`;
			if (
				enforceTagSearchKey &&
				key === 'search' &&
				filters['search'] &&
				filters['search'].trim().length > 1 &&
				!filters['search'].startsWith('#')
			)
				filters['search'] = `#${filters['search']}`;
			if (typeof filters[key] === 'string' && filters[key].includes('#')) result += encodeURIComponent(filters[key]);
			else result += filters[key];
		});
		return result;
	}
}
