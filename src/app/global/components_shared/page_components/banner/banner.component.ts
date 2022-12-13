import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import * as moment from 'moment-timezone';

import { API_DEALER, API_SINGLE_HOST, HOST_LICENSE_STATISTICS, TAG, UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
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
	@Input() editable: boolean;
	@Input() single_image = 'assets/media-files/admin-icon.png';
	@Input() single_name: string;
	@Input() single_desc: string;
	@Input() dealer_data: any;
	@Input() host_data: API_SINGLE_HOST;
	@Input() advertiser_data: any;
	@Input() refresh_banner: boolean;
	@Input() single_host_data: { dealer_id: string; host_id: string };
	@Input() host_license_count: HOST_LICENSE_STATISTICS;
	@Input() single_advertiser: any;
	@Input() single_host_controls: boolean;
	@Input() single_info: Array<any>;
	@Input() page: string = null;
	@Output() single_host_assign_license = new EventEmitter();
	@Output() toggle_margin_top = new EventEmitter();
	@Output() toggle_margin_top_notes = new EventEmitter();
	@Output() update_info = new EventEmitter();
	business_hours: any;
	category: string;
	count = 0;
	current_business_day = '';
	current_operations: any;
	isAdmin = this._isAdmin;
	is_view_only = false;
	now: any;
	routes: string;
	show_hours = false;
	status = '';
	tags: TAG[];
	temp_label: any = [];
	temp_array: any = [];
	notes: string = '';
	view = '';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _dialog: MatDialog, private _auth: AuthService, private _router: Router, private _titlecase: TitleCasePipe) {}

	ngOnInit() {
		if (this.host_license_count) {
			this.temp_label.push(this.host_license_count.total_ads_label + ': ' + this.host_license_count.total_ads);
			this.temp_label.push(this.host_license_count.total_menu_label + ': ' + this.host_license_count.total_menu);
			this.temp_label.push(this.host_license_count.total_closed_label + ': ' + this.host_license_count.total_closed);
			this.temp_label.push(this.host_license_count.unassigned_value_label + ': ' + this.host_license_count.unassigned_value);
			this.temp_array.push(this.host_license_count.total_ads);
			this.temp_array.push(this.host_license_count.total_menu);
			this.temp_array.push(this.host_license_count.total_closed);
			this.temp_array.push(this.host_license_count.unassigned_value);
		}
		this.routes = Object.keys(UI_ROLE_DEFINITION).find((key) => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);

		if (this.host_data) {
			this.category = this._titlecase.transform(this.host_data.host.category);

			if (this.host_data.host.storeHours) {
				this.business_hours = JSON.parse(this.host_data.host.storeHours);

				for (let i = 0; i < this.business_hours.length; i++) {
					if (this.business_hours[i].periods.length > 0) this.count = this.count + 1;
				}

				if (this.count == 0) this.business_hours = null;

				this.setCurrentBusinessDay();
			}
		} else if (this.advertiser_data) {
			this.category = this._titlecase.transform(this.advertiser_data.category);
		}

		this.setView();
		this.setStatus();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	ngOnChanges() {
		if (this.refresh_banner) this.ngOnInit();
	}

	checkRoute(id1, id2) {
		let route = this._auth.current_role;
		if (route === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
			route = UI_ROLE_DEFINITION_TEXT.administrator;
		}
		// this._router.navigate([`/${route}/screens/create-screen/`], { queryParams: { dealer_id: id1, host_id: id2 } });

		const url = this._router.serializeUrl(
			this._router.createUrlTree([`/` + route + `/screens/create-screen/`], { queryParams: { dealer_id: id1, host_id: id2 } })
		);
		window.open(url, '_blank');
	}

	checkContent() {
		if (this.single_advertiser) {
			this.showAdvertiserContent();
		} else if (this.single_host_data) {
			this.showHostContent();
		} else {
			this.showDealerContent();
		}
	}

	onShowNotes(button) {
		if (button == 'notes') {
			this.showNotesModal('Notes', this.host_data.host.notes, 'textarea', 500);
		} else {
			this.showNotesModal('Others', this.host_data.host.others, 'textarea', 500);
		}
	}

	partialNotes(button) {
		if (button == 'notes') {
			const notes = this.host_data.host.notes;
			if (!notes || notes.trim().length <= 0) return '';
			return notes.substr(0, 41);
		} else {
			const others = this.host_data.host.others;
			if (!others || others.trim().length <= 0) return '';
			return others.substr(0, 41);
		}
	}

	showDealerContent() {
		const dialogRef = this._dialog.open(EditSingleDealerComponent, {
			width: '700px',
			panelClass: 'app-edit-single-advertiser',
			disableClose: true,
			data: this.dealer_data
		});

		dialogRef.afterClosed().subscribe(
			(response) => {
				if (!response) {
					this.update_info.emit(true);
					return;
				}
			},
			(error) => {
				throw new Error(error);
			}
		);
	}

	showAdvertiserContent() {
		let dialogRef = this._dialog.open(EditSingleAdvertiserComponent, {
			width: '700px',
			panelClass: 'app-edit-single-advertiser',
			disableClose: true,
			data: this.single_advertiser
		});

		dialogRef.afterClosed().subscribe((r) => {
			this.update_info.emit(true);
		});
	}

	showHostContent() {
		let dialogRef = this._dialog.open(EditSingleHostComponent, {
			width: '992px',
			panelClass: 'app-edit-single-advertiser',
			disableClose: true,
			data: this.single_host_data.host_id
		});

		dialogRef.afterClosed().subscribe((r) => {
			this.update_info.emit(true);
		});
	}

	showNotesModal(title: string, contents: any, type: string, character_limit?: number): void {
		this._dialog.open(InformationModalComponent, {
			width: '600px',
			height: '350px',
			data: { title, contents, type, character_limit },
			panelClass: 'information-modal',
			autoFocus: false
		});
	}

	triggerAssignLicenseModal() {
		this.single_host_assign_license.emit(this.single_host_assign_license);
	}

	triggerToggleMargin() {
		this.show_hours = !this.show_hours;
		this.toggle_margin_top.emit(this.show_hours);
	}

	private setCurrentBusinessDay(): void {
		if (!this.business_hours) {
			this.current_business_day = 'CLOSED';
			return;
		}

		const businessHours: any[] = this.business_hours;
		this.current_business_day = this.now;
		this.current_business_day = moment().format('dddd');
		businessHours.forEach((operation) => {
			let period = '';
			if (operation.day === this.current_business_day) {
				if (!operation.periods || !operation.status) period = 'CLOSED';
				else {
					if (!operation.periods[0].open && !operation.periods[0].close) period = 'Open 24 hours';
					else period = `${operation.periods[0].open} - ${operation.periods[0].close}`;
				}
				this.current_operations = { day: this.current_business_day, period };
			}
		});
	}

	private setStatus(): void {
		if (this.view !== 'dealer') return;
		const data = this.dealer_data as API_DEALER;

		if (data.status === 'A') this.status = 'active';
		else this.status = 'inactive';
	}

	private setTags(): void {
		let tags: TAG[];

		switch (this.view) {
			case 'host':
				tags = this.host_data.host.tags;
				break;
			case 'advertiser':
				tags = this.advertiser_data.tags;
				break;
			default:
				tags = this.dealer_data.tags;
		}

		this.tags = tags;
	}

	private setView(): void {
		if (this.dealer_data) this.view = 'dealer';
		if (this.host_data) this.view = 'host';
		if (this.advertiser_data) this.view = 'advertiser';
		this.setTags();
	}

	protected get _isAdmin() {
		const currentRole = this._auth.current_role;
		return currentRole === 'administrator' || currentRole === 'dealeradmin';
	}
}
