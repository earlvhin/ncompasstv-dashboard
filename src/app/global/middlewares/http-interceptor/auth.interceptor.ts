import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor} from '@angular/common/http';
import { AuthService } from '../../services/auth-service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor  implements HttpInterceptor {
    isTokenRefreshing: boolean = false;

    constructor(public authService: AuthService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const user = this.authService.current_user_value;
        if(user){
            const isLoggedIn = user && user.jwt.token;
            if(isLoggedIn){
            request = request.clone({
                setHeaders: {Authorization: `Bearer ${user.jwt.token}`}
            });
        }
        }
        return next.handle(request);
    }
}