import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as io from 'socket.io-client';

import { UnassignHostLicenseComponent } from 'src/app/global/components_shared/license_components/unassign-host-license/unassign-host-license.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { API_LICENSE, PAGING, UI_CURRENT_USER, UI_HOST_LICENSE } from 'src/app/global/models';
import { LicenseService } from 'src/app/global/services';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-licenses-tab',
	templateUrl: './licenses-tab.component.html',
	styleUrls: ['./licenses-tab.component.scss']
})
export class LicensesTabComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input() currentRole: string;
	@Input() currentUser: UI_CURRENT_USER;
	@Input() hostId: string;

	_socket: any;

	licenses: API_LICENSE['license'][] = [];
	hasNoData = false;
	pagingData: PAGING;
	searchFormControl = new FormControl('', Validators.minLength(3));
	tableColumns: string[];
	tableData: UI_HOST_LICENSE[] = [];

	is_view_only = false;
	pi_updating: boolean;
	update_btn = 'Update System and Restart';

	protected _unsubscribe = new Subject<void>();

	constructor(
		private _allcaps: UpperCasePipe,
		private _date: DatePipe,
		private _dialog: MatDialog,
		private _license: LicenseService,
		private _titlecase: TitleCasePipe,
	) { }
	
	ngOnInit() {
		this.tableColumns = this.columns;
		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
		this.initializeSocket();
		// this.getLicenses();
		this.searchLicenses();
	}

	ngAfterViewInit() {
		this.subscribeToSearch();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
		this._socket.disconnect();
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

	onReloadLicense(): void {
		this.tableData = [];
		this.ngOnInit();
	}

	onUnassignLicense(): void {

		const dialog = this._dialog.open(UnassignHostLicenseComponent, {
			width: '500px',
			data: this.licenses
		});

		dialog.afterClosed().subscribe(
			response => {
				if (!response) return;
				this.onReloadLicense();
			}
		);
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

	private getLicenses(): void {
		this.hasNoData = false;

		this._license.get_license_by_host_id(this.hostId).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {

					if (typeof response === 'string') {
						this.hasNoData = true;
						return;
					}

					const licenses = response as API_LICENSE['license'][];
					this.licenses = [...licenses];
					this.tableData = this.mapToTable([...licenses]);

				},
				error => console.log('Error retrieving licenses by host ID', error)
			);
	}

	private initializeSocket(): void {
		this._socket = io(environment.socket_server, {
			transports: ['websocket'],
			query: 'client=Dashboard__SingleHostComponent'
		});

		this._socket.on('connect', () => {
			console.log('#SingleHostComponent - Connected to Socket Server');
		})
		
		this._socket.on('disconnect', () => {
			console.log('#SingleHostComponent - Disconnnected to Socket Server');
		});
	}

	private mapToTable(data: API_LICENSE['license'][]): UI_HOST_LICENSE[] {

		let counter = 1;
		
		return data.map(
			license => {

				return {
					license_id: { value: license.licenseId, link: null , editable: false, hidden: true },
					index: { value: counter++, link: null , editable: false, hidden: false },
					license_key: { value: license.licenseKey, link: `/${this.currentRole}/licenses/` + license.licenseId, editable: false, hidden: false, status: true },
					alias: { value: license.alias ? license.alias : '--', link: `/${this.currentRole}/licenses/` + license.licenseId, editable: true, label: 'License Alias', id: license.licenseId, hidden: false },
					type: { value: license.screenTypeId != null ? this._titlecase.transform(license.screenTypeName) : '--', link: null , editable: false, hidden: false},
					screen: { value: license.screenId != null ? this._titlecase.transform(license.screenName) : '--', link: license.screenId != null ? `/${this.currentRole}/screens/` + license.screenId : null , editable: false, hidden: false },
					mac_address: { value: license.macAddress ? this._allcaps.transform(license.macAddress) : '--', link: null , editable: false, hidden: false },
					internet_type: { value: license.internetType ? license.internetType : '--', link: null , editable: false, hidden: false },
					internet_speed: { value: license.internetSpeed ? license.internetSpeed: '--', link: null , editable: false, hidden: false },	
					last_push_update: { value: license.contentsUpdated ? this._date.transform(license.contentsUpdated): '--', link: null , editable: false, hidden: false },
					online_status: { value: license.timeIn ? this._date.transform(license.timeIn): '--', link: null , editable: false, hidden: false },
					offline_status: { value: license.timeOut ? this._date.transform(license.timeOut): '--', link: null , editable: false, hidden: false },
					install_date: { value: license.installDate ? this._date.transform(license.installDate, 'MMM dd, y') : '--', link: null, editable: true, label: 'Install Date', hidden: false, id: license.licenseId },
					pi_status: { value: license.piStatus, link: null , editable: false, hidden: true },
				}

			}
		);

	}

	private openWarningModal(status: string, message: string, data: string, return_msg: string, action: string): void {

		this._dialog.closeAll();
		
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data, return_msg, action }
		});

		dialog.afterClosed().subscribe(result => {

			switch (result) {
				
				case 'system_update':

					this.licenses.forEach(
						(i: any) => {
							this._socket.emit('D_system_update_by_license', i.licenseId);
						}
					)
	
					this.pi_updating = true;
					this.update_btn = 'Ongoing System Update';

					break;

				case 'update':

					this.licenses.forEach(
						(i: any) => {
							this._socket.emit('D_update_player', i.licenseId);
						}
					)
	
					this.pi_updating = true;
					this.update_btn = 'Ongoing Content Update';
					break;

				case 'upgrade_to_v2':

					this.licenses.forEach(
						(i: any) => {
							this._socket.emit('D_upgrade_to_v2_by_license', i.licenseId);
						}
					)
					break;

			}
		});
	}

	private searchLicenses(keyword: string = '') {

		this._license.search_license_by_host(this.hostId, keyword)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {

					if (response.message) {
						this.tableData = [];
						this.licenses = [];
						this.hasNoData = true;
						return;
					}

					const data = response as { licenses: API_LICENSE['license'][], paging: PAGING };
					this.pagingData = data.paging;
					this.licenses = [...data.licenses];
					this.tableData = this.mapToTable([...data.licenses]);

				},
				error => console.log('Error searching for licenses of host', error)
			);

	}

	private subscribeToSearch(): void {

		const control = this.searchFormControl;

		control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000), tap(() => this.tableData = []))
			.subscribe(keyword => this.searchLicenses(keyword));

	}

	protected get columns() {
		return [
			'#',
			'License Key',
			'License Alias',
			'Type',
			'Screen',
			'Mac Address',
			'Internet Type',
			'Internet Speed',
			'Last Push Update',
			'Last Online Status',
			'Last Offline Status',
			'Installation Date'
		];
	}

}
