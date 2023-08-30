import { DatePipe, TitleCasePipe } from '@angular/common';
import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { UnassignHostLicenseComponent } from 'src/app/global/components_shared/license_components/unassign-host-license/unassign-host-license.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { API_LICENSE, PAGING, UI_CURRENT_USER, UI_HOST_LICENSE } from 'src/app/global/models';
import { HelperService, LicenseService } from 'src/app/global/services';

@Component({
	selector: 'app-licenses-tab',
	templateUrl: './licenses-tab.component.html',
	styleUrls: ['./licenses-tab.component.scss']
})
export class LicensesTabComponent implements OnInit, OnDestroy, AfterViewInit {
	@Input() currentRole: string;
	@Input() currentUser: UI_CURRENT_USER;
	@Input() hostId: string;
	@Input() socket: any;

	hasNoData = false;
	isViewOnly = false;
	isPiUpdating: boolean;
	licenses: API_LICENSE['license'][] = [];
	pagingData: PAGING;
	searchFormControl = new FormControl('', Validators.minLength(3));
	tableColumns: string[];
	tableData: UI_HOST_LICENSE[] = [];
	updateBtnText = 'Update System and Restart';

	protected _unsubscribe = new Subject<void>();

	constructor(private _date: DatePipe, private _dialog: MatDialog, private _helper: HelperService, private _license: LicenseService, private _titlecase: TitleCasePipe) {}

	ngOnInit() {
		this.tableColumns = this.columns;
		this.isViewOnly = this.currentUser.roleInfo.permission === 'V';
		this.searchLicenses();
		this.subscribeToRefresh();
	}

	ngAfterViewInit() {
		this.subscribeToSearch();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	filterData(data: UI_HOST_LICENSE[]) {
		if (!data || data.length <= 0) {
			this.tableData = [];
			return;
		}

		this.tableData = data;
	}

	onPushUpdate(): void {
		this.openWarningModal(
			'warning',
			'Push Updates',
			'Are you sure you want to push updates?',
			'Click OK to push updates for this license',
			'update'
		);
	}

	onReloadLicenses(): void {
		this.tableData = [];
		this.licenses = [];
		this.ngOnInit();
	}

	onUnassignLicense(): void {
		const dialog = this._dialog.open(UnassignHostLicenseComponent, {
			width: '500px',
			data: this.licenses
		});

		dialog.afterClosed().subscribe((response) => {
			if (!response) return;
			this._helper.onRefreshBannerData.next();
			this.onReloadLicenses();
		});
	}

	onUpdateAndRestart(): void {
		this.openWarningModal(
			'warning',
			'Update System and Restart',
			'Are you sure you want to update the player and restart the pi?',
			'Click OK to push updates for this license',
			'system_update'
		);
	}

	private mapToTable(data: API_LICENSE['license'][]): UI_HOST_LICENSE[] {
		let counter = 1;

		return data.map((license) => {
			return {
				license_id: { value: license.licenseId, link: null, editable: false, hidden: true },
				index: { value: counter++, link: null, editable: false, hidden: false },
				license_key: {
					value: license.licenseKey,
					link: `/${this.currentRole}/licenses/` + license.licenseId,
                    new_tab_link: true,
					editable: false,
					hidden: false,
					status: true
				},
				alias: {
					value: license.alias ? license.alias : '--',
					link: `/${this.currentRole}/licenses/` + license.licenseId,
                    new_tab_link: true,
					editable: true,
					label: 'License Alias',
					id: license.licenseId,
					hidden: false
				},
				type: {
					value: license.screenTypeId != null ? this._titlecase.transform(license.screenTypeName) : '--',
					link: null,
					editable: false,
					hidden: false
				},
				screen: {
					value: license.screenId != null ? this._titlecase.transform(license.screenName) : '--',
					link: license.screenId != null ? `/${this.currentRole}/screens/` + license.screenId : null,
                    new_tab_link: true,
					editable: false,
					hidden: false
				},
				internet_type: { value: license.internetType ? license.internetType : '--', link: null, editable: false, hidden: false },
				internet_speed: { value: license.internetSpeed ? license.internetSpeed : '--', link: null, editable: false, hidden: false },
				mac_address: {
					value: license.macAddress ? license.macAddress : '--',
					link: null,
					editable: false,
					hidden: false
				},
				online_status: { value: license.timeIn ? this._date.transform(license.timeIn) : '--', link: null, editable: false, hidden: false },
				offline_status: { value: license.timeOut ? this._date.transform(license.timeOut) : '--', link: null, editable: false, hidden: false },
				install_date: {
					value: license.installDate ? this._date.transform(license.installDate, 'MMM dd, y') : '--',
					link: null,
					editable: true,
					label: 'Install Date',
					hidden: false,
					id: license.licenseId
				},
				pi_status: { value: license.piStatus, link: null, editable: false, hidden: true },
				player_status: { value: license.playerStatus, link: null, editable: false, hidden: true },
				is_activated: { value: license.isActivated, link: null, editable: false, hidden: true }
			};
		});
	}

	private openWarningModal(status: string, message: string, data: string, return_msg: string, action: string): void {
		this._dialog.closeAll();

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data, return_msg, action }
		});

		dialog.afterClosed().subscribe((result) => {
			switch (result) {
				case 'system_update':
					this.licenses.forEach((data) => this.socket.emit('D_system_update_by_license', data.licenseId));
					this.isPiUpdating = true;
					this.updateBtnText = 'Ongoing System Update';
					break;

				case 'update':
					this.licenses.forEach((data) => this.socket.emit('D_update_player', data.licenseId));
					this.isPiUpdating = true;
					this.updateBtnText = 'Ongoing Content Update';
					break;

				case 'upgrade_to_v2':
					this.licenses.forEach((data) => this.socket.emit('D_upgrade_to_v2_by_license', data.licenseId));
					break;
			}
		});
	}

	private searchLicenses(keyword: string = '') {
		this.tableData = [];

		this._license
			.search_license_by_host(this.hostId, keyword)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					if (response.message) {
						this.tableData = [];
						this.licenses = [];
						this.hasNoData = true;
						return;
					}

					// const data = response as { licenses: API_LICENSE['license'][]; paging: PAGING };
					// this.pagingData = data.paging;
					this.licenses = [...response];
					this.tableData = this.mapToTable([...response]);
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private subscribeToRefresh(): void {
		this._license.onRefreshLicensesTab.pipe(takeUntil(this._unsubscribe)).subscribe(() => this.onReloadLicenses());
	}

	private subscribeToSearch(): void {
		const control = this.searchFormControl;

		control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000)).subscribe((keyword) => this.searchLicenses(keyword));
	}

	protected get columns() {
		return [
			'#',
			'License Key',
			'License Alias',
			'Type',
			'Screen',
			'Internet Type',
			'Internet Speed',
			'Mac Address',
			'Last Startup',
			'Last Disconnect',
			'Installation Date'
		];
	}
}
