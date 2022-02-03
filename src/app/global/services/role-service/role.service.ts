import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { API_USER_ROLES } from '../../models/api_user-role.model';
import { environment } from '../../../../environments/environment';
import 'rxjs/add/operator/map'
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { USER_ROLE } from '../../models';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})

export class RoleService {

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

	get_roles() {
		return this._http.get<{ roles: USER_ROLE[] }>(`${environment.base_uri}${environment.getters.api_get_roles}`, this.httpOptions).map(data => data.roles);
	}

	get_user_role() {
		return Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
	}
}
