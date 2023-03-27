import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

import { environment } from 'src/environments/environment';
import { API_GOOGLE_MAP } from 'src/app/global/models';
import { BaseService } from '../base.service';

@Injectable({
	providedIn: 'root'
})
export class MapService extends BaseService {

	constructor(_auth: AuthService, _http: HttpClient) {
		super(_auth, _http);
	}

	get_google_location_info(data) {
        return this.getRequest(`${this.getters.api_google_map}${data}`);
	}
	
    get_google_store_info(data) {
        return this.getRequest(`${this.getters.api_google_store_hours}${data}`);
	}
}
