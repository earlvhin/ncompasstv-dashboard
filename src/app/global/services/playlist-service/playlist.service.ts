import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

import {
    API_BLOCKLIST_CONTENT,
    API_CONTENT,
    API_HOST,
    API_LICENSE_PROPS,
    API_SCREEN,
    API_SINGLE_PLAYLIST,
    API_PLAYLIST_MINIFIED,
    API_SWAP_CONTENT_RESPONSE,
    UI_ROLE_DEFINITION,
} from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class PlaylistService extends BaseService {
    onBlacklistDataReady = new EventEmitter<API_BLOCKLIST_CONTENT[]>();
    onPushPlaylistUpdateToAllLicenses = new EventEmitter<null>();

    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    blocklist_content(data) {
        return this.postRequest(this.updaters.api_blocklist_content, data);
    }

    blacklist_cloned_content(playlistContentId, playlistId, contentId) {
        return this.postRequest(
            `${this.updaters.api_blacklist_cloned_content}?playlistContentId=${playlistContentId}&playlistId=${playlistId}&contentId=${contentId}`,
            null,
        );
    }

    export_playlist(id) {
        return this.getRequest(`${this.getters.export_content_playlist}${id}`);
    }

    get_blacklisted_by_id(playlist_content_id: string) {
        return this.getRequest(`${this.getters.api_get_blacklisted_by_id}${playlist_content_id}`);
    }

    get_playlists(page, key) {
        return this.getRequest(`${this.getters.api_get_playlist}` + '?page=' + `${page}` + '&search=' + `${key}`);
    }

    get_all_playlists(page, key, column?, order?) {
        const base = `${this.getters.api_get_all_playlist}`;
        const params = this.setUrlParams({ page, search: key, sortColumn: column, sortOrder: order }, false, true);
        const url = `${base}${params}`;
        return this.getRequest(url);
    }

    /**
     * GET: playlists/GetPlaylistsByContentId?contentid=
     * @param contentId
     * @returns
     */
    getPlaylistByContentId(
        contentId: string,
    ): Observable<{ playlists: API_PLAYLIST_MINIFIED[] } | { message: string }> {
        return this.getRequest(`${this.getters.api_get_playlist_by_content}${contentId}`);
    }

    get_playlists_total() {
        return this.getRequest(`${this.getters.api_get_playlist_total}`);
    }

    get_playlists_total_by_dealer(id) {
        return this.getRequest(`${this.getters.api_get_playlist_total_by_dealer}${id}`);
    }

    get_playlist_by_dealer_id(id) {
        return this.getRequest(`${this.getters.api_get_playlist_by_dealer_id}${id}`);
    }

    getPlaylistByDealerIdMinified(id: string) {
        const isDealerAdmin = this.currentUser.role_id == UI_ROLE_DEFINITION.dealeradmin;
        // Temporary fix, passing the exact url for API Host minified call.
        // @TODO create a playlist minified endpoint for dealeradmin
        return this.getRequest(
            isDealerAdmin
                ? `${environment.base_uri}${this.getters.api_get_playlist_by_dealer_id_minify}${id}`
                : `${this.getters.api_get_playlist_by_dealer_id_minify}${id}`,
            null,
            null,
            null,
            null,
            isDealerAdmin,
        );
    }

    get_playlist_by_dealer_id_table(page, id, key) {
        const base = `${this.getters.api_get_playlist_by_dealer_id_table}`;
        const params = this.setUrlParams({ page, dealerid: id, search: key }, false, true);
        const url = `${base}${params}`;
        return this.getRequest(url);
    }

    get_playlist_by_dealer_id_v2(id) {
        return this.getRequest(`${this.getters.api_get_playlist_by_dealer_id_table}?dealerId=${id}&pageSize=0`);
    }

    get_playlist_by_id(id: string): Observable<{
        hostLicenses: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[];
        licenses: API_LICENSE_PROPS[];
        playlist: API_SINGLE_PLAYLIST;
        playlistContents: API_CONTENT[];
        screens: API_SCREEN[];
    }> {
        return this.getRequest(`${this.getters.api_get_playlists_by_id}${id}`);
    }

    getScreensOfPlaylist(id: string): Observable<{ screens: API_SCREEN[] }> {
        return this.getRequest(`${this.getters.api_get_screens_of_playlist}${id}`);
    }

    create_playlist(data) {
        return this.postRequest(this.creators.api_new_playlist, data);
    }

    clone_playlist(data) {
        return this.postRequest(this.creators.api_clone_playlist, data);
    }

    bulk_whitelist(data) {
        return this.postRequest(this.deleters.api_bulk_remove_in_blacklist, data);
    }

    remove_playlist(id, force) {
        const url = `${this.deleters.api_remove_playlist}${id}&force=${force}`;
        return this.postRequest(url, {});
    }

    remove_playlist_content(playlist, content) {
        const url = `${this.deleters.api_remove_playlist_content}?playlistId=${playlist}&playlistContentId=${content}`;
        return this.postRequest(url, {});
    }

    remove_playlist_contents(playlistId: string, contentIdsToDelete: string[]) {
        const url = `${this.deleters.api_remove_playlist_contents}?playlistId=${playlistId}`;
        return this.postRequest(url, contentIdsToDelete);
    }

    remove_in_blocklist(data) {
        const requestOptions: Object = {
            /* other options here */
            responseType: 'text',
        };

        return this.postRequest(this.deleters.api_remove_in_blacklist, data, requestOptions);
    }

    log_content_history(data) {
        return this.postRequest(this.creators.api_new_content_history_log, data);
    }

    swap_playlist_content(data: {
        playlistContentId: string;
        contentId: string;
    }): Observable<API_SWAP_CONTENT_RESPONSE> {
        const { playlistContentId, contentId } = data;
        const url = `${this.updaters.swap_playlist_content}?playlistContentId=${playlistContentId}&contentId=${contentId}`;
        return this.postRequest(url, {});
    }

    update_playlist_info(playlist_data) {
        return this.postRequest(this.updaters.api_update_playlist_info, playlist_data);
    }

    update_playlist_contents(playlist_data) {
        return this.postRequest(this.updaters.api_update_playlist_content, playlist_data);
    }
}
