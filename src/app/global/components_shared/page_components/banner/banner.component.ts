import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment-timezone';

import {
	API_DEALER,
	API_ADVERTISER,
	API_HOST,
	API_USER_DATA,
	HOST_LICENSE_STATISTICS,
	TAG,
	UI_CURRENT_USER,
	UI_ROLE_DEFINITION,
	UI_ROLE_DEFINITION_TEXT,
	UI_STORE_HOUR_PERIOD,
	UI_STORE_HOUR
} from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { HelperService } from 'src/app/global/services';
import { EditSingleAdvertiserComponent } from 'src/app/global/pages_shared/edit-single-advertiser/edit-single-advertiser.component';
import { EditSingleDealerComponent } from 'src/app/global/pages_shared/edit-single-dealer/edit-single-dealer.component';
import { EditSingleHostComponent } from 'src/app/global/pages_shared/edit-single-host/edit-single-host.component';
import { InformationModalComponent } from '../information-modal/information-modal.component';

@Component({
	selector: 'app-banner',
	templateUrl: './banner.component.html',
	styleUrls: ['./banner.component.scss'],
	providers: [TitleCasePipe]
})
export class BannerComponent implements OnInit, OnDestroy {
	@Input() current_user_data: UI_CURRENT_USER = null;
	@Input() editable: boolean;
	@Input() refresh_banner: boolean;
	@Input() description = '';
	@Input() image = 'assets/media-files/admin-icon.png';
	@Input() title = '';
	@Input() single_host_data: { dealer_id: string; host_id: string };
	@Input() host_license_count: HOST_LICENSE_STATISTICS;
	@Input() has_host_controls = false;
	@Input() page = '';
	@Input() page_data:
		| { dealer: API_DEALER; user: API_USER_DATA }
		| { host: API_HOST; dealer: API_DEALER; createdBy: any }
		| { advertiser: API_ADVERTISER; dealer: API_DEALER } = null;
	@Input() is_host_page = false;
	@Output() single_host_assign_license = new EventEmitter();
	@Output() toggle_margin_top = new EventEmitter();
	@Output() toggle_margin_top_notes = new EventEmitter();
	@Output() update_info = new EventEmitter();
	business_hours: any;
	business_name = '';
	category = '';
	count = 0;
	current_business_day = '';
	current_operations: any;
	dealer: API_DEALER = null;
	dealer_url = '';
	host: API_HOST = null;

	is_admin = this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.administrator;
	is_current_user_dealer = this._auth.current_role === 'dealer' || this._auth.current_role === 'sub-dealer';
	is_dealer_admin = this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealeradmin;
	license_stats_label: any = [];
	license_stats_array: any = [];
	notes: string = '';
	show_hours = false;
	status = '';
	tags: TAG[];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _helper: HelperService,
		private _dialog: MatDialog,
		private _router: Router,
		private _titlecase: TitleCasePipe
	) {}

	ngOnInit() {
		if (!this.current_user_data) this.current_user_data = this._auth.current_user_value;
		this.setUserTypeData();
		this.subscribeToRefreshBannerData();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	ngOnChanges() {
		if (this.refresh_banner) this.ngOnInit();
	}

	checkRoute(dealerId: string, hostId: string) {
		let role = this._auth.current_role;
		if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) role = UI_ROLE_DEFINITION_TEXT.administrator;
		const route = `/${role}/screens/create-screen/`;
		const routeData = { queryParams: { dealer_id: dealerId, host_id: hostId } };
		const url = this._router.serializeUrl(this._router.createUrlTree([route], routeData));
		window.open(url, '_blank');
	}

	hasOpeningAndClosing(periods: UI_STORE_HOUR_PERIOD) {
		const originalCondition = periods.open == '' && periods.close == '';
		const isOpenAllDay = periods.open === '12:00 AM' && periods.close === '11:59 PM';
		if (originalCondition || isOpenAllDay) return false;
		return true;
	}

	isOpenAllDay(hours: UI_STORE_HOUR, periodIndex: number) {
		if (!hours.status) return false;
		const originalCondition = hours.periods[periodIndex].open == '' && hours.periods[periodIndex].close == '';
		const isOpenAllDay = hours.periods[periodIndex].open === '12:00 AM' && hours.periods[periodIndex].close === '11:59 PM';
		return originalCondition || isOpenAllDay;
	}

	isOpenButNotAllDay(hours: UI_STORE_HOUR, periodIndex: number) {
		return !this.isOpenAllDay(hours, periodIndex);
	}

	onAssignLicense(): void {
		this.single_host_assign_license.emit(this.single_host_assign_license);
	}

	onClickModify(): void {
		let dialog: ComponentType<EditSingleDealerComponent | EditSingleHostComponent | EditSingleAdvertiserComponent>;
		let data:
			| { dealer: API_DEALER; user: API_USER_DATA }
			| { host: API_HOST; dealer: API_DEALER; createdBy: any }
			| { advertiser: API_ADVERTISER; dealer: API_DEALER };
		const config: MatDialogConfig = {
			panelClass: 'app-edit-single-advertiser',
			disableClose: true,
			data: null
		};

		switch (this.page) {
			case 'single-dealer':
				dialog = EditSingleDealerComponent;
				config.width = '700px';
				data = this.page_data as { dealer: API_DEALER; user: API_USER_DATA };
				break;

			case 'single-host':
				dialog = EditSingleHostComponent;
				config.width = '900px';
				data = this.page_data as { host: API_HOST; dealer: API_DEALER; createdBy: any };
				break;

			default: // single-advertiser
				dialog = EditSingleAdvertiserComponent;
				config.width = '700px';
				data = this.page_data as { advertiser: API_ADVERTISER; dealer: API_DEALER };
		}

		config.data = data;
		const dialogReference = this._dialog.open(dialog, config);

		dialogReference.afterClosed().subscribe((response) => {
			if (!response) return;
			this.update_info.emit(true);
		});
	}

	onCreateScreen(dealerId: string, hostId: string) {
		let role = this._auth.current_role;

		if (role === 'dealeradmin') role = 'administrator';

		const url = this._router.serializeUrl(
			this._router.createUrlTree([`/${role}/screens/create-screen/`], { queryParams: { dealer_id: dealerId, host_id: hostId } })
		);
		window.open(url, '_blank');
	}

	onShowBusinessHours(): void {
		this.show_hours = !this.show_hours;
		this.toggle_margin_top.emit(this.show_hours);
	}

	onShowNotes(button: string): void {
		const data = (this.page_data as { host: API_HOST; dealer: API_DEALER }).host;
		const type = this._titlecase.transform(button);
		let modalData = button === 'notes' ? data.notes : data.others;
		this.openNotes(type, modalData, 'textarea', 500);
	}

	partialNotes(button: string): string {
		const data = (this.page_data as { host: API_HOST; dealer: API_DEALER }).host;
		let stringData: string = button === 'notes' ? data.notes : data.others;

		if (!stringData || stringData.trim().length <= 0) return '';
		return stringData.substring(0, 41);
	}

	private openNotes(title: string, contents: any, type: string, character_limit?: number): void {
		this._dialog.open(InformationModalComponent, {
			width: '600px',
			height: '350px',
			data: { title, contents, type, character_limit },
			panelClass: 'information-modal',
			autoFocus: false
		});
	}

	private setCurrentBusinessDay(): void {
		if (!this.business_hours) {
			this.current_business_day = 'CLOSED';
			return;
		}

		const businessHours: any[] = this.business_hours;
		this.current_business_day = moment().format('dddd');
		businessHours.forEach((operation) => {
			let period = '';
			if (operation.day === this.current_business_day) {
				if (!operation.periods || !operation.status) period = 'CLOSED';
				else {
					const opening = operation.periods[0].open;
					const closing = operation.periods[0].close;
					const hasBlankOpeningTime = !opening || opening === '';
					const hasBlankClosingTime = !closing || closing === '';
					const isSetToOpenAllDay = opening === '12:00 AM' && closing === '11:59 PM';
					if (hasBlankOpeningTime || hasBlankClosingTime || isSetToOpenAllDay) period = 'Open 24 hours';
					else period = `${operation.periods[0].open} - ${operation.periods[0].close}`;
				}
				this.current_operations = { day: this.current_business_day, period };
			}
		});
	}

	private setHostData(): void {
		const { dealer, host } = this.page_data as { host: API_HOST; dealer: API_DEALER };
		this.dealer_url = `/administrator/dealers/${dealer.dealerId}`;

		this.category = host.category ? this._titlecase.transform(host.category) : '--';

		if (host.storeHours) {
			this.business_hours = JSON.parse(host.storeHours);

			for (let i = 0; i < this.business_hours.length; i++) {
				if (this.business_hours[i].periods.length > 0) this.count = this.count + 1;
			}

			if (this.count == 0) this.business_hours = null;

			this.setCurrentBusinessDay();
		}
	}

	private setLicenseStats(): void {
		this.license_stats_array = [];
		this.license_stats_label = [];
		const {
			total_ads_label,
			total_menu_label,
			total_closed_label,
			total_ads,
			total_menu,
			total_closed,
			unassigned_value,
			unassigned_value_label
		} = this.host_license_count;

		if (this.host_license_count) {
			this.license_stats_label.push(`${total_ads_label}: ${total_ads}`);
			this.license_stats_label.push(`${total_menu_label}: ${total_menu}`);
			this.license_stats_label.push(`${total_closed_label}: ${total_closed}`);
			this.license_stats_label.push(`${unassigned_value_label}: ${unassigned_value}`);
			this.license_stats_array.push(total_ads);
			this.license_stats_array.push(total_menu);
			this.license_stats_array.push(total_closed);
			this.license_stats_array.push(unassigned_value);
		}
	}

	private setUserTypeData(): void {
		let tags: TAG[];
		let status: string;
		let data:
			| { dealer: API_DEALER; user: API_USER_DATA }
			| { host: API_HOST; dealer: API_DEALER }
			| { advertiser: API_ADVERTISER; dealer: API_DEALER };

		switch (this.page) {
			case 'single-dealer':
				data = this.page_data as { dealer: API_DEALER; user: API_USER_DATA };
				tags = data.dealer.tags;
				status = data.dealer.status;
				break;

			case 'single-host':
				data = this.page_data as { host: API_HOST; dealer: API_DEALER };
				this.host = data.host;
				this.dealer = data.dealer;
				tags = data.host.tags;
				status = data.host.status;
				this.business_name = data.dealer.businessName;
				this.setHostData();
				this.setLicenseStats();

				break;

			default: // single-advertiser
				data = this.page_data as { advertiser: API_ADVERTISER; dealer: API_DEALER };
				tags = data.advertiser.tags;
				status = data.advertiser.status;
				this.category = this._titlecase.transform((this.page_data as { advertiser: API_ADVERTISER; dealer: API_DEALER }).advertiser.category);
		}

		this.tags = tags;
		this.status = status === 'A' ? 'active' : 'inactive';
	}

	private subscribeToRefreshBannerData() {
		this._helper.onRefreshBannerData.pipe(takeUntil(this._unsubscribe)).subscribe(
			() => this.update_info.emit(),
			(error) => console.log('Error refreshing banner data', error)
		);
	}

	protected get _isAdmin() {
		const currentRole = this._auth.current_role;
		return currentRole === 'administrator' || currentRole === 'dealeradmin';
	}
}
