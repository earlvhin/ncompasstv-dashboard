import { Component, Input, OnInit } from '@angular/core';

import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { UserService } from 'src/app/global/services/user-service/user.service';
import { UI_ROLE_DEFINITION } from '../../../../global/models/ui_role-definition.model';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit {
	@Input() sidebar_state: boolean;
	current_username: string;
	current_userid: string;
	is_dealer : boolean = false;

	constructor(
		private _auth: AuthService,
		private _user: UserService
	) { }

	ngOnInit() {

		if (this.currentUser) {
			const { firstname, user_id, role_id } = this.currentUser
			this.current_username = firstname;
			this.current_userid = user_id;

			if (role_id === UI_ROLE_DEFINITION.dealer) this.is_dealer = true;
		}

	}

	logOut() {
		this._auth.logout();
	}

	getUserNotifications() {
		this._user.get_user_notifications(this.current_userid).subscribe(
			data => {
				//console.log('getUserNotifications', data)
			}
		)
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

}
