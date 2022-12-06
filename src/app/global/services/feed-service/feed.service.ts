import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { WEATHER_FEED_STYLE_DATA } from 'src/app/global/models/api_feed_generator.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root'
})
export class FeedService extends BaseService {
	// token = JSON.parse(localStorage.getItem('tokens'));

	// httpOptions = {
	// 	headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' })
	// };

	// constructor(private _http: HttpClient, private _auth: AuthService) {}

	// clone_feed(contentId: string, title: string, createdBy: string) {
	// 	const body = { contentId, createdBy, title };
	// 	return this._http.post(`${environment.base_uri}${environment.create.feed_clone}`, body, this.httpOptions);
	// }

	// create_feed(data) {
	// 	return this._http.post(`${environment.base_uri}${environment.create.api_new_feed}`, data, this.httpOptions);
	// }

	// edit_feed(data) {
	// 	return this._http.post(`${environment.base_uri}${environment.update.api_update_feed}`, data, this.httpOptions);
	// }

	// edit_generated_feed(data) {
	// 	return this._http.post(`${environment.base_uri}${environment.update.api_update_generated_feed}`, data, this.httpOptions);
	// }

	// generate_feed(data: any, type: string) {
	// 	return this._http.post(`${environment.base_uri}${environment.create.api_new_feed_generate}/${type}`, data, this.httpOptions);
	// }

	get_feeds(page, key, column?, order?) {
        const base = `${this.getters.api_get_feeds}`;
        const params = this.setUrlParams({ page, search: key, sortColumn: column, sortOrder: order }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	// get_feeds_by_dealer(id, page, key) {
	// 	return this._http.get<any>(
	// 		`${environment.base_uri}${environment.getters.api_get_feeds_by_dealer}` +
	// 			'?dealerid=' +
	// 			`${id}` +
	// 			'&page=' +
	// 			`${page}` +
	// 			'&search=' +
	// 			`${key}`,
	// 		this.httpOptions
	// 	);
	// }

	// get_feed_types() {
	// 	return this._http
	// 		.get<any>(`${environment.base_uri}${environment.getters.api_get_feed_types}`, this.httpOptions)
	// 		.map((data: any) => data.feedTypes);
	// }

	// get_fillers() {
	// 	return this._http
	// 		.get<any>(`${environment.base_uri}${environment.getters.api_get_fillers}`, this.httpOptions)
	// 		.map((data: any) => data.fillers);
	// }

    // Disabled Talaga
	// get_search_feeds(key: string) {
	// 	return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_feeds}`+'?search='+`${key}`, this.httpOptions);
	// }

	// get_generated_feed_by_id(id: string) {
	// 	return this._http
	// 		.get<any>(`${environment.base_uri}${environment.getters.api_get_generated_feed_by_id}${id}`, this.httpOptions)
	// 		.pipe(map((data) => data.feed));
	// }

	get_feeds_total() {
        return this.getRequest(`${this.getters.api_get_feeds_total}`);
	}

	// get_feeds_total_by_dealer(id) {
	// 	return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_feeds_total}` + '?dealerid=' + `${id}`, this.httpOptions);
	// }

	// get_feed_by_id(feed_id) {
	// 	return this._http.get(`${environment.base_uri}${environment.getters.api_get_feed_by_id}${feed_id}`, this.httpOptions);
	// }

	// update_filler_feed(feed_data) {
	// 	return this._http.post(`${environment.base_uri}${environment.update.api_update_filler_feed}`, feed_data, this.httpOptions);
	// }

	// update_slide_feed(feed_data) {
	// 	return this._http.post(`${environment.base_uri}${environment.update.api_update_slide_feed}`, feed_data, this.httpOptions);
	// }

	// update_news_feed(feed_data) {
	// 	return this._http.post(`${environment.base_uri}${environment.update.api_update_news_slide_feed}`, feed_data, this.httpOptions);
	// }

	// update_weather_feed(feed_data) {
	// 	return this._http.post(`${environment.base_uri}${environment.update.api_update_weather_feed}`, feed_data, this.httpOptions);
	// }

	// create_weather_feed_demo(weather_feed_style: WEATHER_FEED_STYLE_DATA) {
	// 	return this._http.get(
	// 		`${environment.base_uri}${environment.create.api_new_weather_feed_demo}?
	// 		backgroundContentId=${weather_feed_style.bannerContentId}&
	// 		bannerContentId=${weather_feed_style.bannerContentId}$
	// 		daysFontColor`,
	// 		this.httpOptions
	// 	);
	// }

	// validate_weather_zip(zip: string) {
	// 	return this._http
	// 		.post(`${environment.base_uri}${environment.getters.validate_weather_zip}${zip}`, null, this.httpOptions)
	// 		.pipe(map((data: any) => data.weatherResponse));
	// }

	// validate_rss_url(url: string): Observable<boolean> {
	// 	const base = environment.base_uri;
	// 	const endpoint = environment.getters.validate_rss_url;
	// 	const params = encodeURIComponent(url);
	// 	const requestUrl = `${base}${endpoint}${params}`;
	// 	return this._http.post<any>(requestUrl, null, this.httpOptions);
	// }

	// validateColorFieldValues(control: FormControl): { [s: string]: boolean } {
	// 	if (!control || !control.value) return;

	// 	const controlValue = (control.value as string).toLowerCase();
	// 	const hexPattern = new RegExp(/^#[0-9A-F]{6}$/i);

	// 	if (controlValue.includes('rgba')) {
	// 		const lastCharIndex = controlValue.length - 1;

	// 		if (controlValue.substring(lastCharIndex) !== ')') return { invalidColor: true };

	// 		const colorValuesEnclosed = controlValue.substring(5, lastCharIndex);
	// 		const colorValues = colorValuesEnclosed.split(',');

	// 		for (let i = 0; i < colorValues.length; i++) {
	// 			if (i !== colorValues.length - 1 && colorValues[i].length > 3) return { invalidColor: true };
	// 			if (i === colorValues.length - 1 && parseFloat(colorValues[i]) > 1) return { invalidColor: true };
	// 		}

	// 		return null;
	// 	}

	// 	if (hexPattern.test(controlValue)) return null;
	// 	return { invalidColor: true };
	// }
}
