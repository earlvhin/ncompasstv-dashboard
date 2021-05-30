import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { UserService } from 'src/app/global/services/user-service/user.service';
import { UI_ROLE_DEFINITION } from '../../../../global/models/ui_role-definition.model';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit {
	current_username: string;
	current_userid: string;
	is_dealer : boolean = false;

	constructor(
		private _auth: AuthService,
		private _user: UserService
	) { }

	ngOnInit() {
		this.current_username = this._auth.current_user_value.firstname;
		this.current_userid = this._auth.current_user_value.user_id;

		if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
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
}
