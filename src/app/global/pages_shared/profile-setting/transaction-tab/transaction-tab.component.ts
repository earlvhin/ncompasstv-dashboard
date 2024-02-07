import { Component, OnInit, Input } from '@angular/core';
import { BillingService } from 'src/app/global/services/billing-service/billing-service';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UI_DEALER_TRANSACTIONS } from 'src/app/global/models/ui_dealer_transactions.model';

import * as moment from 'moment';

@Component({
    selector: 'app-transaction-tab',
    templateUrl: './transaction-tab.component.html',
    styleUrls: ['./transaction-tab.component.scss'],
})
export class TransactionTabComponent implements OnInit {
    @Input() dealerId: string;

    end: any;
    end_date: any;
    is_loading: boolean = false;
    filtered_status: string = '';
    filtered_type: string = '';
    filtered_data_transactions: any = [];
    start_date: any;
    start: any;
    transactions: any;
    transactions_paging: any;
    transaction_data: any;

    subscription: Subscription = new Subscription();
    protected _unsubscribe = new Subject<void>();

    filters: any = {
        label_type: '',
        label_status: '',
    };

    transactions_table_column = [
        { name: '#', sortable: false, no_export: true },
        { name: 'Date', sortable: false, key: 'date' },
        { name: 'Order No', sortable: false, key: 'orderNo' },
        { name: 'Transaction Type', sortable: false, key: 'description' },
        { name: 'Description', sortable: false, key: 'description' },
        { name: 'Price', sortable: false, key: 'amount' },
        { name: 'Status', sortable: false, key: 'status' },
    ];

    constructor(private _billing: BillingService) {}

    ngOnInit() {
        this.setDefaultStartDate();
        this.getTransactions(1);
    }

    setDefaultStartDate() {
        var current_year = moment().format('YYYY');
        var current_day = moment().format('MM-DD-YYYY');
        this.start_date = moment(new Date(current_year)).format('MM-DD-YYYY');
        this.end_date = current_day;
        this.start = new Date(moment(new Date(current_year)).format('MM-DD-YYYY'));
        this.end = new Date(current_day);
    }

    getTransactions(page) {
        this.is_loading = false;
        this.subscription.add(
            this._billing
                .get_transaction_charges(
                    page,
                    15,
                    this.dealerId,
                    this.end_date,
                    this.start_date,
                    this.filtered_status,
                    this.filtered_type,
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
                }),
        );
    }

    clearFilter() {
        this.filters.label_type = '';
        this.filters.label_status = '';
        this.filtered_status = '';
        this.filtered_type = '';
        this.getTransactions(1);
    }

    onSelectStartDate(date) {
        this.start_date = date.format('YYYY-MM-DD');
        this.getTransactions(1);
    }

    onSelectEndDate(date) {
        this.end_date = date.format('YYYY-MM-DD');
        this.getTransactions(1);
    }

    filterStatus(status) {
        this.filtered_status = status;
        this.getTransactions(1);
        this.filters.label_status = status;
    }

    filterType(type) {
        this.filtered_type = type;
        this.getTransactions(1);
        this.filters.label_type = type;
    }

    billing_mapToUIFormat(data): any {
        let count = this.transactions_paging.pageStart;
        return data.map((h) => {
            const table = new UI_DEALER_TRANSACTIONS(
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: moment(h.date).format('MMM DD YYYY'),
                    link: null,
                    editable: false,
                    hidden: false,
                },
                { value: h.orderNo, link: null, editable: false, hidden: false },
                {
                    value: h.description.split(' ')[0] === 'Purchase' ? 'Purchase' : 'Subscription',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                { value: h.description, link: null, editable: false, hidden: false },
                {
                    value: h.amount > 0 ? '$ ' + h.amount : '$ ' + 0,
                    link: null,
                    editable: false,
                    hidden: false,
                },
                { value: h.status, link: null, editable: false, hidden: false },
                { value: h.receiptUrl, link: null, editable: false, hidden: true, no_show: true },
            );
            return table;
        });
    }
}
