import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root'
})
export class FastEdgeService {

	// private current_user_subject: BehaviorSubject<UI_CURRENT_USER>;

	http_options = {
		headers: new HttpHeaders(
            { 
                'X-API-KEY': 'kIwFkm6nVF5qYvAQfYKjB6h516yA918w5m1COWZA',
                // 'Access-Control-Allow-Origin' : '*',
                'Content-Type': 'application/json',
            }
        )
	};

	constructor(private _http: HttpClient) {}

	get_google_business_profile(data) {
		return this._http
			.get<any>(`${environment.fastedge}${data}`, this.http_options).map(
                data => {
                    console.log("DATA", data)
                }
            );
	}
}
