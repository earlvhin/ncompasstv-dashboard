import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';

import { HttpHeaders, HttpClient } from '@angular/common/http';
import { BaseService } from '../base.service';

@Injectable({
    providedIn: 'root',
})
export class CategoryService extends BaseService {
    token = JSON.parse(localStorage.getItem('tokens'));

    http_options = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            credentials: 'include',
            Accept: 'application/json',
        }),
    };

    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    get_categories() {
        const url = this.getters.api_get_categories;
        return this.getRequest(url);
    }

    get_parent_categories() {
        const url = this.getters.api_get_parent_categories;
        return this.getRequest(url).map((data) => data.parentCategory);
    }

    get_category_general(category) {
        const url = `${this.getters.api_get_category_general}${category}`;
        return this.getRequest(url);
    }
}
