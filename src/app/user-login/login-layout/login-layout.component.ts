import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../global/services/auth-service/auth.service';
import { UI_CURRENT_USER } from '../../global/models/ui_current-user.model';
import { UI_ROLE_DEFINITION } from '../../global/models/ui_role-definition.model';

@Component({
    selector: 'app-login-layout',
    templateUrl: './login-layout.component.html',
    styleUrls: ['./login-layout.component.scss'],
})
export class LoginLayoutComponent implements OnInit {
    current_user: UI_CURRENT_USER = this._auth.current_user_value;
    user_roles = Object.keys(UI_ROLE_DEFINITION);

    constructor(
        private _auth: AuthService,
        private _router: Router,
    ) {}

    ngOnInit() {
        if (this._auth.token_life() && this.current_user) {
            this.user_roles.forEach((role) => {
                if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION[role]) {
                    this._auth.session_check(true);
                }
            });
        }
    }
}
