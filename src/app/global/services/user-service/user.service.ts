import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

import { environment } from 'src/environments/environment';
import { API_DEALER, API_FILTERS, API_USER_DATA, API_USER_STATS, PAGING, UI_ROLE_DEFINITION } from 'src/app/global/models';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' })
	};

	constructor(private _http: HttpClient, private _auth: AuthService) {}

	deleteUser(userId: string) {
		const endpoint = `${this.base}${this.delete.user}?userid=${userId}`;
		return this._http.post(endpoint, {}, this.httpOptions);
	}

	get_users() {
		return this._http.get<any>(`${this.base}${this.getters.api_get_users}`, this.httpOptions);
	}

	get_users_by_filters(filters: API_FILTERS) {
		const endpoint = `${this.base}${this.getters.api_get_users}`;
		const params = this.setUrlParams(filters, false, true);
		const url = `${endpoint}${params}`;
		return this._http.get<{ paging?: PAGING; message?: string }>(url, this.httpOptions);
	}

	get_users_by_owner(ownerId: string) {
		const endpoint = `${this.base}${this.getters.users_by_owner}${ownerId}`;
		return this._http.get(endpoint, this.httpOptions);
	}

	get_users_search(key) {
		return this._http.get<any>(`${this.base}${this.getters.api_get_users}` + '?search=' + `${key}`, this.httpOptions);
	}

	get_user_total() {
		return this._http.get<API_USER_STATS>(`${this.base}${this.getters.api_get_users_total}`, this.httpOptions);
	}

	get_user_by_id(id: string) {
		return this._http.get<any>(`${this.base}${this.getters.api_get_user_by_id}?user_id=${id}`, this.httpOptions).map((data) => data.user);
	}

	get_all_user_data_by_id(id: string): Observable<{ user?: API_USER_DATA; dealer?: API_DEALER[]; message?: string }> {
		let isAdmin = this._auth.current_role == 'administrator' ? true : false;

		const url = `${this.base}${this.getters.api_get_user_by_id}?user_id=${id}&isAdmin=${isAdmin}`;
		const response: Observable<{ user?: API_USER_DATA; dealer?: API_DEALER[]; message?: string }> = this._http.get(url, this.httpOptions);
		return response;
	}

	create_new_user(role: string, data: any) {
		let url: string;

		switch (role) {
			case UI_ROLE_DEFINITION.administrator:
				url = this.create.api_new_admin;
				break;
			case UI_ROLE_DEFINITION.dealer:
				url = this.create.api_new_dealer;
				break;
			case UI_ROLE_DEFINITION['sub-dealer']:
				url = this.create.sub_dealer_account;
				break;
			case UI_ROLE_DEFINITION.host:
				url = this.create.api_new_host;
				break;
			case UI_ROLE_DEFINITION.advertiser:
				url = this.create.api_new_advertiser;
				break;
			case UI_ROLE_DEFINITION.tech:
				url = this.create.api_new_techrep;
				break;
		}

		return this._http.post(`${this.base}${url}`, data, this.httpOptions);
	}

	validate_email(email: string) {
		const pattern =
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return pattern.test(String(email).toLowerCase());
	}

	update_email_notifications(userId: string, data: boolean) {
		const endpoint = `${this.base}${this.update.user_email_settings}`;
		const body = { allowEmail: data ? 1 : 0, userId };
		return this._http.post(endpoint, body, this.httpOptions);
	}

	update_permission(userId: string, type: string) {
		const endpoint = `${this.base}${this.update.account_permission}?userid=${userId}&type=${type}`;
		return this._http.post(endpoint, {}, this.httpOptions);
	}

	update_user(data) {
		return this._http.post(`${this.base}${this.update.api_update_user}`, data, this.httpOptions);
	}

	get_user_notifications(receiverId: string) {
		return this._http.get(`${this.base}${this.getters.api_get_notifications}${receiverId}`, this.httpOptions);
	}

	set_cookie_for_other_site(userId: string) {
		return this._http.get(`${this.base}${this.getters.api_get_and_set_cookies}${userId}`, this.httpOptions);
	}

	protected get base() {
		return environment.base_uri;
	}

	protected get create() {
		return environment.create;
	}

	protected get delete() {
		return environment.delete;
	}

	protected get getters() {
		return environment.getters;
	}

	protected get update() {
		return environment.update;
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
