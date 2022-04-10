import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpParameterCodec } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as moment from 'moment';

import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { API_FILTERS, API_INSTALLATION_STATS, API_LICENSE, API_LICENSE_PROPS, LICENSE_TOTAL_STATISTICS, PAGING } from 'src/app/global/models';

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
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`},
		),
	};

	onSortLicenseByColumn = new EventEmitter<{ column: string, order: string }>();
	onRefreshLicensesTab = new EventEmitter<void>();
	httpParams = (params: object) => new HttpParams({ encoder: new CustomHttpParamEncoder(), fromObject: { ...params } })
	
	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }

	api_get_licenses_total_by_host_dealer(dealerId: string, hostId: string) {
		const base = `${this.baseUri}${this.getters.api_get_licenses_total}`;
		const endpoint = `${base}?dealerid=${dealerId}&hostid=${hostId}`;
		return this._http.get<LICENSE_TOTAL_STATISTICS>(endpoint, this.httpOptions);
	} 

	get_all_licenses(page: number, key: string, column: string, order: string, pageSize: number, adminLicenses: boolean, status?: string, daysOffline?: string, activated?: boolean, recent?:string, zone?: string, dealer?: string, host?: string, assigned?: string, pending?:string, online?: string, isActivated?): Observable<{ licenses?: API_LICENSE['license'][], paging?: PAGING, message?: string }> {
        const params = this.httpParams({ page, search: key, sortColumn: column, sortOrder: order, pageSize, includeAdmin: adminLicenses, piStatus: status, daysOffline: daysOffline, active: activated,  daysInstalled: recent, timezone: zone, dealerId: dealer, hostId:host, assigned, pending, online, isActivated })
		return this._http.get<{ licenses?: API_LICENSE['license'][], paging?: PAGING, message?: string }>(`${environment.base_uri}${environment.getters.api_get_licenses}`, { ...this.httpOptions, params });
	}
	
    get_all_licenses_duration(page: number, key: string, column: string, order: string, pageSize: number, adminLicenses: boolean, status?: string, daysOffline?: string, activated?, recent?:string, zone?: string, dealer?: string, host?: string, assigned?: string, pending?:string, online?: string, isActivated?): Observable<{ licenses?: API_LICENSE['license'][], paging?: PAGING, message?: string }> {
        const params = this.httpParams({ page, search: key, sortColumn: column, sortOrder: order, pageSize,includeAdmin: adminLicenses, piStatus: status, daysOffline: daysOffline, active:activated, daysInstalled: recent, timezone: zone, dealerId: dealer, hostId:host, assigned, pending, online, isActivated })
		return this._http.get<{ licenses?: API_LICENSE['license'][], paging?: PAGING, message?: string }>(`${environment.base_uri}${environment.getters.api_get_licenses_all_duration}`, { ...this.httpOptions, params });
	}
    
    get_all_licenses_duration_clone(page: number, key: string, column: string, order: string, pageSize: number, adminLicenses: boolean, status?: string, daysOffline?: string, activated?, recent?:string, zone?: string, dealer?: string, host?: string): Observable<{ licenses?: API_LICENSE['license'][], paging?: PAGING, message?: string }> {
        const params = this.httpParams({ page, search: key, sortColumn: column, sortOrder: order, pageSize,includeAdmin: adminLicenses, piStatus: status, daysOffline: daysOffline, active:activated, daysInstalled: recent, timezone: zone, dealerId: dealer, hostId:host })
		return this._http.get<{ licenses?: API_LICENSE['license'][], paging?: PAGING, message?: string }>(`${environment.base_uri}${environment.getters.api_get_licenses_all_duration_clone}`, { ...this.httpOptions, params });
	}

	get_by_tags(filters: API_FILTERS, enforceTagSearchKey = false) {
		let baseUrl = `${this.baseUri}${this.getters.license_by_tags}`;
		let params = this.setUrlParams(filters, enforceTagSearchKey);
		const url = `${baseUrl}${params}`;
		return this._http.get<{ licenses: API_LICENSE['license'][], paging: PAGING }>(url, this.httpOptions);
	}

	get_installations(filters: API_FILTERS, type = 'default'): Observable<{ paging?: PAGING, message?: string }>{
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
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_total}`, this.httpOptions);
	}

    get_licenses_statistics(dealer?, startDate?, endDate?) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_statistics}`+'?dealerid='+`${dealer}`+'&startdate='+`${startDate}`+'&enddate='+`${endDate}`, this.httpOptions);
	}
    
    get_licenses_installation_statistics(dealer?, startDate?, endDate?) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_installation_statistics}`+'?dealerid='+`${dealer}`+'&startdate='+`${startDate}`+'&enddate='+`${endDate}`, this.httpOptions);
	}
	
    get_licenses_installation_statistics_detailed(dealer?, startDate?, endDate?) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_installation_statistics_detailed}`+'?dealerid='+`${dealer}`+'&startdate='+`${startDate}`+'&enddate='+`${endDate}`, this.httpOptions);
	}

	get_licenses_total_by_dealer(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_total_by_dealer}${id}`, this.httpOptions);
	}
	
	get_license_by_dealer_id(dealerId: string, page: number, search?: string, arrangement?: any, pageSize = 15) {
		const base = `${environment.base_uri_old}${environment.getters.api_get_licenses_by_dealer}`;
		const params = this.setUrlParams({ dealerId, page, search, arrangement, pageSize });
		const url = `${base}${params}`;
		return this._http.get<any>(url, this.httpOptions);
	}
	
    get_license_by_screen_id(id: string, page: number) {
		const params = this.httpParams({ screenId: id, page });
		return this._http.get<{ paging?: PAGING, message?: string }>(`${environment.base_uri}${environment.getters.api_get_licenses_by_screen}`, { ...this.httpOptions, params });
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
		return this._http.get<{ licenses?: API_LICENSE['license'][], paging?: PAGING, message?: string }>(url);
	}

	sort_license_by_dealer_id(id, page, key, column, order, pageSize=15, status?, daysOffline?, activated?, recent?, zone?, host?, assigned?, pending?, online?, isActivated?) {
		const base = `${environment.base_uri_old}${environment.getters.api_get_licenses_by_dealer}`;
		const filters = { dealerId: id,page, search: key, sortColumn: column, sortOrder: order, pageSize, piStatus: status, daysOffline, active: activated, daysInstalled: recent, timezone: zone, hostId: host, assigned, pending, online, isActivated };
		const params = this.setUrlParams(filters, false, false);
		const url = `${base}${params}`;
		return this._http.get<any>(url);
	}

	get_licenses_by_host_id(id: string): Observable<API_LICENSE_PROPS[] | { message: string }> {
		return this._http.get<API_LICENSE_PROPS[] | { message: string }>(`${environment.base_uri}${environment.getters.api_get_licenses_by_host}${id}`, this.httpOptions);
	}

	get_license_by_id(id) {
		return this._http.get<API_LICENSE>(`${environment.base_uri}${environment.getters.api_get_licenses_by_id}${id}`, this.httpOptions);
	}

	get_license_report(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_license_report}`, data, this.httpOptions);
	}

	get_license_to_export(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.export_dealer_licenses}${id}`, this.httpOptions);
	}
	

    get_license_to_export_duration(id: string, key: string, column: string, order: string, pageSize?: number, status?: string, daysOffline?, activated?, recent?, zone?, host?, assigned?, pending?, online?, isActivated?) {
        const params = this.httpParams({ dealerId: id, page:1, search: key, sortColumn: column, sortOrder: order, pageSize, piStatus: status, daysOffline: daysOffline, active:activated, daysInstalled: recent, timezone: zone, hostId:host, assigned, pending, online, isActivated })
		return this._http.get<any>(`${environment.base_uri_old}${environment.getters.api_get_licenses_duration}`, { ...this.httpOptions, params });
		// return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_duration}${id}`, this.httpOptions);
	}

	get_license_total_per_dealer(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_licenses_total_by_dealer}${id}`, this.httpOptions)
	}

	get_ad_licenses_total() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_ad_licenses_total}`, this.httpOptions);
	}

	get_ad_licenses_total_by_dealer(id: string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_ad_licenses_total_by_dealer}${id}`, this.httpOptions);
	}

	get_installation_statistics(date: string = null): Observable<{ licenseInstallationStats: API_INSTALLATION_STATS }> {
		if (!date) date = moment().format('MM-DD-YYYY');
		const base = `${this.baseUri}${this.getters.license_installation_statistics}`;
		const url = `${base}?installDate=${date}`;
		return this._http.get<{ licenseInstallationStats: API_INSTALLATION_STATS }>(url);
	}

	get_statistics_by_dealer(id: string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.license_statistics}?dealerId=${id}`, this.httpOptions)
	}

	get_statistics_by_installation(date: string) {
		const url = `${environment.base_uri}${environment.getters.license_statistics_by_install_date}${date}`;
		return this._http.get<any>(url, this.httpOptions);
	}

	activate_license(id) {
		return this._http.post(`${environment.base_uri}${environment.update.api_activate_license}${id}`, null, this.httpOptions);
	}

	deactivate_license(id) {
		return this._http.post(`${environment.base_uri}${environment.update.api_deactivate_license}${id}`, null, this.httpOptions);
	}

	assign_licenses_to_host(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_assign_license_to_host}`, data, this.httpOptions);
	}

	generate_license(id, count) {
		return this._http.post(`${environment.base_uri}${environment.create.api_new_license}dealerId=${id}&licensecount=${count}`, null, this.httpOptions);
	}

	get_screenshots(id) {
		return this._http.get(`${environment.base_uri_old}${environment.getters.api_get_screenshots}${id}`, this.httpOptions).map( (data: any) => data.files );
	}

	search_license(keyword = '') {
		const url = `${this.baseUri}${this.getters.search_license}${keyword}`;
		return this._http.get(url, this.httpOptions);
	}
	
	update_alias(data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_alias}`, data, this.httpOptions);
	}

	/**
	 *  Updates the license's boot delay
	 * 	@param data: {licenseId: string, bootDelayDuration: number}
	*/
	update_license_boot_delay(data: {licenseId: string, bootDelay: number}) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_license_boot_delay}`, data, this.httpOptions);
	}

	update_license_reboot_time(body: any) {
		const url = `${this.baseUri}${environment.update.license_reboot_time}`;
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
			headers: new HttpHeaders({ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`}),
			responseType: 'text' as 'json'
		};

		return this._http.post(`${environment.base_uri}${environment.update.install_date}`, data, options);
	}

	/**
	 *  Updates the installation date on multiple licenses
	 * 	
	 * 	@param data: { licenseId: string, installDate: string }[]
	 */
	update_install_date_list(data: { licenseId: string, installDate: string }[]): Observable<any> {

		const options = {
			headers: new HttpHeaders({ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`}),
			responseType: 'text' as 'json'
		};

		return this._http.post(`${environment.base_uri}${environment.update.install_date_list}`, data, options);
	}

	/**
	 * @description: Update the Display Status of the License
	 * @param data: {licenseId:string, displayStatus: number}
	 * @returns: Observable of ANY
	 */
	update_display_status(data: {licenseId: string, displayStatus: number}): Observable<any> {
		return this._http.post(`${environment.base_uri}${environment.update.api_display_status}`, data, this.httpOptions);
	}

	update_notification_settings(body: { licenseId: string, notificationSettings?: number, emailSettings?: number }) {
		const url = `${this.baseUri}${environment.update.license_notification_settings}`;
		return this._http.post(url, body);
	}

	delete_screenshots(id) {
		return this._http.get(`${environment.base_uri_old}${environment.delete.api_remove_screenshots}${id}`, this.httpOptions);
	}
	
	delete_license(to_delete) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_license}`, to_delete, this.httpOptions);
	}

	unassign_host_license(licenses, force?) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_host_licenses}`, licenses, this.httpOptions);
	}

	get_license_by_dealear_old(dealer) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_license_by_dealer_temp}${dealer}`, this.httpOptions);
	}

	/**
	 * @description: Get Resource Usage By License
	 * @param license: string
	 */
	get_license_resource(license: string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_resource_logs}${license}`, this.httpOptions);
	}

	/**
	 * @description: Get Resource Usage By License Id and Date
	 * @param license: string
	 */
	get_license_resource_logs(license: string, date: string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_resource_logs_by_date}${license}&selectedDate=${date}&page=1&pageSize=30`, this.httpOptions);
	}

	/**
	 * @description: Get All Activities
	 * @param license
	 * @returns array of activities
	 */
	get_activities(id: string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_activities_by_license_id}${id}`, this.httpOptions);
	}
	
	/**
	 * @description: Save User Dashboard Activities
	 * @param activity
	 * @returns: Observable of ANY
	 */
	save_activity(activity) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_save_activity}`, activity, this.httpOptions);
	}

	/**
	 * @description: Update Internet Information of License ID
	 * @param data - LicenseID, InternetInfo Data 
	*/
	update_internet_info(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.update.api_update_internet_info}`, data, this.httpOptions);
	}

	set_screenshot_status(data: any) {
		return this._http.post<any>(`${environment.base_uri}${environment.update.api_update_screenshot_settings}`, data, this.httpOptions);
	}

	set_speedtest_status(data: any) {
		return this._http.post<any>(`${environment.base_uri}${environment.update.api_update_speedtest_settings}`, data, this.httpOptions);
	}

	set_resource_status(data: any) {
		return this._http.post<any>(`${environment.base_uri}${environment.update.api_update_resource_settings}`, data, this.httpOptions);
	}

	set_tvdisplay_status(data: any) {
		return this._http.post<any>(`${environment.base_uri}${environment.update.api_update_tvdisplay_settings}`, data, this.httpOptions);
	}

	update_reboot_time(body: { licenseId: string, rebootTime: string }) {
		const url = `${environment.base_uri}${environment.update.license_reboot_time}`;
		return this._http.post(url, body);
	}

	protected setUrlParams(filters: API_FILTERS, enforceTagSearchKey = false, allowBlanks = false) {
        let result = '';
        Object.keys(filters).forEach(
            key => {
                if (!allowBlanks && (typeof filters[key] === 'undefined' || !filters[key])) return;
                if (!result.includes('?')) result += `?${key}=`;
                else result += `&${key}=`;
                if (enforceTagSearchKey && key === 'search' && filters['search'] && filters['search'].trim().length > 1 && !filters['search'].startsWith('#')) filters['search'] = `#${filters['search']}`;
                if (typeof filters[key] === 'string' && filters[key].includes('#')) result += encodeURIComponent(filters[key]); 
                else result += filters[key];
            }
        );
        return result
    }

	protected get baseUri() {
		return `${environment.base_uri}`;
	}

	protected get getters() {
		return environment.getters;
	}
}
