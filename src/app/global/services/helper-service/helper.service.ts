import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Subject } from 'rxjs';

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

    /**
     * Use this function to retrieve the correct date computation using the mat-datepicker.
     * This is to fix the offset made when a user is on a different timezone.
     * @param {string} data
     * @returns {Date}
     */
    parseDate(data: Date): Date {
        const result = new Date(data);
        result.setMinutes(result.getMinutes() + result.getTimezoneOffset());
        return result;
    }

    /**
     * Converts a date object to string for readability
     * @param {Date} data
     * @returns {string}
     */
    dateToString(data: Date): string {
        return moment(data).format('YYYY-MM-DD');
    }
}
