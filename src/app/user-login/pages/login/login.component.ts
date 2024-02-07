import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../global/services/auth-service/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
    constructor(
        private _router: Router,
        private _auth: AuthService,
    ) {}

    ngOnInit() {
        if (this._auth.session_valid) {
            this._router.navigate(['/administrator']);
        }
    }
}
