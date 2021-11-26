import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';

@Component({
  selector: 'app-locator',
  templateUrl: './locator.component.html',
  styleUrls: ['./locator.component.scss']
})

export class LocatorComponent implements OnInit {
	
	title = 'Locator';
	is_dealer = false;

	constructor(
		private _auth: AuthService
	) { }

	ngOnInit() {
		const roleId = this._auth.current_user_value.role_id; 
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
		}
	}

	
}
