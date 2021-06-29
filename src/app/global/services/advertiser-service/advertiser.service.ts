import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';
import { API_ADVERTISER } from '../../models/api_advertiser.model';

@Injectable({
	providedIn: 'root'
})

export class AdvertiserService {
	token = JSON.parse(localStorage.getItem('tokens'));
	httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`}
		)
	};

	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }

	get_advertisers() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_advertisers}`, this.httpOptions).map(data => data.advertisers);
	}
	
	get_advertisers_total() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_advertiser_total}`, this.httpOptions);
	}
	
	get_advertisers_total_by_dealer(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_advertiser_total_by_dealer}${id}`, this.httpOptions);
	}

	get_advertisers_by_dealer_id(id, page, key, column?, order?) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_advertisers_by_dealer_id}${id}`+'&page='+`${page}`+'&search='+`${key}`+'&sortColumn='+`${column}`+'&sortOrder='+`${order}`, this.httpOptions);
	}

	get_advertiser_by_id(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_advertisers_by_id}${id}`, this.httpOptions).map(data => data.advertiser);
	}

	get_advertiser_report(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_advertiser_report}`, data, this.httpOptions);
	}

	add_advertiser_profile(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_new_advertiser_profile}`, data, this.httpOptions);
	}

	search_advertiser(keyword = '') {
		const url = `${this.baseUri}${this.getters.search_advertiser}${keyword}`;
		return this._http.get(url, this.httpOptions);
	}
	
	update_advertiser(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.update.api_update_advertiser}`, data, this.httpOptions);
	}

	remove_advertiser(id, force) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_advertiser}${id}&force=${force}`, null, this.httpOptions);
	}

	protected get baseUri() {
		return `${environment.base_uri}`;
	}

	protected get getters() {
		return environment.getters;
	}
}
