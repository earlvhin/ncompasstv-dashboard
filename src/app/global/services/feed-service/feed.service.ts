import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';
import { GenerateFeed, GenerateWeatherFeed, WEATHER_FEED_STYLE_DATA } from '../../models/api_feed_generator.model';
import { map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})

export class FeedService {

	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`}
		)
	};

	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }

	create_feed(data) {
		return this._http.post(`${environment.base_uri}${environment.create.api_new_feed}`, data, this.httpOptions)
	}

	edit_feed(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_feed}`, data, this.httpOptions)
	}

	edit_generated_feed(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_generated_feed}`, data, this.httpOptions);
	}

	generate_feed(data: any, type: string) {
		return this._http.post(`${environment.base_uri}${environment.create.api_new_feed_generate}/${type}`, data, this.httpOptions);
	}

	get_feeds(page, key, column?, order?) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_feeds}`+'?page='+`${page}`+'&search='+`${key}`+'&sortColumn='+`${column}`+'&sortOrder='+`${order}`, this.httpOptions);
	}

	get_feeds_by_dealer(id, page, key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_feeds_by_dealer}`+'?dealerid='+`${id}`+'&page='+`${page}`+'&search='+`${key}`, this.httpOptions);
	}

	get_feed_types() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_feed_types}`, this.httpOptions).map((data: any) => data.feedTypes);
	}
	
	// get_search_feeds(key: string) {
	// 	return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_feeds}`+'?search='+`${key}`, this.httpOptions);
	// }

	get_generated_feed_by_id(id: string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_generated_feed_by_id}${id}`, this.httpOptions).pipe(map(data => data.feed));
	}
	
	get_feeds_total() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_feeds_total}`, this.httpOptions);
	}

	get_feeds_total_by_dealer(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_feeds_total}`+'?dealerid='+`${id}`, this.httpOptions);
	}

	get_feed_by_id(feed_id) {
		return this._http.get(`${environment.base_uri}${environment.getters.api_get_feed_by_id}${feed_id}`, this.httpOptions)
	}
	
	create_weather_feed_demo(weather_feed_style: WEATHER_FEED_STYLE_DATA) {
		return this._http.post(`${environment.base_uri}${environment.create.api_new_weather_feed_demo}`, weather_feed_style, this.httpOptions);
	}

	// get_feed_screenshot(url) {
	// 	return 
	// }
}