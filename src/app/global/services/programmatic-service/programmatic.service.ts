import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PROGRAMMATIC_CREATE } from 'src/app/global/models/programmatic.model';

@Injectable({
    providedIn: 'root',
})
export class ProgrammaticService extends BaseService {
    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            credentials: 'include',
            Accept: 'application/json',
        }),
    };

    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    /**
     * Add New Programmatic
     * API POST Method to BE API
     * @param data - Add App Version Form Data
     */
    createProgrammatic(data: PROGRAMMATIC_CREATE): Observable<{ message: string }> {
        return this.postRequest(this.creators.programmatic, data);
    }
}
