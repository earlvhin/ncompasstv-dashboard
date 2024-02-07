import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service/auth.service';

@Injectable({
    providedIn: 'root',
})
export class PermissionGuard implements CanActivate {
    constructor(
        private _auth: AuthService,
        private _router: Router,
    ) {}

    canActivate() {
        const hasPermission = this.currentUser.roleInfo.permission === 'E';
        if (hasPermission) return true;
        this._router.navigate(['/sub-dealer/dashboard']);
    }

    protected get currentUser() {
        return this._auth.current_user_value;
    }
}
