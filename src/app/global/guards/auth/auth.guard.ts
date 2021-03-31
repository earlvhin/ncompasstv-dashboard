import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service/auth.service';

@Injectable()

export class AuthGuard implements CanActivate {

	currentUser: any;
	currentRole: any;

	constructor(
		private _auth: AuthService,
		private _router: Router
	) {}

	canActivate(): boolean {
		if(!this._auth.token_life()) {
			localStorage.removeItem('tokens');
			localStorage.removeItem('currentUser');
			this._router.navigate(['/login']);
			return false;
		}
		return true;
	}
}