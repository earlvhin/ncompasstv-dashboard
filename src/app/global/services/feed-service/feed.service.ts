import { Injectable, ɵ_sanitizeUrl } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { WEATHER_FEED_STYLE_DATA } from 'src/app/global/models/api_feed_generator.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';
import { CREATE_WIDGET_FEED } from '../../models';

@Injectable({
	providedIn: 'root'
})
export class FeedService extends BaseService {
	constructor(_auth: AuthService, _http: HttpClient) {
		super(_auth, _http);
	}

	clone_feed(contentId: string, title: string, createdBy: string) {
		const url = `${this.creators.feed_clone}`;
		const body = { contentId, createdBy, title };
		return this.postRequest(url, body);
	}

	create_feed(data) {
		const url = `${this.creators.api_new_feed}`;
		return this.postRequest(url, data);
	}

	create_widget_feed(body: CREATE_WIDGET_FEED) {
		const url = this.creators.api_new_feed;

		body.embeddedscript = encodeURIComponent(body.embeddedscript).replace(/'/g, '%27').replace(/"/g, '%22');

		return this.postRequest(url, [body]);
	}

	edit_feed(data) {
		const url = `${this.updaters.api_update_feed}`;
		return this.postRequest(url, data);
	}

	edit_generated_feed(data) {
		const url = `${this.updaters.api_update_generated_feed}`;
		return this.postRequest(url, data);
	}

	generate_feed(data: any, type: string) {
		const url = `${this.creators.api_new_feed_generate}` + '/' + `${type}`;
		return this.postRequest(url, data);
	}

	get_feeds(page, key, column?, order?) {
		const base = `${this.getters.api_get_feeds}`;
		const params = this.setUrlParams({ page, search: key, sortColumn: column, sortOrder: order }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_feeds_by_dealer(id, page, key) {
		const base = `${this.getters.api_get_feeds_by_dealer}`;
		const params = this.setUrlParams({ dealerid: id, page, search: key }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_feed_types() {
		return this.getRequest(`${this.getters.api_get_feed_types}`).map((data: any) => data.feedTypes);
	}

	get_fillers() {
		return this.getRequest(`${this.getters.api_get_fillers}`).map((data: any) => data.fillers);
	}

	get_generated_feed_by_id(id: string) {
		return this.getRequest(`${this.getters.api_get_generated_feed_by_id}${id}`).pipe(map((data) => data.feed));
	}

	get_feeds_total() {
		return this.getRequest(`${this.getters.api_get_feeds_total}`);
	}

	get_feeds_total_by_dealer(id) {
		return this.getRequest(`${this.getters.api_get_feeds_total}` + '?dealerid=' + `${id}`);
	}

	get_feed_by_id(feed_id) {
		return this.getRequest(`${this.getters.api_get_feed_by_id}${feed_id}`);
	}

	update_filler_feed(feed_data) {
		const url = `${this.updaters.api_update_filler_feed}`;
		return this.postRequest(url, feed_data);
	}

	update_slide_feed(feed_data) {
		const url = `${this.updaters.api_update_slide_feed}`;
		return this.postRequest(url, feed_data);
	}

	update_news_feed(feed_data) {
		const url = `${this.updaters.api_update_news_slide_feed}`;
		return this.postRequest(url, feed_data);
	}

	update_weather_feed(feed_data) {
		const url = `${this.updaters.api_update_weather_feed}`;
		return this.postRequest(url, feed_data);
	}

	create_weather_feed_demo(weather_feed_style: WEATHER_FEED_STYLE_DATA) {
		return this.getRequest(
			`${this.creators.api_new_weather_feed_demo}` +
				'?backgroundContentId=' +
				`${weather_feed_style.bannerContentId}` +
				'&bannerContentId=' +
				`${weather_feed_style.bannerContentId}daysFontColor`
		);
	}

	validate_weather_zip(zip: string) {
		const url = `${this.getters.validate_weather_zip}${zip}`;
		return this.postRequest(url, {}).pipe(map((data: any) => data.weatherResponse));
	}

	validate_rss_url(url: string): Observable<boolean> {
		const endpoint = `${this.getters.validate_rss_url}`;
		const params = encodeURIComponent(url);
		const requestUrl = `${endpoint}${params}`;
		return this.postRequest(requestUrl, {});
	}

	validateColorFieldValues(control: FormControl): { [s: string]: boolean } {
		if (!control || !control.value) return;

		const controlValue = (control.value as string).toLowerCase();
		const hexPattern = new RegExp(/^#[0-9A-F]{6}$/i);

		if (controlValue.includes('rgba')) {
			const lastCharIndex = controlValue.length - 1;

			if (controlValue.substring(lastCharIndex) !== ')') return { invalidColor: true };

			const colorValuesEnclosed = controlValue.substring(5, lastCharIndex);
			const colorValues = colorValuesEnclosed.split(',');

			for (let i = 0; i < colorValues.length; i++) {
				if (i !== colorValues.length - 1 && colorValues[i].length > 3) return { invalidColor: true };
				if (i === colorValues.length - 1 && parseFloat(colorValues[i]) > 1) return { invalidColor: true };
			}

			return null;
		}

		if (hexPattern.test(controlValue)) return null;
		return { invalidColor: true };
	}
}
