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
	
    get_invoice_charges(page, pageSize=15, searchkey, status?, date?) {
		return this.getRequest(
            `${this.getters.api_get_billing_invoice_charges}` + '?page=' + `${page}` + '&pageSize=' + `${pageSize}` + '&status=' + `${status}` + '&billingdate=' + `${date}`+ '&filterby=' + `${searchkey}`
        );
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
}
