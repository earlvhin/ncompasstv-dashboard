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

	getAll(page?: number) {
		return this._http.get(`${environment.base_uri}${environment.getters.api_get_all_notifications}${ page > 0 ? '?page=' + page : ''}`, this.httpOptions);
	}

	getByDealerId(dealerId: string, page?: number) {
		return this._http.get(`${environment.base_uri}${environment.getters.api_get_dealer_notifications}${dealerId}${ page > 0 ? '&page=' + page : ''}`, this.httpOptions);
	}

	getById() {
		// return this._http
	}

	updateNotificationStatus(id: string) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_notification_status}${id}`, null, this.httpOptions);
	}
}
