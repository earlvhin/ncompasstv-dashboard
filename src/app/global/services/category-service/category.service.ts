import { Injectable } from '@angular/core';
import { AuthService } from '../../../global/services/auth-service/auth.service';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { API_CATEGORY } from '../../models/api_category.model';
import { API_PARENTCATEGORY } from '../../models/api_parentcategory.model';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root'
})


export class CategoryService {
	
	token = JSON.parse(localStorage.getItem('tokens'));

	http_options = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}` }
		)
	};
	
	constructor(
		private _auth: AuthService,
		private _http: HttpClient
	) { }

	get_categories() {
		return this._http.get<API_CATEGORY[]>(`${environment.base_uri}${environment.getters.api_get_categories}`, this.http_options);
	}
	
	get_parent_categories() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_parent_categories}`, this.http_options).map(data => data.parentCategory);
	}

}
