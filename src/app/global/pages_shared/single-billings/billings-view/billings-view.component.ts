import { Component, OnInit, Input } from '@angular/core';
import { DealerService } from '../../../services/dealer-service/dealer.service';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/global/services';
import { UI_DEALER_BILLING } from 'src/app/global/models/ui_dealer-billing.model';

@Component({
    selector: 'app-billings-view',
    templateUrl: './billings-view.component.html',
    styleUrls: ['./billings-view.component.scss']
  })

  export class BillingsViewComponent implements OnInit {
    alldealervalues: any;
    alldealervalues_paging: any;
    billing_data: any;
    is_loading: boolean = false;

    billings_table_column = [
		{ name: '#', sortable: false, no_export: true },
        { name: 'Dealer ID', sortable: false, key: 'dearlerId', hidden: true, no_show: true },
        { name: 'Dealer Alias', sortable: false, key: 'dearlerIdAlias',},
        { name: 'Dealer Name', sortable: false, key: 'businessName',},
        { name: 'Billable Licenses', sortable: false, key: 'billableLicenses',},
        { name: 'Price/License', sortable: false, key: 'perLicense',},
        { name: 'New License Price', sortable: false, key: 'licensePriceNew',},
        { name: 'Base Fee', sortable: false, key: 'baseFee',},
        { name: 'Total Bill', sortable: false, key: 'billing',},
        { name: 'Billing Date', sortable: false, key: 'billingDate',},
	];

    subscription: Subscription = new Subscription;
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _dealer: DealerService,
        private _auth: AuthService,
        
    ) { }

    ngOnInit() {
        this.getAllDealerBillings(1);
    }



    getAllDealerBillings(page: number) {
        this.is_loading = false;
		this.subscription.add(
			this._dealer.get_all_dealer_values(page).pipe(takeUntil(this._unsubscribe)).subscribe(
				response => {
                    this.alldealervalues_paging = response.paging;
                    if(response.paging.totalEntities > 0) {
                        this.alldealervalues = response.paging.entities;
                        this.billing_data = this.billing_mapToUIFormat(this.alldealervalues);
                        this.is_loading = true;
                    }
                }
            )
        )
    }

    private get currentRole() {
		return this._auth.current_role;
	}

    toggleCharge(e) {

    }

    reloadBilling() {

    }

    billing_mapToUIFormat(data): any {
		let count = this.alldealervalues_paging.pageStart;
		return data.map(
			h => {
				const table = new UI_DEALER_BILLING (
                    { value: count++, link: null , editable: false, hidden: false},
					{ value: h.dealerId, link: null , editable: false, hidden: true, key: false},
					{ value: h.dealerIdAlias, link: `/${this.currentRole}/dealers/${h.dealerId}`, new_tab_link: 'true', editable: false, hidden: false, status: true,},
					{ value: h.businessName ? h.businessName: '--', link: `/${this.currentRole}/dealers/${h.dealerId}`, new_tab_link: 'true', editable: false, hidden: false},
					{ value: h.billableLicenses > 0 ? h.billableLicenses: 0, link: null, editable: false, hidden: false },
					{ value: h.perLicense > 0 ? '$ ' + h.perLicense: '$ ' + 0, link: null, editable: false, hidden: false },
					{ value: h.licensePriceNew > 0 ? '$ ' + h.licensePriceNew: '$ ' + 0, link: null, editable: false, hidden: false },
					{ value: h.baseFee > 0 ? '$ ' + h.baseFee: '$ ' + 0, link: null, editable: false, hidden: false },
					{ value: h.billing > 0 ? '$ ' + h.billing: '$ ' + 0, link: null, editable: false, hidden: false },
					{ value: h.billingDate > 0 ? (h.billingDate === 1 ? '1st' : '15th'): 0, link: null, editable: false, hidden: false },
					{ value: h.autoCharge > 0 ? h.autoCharge: 0, link: null, editable: false, hidden: true,  },
                );
				return table;
			}
		);
	}
}
