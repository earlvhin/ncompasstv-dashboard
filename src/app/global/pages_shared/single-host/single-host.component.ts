import { UpperCasePipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { Subject, Subscription } from 'rxjs';
import * as io from 'socket.io-client';

import { AssignLicenseModalComponent } from '../../components_shared/license_components/assign-license-modal/assign-license-modal.component';
import { UnassignHostLicenseComponent } from '../../components_shared/license_components/unassign-host-license/unassign-host-license.component';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { environment } from '../../../../environments/environment';
import { CustomFields, FieldGroupFields } from '../../models/host-custom-field-group';

import { AuthService, HelperService, HostService, LicenseService } from 'src/app/global/services';
import { API_SINGLE_HOST, API_LICENSE, UI_HOST_LICENSE, UI_ROLE_DEFINITION } from 'src/app/global/models';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'app-single-host',
	templateUrl: './single-host.component.html',
	styleUrls: ['./single-host.component.scss'],
	providers: [UpperCasePipe, DatePipe, TitleCasePipe]
})

export class SingleHostComponent implements OnInit {

	_socket: any;
	d_name: string;
	d_desc: string ;
	dealer_id: string;
	field_group_fields: FieldGroupFields[] = [];
	filtered_data: UI_HOST_LICENSE[] = [];
	has_records: boolean = true;
	host_id: string;
	host_license_api: API_LICENSE[];
	host_data: API_SINGLE_HOST;
	host_license: UI_HOST_LICENSE[] = [];
	host_license_count: any;
	host_fields: CustomFields[] = [];
	host_field_title: string;
	img: string = "assets/media_files/admin-icon.png";
	is_administrator: boolean;
	is_dealer: boolean = false;
	is_initial_load = true;
	lat: string;
	long: string;
	margin_more: boolean = false;
	margin_notes = false;
	no_record: boolean = false;
	no_case: boolean = true;
	pi_updating: boolean;
	single_host_data: any;
	subscription: Subscription = new Subscription();
	update_btn: string = "Update System and Restart";

	host_license_table_col = [
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
	
	private business_hours_update_sub: Subscription;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _allcaps: UpperCasePipe,
		private _date: DatePipe,
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _helper: HelperService,
		private _host: HostService,
		private _license: LicenseService,
		private _params: ActivatedRoute,
		private _titlecase: TitleCasePipe
	) { }

	ngOnInit() {

		this._socket = io(environment.socket_server, {
			transports: ['websocket'],
			query: 'client=Dashboard__SingleHostComponent'
		});

		this._socket.on('connect', () => {
			console.log('#SingleHostComponent - Connected to Socket Server');
		})
		
		this._socket.on('disconnect', () => {
			console.log('#SingleHostComponent - Disconnnected to Socket Server');
		})
		
		if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
		} else if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.administrator) {
			this.is_administrator = true;
		}

		this.subscription.add(
			this._params.paramMap.subscribe(
				() => {
					this.host_id = this._params.snapshot.params.data;
					this.getLicenseByHostId(this._params.snapshot.params.data);
				}
			)
		);
			
		this.getHostById();

		if (!this.business_hours_update_sub) this.subscribeToBusinessHoursUpdate();

		this.getHostFields();

	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
		this.subscription.unsubscribe();
		this.business_hours_update_sub.unsubscribe();
		this._socket.disconnect();
	}

	getHostFields(): void {

		this.subscription.add(
			this._host.get_fields().subscribe(
				response => {
					this.host_fields = response.paging.entities;
				}, 
				error => console.log('Error retrieving host fields', error)
			)
		);

	}

	getFieldGroup(id: string, title: string) {

		this.subscription.add(
			this._host.get_field_by_id(id)
				.subscribe(
					(response: any) => {
						this.host_field_title = title;
						this.field_group_fields = response.fields;
					},
					error => console.log('Error retrieving host field by id', error)
				)
		);

	}

	openAssignLicenseModal(): void {
		let dialogRef = this._dialog.open(AssignLicenseModalComponent, {
			width: '500px',
			data: this.single_host_data
		})

		dialogRef.afterClosed().subscribe(
			data => {
				if (data) {
					this.ngOnInit();
				}
			}
		)
	}

	toggledHours(e) {
		this.margin_more = e;
	}

	toggledNotes(value: boolean): void {
		this.margin_notes = value;
	}

	didToggleNotesAndHours(): boolean {

		if (this.margin_notes && this.margin_more) {
			return true;
		}

		return false;

	}

	filterData(data) {
		this.filtered_data = data;
	}

	getLicenseByHostId(id) {
		this.host_license = [];
		this.no_record = false;
		this.subscription.add(
			this._license.get_license_by_host_id(id).subscribe(
				(data: any) => {
					if(!data.message) {
						// If not error
						this.host_license_api = data;
						this.host_license = this.hostLicense_mapToUIFormat(this.host_license_api);
						this.filtered_data = this.hostLicense_mapToUIFormat(this.host_license_api);
					} else {
						// If Error
						this.no_record = true;
						this.host_license = data;
					}
				}
			)
		);
	}

	hostLicense_mapToUIFormat(data:any) {
		let counter = 1;
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		return data.map(
			l => {
				return new UI_HOST_LICENSE(
					{ value: l.licenseId, link: null , editable: false, hidden: true},
					{ value: counter++, link: null , editable: false, hidden: false},
					{ value: l.licenseKey, link: `/${route}/licenses/` + l.licenseId, editable: false, hidden: false, status: true},
					{ value: l.alias ? l.alias : '--', link: `/${route}/licenses/` + l.licenseId, editable: true, label: 'License Alias', id: l.licenseId, hidden: false},
					{ value: l.screenTypeId != null ? this._titlecase.transform(l.screenTypeName) : '--', link: null , editable: false, hidden: false},
					{ value: l.screenId != null ? this._titlecase.transform(l.screenName) : '--', link: l.screenId != null ? `/${route}/screens/` + l.screenId : null , editable: false, hidden: false},
					{ value: l.macAddress ? this._allcaps.transform(l.macAddress) : '--', link: null , editable: false, hidden: false},
					{ value: l.internetType ? l.internetType : '--', link: null , editable: false, hidden: false},
					{ value: l.internetSpeed ? l.internetSpeed: '--', link: null , editable: false, hidden: false},	
					{ value: l.contentsUpdated ? this._date.transform(l.contentsUpdated): '--', link: null , editable: false, hidden: false},
					{ value: l.timeIn ? this._date.transform(l.timeIn): '--', link: null , editable: false, hidden: false},
					{ value: l.timeOut ? this._date.transform(l.timeOut): '--', link: null , editable: false, hidden: false},
					{ value: l.installDate ? this._date.transform(l.installDate, 'MMM dd, y') : '--', link: null, editable: true, label: 'Install Date', hidden: false, id: l.licenseId },
					{ value: l.piStatus, link: null , editable: false, hidden: true },
				)
			}
		)
	}

	reloadLicense() {
		this.host_license = [];
		this.ngOnInit();
	}

	updateAndRestart() {
		this.warningModal('warning', 'Update System and Restart', 'Are you sure you want to update the player and restart the pi?', 'Click OK to push updates for this license', 'system_update');
	}

	updateToVersion2() {
		this.warningModal('warning', 'Upgrade Players to Version 2', 'Upgrade players with licenses below  to version 2?', 'Click OK to apply updates to licences below', 'upgrade_to_v2')
	}

	pushUpdate() {
		this.warningModal('warning', 'Push Updates', 'Are you sure you want to push updates?', 'Click OK to push updates for this license', 'update');
	}

	warningModal(status, message, data, return_msg, action): void {
		this._dialog.closeAll();
		
		let dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data,
				return_msg: return_msg,
				action: action
			}
		})

		dialogRef.afterClosed().subscribe(result => {
			if(result === 'system_update') {
				this.host_license_api.forEach(
					(i: any) => {
						// console.log('SystemUpdate Emitted:', i.licenseId)
						this._socket.emit('D_system_update_by_license', i.licenseId);
					}
				)

				this.pi_updating = true;
				this.update_btn = 'Ongoing System Update';
			} else if(result === 'update') {
				this.host_license_api.forEach(
					(i: any) => {
						// console.log('D_update_player:', i.licenseId)
						this._socket.emit('D_update_player', i.licenseId);
					}
				)

				this.pi_updating = true;
				this.update_btn = 'Ongoing Content Update';
			}  else if(result === 'upgrade_to_v2') {
				this.host_license_api.forEach(
					(i: any) => {
						// console.log('D_upgrade_to_v2_by_license:', i.licenseId)
						this._socket.emit('D_upgrade_to_v2_by_license', i.licenseId);
					}
				)
			}
		});
	}

	unassignHostLicense() {
		let dialog = this._dialog.open(UnassignHostLicenseComponent, {
			width: '500px',
			data: this.host_license_api ? this.host_license_api : null
		})

		dialog.afterClosed().subscribe(
			data => {
				if (data) {
					this.reloadLicense();
				}
			}
		);
	}

	getLicenseTotalByHostIdDealerId() {
	let dealerId = this.single_host_data.dealer_id;
	let hostId = this.single_host_data.host_id;
	this.subscription.add(
		this._license.api_get_licenses_total_by_host_dealer(dealerId, hostId).subscribe(
			(data: any) => {
				if(data)
				{
					this.host_license_count = {
						total_count: data.total,
						total_count_label: 'License(s)',
						active_value: data.totalActive,
						active_value_label: 'Active',
						inactive_value: data.totalInActive,
						inactive_value_label: 'Inactive',
						online_value: data.totalOnline,
						online_value_label: 'Online',
						offline_value: data.totalOffline,
						offline_value_label: 'Offline'
					}
				}
			},
			error => console.log('Error retrieving total license count', error)
		)
	);
	}

	private getHostById() {

		if (this.is_initial_load && (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer')) {
			this.setPageData(this._helper.singleHostData);
			this.is_initial_load = false;
			return;
		}

		this._host.get_host_by_id(this.host_id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { host, dealer, hostTags }) => this.setPageData(response),
				error => console.log('Error retrieving host by ID', error)
			);

	}

	private setPageData(response: { host, dealer, hostTags }) {
		const { host, dealer, hostTags } = response;
		host.tags = hostTags;
		this.host_data = response.host;
		this.single_host_data = { dealer_id: dealer.dealerId, host_id: this.host_id };
		this.d_name = host.name;
		this.d_desc = host.address ? `${host.address}, ${host.city}, ${host.state} ${host.postalCode}` : 'No Address Available';
		this.lat = host.latitude;
		this.long = host.longitude;
		this.getLicenseTotalByHostIdDealerId();
	}

	private subscribeToBusinessHoursUpdate(): void {
		this.business_hours_update_sub = this._host.onUpdateBusinessHours.subscribe(
			(response: boolean) => {
				if (response) {
					this.host_license_api.forEach(
						(license: any) => {
							console.log('System Update Emitted:', license.licenseId);
							this._socket.emit('D_update_player', license.licenseId);
						}
					);
				}
			}
		);
	}

	protected get currentRole() {
		return this._auth.current_role;
	}
}
