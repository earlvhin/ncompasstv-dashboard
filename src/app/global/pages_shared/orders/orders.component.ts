import { Component, OnInit, Input } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BillingService } from 'src/app/global/services/billing-service/billing-service';
import { AuthService } from 'src/app/global/services';
import { UI_DEALER_ORDERS } from 'src/app/global/models/ui_dealer_orders.model';
import * as moment from 'moment';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {

    @Input() dealerId: string = '';

    end: any;
    end_date: any;
    initial_load_orders: boolean = true;
    is_loading: boolean = false;
    filtered_status: string = '';
    filtered_billing_date: string = '';
    filtered_data_orders: any = [];
    search_data_orders: string = "";
    searching_orders: boolean = false;
    start_date: any;
    start: any;
    orders: any;
    orders_paging: any;
    orders_data: any;

    subscription: Subscription = new Subscription;
    protected _unsubscribe = new Subject<void>();

    filters: any = {
        billing_date:"",
        label_status:"",
    }

    orders_table_column = [
		{ name: '#', sortable: false, no_export: true },
        { name: 'Date', sortable: false, key: 'date'},
        { name: 'Order No', sortable: false, key: 'orderNo',},
        { name: 'Dealer Alias', sortable: false, key: 'dealerAlias'},
        { name: 'Dealer Name', sortable: false, key: 'businessName'},
        { name: 'Quantity', sortable: false, key: 'quantity'},
        { name: 'Status', sortable: false, key: 'status'},
	];

    constructor(
        private _billing: BillingService,
        private _auth: AuthService,
        private _dialog: MatDialog,
    ) { }

    ngOnInit() {
        this.setDefaultStartDate();
        this.getOrders(1);
        console.log("DealerID", this.dealerId)
    }

    setDefaultStartDate() {
        var current_year = moment().format('YYYY');
        var current_day = moment().format('MM-DD-YYYY');
        this.start_date = moment(new Date(current_year)).format('MM-DD-YYYY');
        this.end_date = current_day;
        this.start = new Date(moment(new Date(current_year)).format('MM-DD-YYYY'));
        this.end = new Date(current_day);
    }

    filterData(e) {
        if (e) {
            this.search_data_orders = e;
            this.getOrders(1);
        } else {
            this.search_data_orders = "";
            this.getOrders(1);
        }   
    }

    getOrders(page) {
        this.is_loading = false;
        this.searching_orders = true;
        if(this.dealerId == '') {
            this.subscription.add(
                this._billing.get_billing_purchases(page, 15, this.search_data_orders, this.end_date, this.start_date, this.filtered_status).pipe(takeUntil(this._unsubscribe)).subscribe(
                    response => {
                        if(!response.message) {
                            this.orders_paging = response.paging;
                            if(response.paging.totalEntities > 0) {
                                this.orders = response.paging.entities;
                                this.filtered_data_orders = this.orders;
                                this.orders_data = this.billing_mapToUIFormat(this.orders);
                            }
                        } else {
                            this.orders = [];
                            this.filtered_data_orders = [];
                        }
                        this.is_loading = true;
                    }
                ).add(() => {
                    this.initial_load_orders = false;
                    this.searching_orders = false;
                })
            )
        } else {
            this.subscription.add(
                this._billing.get_billing_purchases_per_dealer(this.dealerId, page, 15, this.end_date, this.start_date, this.filtered_status).pipe(takeUntil(this._unsubscribe)).subscribe(
                    response => {
                        if(!response.message) {
                            this.orders_paging = response.paging;
                            if(response.paging.totalEntities > 0) {
                                this.orders = response.paging.entities;
                                this.filtered_data_orders = this.orders;
                                this.orders_data = this.billing_mapToUIFormat(this.orders);
                            }
                        } else {
                            this.orders = [];
                            this.filtered_data_orders = [];
                        }
                        this.is_loading = true;
                    }
                ).add(() => {
                    this.initial_load_orders = false;
                    this.searching_orders = false;
                })
            )
        }
        
    }

    onSelectStartDate(date) {
        this.start_date = date.format('MM-DD-YYYY');
        this.getOrders(1);
    }
    
    onSelectEndDate(date) {
        this.end_date = date.format('MM-DD-YYYY');
        this.getOrders(1);
    }

    clearFilter() {
        this.filters.billing_date = '';
        this.filters.label_status = '';
        this.filtered_status = '';
        this.filtered_billing_date = '';
        this.getOrders(1);
    }

    filterStatus(status) {
        this.filtered_status = status;
        this.getOrders(1)
        this.filters.label_status = status;
    }
    
    filterBillingDate(date) {
        this.filtered_billing_date = date;
        this.getOrders(1)
        this.filters.billing_date = date;
    }

    billing_mapToUIFormat(data): any {
		let count = this.orders_paging.pageStart;
		return data.map(
			h => {
				const table = new UI_DEALER_ORDERS (
                    { value: count++, link: null , editable: false, hidden: false},
					{ value: h.date, link: null , editable: false, hidden: false},
					{ value: h.orderNo, link: null , editable: false, hidden: false},
					{ value: h.dealerAlias, link: '/administrator/dealers/' + h.dealerId , new_tab_link:true, editable: false, hidden: false},
					{ value: h.businessName, link: '/administrator/dealers/' + h.dealerId , new_tab_link:true, editable: false, hidden: false},
					{ value: h.quantity, link: null, editable: false, hidden: false },
                    { value: h.status, link: null , editable: false, hidden: false },
                );
				return table;
			}
		);
	}

    shipOrder(event) {
        var data_order = this.orders.filter( orders => orders.orderNo === event.order_id)
        var shipping_details = {
            dealerId: data_order[0].dealerId,
            userId: this._auth.current_user_value.user_id,
            OrderNo: event.order_id,
            status: event.order_status
        }

		this._billing.update_billing_order(shipping_details).subscribe(
			response => {
				if(response) {
                    this.openConfirmationModal('success', 'Success!', 'Order has been marked as ' + event.order_status); 
                }
			}
		)		
	}

    openConfirmationModal(status, message, data): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  { status, message, data }
		})

		dialog.afterClosed().subscribe(() => this.ngOnInit());
	}
}
