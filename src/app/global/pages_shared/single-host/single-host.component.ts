import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { UpperCasePipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { HostService } from '../../services/host-service/host.service';
import { LicenseService } from '../../services/license-service/license.service';
import { API_SINGLE_HOST } from '../../models/api_host.model';
import { API_LICENSE } from '../../models/api_license.model';
import { UI_HOST_LICENSE } from '../../models/ui_host-license.model';
import { AssignLicenseModalComponent } from '../../components_shared/license_components/assign-license-modal/assign-license-modal.component';
import { AuthService } from '../../services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { UnassignHostLicenseComponent } from '../../components_shared/license_components/unassign-host-license/unassign-host-license.component';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { environment } from '../../../../environments/environment';

@Component({
	selector: 'app-single-host',
	templateUrl: './single-host.component.html',
	styleUrls: ['./single-host.component.scss'],
	providers: [UpperCasePipe, DatePipe, TitleCasePipe]
})

export class SingleHostComponent implements OnInit {

	subscription: Subscription = new Subscription();
	is_dealer: boolean = false;
	margin_more: boolean = false;
	margin_notes = false;
	img: string = "assets/media_files/admin-icon.png";
	d_name: string;
	d_desc: string ;
	host_id: string;
	dealer_id: string;
	single_host_data: any;
	no_record: boolean = false;
	has_records: boolean = true;
	host_license_api: API_LICENSE[];
	host_data: API_SINGLE_HOST;
	filtered_data: UI_HOST_LICENSE[] = [];
	host_license: UI_HOST_LICENSE[] = [];
	host_license_table_col = [
		'#',
		'License Key',
		'License Alias',
		'Type',
		'Mac Address',
		'Internet Type',
		'Internet Speed',
		'Last Push Update',
		'Last Online Status',
		'Last Offline Status',
		'Install Date'
	];

	lat: string;
	long: string;
	no_case: boolean = true;
	pi_updating: boolean;
	update_btn: string = "Update System and Restart";

	private business_hours_update_sub: Subscription;

	constructor(
		private _params: ActivatedRoute,
		private _host: HostService,
		private _dialog: MatDialog,
		private _license: LicenseService,
		private _auth: AuthService,
		private _allcaps: UpperCasePipe,
		private _router: Router,
		private _date: DatePipe,
		private _titlecase: TitleCasePipe,
		private _socket: Socket
	) { }

	ngOnInit() {
		this._socket.ioSocket.io.uri = environment.socket_server;
		this._socket.connect();
		
		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
		}

		this.subscription.add(
			this._params.paramMap.subscribe(
				() => {
					this.host_id = this._params.snapshot.params.data;
					this.getLicenseByHostId(this._params.snapshot.params.data);
				}
			)
		);
			
		this.subscription.add(
			this._host.get_host_by_id(this.host_id).subscribe(
				(data: any) => {
					console.log('#GET_HOST_BY_ID', data)
					this.host_data = data;
					this.single_host_data = { dealer_id: data.dealer.dealerId, host_id: this.host_id };
					this.d_name = data.host.name;
					this.d_desc = data.host.address ? `${data.host.address}, ${data.host.city}, ${data.host.state} ${data.host.postalCode}` : 'No Address Available';
					this.lat = data.host.latitude;
					this.long = data.host.longitude;
				},
				error => console.log('Error retrieving host by ID', error)
			)
		);

		if (!this.business_hours_update_sub) this.subscribeToBusinessHoursUpdate();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.business_hours_update_sub.unsubscribe();
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
						console.log('SystemUpdate Emitted:', i.licenseId)
						this._socket.emit('D_system_update_by_license', i.licenseId);
					}
				)

				this.pi_updating = true;
				this.update_btn = 'Ongoing System Update';
			} else if(result === 'update') {
				this.host_license_api.forEach(
					(i: any) => {
						console.log('D_update_player:', i.licenseId)
						this._socket.emit('D_update_player', i.licenseId);
					}
				)

				this.pi_updating = true;
				this.update_btn = 'Ongoing Content Update';
			} 
		});
	}

	unassignHostLicense() {
		console.log(this.host_license_api)
		let dialog = this._dialog.open(UnassignHostLicenseComponent, {
			width: '500px',
			data: this.host_license_api ? this.host_license_api : null
		})

		dialog.afterClosed().subscribe(
			data => {
				if (data) {
					this.ngOnInit();
				}
			}
		);
	}

	private subscribeToBusinessHoursUpdate(): void {
		this.business_hours_update_sub = this._host.onUpdateBusinessHours.subscribe(
			(response: boolean) => {
				if (response) {
					this.host_license_api.forEach(
						(license: any) => {
							console.log('System Update Emitted:', license.licenseId);
							this._socket.emit('D_system_update_by_license', license.licenseId);
						}
					);

				}
			}
		);
	}
}
