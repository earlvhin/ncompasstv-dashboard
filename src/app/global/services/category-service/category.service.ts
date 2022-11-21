import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

import { HttpHeaders, HttpClient } from '@angular/common/http';
import { API_CATEGORY, API_PARENT_CATEGORY } from 'src/app/global/models';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root'
})
export class CategoryService {
	token = JSON.parse(localStorage.getItem('tokens'));

	http_options = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' })
	};

	constructor(private _auth: AuthService, private _http: HttpClient) {}

	get_categories() {
		return this._http.get<API_CATEGORY[]>(`${environment.base_uri}${environment.getters.api_get_categories}`, this.http_options);
	}

	get_parent_categories() {
		return this._http
			.get<{ parentCategory: API_PARENT_CATEGORY[] }>(
				`${environment.base_uri}${environment.getters.api_get_parent_categories}`,
				this.http_options
			)
			.map((data) => data.parentCategory);
	}

	get_category_general(category) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_category_general}${category}`, this.http_options);
	}
}
