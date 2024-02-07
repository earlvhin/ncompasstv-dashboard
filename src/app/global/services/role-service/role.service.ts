import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/map';

import { AuthService } from '../auth-service/auth.service';
import { environment } from 'src/environments/environment';
import { UI_ROLE_DEFINITION, USER_ROLE } from 'src/app/global/models';

@Injectable({
    providedIn: 'root',
})
export class RoleService {
    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            credentials: 'include',
            Accept: 'application/json',
        }),
    };

    constructor(
        private _http: HttpClient,
        private _auth: AuthService,
    ) {}

    get_roles() {
        return this._http
            .get<{
                roles: USER_ROLE[];
            }>(`${environment.base_uri}${environment.getters.api_get_roles}`, this.httpOptions)
            .map((data) => data.roles);
    }

    get_user_role() {
        return Object.keys(UI_ROLE_DEFINITION).find(
            (key) => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id,
        );
    }
}
