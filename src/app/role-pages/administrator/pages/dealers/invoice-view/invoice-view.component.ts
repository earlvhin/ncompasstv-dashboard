import { Component, OnInit, Input } from '@angular/core';
import { BillingService } from 'src/app/global/services/billing-service/billing-service';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UI_DEALER_INVOICE_TRANSACTIONS } from 'src/app/global/models/ui_dealer_transactions.model';

import * as moment from 'moment';

@Component({
    selector: 'app-invoice-view',
    templateUrl: './invoice-view.component.html',
    styleUrls: ['./invoice-view.component.scss'],
})
export class InvoiceViewComponent implements OnInit {
    @Input() dealerId: string;

    initial_load_hosts: boolean = true;
    is_loading: boolean = false;
    filtered_status: string = '';
    filtered_billing_date: string = '';
    filtered_data_transactions: any = [];
    search_data_host: string = '';
    searching_hosts: boolean = false;
    transactions: any;
    transactions_paging: any;
    transaction_data: any;

    subscription: Subscription = new Subscription();
    protected _unsubscribe = new Subject<void>();

    filters: any = {
        billing_date: '',
        label_status: '',
    };

    transactions_table_column = [
        { name: '#', sortable: false, no_export: true },
        { name: 'Dealer Alias', sortable: false, key: 'dealerAlias' },
        { name: 'Dealer Name', sortable: false, key: 'businessName' },
        { name: 'Total Bill', sortable: false, key: 'amount' },
        { name: 'Billing Date', sortable: false, key: 'billingDate' },
        { name: 'Status', sortable: false, key: 'status' },
    ];

    constructor(private _billing: BillingService) {}

    ngOnInit() {
        this.getTransactions(1);
    }

    filterData(e) {
        if (e) {
            this.search_data_host = e;
            this.getTransactions(1);
        } else {
            this.search_data_host = '';
            this.getTransactions(1);
        }
    }

    getTransactions(page) {
        this.is_loading = false;
        this.searching_hosts = true;
        this.subscription.add(
            this._billing
                .get_invoice_charges(
                    page,
                    15,
                    this.search_data_host,
                    this.filtered_status,
                    this.filtered_billing_date,
                )
                .pipe(takeUntil(this._unsubscribe))
                .subscribe((response: any) => {
                    if (!response.message) {
                        this.transactions_paging = response.paging;
                        if (response.paging.totalEntities > 0) {
                            this.transactions = response.paging.entities;
                            this.filtered_data_transactions = this.transactions;
                            this.transaction_data = this.billing_mapToUIFormat(this.transactions);
                        }
                    } else {
                        this.transactions = [];
                        this.filtered_data_transactions = [];
                    }
                    this.is_loading = true;
                })
                .add(() => {
                    this.initial_load_hosts = false;
                    this.searching_hosts = false;
                }),
        );
    }

    clearFilter() {
        this.filters.billing_date = '';
        this.filters.label_status = '';
        this.filtered_status = '';
        this.filtered_billing_date = '';
        this.getTransactions(1);
    }

    filterStatus(status) {
        this.filtered_status = status;
        this.getTransactions(1);
        this.filters.label_status = status;
    }

    filterBillingDate(date) {
        this.filtered_billing_date = date;
        this.getTransactions(1);
        this.filters.billing_date = date;
    }

    billing_mapToUIFormat(data): any {
        let count = this.transactions_paging.pageStart;
        return data.map((h) => {
            const table = new UI_DEALER_INVOICE_TRANSACTIONS(
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: h.dealerAlias,
                    link: '/administrator/dealers/' + h.dealerId,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.businessName,
                    link: '/administrator/dealers/' + h.dealerId,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                { value: '$ ' + h.amount, link: null, editable: false, hidden: false },
                { value: h.billingDate, link: null, editable: false, hidden: false },
                { value: h.status, link: null, editable: false, hidden: false },
                { value: h.receiptUrl, link: null, editable: false, hidden: true, no_show: true },
            );
            return table;
        });
    }
}
