import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_TEMPLATE, API_ZONE } from 'src/app/global/models';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { BaseService } from '../base.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class TemplateService extends BaseService {
    onSelectZone = new EventEmitter<string>();

    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    get_templates(): Observable<API_TEMPLATE[]> {
        return this.getRequest(environment.getters.api_get_templates);
    }

    get_template_by_id(id: string): Observable<API_TEMPLATE[]> {
        return this.getRequest(`${environment.getters.api_get_template_by_id}${id}`);
    }

    new_template(data: any) {
        return this.postRequest(`${environment.create.api_new_template}`, data);
    }

    update_template(template: API_TEMPLATE['template'], templateZones: API_ZONE[]) {
        const url = `${environment.update.template}`;
        const data = { template, templateZones: templateZones };
        return this.postRequest(url, data);
    }
}
