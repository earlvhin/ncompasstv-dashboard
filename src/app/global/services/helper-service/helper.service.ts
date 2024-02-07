import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import {
    API_ADVERTISER,
    API_SINGLE_HOST,
    API_SINGLE_PLAYLIST,
    API_SINGLE_SCREEN,
    API_USER_DATA,
    API_SINGLE_LICENSE_PAGE,
} from 'src/app/global/models';

@Injectable({
    providedIn: 'root',
})
export class HelperService {
    singleLicensePageCurrentTab: string;
    renderedChartIds = [];

    onClickCardByStatus = new Subject<{ page: string; value: string }>();
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
    singlePlaylistData: API_SINGLE_PLAYLIST;
    singleScreenData: API_SINGLE_SCREEN;
    singleUserData: API_USER_DATA;
}
