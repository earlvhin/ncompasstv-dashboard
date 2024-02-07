import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

import { AuthService } from '../auth-service/auth.service';
import { BaseService } from '../base.service';

@Injectable({
    providedIn: 'root',
})
export class NotificationService extends BaseService {
    private resolve_all_event = new Subject<any>();
    resolve_all_event_emitted$ = this.resolve_all_event.asObservable();

    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    emitResolveAllEvent(change: any) {
        this.resolve_all_event.next(change);
    }

    getAll(page: number = 1, pageSize: number = 50) {
        const url = `${this.getters.api_get_all_notifications}?page=${page ? page : 1}&pageSize=${pageSize}`;
        return this.getRequest(url);
    }

    getByDealerId(dealerId: string, page: number = 1, pageSize: number = 50) {
        const url = `${this.getters.api_get_dealer_notifications}${dealerId}&page=${page ? page : 1}&pageSize=${pageSize}`;
        return this.getRequest(url);
    }

    updateNotificationStatus(id: string) {
        const url = `${this.updaters.api_update_notification_status}${id}`;
        return this.postRequest(url, {});
    }

    updateAllNotificationStatus() {
        const url = `${this.updaters.api_update_all_notification_status}`;
        return this.postRequest(url, {});
    }

    updateNotificationStatusByDealerId(dealerId: string) {
        const url = `${this.updaters.api_update_notification_status_by_dealer}${dealerId}`;
        return this.postRequest(url, {});
    }
}
