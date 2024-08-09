import { Injectable, EventEmitter } from '@angular/core';
import * as moment from 'moment';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import {
    API_ADVERTISER,
    API_SINGLE_HOST,
    API_SINGLE_PLAYLIST,
    API_SINGLE_SCREEN,
    API_USER_DATA,
    API_SINGLE_LICENSE_PAGE,
    API_LICENSE_PROPS,
    API_CONTENT,
    API_HOST,
    API_SCREEN,
} from 'src/app/global/models';

@Injectable({
    providedIn: 'root',
})
export class HelperService {
    singleLicensePageCurrentTab: string;
    renderedChartIds = [];

    onClickCardByStatus = new Subject<{ page: string; value: string }>();
    onDealerSelected$ = new Subject<{ id: string; value: string }>();
    onHoverContent = new Subject<{ playlistContentId: string }>();
    onRefreshUsersPage = new Subject<void>();
    onResetAutocompleteField = new Subject<string>();
    onResultToggleEmailNotification = new Subject<{ tableDataIndex: number; updated: boolean }>();
    onRefreshSingleHostImagesTab = new Subject<void>();
    onRefreshSingleHostDocumentsTab = new Subject<void>();
    onToggleEmailNotification = new Subject<{
        userId: string;
        value: boolean;
        tableDataIndex: number;
        currentEmail: string;
    }>();
    onTouchPaginatedAutoCompleteField = new Subject<void>();
    onRefreshBannerData = new Subject<void>();
    onUpdateInstallationDate = new Subject<void>();

    singleAdvertiserData: API_ADVERTISER;
    singleHostData: API_SINGLE_HOST;
    singleLicenseData: API_SINGLE_LICENSE_PAGE;
    singlePlaylistData: {
        licenses: API_LICENSE_PROPS[];
        playlist: API_SINGLE_PLAYLIST;
        playlistContents: API_CONTENT[];
        hostLicenses: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[];
        screens: API_SCREEN[];
    };
    singleScreenData: API_SINGLE_SCREEN;
    singleUserData: API_USER_DATA;
    currentlySelectedDealer: { id: string; value: string } = null;

    /**
     * Use this function to retrieve the correct date computation using the mat-datepicker.
     * This is to fix the offset made when a user is on a different timezone.
     * @param {string} data
     * @returns {Date}
     */
    parseDate(data: Date): Date {
        return moment.utc(data).toDate();
    }

    /**
     * Converts a date object to string for readability
     * @param {Date} data
     * @returns {string}
     */
    dateToString(data: Date): string {
        return moment(data).format('YYYY-MM-DD');
    }

    /**
     * Reduces the length of the string based on the given limit
     *
     * @param {string} data
     * @param {number} limit
     * @returns {string}
     */
    truncateText(data: string, limit: number = 250): string {
        if (data.length > limit) return `${data.slice(0, limit)}...`;
        return data;
    }
}
