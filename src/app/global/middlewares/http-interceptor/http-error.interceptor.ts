import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { retry, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request)
          .pipe(retry(4),
              catchError((error: HttpErrorResponse) => {
                console.log(`Error: ${error.status} - ${error.statusText} at ${error.url.substring(error.url.lastIndexOf('/') + 1)}`);
                return throwError(error);
            })
        )   
    }
}