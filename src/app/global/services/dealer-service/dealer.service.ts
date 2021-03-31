import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map'
import { HttpClient, HttpHeaders, HttpParams, HttpParameterCodec } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { API_DEALER } from '../../models/api_dealer.model';
import { environment } from '../../../../environments/environment';

export class CustomHttpParamEncoder implements HttpParameterCodec {
  encodeKey(key: string): string {
    return encodeURIComponent(key);
  }
  encodeValue(value: string): string {
    return encodeURIComponent(value);
  }
  decodeKey(key: string): string {
    return decodeURIComponent(key);
  }
  decodeValue(value: string): string {
    return decodeURIComponent(value);
  }
}

@Injectable({
	providedIn: 'root'
})

export class DealerService {
	
	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`}
		)
	};

	httpParams = (params: object) => new HttpParams({ encoder: new CustomHttpParamEncoder(), fromObject: { ...params } })

	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }
	
	add_dealer(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_new_dealer}`, data);
	}

	get_dealers() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_dealers}`, this.httpOptions).map(data => data.dealers);
	}

	get_dealers_with_host(page, key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_dealers_with_host}`+'?page='+`${page}`+'&search='+`${key}`, this.httpOptions);
	}
	
	get_dealers_with_advertiser(page, key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_dealers_with_advertiser}`+'?page='+`${page}`+'&search='+`${key}`, this.httpOptions);
	}
	
	get_dealers_with_license(page, key) {
		const params = this.httpParams({ page, search: key })

		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_dealers_with_license}`, { ...this.httpOptions, params });
	}

	get_dealers_with_page(page, key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_dealers}`+'?page='+`${page}`+'&search='+`${key}`, this.httpOptions);
	}

	get_dealers_with_sort(page, key, column, order, filter_column?, min?, max?) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_dealers_with_sort}`+'?page='+`${page}`+'&search='+`${key}`+'&sortColumn='+`${column}`+'&sortOrder='+`${order}`+'&filter='+`${filter_column}`+'&filterMin='+`${min}`+'&filterMax='+`${max}`, this.httpOptions);
	}

	get_dealer_by_id(id: string) {
		return this._http.get<API_DEALER>(`${environment.base_uri}${environment.getters.api_get_dealer_by_id}${id}`, this.httpOptions).map(data => data.dealer);
	}
	
	get_search_dealer(key: string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_search_dealer}${key}`, this.httpOptions);
	}

	get_search_dealer_getall(key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_search_dealer_getall}${key}`, this.httpOptions);
	}

	get_search_dealer_with_host(key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_search_dealer_with_host}${key}`, this.httpOptions);
	}

	get_dealer_report(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_dealer_report}`, data, this.httpOptions);
	}

	update_dealer(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_dealer}`, data, this.httpOptions);
	}
}
