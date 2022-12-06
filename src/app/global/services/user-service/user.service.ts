import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { USER } from '../../models/api_user.model';
import { environment } from '../../../../environments/environment';
import { UI_ROLE_DEFINITION } from '../../../global/models/ui_role-definition.model';
import 'rxjs/add/operator/map';
import { API_FILTERS, API_USER_STATS, PAGING } from '../../models';
import { BaseService } from '../base.service';

@Injectable({
	providedIn: 'root'
})
export class UserService extends BaseService {
	token = JSON.parse(localStorage.getItem('tokens'));

	// httpOptions = {
	// 	headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' })
	// };

	// constructor(private _http: HttpClient, private _auth: AuthService) {}

	deleteUser(userId: string) {
        const url = `${this.deleters.user}?userid=${userId}`;
		return this.postRequest(url, {});
	}

	get_users() {
        const url = this.getters.api_get_users;
		return this.getRequest(url);
	}

	get_users_by_filters(filters: API_FILTERS) {
		const endpoint = `${this.getters.api_get_users}`;
		const params = this.setUrlParams(filters, false, true);
		const url = `${endpoint}${params}`;
		return this.getRequest(url);
	}

	get_users_by_owner(ownerId: string) {
        const url = `${this.getters.users_by_owner}${ownerId}`;
		return this.getRequest(url);
	}
	
	get_users_search(key) {
        const url = `${this.getters.api_get_users}` + '?search=' + `${key}`;
		return this.getRequest(url);
	}
	
	get_user_total() {
        const url = this.getters.api_get_users_total;
		return this.getRequest(url);
	}

	get_user_by_id(data) {
        const url = `${this.getters.api_get_user_by_id}${data}`;
		return this.getRequest(url).map((data) => data.user);
	}

	get_user_alldata_by_id(data, isAdmin) {
		const url = `${this.getters.api_get_user_by_id}${data}` + '&isAdmin=' + `${isAdmin}`;
		return this.getRequest(url).map((data) => data);
	}

	create_new_user(role: string, data: any) {
		let url: string;

		switch (role) {
			case UI_ROLE_DEFINITION.administrator:
                url = `${this.creators.api_new_admin}`
				break;
			case UI_ROLE_DEFINITION.dealer:
                url = `${this.creators.api_new_dealer}`
				break;
			case UI_ROLE_DEFINITION.dealeradmin:
                url = `${this.creators.api_new_dealer_admin}`
				break;
			case UI_ROLE_DEFINITION['sub-dealer']:
                url = `${this.creators.sub_dealer_account}`
				break;
			case UI_ROLE_DEFINITION.host:
                url = `${this.creators.api_new_host}`
				break;
			case UI_ROLE_DEFINITION.advertiser:
                url = `${this.creators.api_new_advertiser}`
				break;
			case UI_ROLE_DEFINITION.tech:
                url = `${this.creators.api_new_techrep}`
				break;
		}
        const body = { data };
		return this.postRequest(url, body);
	}

	validate_email(email: string) {
		const re =
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(String(email).toLowerCase());
	}

	update_email_notifications(userId: string, data: boolean) {
        const url = `${this.updaters.user_email_settings}`;
        const body = { allowEmail: data ? 1 : 0, userId };
		return this.postRequest(url, body);
	}

	update_permission(userId: string, type: string) {
        const url = `${this.updaters.account_permission}?userid=${userId}&type=${type}`;
		return this.postRequest(url, {});
	}

	update_user(data) {
        const url = `${this.updaters.api_update_user}`;
		return this.postRequest(url, data);
	}
	
    dealeradmin_update_user(data) {
        const url = `${this.updaters.dealeradmin_update_user}`;
		return this.postRequest(url, data);
	}

	get_user_notifications(id) {
        const url = `${this.getters.api_get_notifications}${id}`;
		return this.getRequest(url);
	}

    set_cookie_for_other_site(id) {
        const url = `${this.getters.api_get_and_set_cookies}${id}`;
		return this.getRequest(url);
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
