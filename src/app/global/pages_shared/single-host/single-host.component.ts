import { UpperCasePipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AssignLicenseModalComponent } from '../../components_shared/license_components/assign-license-modal/assign-license-modal.component';
import { AuthService, HelperService, HostService, LicenseService } from 'src/app/global/services';
import { API_SINGLE_HOST, API_LICENSE, UI_HOST_LICENSE, HOST_LICENSE_STATISTICS, UI_ROLE_DEFINITION, 
	CustomFields, FieldGroupFields } from 'src/app/global/models';

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
	host_license_count: HOST_LICENSE_STATISTICS;
	host_fields: CustomFields[] = [];
	host_field_title: string;
	img: string = "assets/media_files/admin-icon.png";
	is_administrator: boolean;
	is_dealer: boolean = false;
	is_initial_load = true;
	is_view_only = false;
	lat: number;
	long: number;
	margin_more: boolean = false;
	margin_notes = false;
	no_record: boolean = false;
	no_case: boolean = true;
	pi_updating: boolean;
	single_host_data: any;
	update_btn: string = "Update System and Restart";

	currentRole = this._auth.current_role;
	currentUser = this._auth.current_user_value;

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
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _helper: HelperService,
		private _host: HostService,
		private _license: LicenseService,
		private _params: ActivatedRoute,
	) { }

	ngOnInit() {

		this.is_view_only = this.currentUser.roleInfo.permission === 'V';

		this._params.paramMap.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => this.host_id = this._params.snapshot.params.data);
			
		this.getHostById();

		if (!this.business_hours_update_sub) this.subscribeToBusinessHoursUpdate();

		this.getHostFields();

	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
		this.business_hours_update_sub.unsubscribe();
	}

	getHostFields(): void {

		this._host.get_fields().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => this.host_fields = response.paging.entities, 
				error => console.log('Error retrieving host fields', error)
			);

	}

	getFieldGroup(id: string, title: string) {

		this._host.get_field_by_id(id).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: any) => {
					this.host_field_title = title;
					this.field_group_fields = response.fields;
				},
				error => console.log('Error retrieving host field by id', error)
			);

	}

	openAssignLicenseModal(): void {

		const dialogRef = this._dialog.open(AssignLicenseModalComponent, {
			width: '500px',
			data: this.single_host_data
		});

		dialogRef.afterClosed().subscribe(
			data => {
				if (data) this.ngOnInit()
			}
		);
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

	getLicenseTotalByHostIdDealerId() {

		const dealerId = this.single_host_data.dealer_id;
		const hostId = this.single_host_data.host_id;

		this._license.api_get_licenses_total_by_host_dealer(dealerId, hostId).subscribe(
			response => {

				if (!response) return;
			
				const { total, totalActive, totalInActive, totalOnline, totalOffline, totalAd, totalMenu, totalClosed } = response;

				this.host_license_count = {
					total_count: total,
					total_count_label: 'License(s)',
					active_value: totalActive,
					active_value_label: 'Active',
					inactive_value: totalInActive,
					inactive_value_label: 'Inactive',
					online_value: totalOnline,
					online_value_label: 'Online',
					offline_value: totalOffline,
					offline_value_label: 'Offline',
					total_ads: totalAd,
					total_ads_label: 'Ads',
					total_menu: totalMenu,
					total_menu_label: 'Menu',
					total_closed: totalClosed,
					total_closed_label: 'Closed'
				}

			},
			error => console.log('Error retrieving total license count', error)
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
		this.lat = parseFloat(host.latitude);
		this.long = parseFloat(host.longitude);
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

}
