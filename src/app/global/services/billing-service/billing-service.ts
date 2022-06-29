import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';

@Injectable({
	providedIn: 'root'
})

export class BillingService extends BaseService {
	get_transaction_charges(page, pageSize=15, id, dateTo, dateFrom, status?, type?) {
		return this.getRequest(
            `${this.getters.api_get_billing_charges}` + '?page=' + `${page}` + '&pageSize=' + `${pageSize}` + '&dealerid=' + `${id}` + '&from=' + `${dateFrom}` + '&to=' + `${dateTo}` + '&status=' + `${status}` + '&type=' + `${type}`
        );
 	}
}
