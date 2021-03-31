import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { API_GOOGLE_MAP } from '../../models/api_google-map.model';

@Injectable({
    providedIn: 'root'
})

export class MapService {
	
	constructor(
		private _http: HttpClient
	) { }
	
	get_google_location_info(data) {
		return this._http.get<API_GOOGLE_MAP>(`${environment.base_uri}${environment.getters.api_google_map}${data}`).map(data => data.google_search);
	}
}
