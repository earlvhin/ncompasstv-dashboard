import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import * as moment from 'moment-timezone';

import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { AuthService } from '../../../services/auth-service/auth.service';
import { EditSingleAdvertiserComponent } from '../../../../global/pages_shared/edit-single-advertiser/edit-single-advertiser.component';
import { EditSingleDealerComponent } from '../../../../global/pages_shared/edit-single-dealer/edit-single-dealer.component';
import { EditSingleHostComponent } from '../../../../global/pages_shared/edit-single-host/edit-single-host.component';
import { InformationModalComponent } from '../information-modal/information-modal.component';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';
import { TAG } from 'src/app/global/models/tag.model';

@Component({
	selector: 'app-banner',
	templateUrl: './banner.component.html',
	styleUrls: ['./banner.component.scss'],
	providers: [TitleCasePipe]
})

export class BannerComponent implements OnInit, OnDestroy {
	@Input() editable: boolean;
	@Input() single_image: string;
	@Input() single_name: string;
	@Input() single_desc: string;
	@Input() dealer_data: any;
	@Input() host_data: any;
	@Input() advertiser_data: any;
    @Input() refresh_banner: boolean;
	@Input() single_host_data: any;
	@Input() host_license_count: any;
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
	is_view_only = false;
	now: any;
	routes: string;
	show_hours = false;
	status = '';
	tags: TAG[];
	notes: string = '';
	view = '';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _dialog: MatDialog,
		private _auth: AuthService,
		private _router: Router,
		private _titlecase: TitleCasePipe,
	) { }

	ngOnInit() {

		this.routes = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);

		if (this.host_data) {
			this.category = this._titlecase.transform(this.host_data.category);
			
			if (this.host_data.storeHours) {
				this.business_hours = JSON.parse(this.host_data.storeHours);

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

	onShowNotes(button) {
        if(button == 'notes') {
            this.showNotesModal('Notes', this.host_data.notes, 'textarea', 500);
        } else {
            this.showNotesModal('Others', this.host_data.others, 'textarea', 500);
        }
	}

    partialNotes(button) {
        if (button == 'notes') {
            const notes = this.host_data.notes;
            if (!notes || notes.trim().length <= 0)
            return '';
            return notes.substr(0, 41);
        } else {
            const others = this.host_data.others;
            if (!others || others.trim().length <= 0)
            return '';
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

		dialogRef.afterClosed()
			.subscribe(
				response => {
					
					if (!response) {
						this.update_info.emit(true);
						return;
					}

				},
				error => console.log('Error closing edit single dealer modal', error)
		);

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
			width: '992px',
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

		const businessHours: any[] = this.business_hours;
		this.current_business_day = this.now;
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
				tags = this.host_data.tags;
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

}