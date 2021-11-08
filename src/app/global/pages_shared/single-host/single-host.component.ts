import { UpperCasePipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as io from 'socket.io-client';

import { AssignLicenseModalComponent } from '../../components_shared/license_components/assign-license-modal/assign-license-modal.component';
import { AuthService, HelperService, HostService, LicenseService } from 'src/app/global/services';
import { API_SINGLE_HOST, API_LICENSE, HOST_LICENSE_STATISTICS, API_HOST, API_DEALER, TAG } from 'src/app/global/models';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-single-host',
	templateUrl: './single-host.component.html',
	styleUrls: ['./single-host.component.scss'],
	providers: [UpperCasePipe, DatePipe, TitleCasePipe]
})

export class SingleHostComponent implements OnInit {

	_socket: any;
	address: string ;
	currentImage: string;
	currentRole = this._auth.current_role;
	currentUser = this._auth.current_user_value;
	hostName: string;
	hostId: string;
	host: API_SINGLE_HOST['host'];
	hostLicenseStatistics: HOST_LICENSE_STATISTICS;
	isViewOnly = false;
	singleHostData: { dealer_id: string, host_id: string };
	lat: number;
	long: number;
	
	private hostLicenses: API_LICENSE[];
	private isInitialLoad = true;
	private marginMore = false;
	private marginNotes = false;
	
	protected _unsubscribe = new Subject<void>();
	protected defaultImage = 'assets/media_files/admin-icon.png';

	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _helper: HelperService,
		private _host: HostService,
		private _license: LicenseService,
		private _params: ActivatedRoute,
	) { }

	ngOnInit() {

		this.initializeSocket();
		this.isViewOnly = this.currentUser.roleInfo.permission === 'V';

		this._params.paramMap.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => this.hostId = this._params.snapshot.params.data);
			
		this.getHostById();
		this.subscribeToBusinessHoursUpdate();
		this.currentImage = this.defaultImage;

	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
		if (this._socket) this._socket.disconnect();
	}

	didToggleNotesAndHours(): boolean {

		if (this.marginNotes && this.marginMore) {
			return true;
		}

		return false;

	}

	openAssignLicenseModal(): void {

		const dialogRef = this._dialog.open(AssignLicenseModalComponent, {
			width: '500px',
			data: this.singleHostData
		});

		dialogRef.afterClosed().subscribe(
			data => {
				if (data) this.ngOnInit()
			}
		);
	}

	toggledHours(e) {
		this.marginMore = e;
	}

	toggledNotes(value: boolean): void {
		this.marginNotes = value;
	}

	private getLicenseTotalByHostIdDealerId() {

		const dealerId = this.singleHostData.dealer_id;
		const hostId = this.singleHostData.host_id;

		this._license.api_get_licenses_total_by_host_dealer(dealerId, hostId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {

					if (!response) return;
				
					const { total, totalActive, totalInActive, totalOnline, totalOffline, totalAd, totalMenu, totalClosed } = response;

					this.hostLicenseStatistics = {
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

		if (this.isInitialLoad && (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer')) {
			this.setPageData(this._helper.singleHostData);
			this.isInitialLoad = false;
			return;
		}

		this._host.get_host_by_id(this.hostId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { host: API_HOST, dealer: API_DEALER, hostTags: TAG }) => this.setPageData(response),
				error => console.log('Error retrieving host by ID', error)
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

	private setPageData(response: API_SINGLE_HOST) {
		const { host, dealer, hostTags } = response;
		host.tags = hostTags;
		this.host = response.host;
		this.currentImage = response.host.logo;
		this.singleHostData = { dealer_id: dealer.dealerId, host_id: this.hostId };
		this.hostName = host.name;
		this.address = host.address ? `${host.address}, ${host.city}, ${host.state} ${host.postalCode}` : 'No Address Available';
		this.lat = parseFloat(host.latitude);
		this.long = parseFloat(host.longitude);
		this.getLicenseTotalByHostIdDealerId();
	}

	private subscribeToBusinessHoursUpdate(): void {

		this._host.onUpdateBusinessHours.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: boolean) => {

					if (!response) return;

					this.hostLicenses.forEach(
						(license: any) => {
							console.log('System Update Emitted:', license.licenseId);
							this._socket.emit('D_update_player', license.licenseId);
						}
					);
				}
			);
	}

}
