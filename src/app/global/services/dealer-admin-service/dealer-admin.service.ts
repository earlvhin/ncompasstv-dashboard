import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import 'rxjs/add/operator/map';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';

@Injectable({
    providedIn: 'root',
})
export class DealerAdminService extends BaseService {
    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    get_search_dealer_admin_getall() {
        return this.getRequest(`${this.getters.api_get_dealer_admins}`);
    }
}
