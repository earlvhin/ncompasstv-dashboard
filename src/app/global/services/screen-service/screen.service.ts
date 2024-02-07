import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    API_CHANGE_TEMPLATE,
    API_SINGLE_SCREEN,
    API_CHANGE_TEMPLATE_RESPONSE,
    CREATE_SCREEN_RESPONSE,
} from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';

@Injectable({
    providedIn: 'root',
})
export class ScreenService extends BaseService {
    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    assign_license(data) {
        const url = `${this.updaters.api_assign_license_to_screen}`;
        return this.postRequest(url, data);
    }

    change_template(body: API_CHANGE_TEMPLATE): Observable<API_CHANGE_TEMPLATE_RESPONSE> {
        const url = `${this.updaters.screen_template}`;
        return this.postRequest(url, body);
    }

    create_screen(data): Observable<CREATE_SCREEN_RESPONSE> {
        const url = `${this.creators.api_new_screen}`;
        return this.postRequest(url, data);
    }

    edit_screen(data) {
        const url = `${this.updaters.api_update_screen}`;
        return this.postRequest(url, data);
    }

    get_screens(page, key, column, order) {
        const base = `${this.getters.api_get_screens}`;
        const params = this.setUrlParams(
            { page, search: key, sortColumn: column, sortOrder: order },
            false,
            true,
        );
        const url = `${base}${params}`;
        return this.getRequest(url);
    }

    get_screens_search(key) {
        return this.getRequest(`${this.getters.api_get_screens}` + '?search=' + `${key}`);
    }

    get_screens_type() {
        return this.getRequest(`${this.getters.api_get_screens_type}`);
    }

    get_screen_by_id(
        id: string,
        licenseId?: string,
    ): Observable<{ message: string } | API_SINGLE_SCREEN> {
        let base = `${this.getters.api_get_screen_by_id}${id}`;
        if (licenseId) base += `&licenseId=${licenseId}`;
        return this.getRequest(base);
    }

    get_screen_by_dealer_id(id) {
        return this.getRequest(`${this.getters.api_get_screen_by_dealer}${id}`);
    }

    api_get_screen_by_dealer_table(page, id, key) {
        const base = `${this.getters.api_get_screen_by_dealer_table}`;
        const params = this.setUrlParams({ page, dealerid: id, search: key }, false, true);
        const url = `${base}${params}`;
        return this.getRequest(url);
    }

    get_screen_total() {
        return this.getRequest(`${this.getters.api_get_screens_total}`);
    }

    get_screen_total_by_dealer(id) {
        return this.getRequest(`${this.getters.api_get_screens_total_by_dealer}${id}`);
    }

    delete_screen(to_delete) {
        const url = `${this.deleters.api_remove_screen}`;
        return this.postRequest(url, to_delete);
    }

    unassign_license(data) {
        const url = `${this.deleters.api_remove_screen_license}`;
        return this.postRequest(url, data);
    }
}
