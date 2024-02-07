import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

import { BaseService } from '../base.service';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { API_ORDER, PAGING } from 'src/app/global/models';

@Injectable({
    providedIn: 'root',
})
export class BillingService extends BaseService {
    on_click_order = new Subject<void>();
    token = JSON.parse(localStorage.getItem('tokens'));

    constructor(_auth: AuthService, _http: HttpClient) {
        super(_auth, _http);
    }

    get_transaction_charges(
        page: number,
        pageSize = 15,
        id: string,
        dateTo: string,
        dateFrom: string,
        status?: string,
        type?: string,
    ) {
        const url = `${this.getters.api_get_billing_charges}?page=${page}&pageSize=${pageSize}&dealerid=${id}&from=${dateFrom}&to=${dateTo}&status=${status}&type=${type}`;
        return this.getRequest(url);
    }

    get_invoice_charges(
        page: number,
        pageSize = 15,
        searchkey: string,
        status?: string,
        date?: string,
    ) {
        const url = `${this.getters.api_get_billing_invoice_charges}?page=${page}&pageSize=${pageSize}&status=${status}&billingdate=${date}&filterby=${searchkey}`;
        return this.getRequest(url);
    }

    update_billing_details(data) {
        return this.postRequest(this.updaters.api_update_card, data);
    }

    update_credit_card(data) {
        return this.postRequest(this.updaters.api_creditcard_update, data);
    }

    delete_credit_card(data) {
        return this.postRequest(this.deleters.api_delete_credit_card, data);
    }

    add_credit_card(data) {
        return this.postRequest(this.creators.add_credit_card, data);
    }

    get_billing_purchases(
        page,
        pageSize = 1,
        searchkey: string,
        startDate: string,
        endDate: string,
        orderStatus = '',
    ): Observable<{ paging?: PAGING; purchases?: API_ORDER[]; message?: string }> {
        const url = `${this.getters.api_get_billing_purchases}?page=${page}&pageSize=${pageSize}&filterBy=${searchkey}&from=${endDate}&to=${startDate}&status=${orderStatus}`;
        return this.getRequest(url);
    }

    get_billing_purchases_per_dealer(
        id: string,
        page: number,
        pageSize = 1,
        startDate: string,
        endDate: string,
        orderStatus = '',
    ) {
        const url = `${this.getters.api_get_dealer_orders}?dealerid=${id}&page=${page}&pageSize=${pageSize}&from=${endDate}&to=${startDate}&status=${orderStatus}`;
        return this.getRequest(url);
    }

    set_order_as_viewed(data: { orderId: string; createdBy: string }) {
        const url = this.updaters.set_order_as_viewed;
        return this.postRequest(url, data);
    }

    update_billing_order(data: any) {
        const url = `${this.updaters.api_billing_order_update}`;
        return this.postRequest(url, data);
    }
}
