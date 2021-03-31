import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';

@Component({
  selector: 'app-locator',
  templateUrl: './locator.component.html',
  styleUrls: ['./locator.component.scss']
})

export class LocatorComponent implements OnInit {
	
	title: string = "Locator";
	is_host_view: boolean = true;
	is_dealer: boolean = false;
	constructor(
		private _auth: AuthService,
	) { }

	ngOnInit() {
		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
		}
	}

}
