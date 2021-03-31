import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../../../global/models/ui_role-definition.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  icons_only: boolean = false;
  isDealer: boolean = false;
  @Input() routes: any;
  @Output() toggleEvent = new EventEmitter<boolean>();
  
  constructor(
		private _auth: AuthService
	) { }

  toggleSideBar () {
    this.icons_only = !this.icons_only;  
    this.toggleEvent.emit(this.icons_only) 
  }

  ngOnInit() {
    if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
      this.isDealer = true;
    }
  }
}
