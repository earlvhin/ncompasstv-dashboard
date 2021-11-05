import { EventEmitter, Injectable } from '@angular/core';

import { API_ADVERTISER, API_SINGLE_HOST, API_LICENSE, API_SINGLE_PLAYLIST,
	API_SINGLE_SCREEN, API_USER_DATA } from 'src/app/global/models';

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
	onRefreshUsersPage = new EventEmitter<void>();
    onResetAutocompleteField = new EventEmitter<string>();
	onSelectAnalyticsTab = new EventEmitter<string>();
	onToggleEmailNotification = new EventEmitter<{ userId: string, value: boolean, tableDataIndex: number, currentEmail: string }>();
	onResultToggleEmailNotification = new EventEmitter<{ tableDataIndex: number, updated: boolean }>();
	onRefreshSingleHostImagesTab = new EventEmitter<void>();
	onRefreshSingleHostDocumentsTab = new EventEmitter<void>();

	singleAdvertiserData: API_ADVERTISER;
	singleHostData: API_SINGLE_HOST;
	singleLicenseData: API_LICENSE;
	singlePlaylistData: API_SINGLE_PLAYLIST;
	singleScreenData: API_SINGLE_SCREEN;
	singleUserData: API_USER_DATA;
}