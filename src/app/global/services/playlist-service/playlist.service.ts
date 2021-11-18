import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import 'rxjs/add/operator/map'

import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { environment } from 'src/environments/environment';
import { API_BLOCKLIST_CONTENT, API_SINGLE_PLAYLIST } from 'src/app/global/models';

@Injectable({
  providedIn: 'root'
})

export class PlaylistService {

	onBlacklistDataReady = new EventEmitter<API_BLOCKLIST_CONTENT[]>();
	token = JSON.parse(localStorage.getItem('tokens'));

	httpOptions = {
		headers: new HttpHeaders(
			{ 'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}` }
		)
	};

	httpOptions_1 = {
		headers: new HttpHeaders(
			{ 
				'Authorization': `Bearer ${this._auth.current_user_value.jwt.token}`,
				'Response-Type': 'text'
			}
		)
	};

	constructor(
		private _http: HttpClient,
		private _auth: AuthService
	) { }

	blocklist_content(data) {
		return this._http.post<API_BLOCKLIST_CONTENT[]>(`${environment.base_uri}${environment.update.api_blocklist_content}`, data, this.httpOptions)
	}

	blacklist_cloned_content(playlistContentId, playlistId, contentId) {
		return this._http.post<API_BLOCKLIST_CONTENT[]>(`${environment.base_uri}${environment.update.api_blacklist_cloned_content}`
										+'?playlistContentId='+`${playlistContentId}`+'&playlistId='+`${playlistId}`+ '&contentId='+`${contentId}`, this.httpOptions)
	}

	export_playlist(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.export_content_playlist}${id}`, this.httpOptions);
	}

	get_blacklisted_by_id(playlist_content_id: string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_blacklisted_by_id}${playlist_content_id}`, this.httpOptions)
	}

	get_playlists(page, key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_playlist}`+'?page='+`${page}`+'&search='+`${key}`, this.httpOptions);
	}
	
	get_all_playlists(page, key, column?, order?) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_all_playlist}`+'?page='+`${page}`+'&search='+`${key}`+'&sortColumn='+`${column}`+'&sortOrder='+`${order}`, this.httpOptions);
	}

	get_playlist_by_content_id(content_id: string) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_playlist_by_content}${content_id}`, this.httpOptions).pipe(map(i => i.playlists));
	} 
	
	// search_playlists(key) {
	// 	return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_playlist}`+'?search='+`${key}`, this.httpOptions);
	// }
	
	get_playlists_total() {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_playlist_total}`, this.httpOptions);
	}
	
	get_playlists_total_by_dealer(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_playlist_total_by_dealer}${id}`, this.httpOptions);
	}

	get_playlist_by_dealer_id(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_playlist_by_dealer_id}${id}`, this.httpOptions)
	}

	get_playlist_by_dealer_id_table(page, id, key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_playlist_by_dealer_id_table}`+'?page='+`${page}`+'&dealerid='+`${id}`+'&search='+`${key}`, this.httpOptions)
	}

	get_playlist_by_dealer_id_v2(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_playlist_by_dealer_id_table}?dealerId=${id}&pageSize=0`, this.httpOptions);
	}

	get_playlist_by_id(id) {
		return this._http.get<API_SINGLE_PLAYLIST>(`${environment.base_uri}${environment.getters.api_get_playlists_by_id}${id}`, this.httpOptions);
	}

	get_screens_of_playlist(id) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_screens_of_playlist}${id}`, this.httpOptions);
	}

	create_playlist(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_new_playlist}`, data, this.httpOptions);
	}

	clone_playlist(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_clone_playlist}`, data, this.httpOptions);
	}

	bulk_whitelist(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_bulk_remove_in_blacklist}`, data, this.httpOptions);
	}

	remove_playlist(id, force) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_playlist}${id}&force=${force}`, null, this.httpOptions);
	} 

	remove_playlist_content(playlist, content) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_playlist_content}?playlistId=${playlist}&playlistContentId=${content}`, null, this.httpOptions);
	}

	remove_playlist_contents(playlist, contents) {
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_playlist_contents}?playlistId=${playlist}`, contents, this.httpOptions);
	}

	remove_in_blocklist(data) {
		const requestOptions: Object = {
			/* other options here */
			responseType: 'text'
		}
		return this._http.post<any>(`${environment.base_uri}${environment.delete.api_remove_in_blacklist}`, data, requestOptions);
	}

	log_content_history(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_new_content_history_log}`, data, this.httpOptions);
	}

	update_playlist_info(playlist_data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_playlist_info}`, playlist_data, this.httpOptions);
	}

	update_playlist_contents(playlist_data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_playlist_content}`, playlist_data, this.httpOptions);
	}
}
