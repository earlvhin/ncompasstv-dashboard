import { Component, OnInit, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
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
	@Input() routes: { path: string, label: string, icon: string }[];
	@Output() toggleEvent = new EventEmitter<boolean>();
	icons_only: boolean = false;
	installations_count = 0;
	isDealer: boolean = false;

	private subscription: Subscription = new Subscription();
	
	constructor(
		private _auth: AuthService,
		private _license: LicenseService,
        private _router: Router
	) { }
	
	ngOnInit() {

		this._router.events.pipe(filter(event => event instanceof NavigationEnd))
			.subscribe(
				(event: NavigationEnd) => {
					if (event.url.match(/dealers.*/)) {
						this.icons_only = true;
						this.toggleEvent.emit(this.icons_only);
					}
				},
				error => console.log('Error on sidebar router events', error)
			);

		if (this.currentUser.role_id === UI_ROLE_DEFINITION.dealer) this.isDealer = true;
		if (!this.isDealer) this.getInstallations();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	toggleSideBar(): void {
		this.icons_only = !this.icons_only;  
		this.toggleEvent.emit(this.icons_only);
	}

	getInstallations(): void {
		this.subscription.add(
			this._license.get_statistics_by_installation(moment().format('MM/DD/YYYYY')).subscribe(
				data => {
					if(!data.message) {
						this.installations_count = data.licenseInstallationStats ? data.licenseInstallationStats.total : 0;
					} else {
						this.installations_count = 0;
					}
				},
				error => console.log('Error retrieving installation statistics', error)
			)
		);
	}

	private get currentUser() {
		return this._auth.current_user_value;
	}
}
	