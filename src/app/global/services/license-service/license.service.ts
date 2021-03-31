import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpParameterCodec } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';
import { API_LICENSE } from '../../models/api_license.model';
import { Observable } from 'rxjs';

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

export class LicenseService {
	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`},
		),
	};

	onSortLicenseByColumn = new EventEmitter<{ column: string, order: string }>();
	httpParams = (params: object) => new HttpParams({ encoder: new CustomHttpParamEncoder(), fromObject: { ...params } })
	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }

	get_all_licenses() {}

	get_licenses_total() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_total}`, this.httpOptions);
	}
	
	get_licenses_total_by_dealer(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_total_by_dealer}${id}`, this.httpOptions);
	}
	
	get_license_by_dealer_id(id, page, key, arrangement) {
		const params = this.httpParams({ dealerId: id,page, search: key, arrangement })
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_by_dealer}`, { ...this.httpOptions, params });
	}

	get_license_by_host_id(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_by_host}${id}`, this.httpOptions);
	}

	get_license_by_id(id) {
		return this._http.get<API_LICENSE>(`${environment.base_uri}${environment.getters.api_get_licenses_by_id}${id}`, this.httpOptions);
	}

	get_license_report(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_license_report}`, data, this.httpOptions);
	}

	get_license_total_per_dealer(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_total_by_dealer}${id}`, this.httpOptions)
	}

	activate_license(id) {
		return this._http.post(`${environment.base_uri}${environment.update.api_activate_license}${id}`, null, this.httpOptions);
	}

	deactivate_license(id) {
		return this._http.post(`${environment.base_uri}${environment.update.api_deactivate_license}${id}`, null, this.httpOptions);
	}

	assign_licenses_to_host(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_assign_license_to_host}`, data, this.httpOptions);
	}

	generate_license(id, count) {
		return this._http.post(`${environment.base_uri}${environment.create.api_new_license}dealerId=${id}&licensecount=${count}`, null, this.httpOptions);
	}

	get_screenshots(id) {
		return this._http.get(`${environment.base_uri_old}${environment.getters.api_get_screenshots}${id}`, this.httpOptions).map( (data: any) => data.files );
	}
	
	update_alias(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_alias}`, data, this.httpOptions);
	}

	/**
	 *  Updates the license installation date
	 * 	
	 * 	@param licenseId: string
	 * 	@param installDate: string = '03/05/2021'
	 */
	update_install_date(licenseId: string, installDate: string): Observable<any> {
		const data = { licenseId, installDate };

		const options = {
			headers: new HttpHeaders({ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`}),
			responseType: 'text' as 'json'
		};

		return this._http.post(`${environment.base_uri}${environment.update.install_date}`, data, options);
	}

	/**
	 *  Updates the installation date on multiple licenses
	 * 	
	 * 	@param data: { licenseId: string, installDate: string }[]
	 */
	update_install_date_list(data: { licenseId: string, installDate: string }[]): Observable<any> {

		const options = {
			headers: new HttpHeaders({ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`}),
			responseType: 'text' as 'json'
		};

		return this._http.post(`${environment.base_uri}${environment.update.install_date_list}`, data, options);
	}

	delete_screenshots(id) {
		return this._http.get(`${environment.base_uri_old}${environment.delete.api_remove_screenshots}${id}`, this.httpOptions);
	}
	
	delete_license(to_delete) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_license}`, to_delete, this.httpOptions);
	}

	unassign_host_license(licenses, force?) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_host_licenses}`, licenses, this.httpOptions);
	}

	get_license_by_dealear_old(dealer) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_license_by_dealer_temp}${dealer}`, this.httpOptions);
	}

	/**
	 * Update Internet Informationof License ID
	 * @param data - LicenseID, InternetInfo Data 
	*/
	update_internet_info(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.update.api_update_internet_info}`, data, this.httpOptions);
	}
}
