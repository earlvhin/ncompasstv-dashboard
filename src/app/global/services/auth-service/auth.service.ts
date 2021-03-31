import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { UI_CURRENT_USER } from '../../models/ui_current-user.model';
import { tokenNotExpired } from 'angular2-jwt';
import { Observable, BehaviorSubject } from 'rxjs';
import { USER_LOGIN } from '../../models/api_user.model';


@Injectable({
	providedIn: 'root'
})

export class AuthService {

	private current_user_subject: BehaviorSubject<UI_CURRENT_USER>;
	public current_user: Observable<UI_CURRENT_USER>;
	public session_status: boolean;

	http_options = {
		headers: new HttpHeaders(
			{'Content-Type':  'application/json'}
		)
	};
	
	constructor(
		private _http: HttpClient,
		private _router: Router
	) { }

	// Store User Info inside Local Storage to a global variable. 
	public get current_user_value(): UI_CURRENT_USER {
		this.current_user_subject = new BehaviorSubject<UI_CURRENT_USER>(JSON.parse(localStorage.getItem('current_user')));
		this.current_user = this.current_user_subject.asObservable();
		return this.current_user_subject.value;
	}

	public get session_valid(): boolean {
		return this.session_status;
	}

	// Authenticate User
	authenticate_user(data) {
		return this._http.post<USER_LOGIN>(`${environment.base_uri}${environment.auth.api_login}?username=${data.username}&password=${data.password}`, null);
	}

	// Store User Info and Token to Local Storage
	refresh_token() {
		const refresh_option = {
			headers: new HttpHeaders(
				{'Authorization' :  `Bearer ${this.current_user_value.jwt.token}`}
			)
		}
		
		if (this._http.post(`${environment.base_uri}${environment.auth.api_refresh}`, JSON.stringify(this.current_user_value.jwt), refresh_option)) {
			return true;
		}

		return false;
	}

	session_check(status) {
		return this.session_status = status;
	}

	// Check Token Life for AuthGuard
	token_life() {
		return tokenNotExpired('current_token');
	}
	
	// Remove user from local storage
	logout() {
		localStorage.removeItem('current_token');
		localStorage.removeItem('current_user');
		this._router.navigate(['/login']);
	}
}
