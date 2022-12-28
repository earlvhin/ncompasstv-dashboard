import { EventEmitter, Injectable } from '@angular/core';

import {
	API_ADVERTISER,
	API_SINGLE_HOST,
	API_SINGLE_PLAYLIST,
	API_SINGLE_SCREEN,
	API_USER_DATA,
	API_SINGLE_LICENSE_PAGE
} from 'src/app/global/models';

@Injectable({
	providedIn: 'root'
})
export class HelperService {
	singleLicensePageCurrentTab: string;
	renderedChartIds = [];

	analyticsOnSelectMonth = new EventEmitter<void>();
	onClickAllDealers = new EventEmitter<void>();
	onClickActiveDealers = new EventEmitter<void>();
	onClickInactiveDealers = new EventEmitter<void>();
	onClickCardByStatus = new EventEmitter<{ page: string; value: string }>();
	onHoverContent = new EventEmitter<{ playlistContentId: string }>();
	onRefreshUsersPage = new EventEmitter<void>();
	onResetAutocompleteField = new EventEmitter<string>();
	onResultToggleEmailNotification = new EventEmitter<{ tableDataIndex: number; updated: boolean }>();
	onRefreshSingleHostImagesTab = new EventEmitter<void>();
	onRefreshSingleHostDocumentsTab = new EventEmitter<void>();
	onSelectAnalyticsTab = new EventEmitter<string>();
	onToggleEmailNotification = new EventEmitter<{ userId: string; value: boolean; tableDataIndex: number; currentEmail: string }>();
	onTouchPaginatedAutoCompleteField = new EventEmitter<void>();
	onUpdateInstallationDate = new EventEmitter<void>();

	singleAdvertiserData: API_ADVERTISER;
	singleHostData: API_SINGLE_HOST;
	singleLicenseData: API_SINGLE_LICENSE_PAGE;
	singlePlaylistData: API_SINGLE_PLAYLIST;
	singleScreenData: API_SINGLE_SCREEN;
	singleUserData: API_USER_DATA;
}