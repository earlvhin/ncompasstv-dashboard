import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as moment from 'moment';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { AuthService, BillingService } from 'src/app/global/services';
import { API_ORDER, UI_DEALER_ORDERS } from 'src/app/global/models';

@Component({
    selector: 'app-orders',
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit {
    @Input() dealerId: string = '';
    end: any;
    end_date: string;
    filtered_status: string = '';
    filtered_billing_date: string = '';
    filtered_data_orders: any = [];
    initial_load_orders: boolean = true;
    is_loading: boolean = false;
    search_data_orders = '';
    searching_orders = false;
    start_date: string;
    start: any;
    orders: any;
    orders_paging: any;
    orders_data: any;

    protected _unsubscribe = new Subject<void>();

    filters = {
        billing_date: '',
        label_status: '',
    };

    orders_table_column = [
        { name: '#', sortable: false, no_export: true },
        { name: 'Date', sortable: false, key: 'date' },
        { name: 'Order No', sortable: false, key: 'orderNo' },
        { name: 'Dealer Alias', sortable: false, key: 'dealerAlias' },
        { name: 'Dealer Name', sortable: false, key: 'businessName' },
        { name: 'Quantity', sortable: false, key: 'quantity' },
        { name: 'Status', sortable: false, key: 'status' },
    ];

    constructor(
        private _auth: AuthService,
        private _billing: BillingService,
        private _dialog: MatDialog,
    ) {}

    ngOnInit() {
        this.setDefaultStartDate();
        this.getOrders(1);
    }

    clearFilter() {
        this.filters.billing_date = '';
        this.filters.label_status = '';
        this.filtered_status = '';
        this.filtered_billing_date = '';
        this.getOrders(1);
    }

    filterData(event: any): void {
        let searchKey = '';

        if (event) searchKey = event;

        this.search_data_orders = searchKey;
        this.getOrders(1);
    }

    filterStatus(status: string) {
        this.filtered_status = status;
        this.getOrders(1);
        this.filters.label_status = status;
    }

    getOrders(page: number) {
        this.is_loading = false;
        this.searching_orders = true;

        let request = this._billing.get_billing_purchases(
            page,
            15,
            this.search_data_orders,
            this.end_date,
            this.start_date,
            this.filtered_status,
        );

        if (this.dealerId)
            request = this._billing.get_billing_purchases_per_dealer(
                this.dealerId,
                page,
                15,
                this.end_date,
                this.start_date,
                this.filtered_status,
            );

        request
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if (!response.message) {
                        this.orders_paging = response.paging;

                        if (response.paging.totalEntities > 0) {
                            this.orders = response.paging.entities;
                            this.filtered_data_orders = this.orders;
                            this.orders_data = this.billing_mapToUIFormat(this.orders);
                        }
                    } else {
                        this.orders = [];
                        this.filtered_data_orders = [];
                    }

                    this.is_loading = true;
                },
                (error) => {
                    this.is_loading = true;
                    console.error(error);
                },
            )
            .add(() => {
                this.initial_load_orders = false;
                this.searching_orders = false;
            });
    }

    onSelectEndDate(date: moment.Moment) {
        this.end_date = date.format('MM-DD-YYYY');
        this.getOrders(1);
    }

    onSelectStartDate(date: moment.Moment) {
        this.start_date = date.format('MM-DD-YYYY');
        this.getOrders(1);
    }

    shipOrder(event: { order_id: string; order_status: string }) {
        const data_order = this.orders.filter((orders) => orders.orderNo === event.order_id);

        const shipping_details = {
            dealerId: data_order[0].dealerId,
            userId: this._auth.current_user_value.user_id,
            OrderNo: event.order_id,
            status: event.order_status,
        };

        this._billing.update_billing_order(shipping_details).subscribe((response) => {
            if (!response) return;

            this.openConfirmationModal(
                'success',
                'Success!',
                'Order has been marked as ' + event.order_status,
            );
        });
    }

    private billing_mapToUIFormat(data: API_ORDER[]): UI_DEALER_ORDERS[] {
        let count = this.orders_paging.pageStart;

        return data.map((order) => {
            const is_new_order = order.hasViewed === 0;

            const table = new UI_DEALER_ORDERS(
                { value: count++, link: null, editable: false, hidden: false, is_new_order },
                { value: order.date, link: null, editable: false, hidden: false, is_new_order },
                { value: order.orderNo, link: null, editable: false, hidden: false, is_new_order },
                {
                    value: order.dealerAlias,
                    link: `/administrator/dealers/${order.dealerId}`,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    is_new_order,
                },
                {
                    value: order.businessName,
                    link: `/administrator/dealers/${order.dealerId}`,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    is_new_order,
                },
                { value: order.quantity, link: null, editable: false, hidden: false, is_new_order },
                { value: order.status, link: null, editable: false, hidden: false, is_new_order },
                { value: order.hasViewed, link: null, editable: false, hidden: true },
            );

            return table;
        });
    }

    private openConfirmationModal(status: string, message: string, data: string): void {
        const dialog = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status, message, data },
        });

        dialog.afterClosed().subscribe(() => this.ngOnInit());
    }

    private setDefaultStartDate() {
        const current_year = moment().format('YYYY');
        const current_day = moment().format('MM-DD-YYYY');
        this.start_date = moment(new Date(current_year)).format('MM-DD-YYYY');
        this.end_date = current_day;
        this.start = new Date(moment(new Date(current_year)).format('MM-DD-YYYY'));
        this.end = new Date(current_day);
    }
}
