import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PAGING } from 'src/app/global/models';
import { BaseService } from '../base.service';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

@Injectable({
    providedIn: 'root',
})
export class FillerService extends BaseService {
    http_options = {
        headers: new HttpHeaders({ 'Content-Type': 'multipart/form-data' }),
    };

    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    get_filler_totals() {
        const url = `${this.getters.api_get_filler_gettotal}`;
        return this.getRequest(url);
    }

    get_filler_thumbnails(id, count) {
        const url = `${this.getters.api_get_content_thumbnails}?id=${id}&take=${count}`;
        return this.getRequest(url).map((data) => (data.message ? data : data.data));
    }

    // ------------------------------------
    // CRUD FILLER GROUPS
    // ------------------------------------

    add_filler_group(data: any) {
        const url = this.creators.api_new_filler_group;
        return this.postRequest(url, data);
    }

    get_filler_groups(
        page: number,
        key: string,
        pageSize,
        column = '',
        order = '',
        dealer?: boolean,
        notOwner?: boolean,
    ): Observable<{
        paging: PAGING;
    }> {
        let url = '';
        if (notOwner) pageSize = 12;
        if (dealer)
            url = `${this.getters.api_get_dealer_filler_groups}?page=${page}&pageSize=${pageSize}&sortColumn=${column}&sortOrder=${order}`;
        else
            url = `${this.getters.api_get_filler_groups}?page=${page}&pageSize=${pageSize}&sortColumn=${column}&sortOrder=${order}`;

        if (key && key.trim().length > 0) {
            const search = encodeURIComponent(key);
            url += `&search=${search}`;
        }

        return this.getRequest(url);
    }

    update_filler_group_photo(data: any) {
        const url = this.updaters.api_update_filler_group_photo;
        return this.postRequest(url, data);
    }

    get_filler_group_for_feeds(assignee = '') {
        let url = `${this.getters.api_get_filler_group_for_feeds}?pageSize=0&assignedTo=${assignee}`;
        return this.getRequest(url);
    }

    get_filler_group_by_id(id: string) {
        let url = `${this.getters.api_get_filler_group_by_id}?id=${id}`;
        return this.getRequest(url);
    }

    get_filler_group_dealer_admin_view(
        id: string,
        page: number,
        key: string,
        pageSize = 11,
        column = '',
        order = '',
        userview?: string,
        notOwner?: boolean,
    ) {
        let url = '';
        if (notOwner) pageSize = 12;
        if (userview == 'dealeradmin')
            url = `${this.getters.api_get_dealeradmin_filler_groups_view}?page=${page}&pageSize=${pageSize}&sortColumn=${column}&sortOrder=${order}`;
        else
            url = `${this.getters.api_get_dealer_filler_groups_admin_view}?id=${id}&page=${page}&pageSize=${pageSize}&sortColumn=${column}&sortOrder=${order}`;

        if (key && key.trim().length > 0) {
            const search = encodeURIComponent(key);
            url += `&search=${search}`;
        }
        return this.getRequest(url);
    }

    get_filler_group_of_other_roles(
        role: string,
        page: number,
        key: string,
        pageSize = 11,
        column = '',
        order = '',
        notOwner?: boolean,
    ): Observable<{
        paging: PAGING;
    }> {
        if (notOwner) pageSize = 12;
        let url = `${this.getters.api_get_dealer_filler_groups_other_roles}?role=${role}&page=${page}&pageSize=${pageSize}&sortColumn=${column}&sortOrder=${order}`;
        if (key && key.trim().length > 0) {
            const search = encodeURIComponent(key);
            url += `&search=${search}`;
        }
        return this.getRequest(url);
    }

    validate_delete_filler_group(id: string) {
        let url = `${this.getters.api_get_filler_group_validation}?id=${id}`;
        return this.getRequest(url);
    }

    delete_filler_group(id) {
        const url = `${this.deleters.api_delete_filler_group}?id=${id}`;
        return this.postRequest(url, {});
    }

    // ------------------------------------
    // CRUD FILLER CONTENTS
    // ------------------------------------

    get_filler_group_contents(id: string, key = '', page = 1, pageSize = 30, column, order) {
        let url = `${this.getters.api_get_filler_group_contents}?id=${id}&pageSize=${pageSize}&page=${page}&search=${key}&sortColumn=${column}&sortOrder=${order}`;
        return this.getRequest(url);
    }

    get_filler_group_playing_where(id: string) {
        let url = `${this.getters.api_get_fillers_playing_where}?id=${id}`;
        return this.getRequest(url);
    }

    update_filler_contents(data: any) {
        const url = this.updaters.api_update_fillers_content;
        return this.postRequest(url, data);
    }

    delete_filler_contents(id) {
        const url = `${this.deleters.api_delete_filler_content}?id=${id}`;
        return this.postRequest(url, {});
    }

    // SOLO CONTENT
    getFillerGroupSolo(id: string) {
        let url = `${this.getters.api_get_filler_feed_solo}?id=${id}`;
        return this.getRequest(url).map((data) => data.data[0]);
    }

    // ------------------------------------
    // CRUD FILLER FEEDS
    // ------------------------------------

    add_filler_feed(data: any) {
        const url = this.creators.api_create_filler_feed;
        return this.postRequest(url, data);
    }

    public get_filler_feeds(
        page = 1,
        search = '',
        pagesize = 15,
        column?: string,
        order?: string,
    ): Observable<{
        paging: PAGING;
    }> {
        const base = `${this.getters.api_get_filler_feeds}`;
        const params = this.setUrlParams(
            {
                page,
                search: search,
                sortColumn: column,
                sortOrder: order,
                pageSize: pagesize,
            },
            false,
            true,
        );
        const url = `${base}${params}`;

        return this.getRequest(url);
    }

    get_filler_feeds_by_role(role, id = '') {
        let url = `${this.getters.api_get_filler_feed_by_role}?role=${role}&dealerid=${id}`;
        return this.getRequest(url);
    }

    delete_filler_feeds(data_id) {
        const url = `${this.deleters.api_delete_filler_feed}`;
        return this.postRequest(url, data_id);
    }

    get_all_filler_feeds_minified() {
        let url = `${this.getters.api_get_filler_feeds_minify}?pagesize=0`;
        return this.getRequest(url);
    }

    get_single_filler_feeds_placeholder(id) {
        let url = `${this.getters.api_get_filler_feed_placeholder}?fillerplaylistid=${id}`;
        return this.getRequest(url);
    }

    check_if_filler_has_dependency(id) {
        let url = `${this.getters.api_get_filler_feed_dependency}?fillerplaylistid=${id}`;
        return this.getRequest(url);
    }

    check_if_filler_is_in_playlist(id) {
        let url = `${this.getters.api_get_filler_check_if_in_playlist}?playlistId=${id}`;
        return this.getRequest(url);
    }

    cloneFiller(fillerPlaylistId: string, newName: string, createdBy: string) {
        const url = `${this.creators.filler_clone}`;
        const body = { fillerPlaylistId, createdBy, newName };
        return this.postRequest(url, body);
    }
}
