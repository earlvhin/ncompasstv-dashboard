import { Component, OnInit, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { UI_ROLE_DEFINITION } from '../../../../global/models/ui_role-definition.model';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss']
})

export class SidebarComponent implements OnInit, OnDestroy {
	icons_only: boolean = false;
	installations_count = 0;
	isDealer: boolean = false;
	@Input() routes: { path: string, label: string, icon: string }[];
	@Output() toggleEvent = new EventEmitter<boolean>();
	subscription: Subscription = new Subscription();
	
	constructor(
		private _auth: AuthService,
		private _license: LicenseService
	) { }
		
	ngOnInit() {
		if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.isDealer = true;
		}
		if (!this.isDealer) {
			this.getInstallations();
		}
	}

	ngOnDestroy(){}

	toggleSideBar () {
		this.icons_only = !this.icons_only;  
		this.toggleEvent.emit(this.icons_only);
	}

	getInstallations() {
		this.subscription.add(
			this._license.get_licenses_by_install_date(1, moment().format('MM/DD/YYYYY'), "", "").subscribe(
				data => {
					if(!data.message) {
						this.installations_count = data.licenseInstallationStats.total;
					} else {
						this.installations_count = 0;
					}
				}
			)
		)
	}
}
	