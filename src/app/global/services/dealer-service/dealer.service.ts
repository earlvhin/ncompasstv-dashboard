import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map'

import { API_DEALER, API_EXPORT_DEALER, API_FILTERS, PAGING } from 'src/app/global/models';
import { BaseService } from '../base.service';

@Injectable({
	providedIn: 'root'
})

export class DealerService extends BaseService {
	
	
	onSuccessReassigningDealer = new EventEmitter<null>();
	
    api_get_dealer_total() {
		return this.getRequest(`${this.getters.api_get_dealer_total}`);
	}
    
	add_dealer(data) {
		return this.postRequest(`${this.creators.api_new_dealer}`, data);
	}
	
    content_dealer_metrics(data) {
		return this.postRequest(`${this.getters.api_get_dealers_content_metrics}`, data);
	}

	delete_dealer(body: { dealerId: string, userId: string, retainContents: boolean }) {
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
		return this.getRequest(`${this.getters.export_dealers}`).map(response => response.dealers);
	}

	get_dealers() {
		return this.getRequest(`${this.getters.api_get_dealers}`).map(data => data.dealers);
	}
	
	get_dealers_directory(page: number, key: string, searchKey: string) { 
		return this.getRequest(`${this.getters.api_get_dealers_directory}`+'?page='+`${page}`+'&search='+`${key}`+'&searchBy='+`${searchKey}`);
	}

	get_dealers_with_host(page: number, search: string) {
		const filters: API_FILTERS  = { page, search };
		const base = `${this.getters.api_get_dealers_with_host}`;
		const params = this.setUrlParams(filters);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}
	
	get_dealers_with_advertiser(page: number, search: string, sortColumn?: string, sortOrder?: string) {
		const base = `${this.getters.api_get_dealers_with_advertiser}`;
		const params = this.setUrlParams({ page, search, sortColumn, sortOrder });
		const url = `${base}${params}`;
		return this.getRequest(url);
	}
	
	get_dealers_with_license(page: number, key: string) {
		const params = this.setUrlParams({ page, search: key });
		return this.getRequest(`${this.getters.api_get_dealers_with_license}${params}`);
	}

	get_dealers_with_page(page: number, key: string): Observable<{ dealers: API_DEALER[], paging: PAGING }> {
		return this.getRequest(`${this.getters.api_get_dealers}`+'?page='+`${page}`+'&search='+`${key}`);
	}

    get_dealers_with_sort(page: number, search: string, sortColumn: string, sortOrder: string, filter?: string, filterMin?: any, filterMax?: any, status = '', filterPerc?: string, filterPercMin?: number, filterPercMax?: number) {
		const filters: API_FILTERS = { page, search, sortColumn, sortOrder, filter, filterMin, filterMax, status, filterPerc, filterPercMin, filterPercMax };		
        const base = `${this.getters.api_get_dealers_with_sort}`;
		const params = this.setUrlParams(filters);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

    get_dealer_license_zone(key: string, dealerId: string, page: number) {
		const params = this.setUrlParams({ page, search: key, dealerId });
		return this.getRequest(`${this.getters.api_get_dealer_license_zone}${params}`);
	}

	get_dealer_by_id(id: string) {
		return this.getRequest(`${this.getters.api_get_dealer_by_id}${id}`).map(data => data.dealer);
	}
	
    get_dealer_values_by_id(id: string) {
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

	reassign_dealer(old_id: string, new_id: string) {
		const data = { oldDealerId: old_id, newDealerId: new_id };
		return this.postRequest(`${this.updaters.reassign_dealer}`, data);
	}

    upload_contract_files(data) {
		return this.postRequest(`${this.creators.dealer_contract_files}`, data);
	}
    
    upload_territory_files(data) {
		return this.postRequest(`${this.creators.dealer_territory_files}`, data);
	}
}
