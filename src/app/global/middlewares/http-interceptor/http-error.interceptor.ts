import {
    HttpEvent,
    HttpInterceptor,
    HttpHandler,
    HttpRequest,
    HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { retry, catchError, first, filter, switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { AuthService } from '../../services/auth-service/auth.service';
import { MatDialog } from '@angular/material';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { environment } from '../../../../environments/environment';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
    private refreshingInProgress: boolean;
    private accessTokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    private errorCatched: boolean = false;

    constructor(
        private authService: AuthService,
        private _dialog: MatDialog,
    ) {}
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let currentToken = JSON.parse(localStorage.getItem('current_token'));
        let token = currentToken ? currentToken.token : null;
        return next.handle(this.addAuthorizationHeader(request, token)).pipe(
            retry(5),
            catchError((error) => {
                // in case of 401 http error
                // if (error instanceof HttpErrorResponse && error.status === 401) {
                // 	if (this.errorCatched == true) return;

                // 	const currentToken = localStorage.getItem('current_token');

                // 	// if there are tokens then send refresh token request
                // 	if (currentToken) {
                // 		return this.refreshToken(request, next);
                // 	}

                // 	// otherwise logout and redirect to login page
                // 	this.showWarningModal('logout', '', 'You may have been logged in elsewhere causing your session to be invalid.', '', 'OK');
                // }

                // in case of 403 http error (refresh token failed)
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    if (this.errorCatched == true) return;
                    this.showWarningModal(
                        'logout',
                        '',
                        'You may have been logged in elsewhere causing your session to be invalid.',
                        '',
                        'OK',
                    );
                }

                return throwError(error);
            }),
        );
    }

    private addAuthorizationHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
        // added url checker
        if (token && request.url.includes(environment.base_uri)) {
            return request.clone({
                setHeaders: {
                    'Content-Type': 'application/json',
                    credentials: 'include',
                    Accept: 'application/json',
                },
                withCredentials: true,
            });
        }

        return request;
    }

    private refreshToken(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.refreshingInProgress) {
            this.refreshingInProgress = true;
            this.accessTokenSubject.next(null);

            return this.authService.refresh_token().pipe(
                switchMap((res) => {
                    this.refreshingInProgress = false;
                    this.accessTokenSubject.next(res.token);
                    // repeat failed request with new token
                    return next.handle(this.addAuthorizationHeader(request, res.token));
                }),
            );
        } else {
            // wait while getting new token
            return this.accessTokenSubject.pipe(
                filter((token) => token !== null),
                take(1),
                switchMap((token) => {
                    // repeat failed request with new token
                    return next.handle(this.addAuthorizationHeader(request, token));
                }),
            );
        }
    }

    private showWarningModal(
        status: string,
        message: string,
        data: any,
        return_msg: string,
        action: string,
    ): void {
        this.errorCatched = true;
        const dialogRef = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '300px',
            data: {
                status: status,
                message: message,
                data: data,
                return_msg: return_msg,
                action: action,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result == 'OK') {
                this.authService.logout();
            }
        });
    }
}
