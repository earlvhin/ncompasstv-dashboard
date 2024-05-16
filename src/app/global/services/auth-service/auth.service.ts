import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tokenNotExpired } from 'angular2-jwt';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import {
    JWT_TOKEN,
    UI_CURRENT_USER,
    UI_ROLE_DEFINITION,
    UI_ROLE_DEFINITION_TEXT,
    USER_LOGIN,
} from 'src/app/global/models';
@Injectable({
    providedIn: 'root',
})
export class AuthService {
    current_user: Observable<UI_CURRENT_USER>;
    session_status: boolean;

    private current_user_subject: BehaviorSubject<UI_CURRENT_USER>;

    http_options = {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };

    constructor(
        private _http: HttpClient,
        private _router: Router,
    ) {}

    // Store User Info inside Local Storage to a global variable.
    get current_user_value(): UI_CURRENT_USER {
        this.current_user_subject = new BehaviorSubject<UI_CURRENT_USER>(
            JSON.parse(localStorage.getItem('current_user')),
        );
        this.current_user = this.current_user_subject.asObservable();

        return this.current_user_subject.value;
    }

    get current_role(): string {
        const role = Object.keys(UI_ROLE_DEFINITION).find(
            (key) => UI_ROLE_DEFINITION[key] === this.current_user_value.role_id,
        );

        return this.returnRoleTextDefinition(role);
    }

    get session_valid(): boolean {
        return this.session_status;
    }

    get roleRoute(): string {
        const currentRole = this.current_role;
        return this.returnRoleTextDefinition(currentRole);
    }

    //Login - Authenticate User
    authenticate_user(data) {
        return this._http
            .post<USER_LOGIN>(`${environment.base_uri}${environment.auth.api_login}`, data, this.http_options)
            .pipe(
                map((current_user) => {
                    let currentUser = new UI_CURRENT_USER();
                    currentUser.user_id = current_user.userId;
                    currentUser.firstname = current_user.firstName;
                    currentUser.lastname = current_user.lastName;
                    currentUser.role_id = current_user.userRole.roleId;
                    currentUser.jwt = new JWT_TOKEN();
                    currentUser.jwt.token = current_user.token;
                    currentUser.jwt.refreshToken = current_user.refreshToken;
                    this.current_user_subject.next(currentUser);
                    return current_user;
                }),
            );
    }

    //Refresh Token
    refresh_token() {
        return this._http
            .post<JWT_TOKEN>(
                `${environment.base_uri}${environment.auth.api_refresh}`,
                JSON.stringify(this.current_user_value.jwt),
                this.http_options,
            )
            .pipe(
                map((data) => {
                    let currentUserStorage = JSON.parse(localStorage.getItem('current_user'));
                    currentUserStorage.jwt.token = data.token;
                    currentUserStorage.jwt.refreshToken = data.refreshToken;
                    localStorage.setItem('current_user', JSON.stringify(currentUserStorage));

                    let currentToken = JSON.parse(localStorage.getItem('current_token'));
                    currentToken.token = data.token;
                    currentToken.refreshToken = data.refreshToken;
                    localStorage.setItem('current_token', JSON.stringify(currentToken));

                    this.current_user_subject.next(currentUserStorage);
                    this.startRefreshTokenTimer();
                    return data;
                }),
            );
    }

    startRefreshTokenTimer() {
        if (this.current_user_value) {
            //parse object to get jwt token expiry
            const jwtTokenExpiry = JSON.parse(atob(this.current_user_value.jwt.token.split('.')[1])).exp;
            const expires = new Date(0);
            expires.setUTCSeconds(jwtTokenExpiry);
            const dateNow = new Date();
            const timeout = expires.getTime() - dateNow.getTime();
            //1 minute before the expiration
            const expiresTime = timeout - 60000;
            this.refreshTokenTimeout = setTimeout(() => this.refresh_token().subscribe(), expiresTime);
        }
    }

    set_user_cookie(jwt: string) {
        return this._http.post(`${environment.base_uri}${environment.update.set_user_cookie}`, {
            token: jwt,
        });
    }

    session_check(status) {
        return (this.session_status = status);
    }

    // Check Token Life for AuthGuard
    token_life() {
        return tokenNotExpired('current_token');
    }

    // Remove user from local storage
    logout() {
        this.stopRefreshTokenTimer();
        this.current_user_subject.next(null);
        localStorage.removeItem('current_token');
        localStorage.removeItem('current_user');
        this._router.navigate(['/login']).then(() => location.reload());
    }

    private refreshTokenTimeout;

    private stopRefreshTokenTimer() {
        clearTimeout(this.refreshTokenTimeout);
    }

    private returnRoleTextDefinition(currentRole) {
        // Administrator
        if (currentRole === UI_ROLE_DEFINITION_TEXT.administrator) {
            return UI_ROLE_DEFINITION_TEXT.administrator;
        }

        // Dealer Admin
        if (currentRole === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            return UI_ROLE_DEFINITION_TEXT.dealeradmin;
        }

        // Dealer and Sub-Dealer
        if (currentRole === UI_ROLE_DEFINITION_TEXT.dealer || currentRole === UI_ROLE_DEFINITION_TEXT['sub-dealer']) {
            return UI_ROLE_DEFINITION_TEXT.dealer;
        }

        return currentRole;
    }
}
