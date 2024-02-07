import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';
import { Observable } from 'rxjs';
import { CITIES_STATE } from '../../models/api_cities_state.model';

@Injectable({
    providedIn: 'root',
})
export class LocationService extends BaseService {
    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    get_cities() {
        return this.getRequest('./assets/data/city.json', null, false, false, false, true);
    }

    get_canada_cities() {
        return this.getRequest('./assets/data/canada.json', null, false, false, false, true);
    }

    get_states_regions(state) {
        return this.getRequest(
            './assets/data/states-abbreviation-region.json',
            null,
            false,
            false,
            false,
            true,
        ).map((states: Array<any>) => {
            return states.filter((s) => s.state === state);
        });
    }

    get_states_by_abbreviation(state) {
        return this.getRequest(
            './assets/data/states-abbreviation-region.json',
            null,
            false,
            false,
            false,
            true,
        ).map((states: Array<any>) => {
            return states.filter((s) => s.abbreviation === state);
        });
    }

    get_cities_data(search?: string): Observable<CITIES_STATE> {
        const url = search
            ? `${this.getters.api_get_cities_state}?search=${search}`
            : this.getters.api_get_cities_state;
        return this.getRequest(url, null, false, false, false, false, true);
    }
}
