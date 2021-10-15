import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';
import { API_HOST } from '../../models/api_host.model';
import { CustomFieldGroup } from '../../models/host-custom-field-group';

@Injectable({
	providedIn: 'root'
})

export class HostService {

	title: string = "Hosts";
	token = JSON.parse(localStorage.getItem('tokens'));
	onUpdateBusinessHours = new EventEmitter<boolean>();

	httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`}
		)
	};

	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }

	add_host(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_new_host}`, data, this.httpOptions);
	}

	add_host_place(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_new_host_place}`, data, this.httpOptions);
	}

	delete_host(hostIds: string[], forceDelete: boolean) {
		const data = { hostIds, forceDelete };
		return this._http.post(`${environment.base_uri}${environment.delete.host}`, data, this.httpOptions);
	}

	export_host(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.export_hosts}${id}`, this.httpOptions);
	}
	
    get_licenses_per_state() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_host_licenses_by_state}`, this.httpOptions);
	}
    
    get_licenses_per_state_details(state) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_host_licenses_by_state_details}${state}`, this.httpOptions).map(data => data.dealerState);
	}

	get_content_by_host_id(id: string) {
		return this._http.get(`${environment.base_uri}${environment.getters.content_by_host_id}?hostId=${id}`, this.httpOptions);
	}

	get_host() {
		return this._http.get<API_HOST>(`${environment.base_uri}${environment.getters.api_get_hosts}`, this.httpOptions).map(data => data.host);
	}
	
	get_host_search(key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_hosts}`+'?search='+`${key}`, this.httpOptions);
	}
	
	get_host_by_page(page, key, column?, order?, pageSize=15) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_hosts}`+'?page='+`${page}`+'&search='+`${key}`+'&sortColumn='+`${column}`+'&sortOrder='+`${order}`+'&pageSize='+`${pageSize}` , this.httpOptions);
	}

	get_host_by_dealer_id(id, page, key, pageSize = 15) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_host_by_dealer}${id}`+'&page='+`${page}`+'&search='+`${key}`+'&pageSize='+`${pageSize}`, this.httpOptions);
	}

    get_host_by_dealer_id_with_sort(id, page, key, column, order, pageSize=15) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_host_by_id_optimized}${id}`+'&page='+`${page}`+'&search='+`${key}`+'&sortColumn='+`${column}`+'&sortOrder='+`${order}`+'&pageSize='+`${pageSize}`, this.httpOptions);
	}
	
	get_host_for_dealer_id(id) {
		return this._http.get<API_HOST[]>(`${environment.base_uri}${environment.getters.api_get_host_for_dealer}${id}`, this.httpOptions);
	}

	get_host_by_id(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_host_by_id}${id}`, this.httpOptions);
	}

	get_host_report(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_host_report}`, data, this.httpOptions);
	}

	update_single_host(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.update.api_update_host}`, data, this.httpOptions);
	}
	
	get_time_zones() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_timezone}`, this.httpOptions)
	}

	get_host_total() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_host_total}`, this.httpOptions)
	}

	get_host_total_per_dealer(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_host_total_per_dealer}${id}`, this.httpOptions)
	}

	get_fields() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_host_fields}`, this.httpOptions);
	}

	get_field_by_id(data: string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_host_field_by_id}${data}`, this.httpOptions);
	}

	create_field_group(data: CustomFieldGroup) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_create_field_group}`, data, this.httpOptions);
	}

	create_field_group_value(data: any) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_fieldgroup_value_create}`, data, this.httpOptions);
	}
}
