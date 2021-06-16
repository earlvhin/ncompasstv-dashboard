import { EventEmitter, Injectable } from '@angular/core';

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

}