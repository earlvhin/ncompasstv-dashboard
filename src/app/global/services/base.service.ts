import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
		}),
		withCredentials: true
	};

	protected applicationOnlyHeaders = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json' })
	};

	constructor(private _auth: AuthService, private _http: HttpClient) {}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected getRequest(
		endpoint: string,
		options: any = null,
		isApplicationRequestOnly = false,
		overrideUrl = false,
		overrideOptions = false
	): Observable<any> {
		let headers: any = isApplicationRequestOnly ? this.applicationOnlyHeaders : this.headers;
		let baseUri = this.baseUri;

        if (options && options.plain) return this._http.get(endpoint);
		if (options) headers = { ...this.headers, ...options };
		if (overrideOptions) headers = { headers: new HttpHeaders(options) };
		if (this._auth.current_role === 'dealeradmin' && (options && !options.global)) baseUri += 'dealeradmin/';

		const url = overrideUrl ? endpoint : `${baseUri}${endpoint}`;
		return this._http.get(url, headers);
	}

	protected postRequest(endpoint: string, body: object, options: any = null, isApplicationRequestOnly = false): Observable<any> {
		let headers = !isApplicationRequestOnly ? this.headers : this.applicationOnlyHeaders;
		let baseUri = this.baseUri;
		if (options) headers = { ...this.headers, ...options };
		if (this._auth.current_role === 'dealeradmin') baseUri += 'dealeradmin/';
		const url = `${baseUri}${endpoint}`;
		return this._http.post(url, body, headers);
	}

	protected customHeader_postRequest(endpoint: string, body: object, options: any = null, customheader): Observable<any> {
		let headers = customheader;
		let baseUri = this.baseUri;
		if (options) headers = { headers, ...options };
		if (this._auth.current_role === 'dealeradmin') baseUri += 'dealeradmin/';
		const url = `${baseUri}${endpoint}`;
		return this._http.post(url, body, headers);
	}

	protected putRequest(endpoint: string, body: object, options: any = null, isApplicationRequestOnly = false): Observable<any> {
		let headers = !isApplicationRequestOnly ? this.headers : this.applicationOnlyHeaders;
		let baseUri = this.baseUri;
		if (options) headers = { ...this.headers, ...options };
		if (this._auth.current_role === 'dealeradmin') baseUri += 'dealeradmin/';
		const url = `${baseUri}${endpoint}`;
		return this._http.put(url, body, headers);
	}

	protected deleteRequest(endpoint: string, options: any = null, isApplicationRequestOnly = false): Observable<any> {
		let headers = !isApplicationRequestOnly ? this.headers : this.applicationOnlyHeaders;
		let baseUri = this.baseUri;
		if (options) headers = { ...this.headers, ...options };
		if (this._auth.current_role === 'dealeradmin') baseUri += 'dealeradmin/';
		const url = `${baseUri}${endpoint}`;
		return this._http.delete(url, headers);
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

	protected get upserts() {
		return environment.upsert;
	}

	protected get deleters() {
		return environment.delete;
	}

	protected setUrlParams(filters: any, enforceTagSearchKey = false, allowBlanks = false) {
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
