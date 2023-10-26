import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseService } from '../base.service';
import { API_ADVERTISER, API_FILTERS, PAGING, TAG } from 'src/app/global/models';

@Injectable({
	providedIn: 'root'
})
export class AdvertiserService extends BaseService {
	token = JSON.parse(localStorage.getItem('tokens'));

	create_advertiser_activity_logs(data) {
		const url = `${this.creators.new_advertiser_activity_logs}`;
		return this.postRequest(url, data);
	}

	get_advertisers(filters: API_FILTERS): Observable<{ advertisers: API_ADVERTISER[]; paging: PAGING }> {
		const base = `${this.getters.api_get_advertisers}`;
		const params = this.setUrlParams(filters, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_advertiser_activity(ownerId: string, sortColumn: string, sortOrder: string, page: number): Observable<{ paging: PAGING; message?: string }> {
		const base = `${this.getters.api_get_advertisers_activity}`;
		const params = this.setUrlParams({ ownerId, sortColumn, sortOrder, page }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_advertisers_total() {
		return this.getRequest(`${this.getters.api_get_advertiser_total}`);
	}

	get_advertisers_total_by_dealer(
		id: string
	): Observable<{ newAdvertisersLastWeek: number; newAdvertisersThisWeek: number; total: number; totalActive: number; totalInActive: number }> {
		const url = `${this.getters.api_get_advertiser_total_by_dealer}${id}`;
		return this.getRequest(url);
	}

	get_advertisers_by_dealer_id(
		filters: API_FILTERS,
		enforceTagKeySearch = false,
		allowBlankFilters = true
	): Observable<{ advertisers?: API_ADVERTISER[]; paging?: PAGING; message?: string }> {
		const base = `${this.getters.api_get_advertisers_by_dealer_id}`;
		const params = this.setUrlParams(filters, enforceTagKeySearch, allowBlankFilters);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_advertisers_unassigned_to_user(id: string, page: number, key: string, column = '', order = '') {
		const url = `${this.getters.api_get_advertisers_unassigned}${id}&page=${page}&search=${key}&sortColumn=${column}&sortOrder=${order}`;
		return this.getRequest(url);
	}

	get_advertiser_by_id(id: string): Observable<{ message?: string; advertiser?: any; tags?: TAG[] }> {
		const url = `${this.getters.api_get_advertisers_by_id}${id}`;
		const request = this.getRequest(url);
		return request;
	}

	get_advertiser_report(data) {
		return this.postRequest(`${this.getters.api_get_advertiser_report}`, data);
	}

	add_advertiser_profile(data) {
		return this.postRequest(`${this.creators.api_new_advertiser_profile}`, data);
	}

	search_advertiser(keyword = '') {
		const url = `${this.baseUri}${this.getters.search_advertiser}${keyword}`;
		return this.getRequest(url);
	}

	update_advertiser(data) {
		return this.postRequest(`${this.updaters.api_update_advertiser}`, data);
	}

	remove_advertiser(id, force) {
		return this.postRequest(`${this.deleters.api_remove_advertiser}${id}&force=${force}`, null);
	}
}
