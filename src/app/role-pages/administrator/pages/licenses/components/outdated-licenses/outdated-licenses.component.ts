import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { API_FILTERS, API_LICENSE_PROPS, PAGING } from 'src/app/global/models';
import { UI_LICENSE } from 'src/app/global/models/ui-license.model';
import { AuthService, LicenseService, UpdateService } from 'src/app/global/services';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-outdated-licenses',
	templateUrl: './outdated-licenses.component.html',
	styleUrls: ['./outdated-licenses.component.scss']
})
export class OutdatedLicensesComponent implements OnInit, OnDestroy {
	currentTableData: UI_LICENSE[] = [];
	filters: API_FILTERS = { page: 1, pageSize: 15, sortColumn: 'UiVersion', sortOrder: 'asc' };
	hasNoData = false;
	latestVersion = { server: null, ui: null };
	isPageReady = false;
	isPreloadDataReady = false;
	searchControl = new FormControl(null);
	tableColumns = this._tableColumns;

	private currentPaging: PAGING;
	private queuedForReset: UI_LICENSE[] = [];
	private queuedTableData: UI_LICENSE[] = [];
	protected _unsubscribe = new Subject<void>();

	constructor(private _auth: AuthService, private _datePipe: DatePipe, private _license: LicenseService, private _update: UpdateService) {}

	ngOnInit() {
		this.loadLicenses().add(() => (this.queuedForReset = Array.from(this.currentTableData)));
		this.subscribeToLicenseSearch();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	addToTable() {
		this.isPreloadDataReady = false;
		this.currentTableData = this.currentTableData.concat(this.queuedTableData);
		this.preloadLicenses();
	}

	sortTable(data: { column: string; order: string }) {
		this.resetFilters();
		this.filters.sortColumn = data.column;
		this.filters.sortOrder = data.order;
		this.loadLicenses();
	}

	private loadLicenses() {
		this.isPageReady = false;
		return this.getOutdatedLicenses().subscribe(
			(response) => {
				if ('message' in response) {
					this.hasNoData = true;
					return;
				}

				this.latestVersion = {
					server: response.appServerVersion,
					ui: response.appUiVersion
				};

				this.currentPaging = response.paging;
				const mapped = this.mapToDataTable(response.paging.entities);
				this.currentTableData = [...mapped];
				this.preloadLicenses();
				this.isPageReady = true;
			},
			(error) => {
				this.hasNoData = true;
				throw new Error(error);
			}
		);
	}

	private getOutdatedLicenses() {
		return this._license.get_outdated_licenses(this.filters).pipe(takeUntil(this._unsubscribe));
	}

	private mapToDataTable(data: API_LICENSE_PROPS[]): UI_LICENSE[] {
		let count = this.currentPaging.pageStart;

		const isBlankOrEmptyString = (value: string) => {
			return typeof value === 'undefined' || !value || value.trim().length === 0;
		};

		const parseDate = (date: string) => {
			if (isBlankOrEmptyString(date)) return '--';
			return this._datePipe.transform(date, 'MMM dd, y h:mm a');
		};

		const parseImageUrl = (image: string) => (image ? `${environment.base_uri}${image.replace('/API/', '')}` : null);

		return data.map((license) => {
			let mapped = {} as UI_LICENSE;

			this._tableColumns.forEach(({ key }) => {
				mapped[key] = { value: license[key] };

				switch (key) {
					case 'index':
						mapped[key].value = count++;
						break;
					case 'dealerId':
						mapped[key].value = license.businessName;
						break;
					case 'hostId':
						mapped[key].value = license.hostName;
						break;
					case 'screenId':
						mapped[key].value = license.screenName;
						break;
					case 'screenshotUrl':
						const parsedImageUrl = parseImageUrl(license.screenshotUrl);
						mapped[key].link = parsedImageUrl;
						mapped[key].value = parsedImageUrl;
						mapped[key].isImage = true;
						break;
					case 'displayStatus':
						mapped[key].value = license.displayStatus === 1 ? 'ON' : 'OFF';
						break;
					case 'lastDisconnect':
						mapped[key].value = parseDate(license.timeOut);
						break;
					case 'lastPush':
						mapped[key].value = parseDate(license.contentsUpdated);
						break;
					case 'alias':
					case 'licenseKey':
						const isInvalidString = isBlankOrEmptyString(license[key]);
						mapped[key].value = isInvalidString ? '--' : license[key];
						if (isInvalidString) break;
						mapped[key].link = `/${this._currentRole}/licenses/${license.licenseId}`;
						mapped[key].new_tab_link = true;
						break;
					default: // intentionally blank to fulfil coding guidelines
				}

				if (key.includes('Id')) {
					const isInvalidString = isBlankOrEmptyString(mapped[key].value);

					if (isInvalidString) {
						mapped[key].value = '--';
						return;
					}

					let pageName = `${key.split('Id')[0]}s`;
					mapped[key].link = `/${this._currentRole}/${pageName}/${license[key]}`;
					mapped[key].new_tab_link = true;
				}
			});

			return mapped;
		});
	}

	private preloadLicenses() {
		this.filters.page++;

		return this.getOutdatedLicenses().subscribe((response) => {
			if ('message' in response || response.paging.entities.length === 0) {
				this.isPreloadDataReady = true;
				this.hasNoData = true;
				return;
			}

			this.currentPaging = response.paging;
			this.queuedTableData = this.mapToDataTable(response.paging.entities);
			this.filters.page = response.paging.page;
			this.isPreloadDataReady = true;
		});
	}

	private resetFilters(): void {
		this.filters = {
			page: 1,
			pageSize: 15,
			sortColumn: 'UiVersion',
			sortOrder: 'asc'
		};
	}

	private searchOutdatedLicenses() {
		this.getOutdatedLicenses().subscribe((response) => {
			if (response.paging.entities.length === 0) {
				this.hasNoData = true;
				return;
			}

			this.currentPaging = response.paging;
			this.currentTableData = this.mapToDataTable(response.paging.entities);
			this.isPageReady = true;
		});
	}

	private subscribeToLicenseSearch() {
		const control = this.searchControl;

		control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000)).subscribe((keyword: string) => {
			this.hasNoData = false;
			this.isPageReady = false;
			this.resetFilters();

			if (!keyword || keyword.trim().length === 0) {
				delete this.filters.search;
				this.currentTableData = [...this.queuedForReset];
				this.resetFilters();
				this.preloadLicenses();
				setTimeout(() => (this.isPageReady = true), 1000);
				return;
			}

			this.filters.search = keyword;
			this.searchOutdatedLicenses();
			this.preloadLicenses();
		});
	}

	protected get _tableColumns() {
		return [
			{ name: '#', key: 'index' },
			{ name: 'Screenshot', key: 'screenshotUrl' },
			{ name: 'Alias', key: 'alias' },
			{ name: 'Key', key: 'licenseKey' },
			{ name: 'Server', key: 'serverVersion', column: 'ServerVersion', sortable: true },
			{ name: 'UI', key: 'uiVersion', column: 'UiVersion', sortable: true },
			{ name: 'Display', key: 'displayStatus' },
			{ name: 'Dealer', key: 'dealerId' },
			{ name: 'Host', key: 'hostId' },
			{ name: 'Screen', key: 'screenId' },
			{ name: 'Last Disconnect', key: 'lastDisconnect' },
			{ name: 'Last Push', key: 'lastPush' }
		];
	}

	protected get _columnNames() {
		return this._tableColumns.map((column) => column.name);
	}

	protected get _currentRole() {
		return this._auth.current_role;
	}
}
