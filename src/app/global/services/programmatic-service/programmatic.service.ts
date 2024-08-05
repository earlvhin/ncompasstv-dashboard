import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
    DeleteProgrammaticVendor,
    GetProgrammaticVendor,
    GetProgrammaticVendors,
    GetProgrammaticVendorsIdAndNames,
    ProgrammaticVendor,
} from 'src/app/global/models';

import { BaseService } from '../base.service';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
@Injectable({
    providedIn: 'root',
})
export class ProgrammaticService extends BaseService {
    protected BASE_ENDPOINT = 'programmatic';
    protected BASE_VENDOR_ENDPOINT = `${this.BASE_ENDPOINT}/vendor`;

    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    getVendor(id: string): Observable<GetProgrammaticVendor> {
        const url = `${this.BASE_VENDOR_ENDPOINT}/${id}`;
        return this.getRequest(url);
    }

    getAllVendors(): Observable<GetProgrammaticVendors> {
        return this.getRequest(this.BASE_VENDOR_ENDPOINT);
    }

    getAllVendorsIdAndNames(): Observable<GetProgrammaticVendorsIdAndNames> {
        return this.getRequest(this.getters.programmatic_all_vendors_id_and_names);
    }

    addVendor(body: ProgrammaticVendor): Observable<GetProgrammaticVendor> {
        return this.postRequest(this.BASE_VENDOR_ENDPOINT, body);
    }

    editVendor(body: ProgrammaticVendor): Observable<GetProgrammaticVendor> {
        return this.putRequest(this.BASE_VENDOR_ENDPOINT, body);
    }

    deleteVendor(id: string): Observable<DeleteProgrammaticVendor> {
        const url = `${this.BASE_VENDOR_ENDPOINT}/${id}`;
        return this.deleteRequest(url);
    }
}
