import { Injectable, EventEmitter } from '@angular/core';
import { BaseService } from 'src/app/global/services/base.service';
import { AddPlaylistContent } from '../class/AddPlaylistContent';
import { PlaylistContentUpdate } from '../type/PlaylistContentUpdate';
import { Observable, Subject } from 'rxjs';
import {
    API_CONTENT_V2,
    API_HOST,
    API_LICENSE_PROPS,
    API_PLAYLIST_V2,
    PlaylistContentSchedule,
    UI_CONTENT_SCHEDULE,
} from 'src/app/global/models';
import * as moment from 'moment';
import { ContentFetch } from '../models/ContentFetch';

@Injectable({
    providedIn: 'root',
})
export class SinglePlaylistService extends BaseService {
    private contentLoaded = new Subject<any>();
    private hostLoaded = new Subject<any>();
    contentLoaded$ = this.contentLoaded.asObservable();
    hostLoaded$ = this.hostLoaded.asObservable();

    contentSchedulerFormValidity = new EventEmitter<{ isInvalid: boolean; errors: string[] }>();
    receiveExistingScheduleData = new EventEmitter<PlaylistContentSchedule>();
    receiveSchedulerFormData = new EventEmitter<UI_CONTENT_SCHEDULE>();
    recheckContentSchedule = new EventEmitter<{ playlistContentId: string }>();
    requestExistingScheduleData = new EventEmitter<UI_CONTENT_SCHEDULE>();
    requestSchedulerFormData = new EventEmitter<{ requestingComponent: string }>();
    scheduleTypeSelected = new EventEmitter<{ type: 1 | 2 | 3; hasExistingSchedule: boolean }>();
    schedulerFormUpdated = new EventEmitter<UI_CONTENT_SCHEDULE>();
    validateSchedulerFormRequest = new EventEmitter<void>();

    addContent(data: AddPlaylistContent, validate: boolean = false) {
        return this.postRequest(`playlistsv2/addcontent${validate ? '?validateFiller=1' : ''}`, data);
    }

    contentReady(contents: API_CONTENT_V2[]) {
        this.contentLoaded.next(contents);
    }

    contentFetch(data: ContentFetch) {
        let childUrl = 'getAll';
        const queryParams = [];

        if (data.dealerId) {
            childUrl = 'getByDealerId';
            queryParams.push(`dealerid=${data.dealerId}`);
        }

        if (data.page) {
            queryParams.push(`page=${data.page}`);
        }

        if (data.searchKey) {
            queryParams.push(`search=${data.searchKey}`);
        }

        if (data.pageSize) {
            queryParams.push(`pageSize=${data.pageSize}`);
        }

        if (data.floating) {
            queryParams.push(`floating=${data.floating}`);
        }

        const queryString = queryParams.join('&');
        const url = `content/${childUrl}${queryString ? `?${queryString}` : ''}`;
        return this.getRequest(url);
    }

    hostsReady(hosts: any) {
        this.hostLoaded.next(hosts);
    }

    getPlaylistData(playlistId: string): Observable<API_PLAYLIST_V2 | { message?: string }> {
        return this.getRequest(`playlistsv2?playlistid=${playlistId}`);
    }

    getPlaylistHosts(playlistId: string): Observable<{ host: API_HOST; licenses: API_LICENSE_PROPS[] }[]> {
        return this.getRequest(`playlistsv2/gethostlicenses?playlistid=${playlistId}`).map(
            (data: any) => data.hostLicenses,
        );
    }

    /**
     * Gets the schedule status of a playlist content based on its type
     * @param data
     * @returns
     */
    getScheduleStatus(data: API_CONTENT_V2 | PlaylistContentSchedule) {
        let result = 'inactive';
        const DATE_FORMAT = 'YYYY-MM-DD';
        const TIME_FORMAT = 'hh:mm A';

        if (!data || !data.playlistContentsScheduleId) return result;

        switch (data.type) {
            case 3: // type 3 means the content only plays during the set schedule
                const currentDate = moment(new Date(), `${DATE_FORMAT} ${TIME_FORMAT}`);
                const startDate = moment(`${data.from} ${data.playTimeStart}`, `${DATE_FORMAT} ${TIME_FORMAT}`);
                const endDate = moment(`${data.to} ${data.playTimeEnd}`, `${DATE_FORMAT} ${TIME_FORMAT}`);

                if (currentDate.isBefore(startDate)) result = 'future';
                if (currentDate.isBetween(startDate, endDate, undefined)) result = 'scheduled';
                break;

            case 2: // type 2 means the content is set to not play
                result = 'inactive';
                break;

            default: // type 1 means the content is set to always play
                result = 'active';
                break;
        }

        return result;
    }

    getPlaylistScreens(id) {
        return this.getRequest(`${this.getters.api_get_screens_of_playlist}${id}`);
    }

    getPlaylistScehduleByContentId(playlistContentId: string) {
        return this.getRequest(`${this.getters.api_get_playlistsv2_schedule_by_content_id}${playlistContentId}`);
    }

    getWhitelistData(playlistContentId: string) {
        return this.getRequest(`playlistsv2/GetLicensePlaylistContents?playlistContentId=${playlistContentId}`);
    }

    mapScheduleFromUiContent(data: UI_CONTENT_SCHEDULE, playlistContentId?: string, contents?: API_CONTENT_V2[]) {
        const result = {} as PlaylistContentSchedule;

        switch (data.type) {
            case 1:
            case 2:
                result.type = data.type;
                break;
            default:
                const DATE_FORMAT = 'YYYY-MM-DD';
                const TIME_FORMAT = 'hh:mm A';
                result.type = 3;

                Object.keys(data).forEach((key) => {
                    if (typeof data[key] === 'undefined' || (!data[key] && typeof data[key] !== 'number')) return;

                    switch (key) {
                        case 'days':
                            result.days = data.days
                                .filter((day) => day.checked)
                                .map((day) => day.dayId)
                                .join(',');
                            break;
                        case 'playTimeStartData':
                        case 'playTimeEndData':
                            let toParse = key === 'playTimeStartData' ? data.playTimeStartData : data.playTimeEndData;
                            const resultKey = key === 'playTimeStartData' ? 'playTimeStart' : 'playTimeEnd';
                            result[resultKey] = moment(`${toParse.hour}:${toParse.minute}`, 'HH:mm').format(
                                TIME_FORMAT,
                            );
                            break;
                        case 'startDate':
                        case 'endDate':
                            const parsedDate = moment(`${data[key]}`).format(DATE_FORMAT);
                            if (key === 'startDate') result.from = parsedDate;
                            else result.to = parsedDate;

                            break;
                        default:
                            result[key] = data[key];
                    }
                });

                result.from += ` ${moment(result.playTimeStart, TIME_FORMAT).format('HH:mm:ss')}`;
                result.to += ` ${moment(result.playTimeEnd, TIME_FORMAT).format('HH:mm:ss')}`;
        }

        if (typeof playlistContentId !== 'undefined' && typeof contents !== 'undefined') {
            result.playlistContentsScheduleId = contents.find(
                (c) => c.playlistContentId === playlistContentId,
            ).playlistContentsScheduleId;
        }

        return result;
    }

    removePlaylistContent(playlistId: string, playlistContentId: string) {
        const url = `${this.deleters.api_remove_playlist_content}?playlistId=${playlistId}&playlistContentId=${playlistContentId}`;
        return this.postRequest(url, {});
    }

    removeWhitelist(blacklistData: { playlistContentId: string; licenses: string[] }[]) {
        return this.postRequest(`playlistsv2/LicensePlaylistContentsDelete`, blacklistData).map((data) => data);
    }

    revert_frequency(playlistContentId: string) {
        const url = this.updaters.revert_frequency;
        const body = { playlistContentId };
        return this.postRequest(url, body);
    }

    set_frequency(frequency: number, playlistContentId: string, playlistId: string) {
        const url = this.updaters.set_content_frequency;
        const body = { frequency, playlistContentId, playlistId };
        return this.postRequest(url, body);
    }

    swapPlaylistContent(data: { contentId: string; playlistContentId: string; duration: number }, isFrequency = false) {
        const frequencyEndpoint = 'playlistsv2/content/swap/parent';
        const endpoint = isFrequency ? frequencyEndpoint : 'playlistsv2/swapcontent';
        return this.postRequest(endpoint, data);
    }

    updateContentSchedule(data: { playlistContentsScheduleId?: string; type: number }[]) {
        return this.postRequest(this.updaters.content_schedule_v2, data);
    }

    updatePlaylistContent(data: PlaylistContentUpdate) {
        return this.postRequest(`playlistsv2/updatecontent`, data).map((data) => data);
    }
}
