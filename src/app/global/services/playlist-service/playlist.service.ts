import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/map'
import { AuthService } from '../auth-service/auth.service';
import { API_PLAYLIST } from '../../models/api_playlists.model';
import { environment } from '../../../../environments/environment';
import { API_SINGLE_PLAYLIST } from '../../models/api_single-playlist.model';
import { API_BLOCKLIST_CONTENT } from '../../models/api_blocklist-content.model';
import { REMOVE_BLOCKLISTED_LICENSE } from '../../models/ui_single-playlist.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class PlaylistService {

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

	get_playlists(page, key) {
		return this._http.get<any>(`${environment.base_uri}${environment.getters.api_get_playlist}`+'?page='+`${page}`+'&search='+`${key}`, this.httpOptions);
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

	get_playlist_by_id(id) {
		return this._http.get<API_SINGLE_PLAYLIST>(`${environment.base_uri}${environment.getters.api_get_playlist_by_id}${id}`, this.httpOptions);
	}

	create_playlist(data) {
		return this._http.post<any>(`${environment.base_uri}${environment.create.api_new_playlist}`, data, this.httpOptions);
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

	update_playlist_info(playlist_data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_playlist_info}`, playlist_data, this.httpOptions);
	}

	update_playlist_contents(playlist_data) {
		return this._http.post(`${environment.base_uri}${environment.update.api_update_playlist_content}`, playlist_data, this.httpOptions);
	}
}
