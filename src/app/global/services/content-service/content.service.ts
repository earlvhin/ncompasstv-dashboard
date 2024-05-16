import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/operator/map';

import {
    API_CONTENT,
    CREDITS_TO_SUBMIT,
    LICENSE_PLAYING_WHERE,
    PAGING,
    PlaylistContentSchedule,
} from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';

@Injectable({
    providedIn: 'root',
})
export class ContentService extends BaseService {
    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    onScheduleChanges = new EventEmitter<string>();

    create_content_schedule(data: PlaylistContentSchedule[]): Observable<any> {
        const url = `${this.updaters.content_schedule}`;
        return this.postRequest(url, data);
    }

    get_all_contents() {
        return this.getRequest(`${this.getters.api_get_assets}` + '?pageSize=0');
    }

    get_contents() {
        return this.getRequest(`${this.getters.api_get_assets}` + '?pageSize=0');
    }

    get_contents_temp(page: string, type: string, sort: string, dealerId: string, key: string, floating: boolean) {
        return this.getRequest(
            `${this.getters.api_get_assets}` +
                '?pageSize=30&page=' +
                `${page}` +
                '&fileCategory=' +
                `${type}` +
                '&sort=' +
                `${sort}` +
                '&dealerId=' +
                `${dealerId}` +
                '&search=' +
                `${key}` +
                '&floating=' +
                `${floating}`,
        );
    }

    get_floating_contents(): Observable<{ iContents: API_CONTENT[]; paging: PAGING }> {
        return this.getRequest(`${this.getters.api_get_assets}` + '?pageSize=0&floating=true');
    }

    get_contents_with_page(
        page = 1,
        type?,
        sort?,
        dealerId = '',
        hostId = '',
        advertiserId = '',
        key = '',
        feedId = '',
        pageSize = 60,
    ) {
        const base = `${this.getters.api_get_assets}`;
        const params = this.setUrlParams(
            {
                page,
                fileCategory: type,
                sort,
                dealerId,
                hostId,
                advertiserId,
                search: key,
                feedId,
                pageSize,
            },
            false,
            true,
        );
        const url = `${base}${params}`;
        return this.getRequest(url);
    }

    get_contents_playing_where(id: string): Observable<{ licenses: LICENSE_PLAYING_WHERE[] }> {
        return this.getRequest(`${this.getters.api_get_content_playing_where}?contentid=${id}`);
    }

    get_unused_contents(
        id: string,
        type = '',
        key?: string,
    ): Observable<{ contents: API_CONTENT[]; paging: PAGING } | { message: string }> {
        const url = `${this.getters.api_get_unused_contents}?dealerid=${id}&filetype=${type}&search=${key}&pageSize=0`;
        return this.getRequest(url);
    }

    get_contents_history(id: string, page: number): Observable<PAGING | { message?: string }> {
        return this.getRequest(`${this.getters.api_get_content_history}${id}&page=${page}`);
    }

    get_contents_total() {
        return this.getRequest(`${this.getters.api_get_content_total}`);
    }

    get_contents_summary() {
        return this.getRequest(`${this.getters.api_get_content_summary}`);
    }

    get_contents_total_by_dealer(id) {
        return this.getRequest(`${this.getters.api_get_content_total_by_dealer}${id}`);
    }

    get_content_by_id(contentId: string): Observable<{ content: API_CONTENT }> {
        return this.getRequest(`${this.getters.api_get_content_by_id}${contentId}`);
    }

    get_content_by_advertiser_id(data) {
        return this.getRequest(`${this.getters.api_get_content_by_advertiser_id}${data}`);
    }

    get_content_by_dealer_id(
        data,
        floating?,
        page?,
        pageSize?,
    ): Observable<{ contents?: API_CONTENT[]; paging?: PAGING; message?: string }> {
        return this.getRequest(
            `${this.getters.api_get_content_by_dealer_id}${data}` + '&page=' + `${page}` + '&pageSize=' + `${pageSize}`,
        );
    }

    get_content_metrics(data) {
        const url = `${this.getters.api_get_content_metrics}`;
        return this.postRequest(url, data);
    }

    get_content_count_by_license(data) {
        const url = `${this.getters.api_get_content_count_by_license}`;
        return this.postRequest(url, data).map((data) => data.iContents);
    }

    get_content_daily_count_by_license(data) {
        const url = `${this.getters.api_get_content_hourly_by_license}`;
        return this.postRequest(url, data).map((data) => data.iContents);
    }

    get_content_monthly_count_by_license(data) {
        const url = `${this.getters.api_get_content_monthly_count_by_license}`;
        return this.postRequest(url, data).map((data) => data.iContents);
    }

    get_content_yearly_count_by_license(data) {
        const url = `${this.getters.api_get_content_yearly_count_by_license}`;
        return this.postRequest(url, data).map((data) => data.contentList);
    }

    get_content_monthly_count(data) {
        const url = `${this.getters.api_get_content_monthly_count}`;
        return this.postRequest(url, data).map((data) => data.iContents[0]);
    }

    get_content_daily_count(data) {
        const url = `${this.getters.api_get_content_daily_count}`;
        return this.postRequest(url, data).map((data) => data.iContents[0]);
    }

    get_content_yearly_count(data) {
        const url = `${this.getters.api_get_content_yearly_count}`;
        return this.postRequest(url, data).map((data) => data.iContents[0]);
    }

    get_content_metrics_export(data) {
        const url = `${this.getters.api_get_content_metrics_export}`;
        return this.postRequest(url, data).map((data) => data);
    }

    get_content_by_license_id(id: string) {
        return this.getRequest(`${this.getters.api_get_content_by_license_zone}${id}`).map(
            (response) => response.screenZonePlaylistsContents,
        );
        // const url = `${environment.base_uri}${environment.getters.api_get_content_by_license_zone}${id}`;
        // return this._http.get<{ screenZonePlaylistsContents: API_SCREEN_ZONE_PLAYLISTS_CONTENTS[] }>(url, this.httpOptions).map(response => response.screenZonePlaylistsContents);
    }

    generate_content_logs_report(data: { contentId: string; start: string; end: string }) {
        return this.getRequest(
            `${this.getters.api_get_logs_based_reports}` +
                '?contentId=' +
                `${data.contentId}` +
                '&startDate=' +
                `${data.start}` +
                '&endDate=' +
                `${data.end}`,
        );
    }

    update_content_protection(body: { contentId: string; isProtected: 0 | 1 }) {
        const url = `${this.updaters.content_protection}`;
        return this.postRequest(url, body);
    }

    update_content_schedule(data: PlaylistContentSchedule): Observable<any> {
        const url = `${this.updaters.content_schedule}`;
        return this.postRequest(url, data);
    }

    update_content_to_filler(body: { contentId: string; isFiller: boolean }) {
        const url = `${this.updaters.content_to_filler}`;
        return this.postRequest(url, body);
    }

    update_unused_contents(data) {
        const url = `${this.updaters.api_update_unused_content}`;
        return this.postRequest(url, data);
    }

    sort_ascending(files) {
        return files.sort((a, b) => {
            if (a.content_data) {
                return a.content_data.date_uploaded.localeCompare(b.content_data.date_uploaded);
            } else {
                return a.date_uploaded.localeCompare(b.date_uploaded);
            }
        });
    }

    sort_descending(files) {
        return files.sort((a, b) => {
            if (b.content_data) {
                return b.content_data.date_uploaded.localeCompare(a.date_uploaded);
            } else {
                return b.date_uploaded.localeCompare(a.date_uploaded);
            }
        });
    }

    filter_images(files) {
        return files.filter((i) => {
            if (i.content_data) {
                return i.content_data.file_type != 'webm';
            } else {
                return i.file_type != 'webm';
            }
        });
    }

    filter_videos(files) {
        return files.filter((i) => {
            if (i.content_data) {
                return i.content_data.file_type == 'webm';
            } else {
                return i.file_type == 'webm';
            }
        });
    }

    search_content(files, keyword) {
        return files.filter((i) => {
            if (i.content_data && i.content_data.file_name) {
                return this.removeFilenameHandle(i.content_data.file_name)
                    .toLowerCase()
                    .includes(keyword.toLowerCase());
            } else if (i.content_data && i.content_data.title) {
                return i.content_data.title.toLowerCase().includes(keyword.toLowerCase());
            }
        });
    }

    reassignContent(data: { type: number; toId: string; contentIds: string[] }) {
        const url = `${this.updaters.reassign_content}`;
        return this.postRequest(url, data);
    }

    removeFilenameHandle(file_name) {
        return file_name.substring(file_name.indexOf('_') + 1);
    }

    remove_content(data) {
        const url = `${this.deleters.api_remove_content}`;
        return this.postRequest(url, data);
    }

    revert_frequency(playlistContentId: string) {
        const url = `${this.updaters.revert_frequency}`;
        const body = { playlistContentId };
        return this.postRequest(url, body);
    }

    search_contents_via_api(key) {
        return this.getRequest(`${this.getters.api_get_assets}` + '?search=' + `${key}`);
    }

    set_frequency(frequency: number, playlistContentId: string, playlistId: string) {
        const url = `${this.updaters.set_content_frequency}`;
        const body = { frequency, playlistContentId, playlistId };
        return this.postRequest(url, body);
    }

    toggle_credits(playlistContentId: string, creditsEnabled = 1) {
        const url = `${this.updaters.toggle_credits}`;
        const body = { playlistContentId, creditsEnabled };
        return this.postRequest(url, body);
    }

    update_play_credits(data: CREDITS_TO_SUBMIT) {
        const url = `${this.updaters.play_credits}`;
        return this.postRequest(url, data);
    }

    unassign_content(data) {
        const url = `${this.updaters.api_update_content}`;
        return this.postRequest(url, data);
    }
}
