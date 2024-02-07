import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { BaseService } from '../base.service';

@Injectable({
    providedIn: 'root',
})
export class PlacerService extends BaseService {
    get_all_placer(page: number, keyword: string, sortColumn: string, sortOrder: string, filter: string, from: string, to: string, pageSize: number) {
        const url = `${this.getters.api_get_placer}?page=${page}&search=${keyword}&sortColumn=${sortColumn}&sortOrder=${sortOrder}&filter=${filter}&from=${from}&to=${to}&pageSize=${pageSize}`;
        return this.getRequest(url);
    }

    get_single_host_placer(host_id: string, page: number, keyword: string, sortColumn: string, sortOrder: string, filter: string, from: string, to: string, pageSize: number) {
        const url = `${this.getters.api_get_placer_for_host}${host_id}?page=${page}&search=${keyword}&sortColumn=${sortColumn}&sortOrder=${sortOrder}&filter=${filter}&from=${from}&to=${to}&pageSize=${pageSize}`;
        return this.getRequest(url);
    }

    update_placer_host(hostId: string, placerId: string, placername?: string) {
        const url = this.updaters.placer_host;
        const body = { hostId, placerId, placername };
        return this.postRequest(url, body);
    }

    delete_placer_dump(id: string) {
        const url = this.deleters.api_delete_placer_dump;
        const body = { id };
        return this.postRequest(url, body);
    }

    upload_placer(filename: string) {
        const url = this.creators.placer_upload;
        const body = { filename };
        return this.postRequest(url, body);
    }
}
