import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { retry, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../../services/auth-service/auth.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request)
          .pipe(retry(4),
              catchError((error: HttpErrorResponse) => {
                if([401, 403].includes(error.status) && this.authService.current_user_value) {
                    //Refresh token
                    this.authService.refresh_token();
                }
                console.log(`Error: ${error.status} - ${error.statusText} at ${error.url.substring(error.url.lastIndexOf('/') + 1)}`);
                return throwError(error);
            })
        )   
    }
}