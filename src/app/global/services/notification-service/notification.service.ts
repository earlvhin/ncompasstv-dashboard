import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth-service/auth.service';

@Injectable({
	providedIn: 'root'
})

export class NotificationService {

	httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}` }
		)
	};

	constructor(
		private _auth: AuthService,
		private _http: HttpClient
	) { }

	getAll() {
		return this._http.get(`${environment.base_uri}${environment.getters.api_get_all_notifications}`, this.httpOptions);
	}

	getByDealerId(dealerId: string) {
		return this._http.get(`${environment.base_uri}${environment.getters.api_get_dealer_notifications}${dealerId}`, this.httpOptions);
	}

	getById() {
		// return this._http
	}

	updateNotificationStatus() {

	}
}
