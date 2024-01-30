import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpParameterCodec } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import * as moment from 'moment';

import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';
import { API_FILTERS, API_INSTALLATION_STATS, API_LICENSE, API_SINGLE_LICENSE_PAGE, PAGING } from 'src/app/global/models';

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
export class LicenseService extends BaseService {
	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' })
	};

	onRefreshLicensesTab = new Subject<void>();
	httpParams = (params: object) => new HttpParams({ encoder: new CustomHttpParamEncoder(), fromObject: { ...params } });

	constructor(_auth: AuthService, _http: HttpClient) {
		super(_auth, _http);
	}

	api_get_licenses_total_by_host_dealer(dealerId: string, hostId: string) {
		const base = `${this.getters.api_get_licenses_total}`;
		const params = this.setUrlParams({ dealerId, hostId }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_all_licenses(
		page: number,
		key: string,
		column: string,
		order: string,
		pageSize: number,
		adminLicenses: boolean,
		status?: string,
		daysOfflineFrom?: string,
		daysOfflineTo?: string,
		activated?: boolean,
		recent?: string,
		zone?: string,
		dealer?: string,
		host?: string,
		assigned?: string,
		pending?: string,
		online?: string,
		isActivated?: string,
		isFavorite?: boolean
	) {
		const base = `${this.getters.api_get_licenses}`;
		const params = this.setUrlParams(
			{
				page,
				search: key,
				sortColumn: column,
				sortOrder: order,
				pageSize,
				includeAdmin: adminLicenses,
				piStatus: status,
				daysOfflineFrom: daysOfflineFrom,
				daysOfflineTo: daysOfflineTo,
				active: activated,
				daysInstalled: recent,
				timezone: zone,
				dealerId: dealer,
				hostId: host,
				assigned,
				pending,
				online,
				isActivated,
				isFavorite
			},
			false,
			true
		);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_all_licenses_fetch(
		page: number,
		key: string,
		column: string,
		order: string,
		pageSize: number,
		adminLicenses: boolean,
		status?: string,
		daysOfflineFrom?: string,
		daysOfflineTo?: string,
		activated?: boolean,
		recent?: string,
		zone?: string,
		dealer?: string,
		host?: string,
		assigned?: string,
		pending?: string,
		online?: string,
		isActivated?: string
	) {
		const base = `${this.getters.api_get_licenses_fetch}`;
		const params = this.setUrlParams(
			{
				page,
				search: key,
				sortColumn: column,
				sortOrder: order,
				pageSize,
				includeAdmin: adminLicenses,
				piStatus: status,
				daysOfflineFrom: daysOfflineFrom,
				daysOfflineTo: daysOfflineTo,
				active: activated,
				daysInstalled: recent,
				timezone: zone,
				dealerId: dealer,
				hostId: host,
				assigned,
				pending,
				online,
				isActivated
			},
			false,
			true
		);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_all_licenses_duration(
		page: number,
		key: string,
		column: string,
		order: string,
		pageSize: number,
		adminLicenses: boolean,
		status?: string,
		daysOfflineFrom?: string,
		daysOfflineTo?: string,
		activated?,
		recent?: string,
		zone?: string,
		dealer?: string,
		host?: string,
		assigned?: string,
		pending?: string,
		online?: string,
		isActivated?
	) {
		const base = `${this.getters.api_get_licenses_all_duration}`;
		const params = this.setUrlParams(
			{
				page,
				search: key,
				sortColumn: column,
				sortOrder: order,
				pageSize,
				includeAdmin: adminLicenses,
				piStatus: status,
				daysOfflineFrom: daysOfflineFrom,
				daysOfflineTo: daysOfflineTo,
				active: activated,
				daysInstalled: recent,
				timezone: zone,
				dealerId: dealer,
				hostId: host,
				assigned,
				pending,
				online,
				isActivated
			},
			false,
			true
		);
		const url = `${base}${params}`;
		return this.getRequest(url);
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
	) {
		const base = `${this.getters.api_get_licenses_all_duration_clone}`;
		const params = this.setUrlParams(
			{
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
			},
			false,
			true
		);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_by_tags(filters: API_FILTERS, enforceTagSearchKey = false) {
		const params = this.setUrlParams(filters, enforceTagSearchKey);
		const endpoint = `${this.getters.license_by_tags}${params}`;
		return this.getRequest(endpoint);
	}

	get_installations(filters: API_FILTERS, type = 'default') {
		let base = '';
		switch (type) {
			case 'next-week':
				base = this.getters.next_week_installations;
				break;

			case 'next-month':
				base = this.getters.next_month_installations;
				break;

			case 'recent':
				base = this.getters.recent_installations;
				break;

			case 'upcoming':
				base = this.getters.upcoming_installations;
				break;

			default:
				base = this.getters.all_license_by_install_date;
		}
		const params = this.setUrlParams(filters, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_licenses_total() {
		const base = `${this.getters.api_get_licenses_total}`;
		const url = `${base}`;
		return this.getRequest(url);
	}

	get_licenses_statistics(dealerId?: string, startDate?: string, endDate?: string) {
		const base = `${this.getters.api_get_licenses_statistics}`;
		const params = this.setUrlParams({ dealerId, startDate, endDate }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_licenses_installation_statistics(dealer?, startDate?, endDate?) {
		const base = `${this.getters.api_get_licenses_installation_statistics}`;
		const params = this.setUrlParams({ dealerid: dealer, startDate, endDate }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_licenses_installation_statistics_detailed(dealer?, startDate?, endDate?) {
		const base = `${this.getters.api_get_licenses_installation_statistics_detailed}`;
		const params = this.setUrlParams({ dealerid: dealer, startDate, endDate }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_licenses_total_by_dealer(id) {
		const base = `${this.getters.api_get_licenses_total_by_dealer}`;
		const params = this.setUrlParams({ dealerid: id }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_license_by_dealer_id(dealerId: string, page: number, search?: string, arrangement?: any, pageSize = 15, pending?: any) {
		const base = `${this.getters.api_get_licenses_by_dealer}`;
		const params = this.setUrlParams({ dealerId, page, search, arrangement, pageSize, pending }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_license_by_screen_id(id: string, page: number) {
		const base = `${this.getters.api_get_licenses_by_screen}`;
		const params = this.setUrlParams({ screenId: id, page }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_outdated_licenses(filters: API_FILTERS): Observable<{ appUiVersion?: string; appServerVersion?: string; paging?: PAGING; message?: string }> {
		const base = this.getters.outdated_licenses;
		const params = this.setUrlParams(filters);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	search_license_by_host(hostId: string, search: string, page = 1, pageSize = 15) {
		const base = `${this.getters.search_license_by_host}`;
		const params = this.setUrlParams({ hostId, search, page, pageSize }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	sort_license_by_dealer_id(
		id,
		page,
		key,
		column,
		order,
		pageSize = 15,
		status?,
		daysOfflineFrom?,
		daysOfflineTo?,
		activated?,
		recent?,
		zone?,
		host?,
		assigned?,
		pending?,
		online?,
		isActivated?,
		isFavorite: any = ''
	) {
		const base = `${this.getters.api_get_licenses_by_dealer}`;
		const params = this.setUrlParams(
			{
				dealerId: id,
				page,
				search: key,
				sortColumn: column,
				sortOrder: order,
				pageSize,
				piStatus: status,
				daysOfflineFrom,
				daysOfflineTo,
				active: activated,
				daysInstalled: recent,
				timezone: zone,
				hostId: host,
				assigned,
				pending,
				online,
				isActivated,
				isFavorite
			},
			false,
			true
		);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_licenses_by_host_id(id: string) {
		const base = `${this.getters.api_get_licenses_by_host}`;
		const params = this.setUrlParams({ hostid: id }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_license_by_id(id: string): Observable<API_SINGLE_LICENSE_PAGE | { message: string }> {
		return this.getRequest(`${this.getters.api_get_licenses_by_id}${id}`);
	}

	get_license_report(data) {
		const body = { data };
		return this.postRequest(this.getters.api_get_license_report, body);
	}

	get_license_to_export(id): Observable<{ licenses?: API_LICENSE[]; message?: string }> {
		return this.getRequest(`${this.getters.export_dealer_licenses}?dealerId=${id}`);
	}

	get_license_to_export_duration(
		id: string,
		key: string,
		column: string,
		order: string,
		pageSize?: number,
		status?: string,
		daysOfflineFrom?,
		daysOfflineTo?,
		activated?,
		recent?,
		zone?,
		host?,
		assigned?,
		pending?,
		online?,
		isActivated?
	) {
		const base = `${this.getters.api_get_licenses_duration}`;
		const params = this.setUrlParams(
			{
				dealerId: id,
				search: key,
				sortColumn: column,
				sortOrder: order,
				pageSize,
				piStatus: status,
				daysOfflineFrom,
				daysOfflineTo,
				active: activated,
				daysInstalled: recent,
				timezone: zone,
				hostId: host,
				assigned,
				pending,
				online,
				isActivated
			},
			false,
			true
		);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_ad_licenses_total() {
		return this.getRequest(`${this.getters.api_get_ad_licenses_total}`);
	}

	get_ad_licenses_total_by_dealer(id: string) {
		return this.getRequest(`${this.getters.api_get_ad_licenses_total_by_dealer}${id}`);
	}

	get_installation_statistics(date: string = null): Observable<{ licenseInstallationStats: API_INSTALLATION_STATS }> {
		if (!date) date = moment().format('MM-DD-YYYY');
		return this.getRequest(`${this.getters.license_installation_statistics}` + '?installdate=' + `${date}`);
	}

	get_statistics_by_dealer(id: string) {
		const base = `${this.getters.license_statistics}`;
		const params = this.setUrlParams({ dealerid: id }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	get_statistics_by_installation(date: string) {
		return this.getRequest(`${this.getters.license_statistics_by_install_date}${date}`);
	}

	activate_license(id) {
		const url = `${this.updaters.api_activate_license}?licenseKey=${id}`;
		return this.postRequest(url, {});
	}

	add_license_favorite(id) {
		const url = `${this.updaters.api_add_license_favorite}?licenseId=${id}`;
		return this.postRequest(url, {});
	}

	remove_license_favorite(id) {
		const url = `${this.deleters.api_remove_favorite}?licenseId=${id}`;
		return this.postRequest(url, {});
	}

	deactivate_license(id) {
		const url = `${this.updaters.api_deactivate_license}?licenseKey=${id}`;
		return this.postRequest(url, {});
	}

	assign_licenses_to_host(data) {
		return this.postRequest(this.updaters.api_assign_license_to_host, data);
	}

	generate_license(id, count) {
		return this.postRequest(`${this.creators.api_new_license}dealerId=${id}&licensecount=${count}`, null);
	}

	get_screenshots(id): Observable<{ files: any[] }> {
		return this.getRequest(`${this.getters.api_get_screenshots}${id}`);
	}

	search_license(keyword = '') {
		const base = `${this.getters.search_license}`;
		const params = this.setUrlParams({ keyword }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	update_alias(data) {
		return this.postRequest(this.updaters.api_update_alias, data);
	}

	update_cec_status(data: { licenseId: string; status: number }) {
		return this.postRequest(this.updaters.license_cec_status, data);
	}

	//  Updates the license's boot delay
	update_license_boot_delay(data: { licenseId: string; bootDelay: number }) {
		return this.postRequest(this.updaters.api_update_license_boot_delay, data);
	}

	update_license_reboot_time(data: { rebootTime: { rebootTime: string }[]; licenseId: string }) {
		const body = {
			rebootTime: JSON.stringify(data.rebootTime),
			licenseId: data.licenseId
		};
		return this.postRequest(`${this.updaters.license_reboot_time}`, body);
	}

	// Updates the license installation date
	update_install_date(licenseId: string, installDate: string): Observable<any> {
		const data = { licenseId, installDate };
		const options = {
			headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' }),
			responseType: 'text' as 'json'
		};
		return this.postRequest(`${this.updaters.install_date}`, data, options);
	}

	//  Updates the installation date on multiple licenses
	update_install_date_list(data: { licenseId: string; installDate: string }[]): Observable<any> {
		const options = {
			headers: new HttpHeaders({ 'Content-Type': 'application/json', credentials: 'include', Accept: 'application/json' }),
			responseType: 'text' as 'json'
		};
		return this.postRequest(`${this.updaters.install_date_list}`, data, options);
	}

	update_display_status(data: { licenseId: string; displayStatus: number }) {
		return this.postRequest(this.updaters.api_display_status, data);
	}

	update_notification_settings(data: { licenseId: string; notificationSettings?: number; emailSettings?: number }) {
		return this.postRequest(this.updaters.license_notification_settings, data);
	}

	delete_screenshots(id) {
		const base = `${this.deleters.api_remove_screenshots}`;
		const params = this.setUrlParams({ licenseId: id }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	delete_license(licenseId: string[]) {
		const endpoint = this.deleters.api_remove_license;
		return this.postRequest(endpoint, licenseId);
	}

	unassign_host_license(licenses, force?) {
		const url = `${this.deleters.api_remove_host_licenses}`;
		return this.postRequest(url, licenses);
	}

	get_license_by_dealear_old(dealer) {
		const base = `${this.getters.api_get_license_by_dealer_temp}`;
		const params = this.setUrlParams({ dealer }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	//Get Resource Usage By License
	get_license_resource(license: string) {
		const base = `${this.getters.api_get_resource_logs}`;
		const params = this.setUrlParams({ license }, false, true);
		const url = `${base}${params}`;
		return this.getRequest(url);
	}

	//Get Resource Usage By License Id and Date
	get_license_resource_logs(licenseId: string, date: string) {
		return this.getRequest(`${this.getters.api_get_resource_logs_by_date}${licenseId}&selectedDate=${date}&page=1&pageSize=30`, null);
	}

	get_activities(id: string) {
		const base = `${this.getters.api_get_activities_by_license_id}`;
		const url = `${base}${id}`;
		return this.getRequest(url);
	}

	save_activity(data: { licenseId: string; activityCode: string; initiatedBy: string }) {
		// const body = { licenseId, activityCode, initiatedBy};
		return this.postRequest(`${this.creators.api_save_activity}`, data);
	}

	update_internet_info(data) {
		const body = { data };
		return this.postRequest(this.updaters.api_update_internet_info, body);
	}

	set_screenshot_status(data) {
		return this.postRequest(this.updaters.api_update_screenshot_settings, data);
	}

	set_speedtest_status(data: { licenseId: string; speedtestSettings: number }) {
		return this.postRequest(this.updaters.api_update_speedtest_settings, data);
	}

	set_resource_status(data: { licenseId: string; resourceSettings: number }) {
		return this.postRequest(this.updaters.api_update_resource_settings, data);
	}

	set_tvdisplay_status(data: { licenseId: string; tvdisplaySettings: number }) {
		return this.postRequest(this.updaters.api_update_tvdisplay_settings, data);
	}

	set_fast_edge_tool_status(data: { licenseId: string; fastEdgeMonitoringTool: number }) {
		return this.postRequest(this.updaters.api_update_fastedge_tool_settings, data);
	}

	create_installation_checklist_title(data: any) {
		return this.postRequest(this.creators.api_installation_checklist_title_add, data);
	}

	update_installation_checklist_title(data: any) {
		return this.postRequest(this.updaters.api_checklist_title_update, data);
	}

	update_installation_checklist_item(data: any) {
		return this.postRequest(this.updaters.api_checklist_item_update, data);
	}

	add_installation_checklist_items(data: any) {
		return this.postRequest(this.creators.api_installation_checklist_items_add, data);
	}

	get_checklist() {
		return this.getRequest(`${this.getters.api_get_checklist}`);
	}

	get_checklist_titles() {
		return this.getRequest(`${this.getters.api_get_checklist_titles}`);
	}

	get_checklist_by_license_id(id: string) {
		return this.getRequest(`${this.getters.api_get_checklist_by_license_id}${id}`);
	}

	update_list_checking(data) {
		return this.postRequest(this.updaters.api_checklist_check_update, data);
	}

	delete_checklist_id(id) {
		const url = `${this.deleters.api_remove_checklist_title}${id}`;
		return this.postRequest(url, {});
	}

	delete_checklist_items(data) {
		return this.postRequest(this.deleters.api_remove_checklist_items, data);
	}

	update_reboot_time(licenseId: string, rebootTime: string) {
		const body = { licenseId, rebootTime };
		return this.postRequest(this.updaters.license_reboot_time, body);
	}

	update_tv_brand(licenseId: string, tvbrand: string) {
		const body = { licenseId, tvbrand };
		return this.postRequest(this.updaters.tv_brand, body);
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
