import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { USER } from '../../models/api_user.model';
import { environment } from '../../../../environments/environment';
import { UI_ROLE_DEFINITION } from '../../../global/models/ui_role-definition.model';
import 'rxjs/add/operator/map'

@Injectable({
	providedIn: 'root'
})

export class UserService {

	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}` }
		)
	};

	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }

	deleteUser(userId: string) {
		const endpoint = `${this.base}${this.delete.user}?userid=${userId}`;
		return this._http.post(endpoint, {}, this.httpOptions);
	}

	get_users() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_users}`, this.httpOptions);
	}

	get_users_by_page(page, key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_users}`+'?page='+`${page}`+'&search='+`${key}`, this.httpOptions);
	}
	
	get_users_search(key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_users}`+'?search='+`${key}`, this.httpOptions);
	}
	
	get_user_total() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_users_total}`, this.httpOptions);
	}

	get_user_by_id(data) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_user_by_id}${data}`, this.httpOptions).map(data => data.user);
	}

	get_user_alldata_by_id(data) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_user_by_id}${data}`, this.httpOptions).map(data => data);
	}

	create_new_user(role: string, data: any) {
		let url: string;

		switch (role)  {
			case UI_ROLE_DEFINITION.administrator:
				url = environment.create.api_new_admin
				break;
			case UI_ROLE_DEFINITION.dealer:
				url = environment.create.api_new_dealer
				break;
			case UI_ROLE_DEFINITION['sub-dealer']:
				url = environment.create.sub_dealer_account;
				break;
			case UI_ROLE_DEFINITION.host:
				url = environment.create.api_new_host
				break;
			case UI_ROLE_DEFINITION.advertiser:
				url = environment.create.api_new_advertiser
				break;
			case UI_ROLE_DEFINITION.tech:
				url = environment.create.api_new_techrep
				break
		}

		return this._http.post(`${environment.base_uri}${url}`, data, this.httpOptions);
	}

	validate_email(email: string) {
		const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(String(email).toLowerCase());
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
		return this._http.post(`${environment.base_uri}${environment.update.api_update_user}`, data, this.httpOptions);
	}

	get_user_notifications(id) {
		return this._http.get(`${environment.base_uri}${environment.getters.api_get_notifications}${id}`, this.httpOptions);
	}

	protected get base() {
		return environment.base_uri;
	}

	protected get delete() {
		return environment.delete;
	}

	protected get update() {
		return environment.update;
	}

}
