import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
	providedIn: 'root'
})
export class LocationService {
	constructor(private _http: HttpClient) {}

	get_cities() {
		return this._http.get('./assets/data/city.json');
	}
	
    get_canada_cities() {
		return this._http.get('./assets/data/canada.json');
	}

	get_states_regions(state) {
		return this._http.get('./assets/data/states-abbreviation-region.json').map((states: Array<any>) => {
			return states.filter((s) => s.state === state);
		});
	}
	
    get_states_by_abbreviation(state) {
		return this._http.get('./assets/data/states-abbreviation-region.json').map((states: Array<any>) => {
			return states.filter((s) => s.abbreviation === state);
		});
	}
}
