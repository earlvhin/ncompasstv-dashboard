import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpParameterCodec } from '@angular/common/http';
import 'rxjs/add/operator/map'

import { API_DEALER, API_FILTERS } from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { environment } from 'src/environments/environment';

export class CustomHttpParamEncoder implements HttpParameterCodec {

	encodeKey(key: string): string {
		return encodeURIComponent(key);
	}

	encodeValue(value: string): string {
		return encodeURIComponent(value);
	}

	decodeKey(key: string): string {
		return decodeURIComponent(key);
	}

	decodeValue(value: string): string {
		return decodeURIComponent(value);
	}

}

@Injectable({
	providedIn: 'root'
})

export class DealerService {
	
	token = JSON.parse(localStorage.getItem('tokens'));
	httpOptions = { headers: new HttpHeaders( { 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`} )};
	httpParams = (params: object) => new HttpParams({ encoder: new CustomHttpParamEncoder(), fromObject: { ...params } });
	onSuccessReassigningDealer = new EventEmitter<null>();

	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }
	
	add_dealer(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_new_dealer}`, data);
	}
	
    content_dealer_metrics(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_dealers_content_metrics}`, data);
	}

	export_dealers() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.export_dealers}`, this.httpOptions).map(data => data.dealers);
	}

	get_dealers() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_dealers}`, this.httpOptions).map(data => data.dealers);
	}
	
	get_dealers_directory(page, key, searchKey) { 
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_dealers_directory}`+'?page='+`${page}`+'&search='+`${key}`+'&searchBy='+`${searchKey}`, this.httpOptions);
	}

	get_dealers_with_host(page: number, search: string) {
		const filters: API_FILTERS  = { page, search };
		const base = `${environment.base_uri}${environment.getters.api_get_dealers_with_host}`;
		const params = this.setUrlParams(filters);
		const url = `${base}${params}`;
		return this._http.get<any>(url, this.httpOptions);
	}
	
	get_dealers_with_advertiser(page: number, search: string, sortColumn?: string, sortOrder?: string) {
		const base = `${environment.base_uri}${environment.getters.api_get_dealers_with_advertiser}`;
		const params = this.setUrlParams({ page, search, sortColumn, sortOrder });
		const url = `${base}${params}`;
		return this._http.get<any>(url, this.httpOptions);
	}
	
	get_dealers_with_license(page, key) {
		const params = this.httpParams({ page, search: key });
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_dealers_with_license}`, { ...this.httpOptions, params });
	}

	get_dealers_with_page(page, key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_dealers}`+'?page='+`${page}`+'&search='+`${key}`, this.httpOptions);
	}

	get_dealers_with_sort(page: number, search: string, sortColumn: string, sortOrder: string, filter?: string, filterMin?: any, filterMax?: any, status = '') {
		const filters: API_FILTERS = { page, search, sortColumn, sortOrder, filter, filterMin, filterMax, status };
		const base = `${this.baseUri}${this.getters.api_get_dealers_with_sort}`;
		const params = this.setUrlParams(filters);
		const url = `${base}${params}`;
		return this._http.get<any>(url, this.httpOptions);
	}

	get_dealer_by_id(id: string) {
		return this._http.get<API_DEALER>(`${environment.base_uri}${environment.getters.api_get_dealer_by_id}${id}`, this.httpOptions).map(data => data.dealer);
	}
	
	get_search_dealer(key: number | string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_search_dealer}${key}`, this.httpOptions);
	}

	get_search_dealer_getall(key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_search_dealer_getall}${key}`, this.httpOptions);
	}

	get_search_dealer_with_host(key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_search_dealer_with_host}${key}`, this.httpOptions);
	}

	get_dealer_report(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_dealer_report}`, data, this.httpOptions);
	}

	update_dealer(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_dealer}`, data, this.httpOptions);
	}

	update_status(id: string, status: string) {
		const requestUrl = `${this.baseUri}${this.update.dealer_status}`;
		const data = { dealerId: id, status };
		const options = {
			headers: new HttpHeaders({ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`}),
			responseType: 'text' as 'json'
		};
		return this._http.post(requestUrl, data, options);

	}

	reassign_dealer(old_id: string, new_id: string) {
		const data = { oldDealerId: old_id, newDealerId: new_id };
		return this._http.post(`${environment.base_uri}${environment.update.reassign_dealer}`, data, this.httpOptions);
	}

	private setUrlParams(filters: API_FILTERS, enforceTagSearchKey = false) {

		let result = '';
		
		Object.keys(filters).forEach(
			key => {
				
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

	protected get update() {
		return environment.update;
	}
}
