import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

import { API_DEALER, API_EXPORT_DEALER, API_DEALER_VALUES, API_FILTERS, PAGING } from 'src/app/global/models';
import { API_CREDIT_CARD_DETAILS } from '../../models/api_credit-card-details.model';
import { UI_CREDIT_CARD_DETAILS } from '../../models/ui_credit-card-details.model';
import { BaseService } from '../base.service';

@Injectable({
	providedIn: 'root'
})
export class DealerService extends BaseService {
	onSuccessReassigningDealer = new EventEmitter<null>();
	onDealerDataLoaded = new EventEmitter<{ email: string }>();

	api_get_dealer_total() {
		return this.getRequest(`${this.getters.api_get_dealer_total}`);
	}

	add_dealer(data) {
		return this.postRequest(`${this.creators.api_new_dealer}`, data);
	}

	content_dealer_metrics(data) {
		return this.postRequest(`${this.getters.api_get_dealers_content_metrics}`, data);
	}

	delete_dealer(body: { dealerId: string; userId: string; retainContents: boolean }) {
		return this.postRequest(`${this.deleters.delete_dealer}`, body);
	}

	delete_contract_details(filename) {
		const body = {};
		return this.postRequest(`${this.deleters.api_delete_contract_details}${filename}`, body);
	}

	delete_territory_details(filename) {
		const body = {};
		return this.postRequest(`${this.deleters.api_delete_territory_details}${filename}`, body);
	}

	export_dealers(): Observable<API_EXPORT_DEALER[]> {
		return this.getRequest(`${this.getters.export_dealers}`).map((response) => response.dealers);
	}

	get_credit_cards(dealerId: string) {
		const url = `${this.getters.dealer_cards}?dealerid=${dealerId}`;
		return this.getRequest(url);
	}

	get_dealers() {
		return this.getRequest(`${this.getters.api_get_dealers}`).map((data) => data.dealers);
	}

	get_dealers_directory(page: number, key: string, searchKey: string) {
		return this.getRequest(
			`${this.getters.api_get_dealers_directory}` + '?page=' + `${page}` + '&search=' + `${key}` + '&searchBy=' + `${searchKey}`
		);
	}

	get_dealers_with_host(page: number, search: string) {
		const filters: API_FILTERS = { page, search };
		const base = `${this.getters.api_get_dealers_with_host}`;
		const params = this.setUrlParams(filters);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_dealers_with_advertiser(page: number, search: string, sortColumn?: string, sortOrder?: string, pageSize = 15): Observable<{ paging?: PAGING, dealers: API_DEALER[], message?: string }> {

		const base = `${this.getters.api_get_dealers_with_advertiser}`;
		const paramsToSet: { page: number, search: string, pageSize: number, sortColumn?: string, sortOrder?: string } = { page, search, pageSize };

		if (sortColumn) paramsToSet.sortColumn = sortColumn;

		if (sortOrder) paramsToSet.sortOrder = sortOrder;

		const params = this.setUrlParams(paramsToSet, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);

	}

	get_dealers_with_license(page: number, key: string) {
		const params = this.setUrlParams({ page, search: key });
		return this.getRequest(`${this.getters.api_get_dealers_with_license}${params}`);
	}

	get_dealers_with_page(page: number, key: string): Observable<{ dealers: API_DEALER[]; paging: PAGING }> {
		return this.getRequest(`${this.getters.api_get_dealers}` + '?page=' + `${page}` + '&search=' + `${key}`);
	}

	get_dealers_with_sort(
		page: number,
		search: string,
		sortColumn: string,
		sortOrder: string,
		filter?: string,
		filterMin?: any,
		filterMax?: any,
		status = '',
		filterPerc?: string,
		filterPercMin?: number,
		filterPercMax?: number
	) {
		const filters: API_FILTERS = {
			page,
			search,
			sortColumn,
			sortOrder,
			filter,
			filterMin,
			filterMax,
			status,
			filterPerc,
			filterPercMin,
			filterPercMax
		};
		const base = `${this.getters.api_get_dealers_with_sort}`;
		const params = this.setUrlParams(filters);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}
	
    get_dealers_fetch(
		page: number,
		search: string,
		sortColumn: string,
		sortOrder: string,
		filter?: string,
		filterMin?: any,
		filterMax?: any,
		status = '',
		filterPerc?: string,
		filterPercMin?: number,
		filterPercMax?: number
	) {
		const filters: API_FILTERS = {
			page,
			search,
			sortColumn,
			sortOrder,
			filter,
			filterMin,
			filterMax,
			status,
			filterPerc,
			filterPercMin,
			filterPercMax
		};
		const base = `${this.getters.api_get_dealers_fetch}`;
		const params = this.setUrlParams(filters);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_dealer_license_zone(key: string, dealerId: string, page: number) {
		const params = this.setUrlParams({ page, search: key, dealerId });
		return this.getRequest(`${this.getters.api_get_dealer_license_zone}${params}`);
	}

	get_dealer_by_id(id: string) {
		return this.getRequest(`${this.getters.api_get_dealer_by_id}${id}`).map((data) => data.dealer);
	}

	get_all_dealer_values(page, searchKey, column, order, pageSize = 15) {
		return this.getRequest(
			`${this.getters.api_get_all_dealer_values}` +
				'?page=' +
				`${page}` +
				'&search=' +
				`${searchKey}` +
				'&sortColumn=' +
				`${column}` +
				'&sortOrder=' +
				`${order}` +
				'&pageSize=' +
				`${pageSize}`
		);
	}

	get_dealer_values_by_id(id: string): Observable<API_DEALER_VALUES | { message: string }> {
		return this.getRequest(`${this.getters.api_get_dealer_values}${id}`);
	}

	get_dealer_contract_files(id: string) {
		return this.getRequest(`${this.getters.api_get_dealer_contract_files}${id}`);
	}

	get_dealer_territory_files(id: string) {
		return this.getRequest(`${this.getters.api_get_dealer_territory_files}${id}`);
	}

	get_search_dealer(key: number | string) {
		return this.getRequest(`${this.getters.api_search_dealer}${key}`);
	}

	get_search_dealer_getall(key: string) {
		return this.getRequest(`${this.getters.api_search_dealer_getall}${key}`);
	}

	get_search_dealer_with_host(key: string) {
		return this.getRequest(`${this.getters.api_search_dealer_with_host}${key}`);
	}

	get_dealer_report(data) {
		return this.postRequest(`${this.getters.api_get_dealer_report}`, data);
	}

	reassign_dealer(old_id: string, new_id: string) {
		const data = { oldDealerId: old_id, newDealerId: new_id };
		return this.postRequest(`${this.updaters.reassign_dealer}`, data);
	}

	save_credit_card_details(data: UI_CREDIT_CARD_DETAILS, type = 'create'): Observable<{ card: API_CREDIT_CARD_DETAILS }> {
		let baseUrl: any = this.creators;
		if (type === 'update') baseUrl = this.updaters;
		const url = baseUrl['dealer_credit_card_details'];

		return this.postRequest(url, data);
	}

	update_dealer(data) {
		return this.postRequest(`${this.updaters.api_update_dealer}`, data);
	}

	update_dealer_values(data) {
		return this.postRequest(`${this.updaters.api_update_dealer_values}`, data);
	}

	update_status(id: string, status: string) {
		const requestUrl = `${this.updaters.dealer_status}`;
		const data = { dealerId: id, status };
		const options = { responseType: 'text' as 'json' };
		return this.postRequest(requestUrl, data, options);
	}

	upload_contract_files(data) {
		return this.postRequest(`${this.creators.dealer_contract_files}`, data);
	}

	upload_territory_files(data) {
		return this.postRequest(`${this.creators.dealer_territory_files}`, data);
	}

}
