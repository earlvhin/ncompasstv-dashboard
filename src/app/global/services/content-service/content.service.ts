import { EventEmitter, Injectable } from '@angular/core'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map'

import { AuthService } from '../auth-service/auth.service';
import { environment } from '../../../../environments/environment';
import { PlaylistContentSchedule } from '../../models/playlist-content-schedule.model';

@Injectable({
	providedIn: 'root'
})

export class ContentService {

	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}` }
		)
	};

	onScheduleChanges = new EventEmitter<string>();

	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }

    get_all_contents() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_assets}`+`?pageSize=0`, this.httpOptions);
	}

	get_contents() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_assets}`, this.httpOptions);
	}

	get_contents_temp(page, type, sort, dealerId, key, floating) {
		return this._http.get<any>(`
		${environment.base_uri}${environment.getters.api_get_assets}`+`?pageSize=30`+`&page=`+`${page}`+`&fileCategory=` + `${type}`+`&sort=` + `${sort}`+`&dealerId=` + `${dealerId}` +`&search=` + `${key}`+`&floating=` + `${floating}`, this.httpOptions);
	}

	get_floating_contents() {
		return this._http.get<any>(`
		${environment.base_uri}${environment.getters.api_get_assets}
		?pageSize=0
		&floating=true`, 
		this.httpOptions).map(i => i.iContents);
	}

	get_contents_with_page(page=1, type?, sort?, dealerId?, hostId?, advertiserId?, key?, pageSize=60) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_assets}
		?pageSize=${pageSize}
		&page=${page}
		&fileCategory=${type || ''}
		&sort=${sort || ''}
		&dealerId=${dealerId || ''}
		&hostId=${hostId || ''}
		&advertiserId=${advertiserId || '' }
		&search=${key || ''}`, this.httpOptions);
	}
	
    get_contents_playing_where(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_content_playing_where}`+`?contentid=`+`${id}`, this.httpOptions);
	}
	
	get_contents_total() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_content_total}`, this.httpOptions);
	}
	
    get_contents_summary() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_content_summary}`, this.httpOptions);
	}

	get_contents_total_by_dealer(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_content_total_by_dealer}${id}`, this.httpOptions);
	}

	get_content_by_id(data) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_content_by_id}${data}`, this.httpOptions).map(data => data.content)
	}

	get_content_by_advertiser_id(data) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_content_by_advertiser_id}${data}`, this.httpOptions);
	}
	
	get_content_by_dealer_id(data, floating?, page?, pageSize?) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_content_by_dealer_id}${data}&page=${page}&pageSize=${pageSize}`, this.httpOptions).map(data => data)
	}

	get_content_metrics(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_content_metrics}`, data, this.httpOptions);
	}
	
    get_content_count_by_license(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_content_count_by_license}`, data, this.httpOptions).map(data => data.iContents);
	}

	get_content_daily_count_by_license(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_content_hourly_by_license}`, data, this.httpOptions).map(data => data.iContents)
	} 

	get_content_monthly_count_by_license(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_content_monthly_count_by_license}`, data, this.httpOptions).map(data => data.iContents)
	}

	get_content_yearly_count_by_license(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_content_yearly_count_by_license}`, data, this.httpOptions).map(data => data.contentList)
	}

	get_content_monthly_count(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_content_monthly_count}`, data, this.httpOptions).map(data => data.iContents[0]);
	}

	get_content_daily_count(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_content_daily_count}`, data, this.httpOptions).map(data => data.iContents[0]);
	}

	get_content_yearly_count(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_content_yearly_count}`, data, this.httpOptions).map(data => data.iContents[0]);
	}
	
    get_content_metrics_export(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.getters.api_get_content_metrics_export}`, data, this.httpOptions).map(data => data);
	}

	get_content_by_license_id(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_content_by_license_zone}${id}`, this.httpOptions).map(data => data.screenZonePlaylistsContents);
	}

	create_content_schedule(data: PlaylistContentSchedule[]): Observable<any> {
		return this._http.post<any>(`${environment.base_uri}${environment.create.content_schedule}`, data, this.httpOptions);
	}

	update_content_schedule(data: PlaylistContentSchedule): Observable<any> {
		return this._http.post<any>(`${environment.base_uri}${environment.update.content_schedule}`, data, this.httpOptions);		
	}

	sort_ascending(files) {
		return files.sort((a, b) => {
			if (a.content_data) {
				return a.content_data.date_uploaded.localeCompare(b.content_data.date_uploaded)
			} else {
				return a.date_uploaded.localeCompare(b.date_uploaded)
			}
		})
	}

	sort_descending(files) {
		return files.sort((a, b) => {
			if (b.content_data) {
				return b.content_data.date_uploaded.localeCompare(a.date_uploaded)
			} else {
				return b.date_uploaded.localeCompare(a.date_uploaded)
			}
		})
	}

	filter_images(files) {
		return files.filter(
			(i) => {
				if (i.content_data) {
					return i.content_data.file_type != 'webm'
				} else {
					return i.file_type != 'webm'
				}
			}
		)
	}

	filter_videos(files) {
		return files.filter(
			(i) => {
				if (i.content_data) {
					return i.content_data.file_type == 'webm'
				} else {
					return i.file_type == 'webm'
				}
			}
		)
	}

	search_content(files, keyword) {
		return files.filter(
			i => {
				if (i.content_data && i.content_data.file_name) {
					return this.removeFilenameHandle(i.content_data.file_name).toLowerCase().includes(keyword.toLowerCase())
				} else if (i.content_data && i.content_data.title) {
					return i.content_data.title.toLowerCase().includes(keyword.toLowerCase())
				} 
			}
		)
	}

	reassignContent(data: { type: number, toId: string, contentIds: string[] }) {
		return this._http.post<any>(`${environment.base_uri}${environment.update.reassign_content}`, data, this.httpOptions);
	}

	removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}

	remove_content(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_content}`, data, this.httpOptions)
	}

	revert_frequency(playlistContentId: string) {
		const url = `${environment.base_uri}${environment.update.revert_frequency}`;
		const body = { playlistContentId };
		return this._http.post(url, body, this.httpOptions);
	}

	search_contents_via_api(key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_assets}`+`?search=`+`${key}`, this.httpOptions);
	}

	set_frequency(frequency: number, playlistContentId: string, playlistId: string) {
		const url = `${environment.base_uri}${environment.update.set_content_frequency}`;
		const body = { frequency, playlistContentId, playlistId };
		return this._http.post(url, body, this.httpOptions);
	}

	toggle_credits(playlistContentId: string, creditsEnabled = 1) {
		const url = `${environment.base_uri}${environment.update.toggle_credits}`;
		const body = { playlistContentId, creditsEnabled };
		return this._http.post(url, body, this.httpOptions);
	}

	update_play_credits(playlistContentId: string, licenseId: string, credits = 100) {
		const url = `${environment.base_uri}${environment.update.play_credits}`;
		const body = { playlistContentId, licenseId, credits };
		return this._http.post(url, body, this.httpOptions);
	}

	unassign_content(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.update.api_update_content}`, data, this.httpOptions);
	}
}
