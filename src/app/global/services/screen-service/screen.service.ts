import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({
	providedIn: 'root'
})

export class ScreenService {
	
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

	assign_license(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_assign_license_to_screen}`, data, this.httpOptions)
	}

	create_screen(data) {
		return this._http.post(`${environment.base_uri}${environment.create.api_new_screen}`, data, this.httpOptions);
	}

	edit_screen(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_screen}`, data, this.httpOptions);
	}

	get_screens(page, key, column, order) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screens}`+'?page='+`${page}`+'&search='+`${key}`+'&sortColumn='+`${column}`+'&sortOrder='+`${order}`, this.httpOptions);
	}

	get_screens_search(key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screens}`+'?search='+`${key}`, this.httpOptions);
	}
	
	get_screens_type() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screens_type}`, this.httpOptions);
	}

	get_screen_by_id(id, licenseId?) {
		if (licenseId) {
			return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screen_by_id}${id}&licenseId=${licenseId}`, this.httpOptions);
		} else {
			return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screen_by_id}${id}`, this.httpOptions);
		}
	}

	get_screen_by_dealer_id(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screen_by_dealer}${id}`, this.httpOptions);
	}

	get_screen_total() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screens_total}`, this.httpOptions);
	}
	
	get_screen_total_by_dealer(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screens_total_by_dealer}${id}`, this.httpOptions);
	}
	
	delete_screen(to_delete) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_screen}`, to_delete, this.httpOptions);
	}

	unassign_license(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_screen_license}`, data, this.httpOptions)
	}
}

