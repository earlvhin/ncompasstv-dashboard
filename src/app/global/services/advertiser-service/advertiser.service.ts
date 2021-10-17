import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';
import { API_FILTERS } from '../../models';

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

	get_advertisers_by_dealer_id(dealer_id: string, page: number, search: string, sortColumn = '', sortOrder = '') {
		const base = `${environment.base_uri}${environment.getters.api_get_advertisers_by_dealer_id}`;
		const params = this.setUrlParams({ page, dealer_id, search, sortColumn, sortOrder });
		const url = `${base}${params}`;
		return this._http.get<any>(url, this.httpOptions);
	}
	
    get_advertisers_unassigned_to_user(id, page, key, column='', order='') {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_advertisers_unassigned}${id}`+'&page='+`${page}`+'&search='+`${key}`+'&sortColumn='+`${column}`+'&sortOrder='+`${order}`, this.httpOptions);
	}

	get_advertiser_by_id(id, page = ''): Observable<any | { advertiser: any, tags: any[]}> {
		const url = `${environment.base_uri}${environment.getters.api_get_advertisers_by_id}${id}`;
		const request = this._http.get<any>(url, this.httpOptions);
		if (page !== 'single-advertiser') return request.map(data => data.advertiser);
		return request;
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

	private setUrlParams(filters: API_FILTERS, enforceTagSearchKey = false) {

		let result = '';
		
		Object.keys(filters).forEach(
			key => {

				if (typeof filters[key] === 'undefined') return;
				
				if (!result.includes('?')) result += `?${key}=`;
				else result += `&${key}=`;

				if (enforceTagSearchKey && key === 'search' && filters['search'] && filters['search'].trim().length > 1 && !filters['search'].startsWith('#')) filters['search'] = `#${filters['search']}`;
				if (typeof filters[key] === 'string' && filters[key].includes('#')) result += encodeURIComponent(filters[key]); 
				else result += filters[key];

			}
		);

		return result

	}

	protected get baseUri() {
		return `${environment.base_uri}`;
	}

	protected get getters() {
		return environment.getters;
	}
}
