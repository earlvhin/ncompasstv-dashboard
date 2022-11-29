import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpParameterCodec } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as moment from 'moment';

import { environment } from 'src/environments/environment';

import {
	API_DEALER_LICENSE,
	API_FILTERS,
	API_INSTALLATION_STATS,
	API_LICENSE,
	API_LICENSE_MONTHLY_STAT,
	API_LICENSE_PROPS,
	LICENSE_TOTAL_STATISTICS,
	PAGING
} from 'src/app/global/models';

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
export class LicenseService {
	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' })
	};

	onSortLicenseByColumn = new EventEmitter<{ column: string; order: string }>();
	onRefreshLicensesTab = new EventEmitter<void>();
	httpParams = (params: object) => new HttpParams({ encoder: new CustomHttpParamEncoder(), fromObject: { ...params } });

	constructor(private _http: HttpClient) {}

	api_get_licenses_total_by_host_dealer(dealerId: string, hostId: string) {
		const base = `${this.baseUri}${this.getters.api_get_licenses_total}`;
		const endpoint = `${base}?dealerid=${dealerId}&hostid=${hostId}`;
		return this._http.get<LICENSE_TOTAL_STATISTICS>(endpoint, this.httpOptions);
	}

	get_all_licenses(
		page: number,
		key: string,
		column: string,
		order: string,
		pageSize: number,
		adminLicenses: boolean,
		status?: string,
		daysOffline?: string,
		activated?: boolean,
		recent?: string,
		zone?: string,
		dealer?: string,
		host?: string,
		assigned?: string,
		pending?: string,
		online?: string,
		isActivated?
	): Observable<{ licenses?: API_LICENSE['license'][]; paging?: PAGING; message?: string }> {
		const params = this.httpParams({
			page,
			search: key,
			sortColumn: column,
			sortOrder: order,
			pageSize,
			includeAdmin: adminLicenses,
			piStatus: status,
			daysOffline: daysOffline,
			active: activated,
			daysInstalled: recent,
			timezone: zone,
			dealerId: dealer,
			hostId: host,
			assigned,
			pending,
			online,
			isActivated
		});
		return this._http.get<{ licenses?: API_LICENSE['license'][]; paging?: PAGING; message?: string }>(
			`${this.baseUri}${this.getters.api_get_licenses}`,
			{ ...this.httpOptions, params }
		);
	}

	get_all_licenses_fetch(
		page: number,
		key: string,
		column: string,
		order: string,
		pageSize: number,
		adminLicenses: boolean,
		status?: string,
		daysOffline?: string,
		activated?: boolean,
		recent?: string,
		zone?: string,
		dealer?: string,
		host?: string,
		assigned?: string,
		pending?: string,
		online?: string,
		isActivated?
	): Observable<{ licenses?: API_LICENSE['license'][]; paging?: PAGING; message?: string }> {
		const params = this.httpParams({
			page,
			search: key,
			sortColumn: column,
			sortOrder: order,
			pageSize,
			includeAdmin: adminLicenses,
			piStatus: status,
			daysOffline: daysOffline,
			active: activated,
			daysInstalled: recent,
			timezone: zone,
			dealerId: dealer,
			hostId: host,
			assigned,
			pending,
			online,
			isActivated
		});
		return this._http.get<{ licenses?: API_LICENSE['license'][]; paging?: PAGING; message?: string }>(
			`${this.baseUri}${this.getters.api_get_licenses_fetch}`,
			{ ...this.httpOptions, params }
		);
	}

	get_all_licenses_duration(
		page: number,
		key: string,
		column: string,
		order: string,
		pageSize: number,
		adminLicenses: boolean,
		status?: string,
		daysOffline?: string,
		activated?,
		recent?: string,
		zone?: string,
		dealer?: string,
		host?: string,
		assigned?: string,
		pending?: string,
		online?: string,
		isActivated?
	): Observable<{ licenses?: API_LICENSE['license'][]; paging?: PAGING; message?: string }> {
		const params = this.httpParams({
			page,
			search: key,
			sortColumn: column,
			sortOrder: order,
			pageSize,
			includeAdmin: adminLicenses,
			piStatus: status,
			daysOffline: daysOffline,
			active: activated,
			daysInstalled: recent,
			timezone: zone,
			dealerId: dealer,
			hostId: host,
			assigned,
			pending,
			online,
			isActivated
		});
		return this._http.get<{ licenses?: API_LICENSE['license'][]; paging?: PAGING; message?: string }>(
			`${this.baseUri}${this.getters.api_get_licenses_all_duration}`,
			{ ...this.httpOptions, params }
		);
	}

	get_all_licenses_duration_clone(
		page: number,
		key: string,
		column: string,
		order: string,
		pageSize: number,
		adminLicenses: boolean,
		status?: string,
		daysOffline?: string,
		activated?,
		recent?: string,
		zone?: string,
		dealer?: string,
		host?: string
	): Observable<{ licenses?: API_LICENSE['license'][]; paging?: PAGING; message?: string }> {
		const params = this.httpParams({
			page,
			search: key,
			sortColumn: column,
			sortOrder: order,
			pageSize,
			includeAdmin: adminLicenses,
			piStatus: status,
			daysOffline: daysOffline,
			active: activated,
			daysInstalled: recent,
			timezone: zone,
			dealerId: dealer,
			hostId: host
		});
		return this._http.get<{ licenses?: API_LICENSE['license'][]; paging?: PAGING; message?: string }>(
			`${this.baseUri}${this.getters.api_get_licenses_all_duration_clone}`,
			{ ...this.httpOptions, params }
		);
	}

	get_by_tags(filters: API_FILTERS, enforceTagSearchKey = false) {
		let baseUrl = `${this.baseUri}${this.getters.license_by_tags}`;
		let params = this.setUrlParams(filters, enforceTagSearchKey);
		const url = `${baseUrl}${params}`;
		return this._http.get<{ licenses: API_LICENSE['license'][]; paging: PAGING }>(url, this.httpOptions);
	}

	get_installations(filters: API_FILTERS, type = 'default'): Observable<{ paging?: PAGING; message?: string }> {
		let endpoint = this.baseUri;

		switch (type) {
			case 'next-week':
				endpoint += this.getters.next_week_installations;
				break;

			case 'next-month':
				endpoint += this.getters.next_month_installations;
				break;

			case 'recent':
				endpoint += this.getters.recent_installations;
				break;

			case 'upcoming':
				endpoint += this.getters.upcoming_installations;
				break;

			default:
				endpoint += this.getters.all_license_by_install_date;
		}

		const params = this.setUrlParams(filters);
		const url = `${endpoint}${params}`;
		return this._http.get(url, this.httpOptions);
	}

	get_licenses_total() {
		return this._http.get<any>(`${this.baseUri}${this.getters.api_get_licenses_total}`, this.httpOptions);
	}

	get_licenses_statistics(dealerId?: string, startDate?: string, endDate?: string) {
		const base = `${this.baseUri}${this.getters.api_get_licenses_statistics}`;
		const endpoint = `${base}?dealerid=${dealerId}&startdate=${startDate}&enddate=${endDate}`;
		return this._http.get<{ licenses?: API_LICENSE_MONTHLY_STAT[]; message?: string }>(endpoint, this.httpOptions);
	}

	get_licenses_installation_statistics(dealerId?: string, startDate?: string, endDate?: string) {
		const url = `${this.baseUri}${this.getters.api_get_licenses_installation_statistics}?dealerid=${dealerId}&startdate=${startDate}&enddate=${endDate}`;

		return this._http.get<any>(url, this.httpOptions);
	}

	get_licenses_installation_statistics_detailed(dealerId?: string, startDate?: string, endDate?: string) {
		const url = `${this.baseUri}${this.getters.api_get_licenses_installation_statistics_detailed}?dealerid=${dealerId}&startdate=${startDate}&enddate=${endDate}`;

		return this._http.get<any>(url, this.httpOptions);
	}

	get_licenses_total_by_dealer(id: string) {
		return this._http.get<any>(`${this.baseUri}${this.getters.api_get_licenses_total_by_dealer}${id}`, this.httpOptions);
	}

	get_license_by_dealer_id(dealerId: string, page: number, search?: string, arrangement?: any, pageSize = 15, pending?: any) {
		const base = `${this.baseUri}${this.getters.api_get_licenses_by_dealer}`;
		const params = this.setUrlParams({ dealerId, page, search, arrangement, pageSize, pending });
		const url = `${base}${params}`;
		return this._http.get<{ paging?: PAGING; message?: string }>(url, this.httpOptions);
	}

	get_license_by_screen_id(id: string, page: number) {
		const params = this.httpParams({ screenId: id, page });
		return this._http.get<{ paging?: PAGING; message?: string }>(`${this.baseUri}${this.getters.api_get_licenses_by_screen}`, {
			...this.httpOptions,
			params
		});
	}

	/**
	 * @description Search licenses of a specific host
	 * @params hostId, search, page
	 * @returns Observable<API_LICENSE['license'][] | { message: string }>
	 */
	search_license_by_host(hostId: string, search: string, page = 1) {
		const base = `${this.baseUri}${this.getters.search_license_by_host}`;
		const params = this.setUrlParams({ hostId, search, page });
		const url = `${base}${params}`;
		return this._http.get<{ licenses?: API_LICENSE['license'][]; paging?: PAGING; message?: string }>(url);
	}

	sort_license_by_dealer_id(
		id,
		page,
		key,
		column,
		order,
		pageSize = 15,
		status?,
		daysOffline?,
		activated?,
		recent?,
		zone?,
		host?,
		assigned?,
		pending?,
		online?,
		isActivated?
	) {
		const base = `${this.baseUri}${this.getters.api_get_licenses_by_dealer}`;
		const filters = {
			dealerId: id,
			page,
			search: key,
			sortColumn: column,
			sortOrder: order,
			pageSize,
			piStatus: status,
			daysOffline,
			active: activated,
			daysInstalled: recent,
			timezone: zone,
			hostId: host,
			assigned,
			pending,
			online,
			isActivated
		};
		const params = this.setUrlParams(filters, false, true);
		const url = `${base}${params}`;
		return this._http.get<any>(url);
	}

	get_licenses_by_host_id(id: string): Observable<API_LICENSE_PROPS[] | { message: string }> {
		return this._http.get<API_LICENSE_PROPS[] | { message: string }>(
			`${this.baseUri}${this.getters.api_get_licenses_by_host}${id}`,
			this.httpOptions
		);
	}

	get_license_by_id(id: string) {
		return this._http.get<API_LICENSE>(`${this.baseUri}${this.getters.api_get_licenses_by_id}${id}`, this.httpOptions);
	}

	get_license_report(data) {
		return this._http.post<any>(`${this.baseUri}${this.getters.api_get_license_report}`, data, this.httpOptions);
	}

	get_dealer_licenses_to_export(id: string): Observable<{ licenses?: API_LICENSE_PROPS[]; message?: string }> {
		const url = `${this.baseUri}${this.getters.export_dealer_licenses}?dealerid=${id}`;
		return this._http.get(url, this.httpOptions);
	}

	get_license_to_export_duration(
		id: string,
		key: string,
		column: string,
		order: string,
		pageSize?: number,
		status?: string,
		daysOffline?,
		activated?,
		recent?,
		zone?,
		host?,
		assigned?,
		pending?,
		online?,
		isActivated?
	) {
		const params = this.httpParams({
			dealerId: id,
			page: 1,
			search: key,
			sortColumn: column,
			sortOrder: order,
			pageSize,
			piStatus: status,
			daysOffline: daysOffline,
			active: activated,
			daysInstalled: recent,
			timezone: zone,
			hostId: host,
			assigned,
			pending,
			online,
			isActivated
		});
		return this._http.get<any>(`${this.baseUri}${this.getters.api_get_licenses_duration}`, { ...this.httpOptions, params });
	}

	get_license_total_per_dealer(id: string) {
		return this._http.get<any>(`${this.baseUri}${this.getters.api_get_licenses_total_by_dealer}${id}`, this.httpOptions);
	}

	get_ad_licenses_total() {
		return this._http.get<any>(`${this.baseUri}${this.getters.api_get_ad_licenses_total}`, this.httpOptions);
	}

	get_ad_licenses_total_by_dealer(id: string) {
		return this._http.get<any>(`${this.baseUri}${this.getters.api_get_ad_licenses_total_by_dealer}${id}`, this.httpOptions);
	}

	get_installation_statistics(date: string = null): Observable<{ licenseInstallationStats: API_INSTALLATION_STATS }> {
		if (!date) date = moment().format('MM-DD-YYYY');
		const base = `${this.baseUri}${this.getters.license_installation_statistics}`;
		const url = `${base}?installDate=${date}`;
		return this._http.get<{ licenseInstallationStats: API_INSTALLATION_STATS }>(url);
	}

	get_statistics_by_dealer(id: string) {
		return this._http.get<any>(`${this.baseUri}${this.getters.license_statistics}?dealerId=${id}`, this.httpOptions);
	}

	get_statistics_by_installation(date: string) {
		const url = `${this.baseUri}${this.getters.license_statistics_by_install_date}${date}`;
		return this._http.get<any>(url, this.httpOptions);
	}

	activate_license(licenseKey: string) {
		return this._http.post(`${this.baseUri}${this.updaters.api_activate_license}${licenseKey}`, null, this.httpOptions);
	}

	deactivate_license(licenseKey: string) {
		return this._http.post(`${this.baseUri}${this.updaters.api_deactivate_license}${licenseKey}`, null, this.httpOptions);
	}

	assign_licenses_to_host(data) {
		return this._http.post(`${this.baseUri}${this.updaters.api_assign_license_to_host}`, data, this.httpOptions);
	}

	generate_license(dealerId: string, count: string) {
		return this._http.post(`${this.baseUri}${this.creators.api_new_license}dealerId=${dealerId}&licensecount=${count}`, null, this.httpOptions);
	}

	get_screenshots(licenseId: string) {
		return this._http.get(`${this.baseUri}${this.getters.api_get_screenshots}${licenseId}`, this.httpOptions).map((data: any) => data.files);
	}

	search_license(keyword = ''): Observable<{ licenses: API_DEALER_LICENSE[] }> {
		const url = `${this.baseUri}${this.getters.search_license}${keyword}`;
		return this._http.get<{ licenses: API_DEALER_LICENSE[] }>(url, this.httpOptions);
	}

	update_alias(data) {
		return this._http.post(`${this.baseUri}${this.updaters.api_update_alias}`, data, this.httpOptions);
	}

	update_cec_status(body: { licenseId: string; status: number }) {
		const url = `${this.baseUri}${this.updaters.license_cec_status}`;
		return this._http.post(url, body);
	}

	/**
	 *  Updates the license's boot delay
	 * 	@param data: {licenseId: string, bootDelayDuration: number}
	 */
	update_license_boot_delay(data: { licenseId: string; bootDelay: number }) {
		return this._http.post(`${this.baseUri}${this.updaters.api_update_license_boot_delay}`, data, this.httpOptions);
	}

	update_license_reboot_time(data: { rebootTime: { rebootTime: string }[]; licenseId: string }) {
		const body = {
			rebootTime: JSON.stringify(data.rebootTime),
			licenseId: data.licenseId
		};

		const url = `${this.baseUri}${this.updaters.license_reboot_time}`;
		return this._http.post(url, body);
	}

	/**
	 *  Updates the license installation date
	 *
	 * 	@param licenseId: string
	 * 	@param installDate: string = '03/05/2021'
	 */
	update_install_date(licenseId: string, installDate: string): Observable<any> {
		const data = { licenseId, installDate };

		const options = {
			headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' }),
			responseType: 'text' as 'json'
		};

		return this._http.post(`${this.baseUri}${this.updaters.install_date}`, data, options);
	}

	/**
	 *  Updates the installation date on multiple licenses
	 *
	 * 	@param data: { licenseId: string, installDate: string }[]
	 */
	update_install_date_list(data: { licenseId: string; installDate: string }[]): Observable<any> {
		const options = {
			headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' }),
			responseType: 'text' as 'json'
		};

		return this._http.post(`${this.baseUri}${this.updaters.install_date_list}`, data, options);
	}

	/**
	 * @description: Update the Display Status of the License
	 * @param data: {licenseId:string, displayStatus: number}
	 * @returns: Observable of ANY
	 */
	update_display_status(data: { licenseId: string; displayStatus: number }): Observable<any> {
		return this._http.post(`${this.baseUri}${this.updaters.api_display_status}`, data, this.httpOptions);
	}

	update_notification_settings(body: { licenseId: string; notificationSettings?: number; emailSettings?: number }) {
		const url = `${this.baseUri}${this.updaters.license_notification_settings}`;
		return this._http.post(url, body);
	}

	delete_screenshots(licenseId: string) {
		return this._http.get(`${this.baseUri}${this.deleters.api_remove_screenshots}${licenseId}`, this.httpOptions);
	}

	delete_license(to_delete) {
		return this._http.post<any>(`${this.baseUri}${this.deleters.api_remove_license}`, to_delete, this.httpOptions);
	}

	unassign_host_license(licenses) {
		return this._http.post<any>(`${this.baseUri}${this.deleters.api_remove_host_licenses}`, licenses, this.httpOptions);
	}

	get_license_by_dealear_old(dealerId: string) {
		return this._http.get<any>(`${this.baseUri}${this.getters.api_get_license_by_dealer_temp}${dealerId}`, this.httpOptions);
	}

	/**
	 * @description: Get Resource Usage By License
	 * @param license: string
	 */
	get_license_resource(license: string) {
		return this._http.get<any>(`${this.baseUri}${this.getters.api_get_resource_logs}${license}`, this.httpOptions);
	}

	/**
	 * @description: Get Resource Usage By License Id and Date
	 * @param license: string
	 */
	get_license_resource_logs(licenseId: string, date: string) {
		return this._http.get<any>(
			`${this.baseUri}${this.getters.api_get_resource_logs_by_date}${licenseId}&selectedDate=${date}&page=1&pageSize=30`,
			this.httpOptions
		);
	}

	/**
	 * @description: Get All Activities
	 * @param license
	 * @returns array of activities
	 */
	get_activities(id: string) {
		const url = `${this.baseUri}${this.getters.api_get_activities_by_license_id}${id}`;
		return this._http.get<{ paging: PAGING }>(url, this.httpOptions);
	}

	/**
	 * @description: Save User Dashboard Activities
	 * @param activity
	 * @returns: Observable of ANY
	 */
	save_activity(data: { licenseId: string; activityCode: string; initiatedBy: string }) {
		const url = `${this.baseUri}${this.creators.api_save_activity}`;
		return this._http.post<any>(url, data, this.httpOptions);
	}

	/**
	 * @description: Update Internet Information of License ID
	 * @param data - LicenseID, InternetInfo Data
	 */
	update_internet_info(data) {
		return this._http.post<any>(`${this.baseUri}${this.updaters.api_update_internet_info}`, data, this.httpOptions);
	}

	set_screenshot_status(data: { licenseId: string; screenshotSettings: number }) {
		const url = `${this.baseUri}${this.updaters.api_update_screenshot_settings}`;
		return this._http.post<any>(url, data, this.httpOptions);
	}

	set_speedtest_status(data: { licenseId: string; speedtestSettings: number }) {
		const url = `${this.baseUri}${this.updaters.api_update_speedtest_settings}`;
		return this._http.post<any>(url, data, this.httpOptions);
	}

	set_resource_status(data: { licenseId: string; resourceSettings: number }) {
		const url = `${this.baseUri}${this.updaters.api_update_resource_settings}`;
		return this._http.post<any>(url, data, this.httpOptions);
	}

	set_tvdisplay_status(data: { licenseId: string; tvdisplaySettings: number }) {
		const url = `${this.baseUri}${this.updaters.api_update_tvdisplay_settings}`;
		return this._http.post<any>(url, data, this.httpOptions);
	}

	create_installation_checklist_title(data: any) {
		const url = `${this.baseUri}${this.creators.api_installation_checklist_title_add}`;
		return this._http.post<any>(url, data, this.httpOptions);
	}

	update_installation_checklist_title(data: any) {
		const url = `${this.baseUri}${this.updaters.api_checklist_title_update}`;
		return this._http.post<any>(url, data, this.httpOptions);
	}

	update_installation_checklist_item(data: any) {
		const url = `${this.baseUri}${this.updaters.api_checklist_item_update}`;
		return this._http.post<any>(url, data, this.httpOptions);
	}

	add_installation_checklist_items(data: any) {
		const url = `${this.baseUri}${this.creators.api_installation_checklist_items_add}`;
		return this._http.post<any>(url, data, this.httpOptions);
	}

	get_checklist() {
		const url = `${this.baseUri}${this.getters.api_get_checklist}`;
		return this._http.get<any>(url, this.httpOptions);
	}

	get_checklist_titles() {
		const url = `${this.baseUri}${this.getters.api_get_checklist_titles}`;
		return this._http.get<any>(url, this.httpOptions);
	}

	get_checklist_by_license_id(id: string) {
		const url = `${this.baseUri}${this.getters.api_get_checklist_by_license_id}${id}`;
		return this._http.get<any>(url, this.httpOptions);
	}

	update_list_checking(data) {
		const url = `${this.baseUri}${this.updaters.api_checklist_check_update}`;
		return this._http.post<any>(url, data, this.httpOptions);
	}

	delete_checklist_id(id: string) {
		const url = `${this.baseUri}${this.deleters.api_remove_checklist_title}${id}`;
		return this._http.post(url, this.httpOptions);
	}

	delete_checklist_items(data) {
		const url = `${this.baseUri}${this.deleters.api_remove_checklist_items}`;
		return this._http.post(url, data, this.httpOptions);
	}

	update_reboot_time(body: { licenseId: string; rebootTime: string }) {
		const url = `${this.baseUri}${this.updaters.license_reboot_time}`;
		return this._http.post(url, body);
	}

	protected setUrlParams(filters: any, enforceTagSearchKey = false, allowBlanks = true) {
		let result = '';
		Object.keys(filters).forEach((key) => {
			if (!allowBlanks && (typeof filters[key] === 'undefined' || !filters[key])) return;
			if (!result.includes('?')) result += `?${key}=`;
			else result += `&${key}=`;
			if (
				enforceTagSearchKey &&
				key === 'search' &&
				filters['search'] &&
				filters['search'].trim().length > 1 &&
				!filters['search'].startsWith('#')
			)
				filters['search'] = `#${filters['search']}`;
			if (typeof filters[key] === 'string' && filters[key].includes('#')) result += encodeURIComponent(filters[key]);
			else result += filters[key];
		});
		return result;
	}

	protected get baseUri() {
		return environment.base_uri;
	}

	protected get creators() {
		return environment.create;
	}

	protected get getters() {
		return environment.getters;
	}

	protected get updaters() {
		return environment.update;
	}

	protected get deleters() {
		return environment.delete;
	}
}
