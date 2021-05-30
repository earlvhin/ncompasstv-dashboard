import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import * as moment from 'moment-timezone';

import { AuthService } from '../../../services/auth-service/auth.service';
import { EditSingleAdvertiserComponent } from '../../../../global/pages_shared/edit-single-advertiser/edit-single-advertiser.component';
import { EditSingleDealerComponent } from '../../../../global/pages_shared/edit-single-dealer/edit-single-dealer.component';
import { EditSingleHostComponent } from '../../../../global/pages_shared/edit-single-host/edit-single-host.component';
import { InformationModalComponent } from '../information-modal/information-modal.component';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';

@Component({
	selector: 'app-banner',
	templateUrl: './banner.component.html',
	styleUrls: ['./banner.component.scss'],
	providers: [TitleCasePipe]
})

export class BannerComponent implements OnInit {
	@Input() editable: boolean;
	@Input() single_image: string;
	@Input() single_name: string;
	@Input() single_desc: string;
	@Input() dealer_data: any;
	@Input() host_data: any;
	@Input() advertiser_data: any;
	@Input() single_host_data: any;
	@Input() single_advertiser: any;
	@Input() single_host_controls: boolean;
	@Input() single_info: Array<any>;
	@Output() single_host_assign_license = new EventEmitter;
	@Output() toggle_margin_top = new EventEmitter;
	@Output() toggle_margin_top_notes = new EventEmitter;
	@Output() update_info = new EventEmitter;
	business_hours: any;
	category: string;
	count = 0;
	current_business_day = '';
	current_operations: any;
	now: any;
	routes: string;
	show_hours = false;
	notes: string = '';

	constructor(
		private _dialog: MatDialog,
		private _router: Router,
		private _auth: AuthService,
		private _titlecase: TitleCasePipe,
	) { }

	ngOnInit() {
		this.routes = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);

		if (this.host_data && this.host_data.host) {
			this.category = this._titlecase.transform(this.host_data.host.category);
				
			if (this.host_data.host.storeHours) {
				this.business_hours = JSON.parse(this.host_data.host.storeHours);

				for (let i = 0; i < this.business_hours.length; i++) {

					if (this.business_hours[i].periods.length > 0) {
						this.count = this.count + 1;
					}
				}

				if (this.count == 0) {
					this.business_hours = null;
				}

				this.setCurrentBusinessDay();

			}

		} else if(this.advertiser_data) {
			this.category = this._titlecase.transform(this.advertiser_data.category);
		}

		// To avoid this.now == -1
		// this.now = new Date().getDay() - 1 > 0  ? new Date().getDay() - 1 : new Date().getDay();
		// console.log('#BUSINESS_HOURS', this.business_hours, this.now)
	}

	checkRoute (id1, id2) {
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this._router.navigate([`/${route}/screens/create-screen/`], { queryParams: { dealer_id: id1, host_id: id2 }});
	}

	checkContent() {
		if(this.single_advertiser) {
			this.showAdvertiserContent();
		}else if(this.single_host_data) {
			this.showHostContent();
		} else {
			this.showDealerContent();
		}
	}

	isAdmin() {
		if (this._auth.current_user_value.role_id == UI_ROLE_DEFINITION.administrator) {
			return true;
		}
	}

	onShowNotes(): void {
		this.showNotesModal('Notes', this.host_data.host.notes, 'textarea', 500);
	}

	partialNotes(): string {
		const notes = this.host_data.host.notes;

		if (!notes || notes.trim().length <= 0) 
			return '';

		return notes.substr(0, 41);
	}

	showDealerContent() {
		let dialogRef = this._dialog.open(EditSingleDealerComponent, {
			width: '700px',
			panelClass: 'app-edit-single-advertiser',
			disableClose: true,
			data: this.dealer_data 
		});

		dialogRef.afterClosed().subscribe(response => {
			
			if (!response) {
				this.update_info.emit(true);
			}
			
		});
	}

	showAdvertiserContent() {
		let dialogRef = this._dialog.open(EditSingleAdvertiserComponent, {
			width: '700px',
			panelClass: 'app-edit-single-advertiser',
			disableClose: true,
			data: this.single_advertiser 
		})

		dialogRef.afterClosed().subscribe(r => {
			this.update_info.emit(true);
		});
	}

	showHostContent() {
		let dialogRef = this._dialog.open(EditSingleHostComponent, {
			width: '700px',
			panelClass: 'app-edit-single-advertiser',
			disableClose: true,
			data: this.single_host_data.host_id 
		})

		dialogRef.afterClosed().subscribe(r => {
			this.update_info.emit(true);
		});
	}

	showNotesModal(title: string, contents: any, type: string, character_limit?: number): void {
		this._dialog.open(InformationModalComponent, {
			width:'600px',
			height: '350px',
			data:  { title, contents, type, character_limit },
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

		const hostData = this.host_data;
		const businessHours: any[] = this.business_hours;
		this.current_business_day = this.now;
		// this.current_business_day = moment.tz(hostData.timezone.name).format('dddd');
		this.current_business_day = moment().format('dddd');

		businessHours.forEach(
			operation => {
				let period = '';

				if (operation.day === this.current_business_day) {

					if (!operation.periods || !operation.status) period = 'CLOSED';

					else {
						if (!operation.periods[0].open && !operation.periods[0].close) period = 'Open 24 hours';
						else period = `${operation.periods[0].open} - ${operation.periods[0].close}`;
					}
					
					this.current_operations = { day: this.current_business_day, period };
				}

			}
		);

	}

}