import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({
	providedIn: 'root'
})

export class TemplateService {

	token = JSON.parse(localStorage.getItem('tokens'));
	onSelectZone = new EventEmitter<string>();

	httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}` }
		)
	};

	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }

	get_templates() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_templates}`, this.httpOptions);
	}

	get_template_by_id(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_template_by_id}${id}`, this.httpOptions);
	}

	new_template(data) {
		return this._http.post(`${environment.base_uri}${environment.create.api_new_template}`, data, this.httpOptions);
	}

}
