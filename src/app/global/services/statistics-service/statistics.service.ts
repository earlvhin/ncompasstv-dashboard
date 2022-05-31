import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class StatisticsService {
	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' })
	};

	constructor(private _http: HttpClient, private _auth: AuthService) {}

	// get_admin_statistics() {
	// 	return this._http.post(`${environment.base_uri}${environment.getters.api_get_admin_statistics}`, this.httpOptions)
	// }

	api_get_dealer_total() {
		return this._http.get(`${environment.base_uri}${environment.getters.api_get_dealer_total}`, this.httpOptions);
	}
}
