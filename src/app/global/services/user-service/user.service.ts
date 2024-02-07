import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';
import {
    API_DEALER,
    API_FILTERS,
    API_USER_ADVERTISER,
    API_USER_DATA,
    API_USER_HOST,
    UI_ROLE_DEFINITION,
} from 'src/app/global/models';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class UserService extends BaseService {
    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    deleteUser(userId: string) {
        const url = `${this.deleters.user}?userid=${userId}`;
        return this.postRequest(url, {});
    }

    get_users() {
        const url = this.getters.api_get_users;
        return this.getRequest(url);
    }

    get_users_by_filters(filters: API_FILTERS) {
        const endpoint = `${this.getters.api_get_users}`;
        const params = this.setUrlParams(filters, false, true);
        const url = `${endpoint}${params}`;
        return this.getRequest(url);
    }

    get_users_by_owner(ownerId: string) {
        const url = `${this.getters.users_by_owner}${ownerId}`;
        return this.getRequest(url);
    }

    get_users_search(key) {
        const url = `${this.getters.api_get_users}` + '?search=' + `${key}`;
        return this.getRequest(url);
    }

    get_user_total() {
        const url = this.getters.api_get_users_total;
        return this.getRequest(url);
    }

    get_user_role_by_id(id) {
        const url = `${this.getters.api_get_users_role_by_id}` + '?userid=' + `${id}`;
        return this.getRequest(url);
    }

    get_user_by_id(userId: string): Observable<{
        user?: API_USER_DATA;
        dealer?: any;
        host?: any;
        advertiser?: any;
        message?: string;
    }> {
        const url = `${this.getters.api_get_user_by_id}?user_id=${userId}`;

        return this.getRequest(url).map(
            (response: {
                dealer?: API_DEALER[];
                advertiser?: API_USER_ADVERTISER[];
                host?: API_USER_HOST[];
                user?: API_USER_DATA;
                message?: string;
            }) => {
                let result: any = {};

                if ('user' in response) result = { ...response.user };
                if ('dealer' in response)
                    result = response.dealer.length && { ...result, dealer: response.dealer[0] };
                if ('advertiser' in response)
                    result = response.advertiser.length && {
                        ...result,
                        advertiser: response.advertiser[0],
                    };
                if ('host' in response)
                    result = response.host.length && { ...result, host: response.host[0] };

                return result;
            },
        );
    }

    get_dealeradmin_dealers(
        userId: string,
    ): Observable<{ dealers: { businessName: string; dealerId: string }[] }> {
        const url = `${this.getters.api_get_dealer_admin_user}?userid=${userId}`;
        return this.getRequest(url);
    }

    get_user_alldata_by_id(userId: string, isAdmin: boolean) {
        const url = `${this.getters.api_get_user_by_id}?user_id=${userId}&isAdmin=${isAdmin}`;
        return this.getRequest(url).map((data) => data);
    }

    create_new_user(role: string, data: any) {
        let url: string;

        switch (role) {
            case UI_ROLE_DEFINITION.administrator:
                url = `${this.creators.api_new_admin}`;
                break;
            case UI_ROLE_DEFINITION.dealer:
                url = `${this.creators.api_new_dealer}`;
                break;
            case UI_ROLE_DEFINITION.dealeradmin:
                url = `${this.creators.api_new_dealer_admin}`;
                break;
            case UI_ROLE_DEFINITION['sub-dealer']:
                url = `${this.creators.sub_dealer_account}`;
                break;
            case UI_ROLE_DEFINITION.host:
                url = `${this.creators.api_new_host}`;
                break;
            case UI_ROLE_DEFINITION.advertiser:
                url = `${this.creators.api_new_advertiser}`;
                break;
            case UI_ROLE_DEFINITION.tech:
                url = `${this.creators.api_new_techrep}`;
                break;
        }
        return this.postRequest(url, data);
    }

    validate_email(email: string) {
        const pattern =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return pattern.test(String(email).toLowerCase());
    }

    update_email_notifications(userId: string, data: boolean) {
        const url = `${this.updaters.user_email_settings}`;
        const body = { allowEmail: data ? 1 : 0, userId };
        return this.postRequest(url, body);
    }

    update_permission(userId: string, type: string) {
        const url = `${this.updaters.account_permission}?userid=${userId}&type=${type}`;
        return this.postRequest(url, {});
    }

    update_user(data) {
        const url = `${this.updaters.api_update_user}`;
        return this.postRequest(url, data);
    }

    dealeradmin_update_user(data) {
        const url = `${this.updaters.dealeradmin_update_user}`;
        return this.postRequest(url, data);
    }

    get_user_notifications(id) {
        const url = `${this.getters.api_get_notifications}${id}`;
        return this.getRequest(url);
    }

    set_cookie_for_other_site(id) {
        const url = `${this.getters.api_get_and_set_cookies}${id}`;
        return this.getRequest(url);
    }

    protected get base() {
        return environment.base_uri;
    }

    protected get create() {
        return environment.create;
    }

    protected get delete() {
        return environment.delete;
    }

    protected get getters() {
        return environment.getters;
    }

    protected get update() {
        return environment.update;
    }

    protected setUrlParams(filters: API_FILTERS, enforceTagSearchKey = false, allowBlanks = false) {
        let result = '';
        Object.keys(filters).forEach((key) => {
            if (!allowBlanks && (typeof filters[key] === 'undefined' || !filters[key])) return;
            if (!result.includes('?')) result += `?${key}=`;
            else result += `&${key}=`;
            if (
                enforceTagSearchKey &&
                key === 'search' &&
                filters['search'] &&
                filters['search'].trim().length > 1 &&
                !filters['search'].startsWith('#')
            )
                filters['search'] = `#${filters['search']}`;
            if (typeof filters[key] === 'string' && filters[key].includes('#'))
                result += encodeURIComponent(filters[key]);
            else result += filters[key];
        });
        return result;
    }
}
