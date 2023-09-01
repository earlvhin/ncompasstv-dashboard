import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

import { BaseService } from '../base.service';
import { API_DEALER, API_FILTERS, API_HOST, API_TIMEZONE, CustomFieldGroup, HOST_S3_FILE, PAGING, TAG } from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Injectable({
	providedIn: 'root'
})
export class HostService extends BaseService {
	onUpdateBusinessHours = new Subject<boolean>();
	dialogClosedSubject = new Subject<void>();
	dialogClosed$ = this.dialogClosedSubject.asObservable();

	emitActivity() {
	  this.dialogClosedSubject.next();
	}

	constructor(_auth: AuthService, _http: HttpClient) {
		super(_auth, _http);
	}

	add_host(data: any) {
		const url = this.creators.api_new_host;
		return this.postRequest(url, data);
	}

	add_host_place(data: any) {
		const url = this.creators.api_new_host_place;
		return this.postRequest(url, data);
	}

	create_field_group(data: CustomFieldGroup) {
		const url = `${this.creators.api_create_field_group}`;
		return this.postRequest(url, data);
	}

	create_field_group_value(data: any) {
		const url = `${this.creators.api_fieldgroup_value_create}`;
		return this.postRequest(url, data);
	}

	create_support_entry(data) {
		const url = `${this.creators.api_create_support}`;
		return this.postRequest(url, data);
	}

	create_host_activity_logs(data) {
		const url = `${this.creators.new_host_activity_logs}`;
		return this.postRequest(url, data);
	}

	delete_host(hostIds: string[], forceDelete: boolean) {
		const data = { hostIds, forceDelete };
		const url = this.deleters.host;
		return this.postRequest(url, data);
	}

	delete_file(s3FileName: string) {
		const url = `${this.deleters.host_file_amazon_s3}?filename=${s3FileName}`;
		const body = {};
		return this.postRequest(url, body);
	}

	export_host(id: string) {
		const url = `${this.getters.export_hosts}${id}`;
		return this.getRequest(url);
	}

	get_licenses_per_state() {
		const url = this.getters.api_get_host_licenses_by_state;
		return this.getRequest(url);
	}

	get_all_dma(page: number, keyword: string, pageSize = 15): Observable<{ paging: PAGING }> {
		const url = `${this.getters.api_get_dma}?page=${page}&search=${keyword}&pageSize=${pageSize}`;
		return this.getRequest(url);
	}

	get_dma_hosts_by_rank(rank: number, code: string, name: string): Observable<{ paging: PAGING }> {
		const url = `${this.getters.dma_hosts_by_rank}?dmaRank=${rank}&dmaCode=${code}&dmaName=${encodeURIComponent(name)}&pageSize=0`;
		return this.getRequest(url);
	}

	get_licenses_per_state_details(state: string) {
		const url = `${this.getters.api_get_host_licenses_by_state_details}${state}`;
		return this.getRequest(url).map((data) => data.dealerState);
	}

	/**
	 * @description Get all the contents assigned to a host
	 * @param hostId
	 * @returns Observable<{ contents?: API_CONTENT[], paging?: PAGING, message?: string }>
	 */
	get_contents(hostId: string, page = 1) {
		const url = `${this.getters.contents_by_host}?hostId=${hostId}&page=${page}`;
		return this.getRequest(url);
	}

	get_content_by_host_id(id: string) {
		const url = `${this.getters.content_by_host_id}?hostId=${id}`;
		return this.getRequest(url);
	}

	/**
	 * @description Get all files of a host by type. Type 1 is images and 2 is for documents.
	 * @param hostId: string
	 * @param type: number = 1 (images) | 2 (documents)
	 * @param page: number
	 * @returns PAGING
	 */
	get_files_by_type(hostId: string, type = 1, page = 1): Observable<PAGING> {
		const base = `${this.getters.host_files}`;
		const params = this.setUrlParams({ hostId, type, page });
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_host(): Observable<API_HOST> {
		const url = `${this.getters.api_get_hosts}`;
		return this.getRequest(url).map((data) => data.host);
	}

	get_host_activity(ownerId: string, sortColumn: string, sortOrder: string, page: number): Observable<{ paging: PAGING; message?: string }> {
		const base = `${this.getters.api_get_hosts_activity}`;
		const params = this.setUrlParams({ownerId, sortColumn, sortOrder, page}, false, true);
		const url = `${base}${params}`
		return this.getRequest(url)
	}

	get_host_statistics(dealerId?: string, startDate?: string, endDate?: string) {
		const url = `${this.getters.api_get_hosts_statistics}?dealerid=${dealerId}&startdate=${startDate}&enddate=${endDate}`;
		return this.getRequest(url);
	}

	get_host_search(key: string) {
		const url = `${this.getters.api_get_hosts}` + '?search=' + `${key}`;
		return this.getRequest(url);
	}

	get_host_categories(page: number, key: string, dealerId: string, pageSize = 15) {
		const url = `${this.getters.api_get_hosts_categories}?search=${key}&page=${page}&pageSize=${pageSize}&dealerId=${dealerId}`;
		return this.getRequest(url);
	}

	get_host_states(page: number, key: string, dealerId: string, pageSize = 15) {
		const url = `${this.getters.api_get_hosts_states}?search=${key}&page=${page}&pageSize=${pageSize}&dealerId=${dealerId}`;
		return this.getRequest(url);
	}

	get_host_by_page(filters: API_FILTERS, enforceTagKeySearch = false, allowBlankFilters = true) {
		const base = `${this.getters.api_get_hosts}`;
		const params = this.setUrlParams(filters, enforceTagKeySearch, allowBlankFilters);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_host_fetch(
		filters: API_FILTERS,
		enforceTagKeySearch = false,
		allowBlankFilters = true
	): Observable<{ host?: any[]; paging?: PAGING; message?: string }> {
		const base = `${this.getters.api_get_hosts_fetch}`;
		const params = this.setUrlParams(filters, enforceTagKeySearch, allowBlankFilters);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_host_fetch_export(filters: API_FILTERS): Observable<{ host?: API_HOST[]; paging?: PAGING; message?: string }> {
		const base = `${this.getters.api_get_hosts_fetch_for_export}`;
		const params = this.setUrlParams(filters, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_host_by_dealer_id(id: any, page: number, key: string, pageSize = 15): Observable<{ paging?: PAGING; message?: string }> {
		let url = `${this.getters.api_get_host_by_dealer}${id}&page=${page}&pageSize=${pageSize}`;

		if (key && key.trim().length > 0) {
			const search = encodeURIComponent(key);
			url += `&search=${search}`;
		}

		return this.getRequest(url);
	}

	get_host_by_dealer_id_locator(
		id: any,
		page: number,
		key: string,
		pageSize = 15,
		pending = false
	): Observable<{ paging?: PAGING; message?: string }> {
		let url = `${this.getters.api_get_host_by_dealer}${id}&page=${page}&pageSize=${pageSize}&pending=${pending}`;

		if (key && key.trim().length > 0) {
			const search = encodeURIComponent(key);
			url += `&search=${search}`;
		}

		return this.getRequest(url);
	}

	get_support_entries(hostId: string, page: number, sortColumn: string, sortOrder: string): Observable<{ paging: PAGING; message?: string }> {
		const base = `${this.getters.api_get_support}`;
		const params = this.setUrlParams({ hostId, page, sortColumn, sortOrder }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_host_by_dealer_id_with_sort(filters: API_FILTERS) {
		const base = `${this.getters.api_get_host_by_id_optimized}`;
		const params = this.setUrlParams(filters, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_host_for_dealer_id(id: string): Observable<API_HOST[]> {
		const url = `${this.getters.api_get_host_for_dealer}${id}`;
		return this.getRequest(url);
	}

	get_host_by_id(id: string): Observable<{
		message?: string;
		host?: API_HOST;
		hostTags?: TAG[];
		dealer?: API_DEALER;
		dealerTags?: TAG[];
		timezone?: API_TIMEZONE;
		fieldGroups?: any[];
		createdBy?: any[];
	}> {
		const url = `${this.getters.api_get_host_by_id}${id}`;
		return this.getRequest(url);
	}

	get_host_report(data: any) {
		const url = `${this.getters.api_get_host_report}`;
		return this.postRequest(url, data);
	}

	update_single_host(data: any) {
		const url = `${this.updaters.api_update_host}`;
		return this.postRequest(url, data);
	}

	get_time_zones(): Observable<API_TIMEZONE[]> {
		const url = `${this.getters.api_get_timezone}`;
		return this.getRequest(url);
	}

	get_host_place_images(placeId: string): Observable<{ images: string[] }> {
		const url = `${this.getters.host_place_images}?placeId=${placeId}`;
		return this.getRequest(url);
	}

	get_host_via_dma(rank: number, code: string, name: string): Observable<{ paging: PAGING }> {
		const url = `${this.getters.api_get_dma_hosts}?dmaRank=${rank}&dmaCode=${code}&dmaName=${encodeURIComponent(name)}&pageSize=0`;
		return this.getRequest(url);
	}

	get_host_total() {
		const url = `${this.getters.api_get_host_total}`;
		return this.getRequest(url);
	}

	get_host_total_per_dealer(id: string) {
		const url = `${this.getters.api_get_host_total_per_dealer}${id}`;
		return this.getRequest(url);
	}

	get_fields() {
		const url = `${this.getters.api_get_host_fields}`;
		return this.getRequest(url);
	}

	get_field_by_id(id: string) {
		const url = `${this.getters.api_get_host_field_by_id}${id}`;
		return this.getRequest(url);
	}

	update_file_alias(id: string, alias: string) {
		const url = this.updaters.host_file_alias;
		const body = { id, alias };
		return this.postRequest(url, body);
	}

	upload_s3_files(body: HOST_S3_FILE) {
		const url = this.creators.host_s3_files;
		return this.postRequest(url, body);
	}

	validate_url(url: string) {
		const pattern = new RegExp(
			'^([a-zA-Z]+:\\/\\/)?' +
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
				'((\\d{1,3}\\.){3}\\d{1,3}))' +
				'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
				'(\\?[;&a-z\\d%_.~+=-]*)?' +
				'(\\#[-a-z\\d_]*)?$',
			'i'
		);
		return pattern.test(url);
	}
}
