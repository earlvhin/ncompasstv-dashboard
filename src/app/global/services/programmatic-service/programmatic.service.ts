import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { PROGRAMMATIC_CREATE } from 'src/app/global/models/programmatic.model';

@Injectable({
    providedIn: 'root',
})
export class ProgrammaticService {
    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            credentials: 'include',
            Accept: 'application/json',
        }),
    };

    constructor(private _http: HttpClient) {}

    /**
     * Add New Programmatic
     * API POST Method to BE API
     * @param data - Add App Version Form Data
     */
    createProgrammatic(data: PROGRAMMATIC_CREATE) {
        return this._http.post<PROGRAMMATIC_CREATE>(
            `${environment.base_uri}${environment.create.programmatic}`,
            data,
            this.httpOptions,
        );
    }
}
