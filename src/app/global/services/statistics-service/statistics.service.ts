import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';
import { BaseService } from '../base.service';

@Injectable({
	providedIn: 'root'
})
export class StatisticsService extends BaseService{
	token = JSON.parse(localStorage.getItem('tokens'));

	// httpOptions = {
	// 	headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' })
	// };

	constructor(_auth: AuthService, _http: HttpClient) {
		super(_auth, _http);
	}


	api_get_dealer_total() {
        const url = `${this.getters.api_get_dealer_total}`;
		return this.getRequest(url);
	}
}
