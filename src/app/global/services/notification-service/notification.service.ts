import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth-service/auth.service';

@Injectable({
	providedIn: 'root'
})
export class NotificationService {
	private resolve_all_event = new Subject<any>();
	resolve_all_event_emitted$ = this.resolve_all_event.asObservable();

	httpOptions = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' })
	};

	constructor(private _auth: AuthService, private _http: HttpClient) {}

	emitResolveAllEvent(change: any) {
		this.resolve_all_event.next(change);
	}

	getAll(page: number = 1, pageSize: number = 50) {
		return this._http.get(
			`${environment.base_uri}${environment.getters.api_get_all_notifications}?page=${page ? page : 1}&pageSize=${pageSize}`,
			this.httpOptions
		);
	}

	getByDealerId(dealerId: string, page: number = 1, pageSize: number = 50) {
		return this._http.get(
			`${environment.base_uri}${environment.getters.api_get_dealer_notifications}${dealerId}&page=${page ? page : 1}&pageSize=${pageSize}`,
			this.httpOptions
		);
	}

	updateNotificationStatus(id: string) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_notification_status}${id}`, null, this.httpOptions);
	}

	updateAllNotificationStatus() {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_all_notification_status}`, null, this.httpOptions);
	}

	updateNotificationStatusByDealerId(dealerId: string) {
		return this._http.post(
			`${environment.base_uri}${environment.update.api_update_notification_status_by_dealer}${dealerId}`,
			null,
			this.httpOptions
		);
	}
}
