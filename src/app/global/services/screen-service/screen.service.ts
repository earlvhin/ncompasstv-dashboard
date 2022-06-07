import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { environment } from 'src/environments/environment';
import { API_CHANGE_TEMPLATE, API_SINGLE_SCREEN, API_CHANGE_TEMPLATE_RESPONSE, CREATE_SCREEN_RESPONSE } from 'src/app/global/models';

@Injectable({
	providedIn: 'root'
})
export class ScreenService {
	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' })
	};

	constructor(private _http: HttpClient, private _auth: AuthService) {}

	assign_license(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_assign_license_to_screen}`, data, this.httpOptions);
	}

	change_template(body: API_CHANGE_TEMPLATE): Observable<API_CHANGE_TEMPLATE_RESPONSE> {
		const url = `${environment.base_uri}${environment.update.screen_template}`;
		return this._http.post<API_CHANGE_TEMPLATE_RESPONSE>(url, body);
	}

	create_screen(data): Observable<CREATE_SCREEN_RESPONSE> {
		return this._http.post<CREATE_SCREEN_RESPONSE>(`${environment.base_uri}${environment.create.api_new_screen}`, data, this.httpOptions);
	}

	edit_screen(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_screen}`, data, this.httpOptions);
	}

	get_screens(page, key, column, order) {
		return this._http.get<any>(
			`${environment.base_uri}${environment.getters.api_get_screens}` +
				'?page=' +
				`${page}` +
				'&search=' +
				`${key}` +
				'&sortColumn=' +
				`${column}` +
				'&sortOrder=' +
				`${order}`,
			this.httpOptions
		);
	}

	get_screens_search(key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screens}` + '?search=' + `${key}`, this.httpOptions);
	}

	get_screens_type() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screens_type}`, this.httpOptions);
	}

	get_screen_by_id(id: string, licenseId?: string): Observable<API_SINGLE_SCREEN> {
		let url = `${environment.base_uri}${environment.getters.api_get_screen_by_id}${id}`;
		if (licenseId) url += `&licenseId=${licenseId}`;
		return this._http.get<API_SINGLE_SCREEN>(url, this.httpOptions);
	}

	get_screen_by_dealer_id(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screen_by_dealer}${id}`, this.httpOptions);
	}

	api_get_screen_by_dealer_table(page, id, key) {
		return this._http.get<any>(
			`${environment.base_uri}${environment.getters.api_get_screen_by_dealer_table}` +
				'?page=' +
				`${page}` +
				'&dealerid=' +
				`${id}` +
				'&search=' +
				`${key}`,
			this.httpOptions
		);
	}

	// get_screen_by_dealer_id_v2(id) {
	// 	return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screen_by_dealer_table}${id}`, this.httpOptions);
	// }

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
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_screen_license}`, data, this.httpOptions);
	}
}
