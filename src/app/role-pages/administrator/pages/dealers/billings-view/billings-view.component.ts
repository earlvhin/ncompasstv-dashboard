import { Component, OnInit, Input } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, DealerService } from 'src/app/global/services';
import { UI_DEALER_BILLING } from 'src/app/global/models/ui_dealer-billing.model';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from 'src/app/global/models';

@Component({
    selector: 'app-billings-view',
    templateUrl: './billings-view.component.html',
    styleUrls: ['./billings-view.component.scss'],
})
export class BillingsViewComponent implements OnInit {
    alldealervalues: any;
    alldealervalues_paging: any;
    billing_data: any;
    billings_to_export: any = [];
    filtered_data_billings: any[] = [];
    initial_load_billings: boolean = true;
    is_dealer_admin: boolean = false;
    is_loading: boolean = false;
    search_key: string = '';
    sort_column_billings: string = '';
    sort_order_billings: string = '';
    workbook: any;
    workbook_generation: boolean = false;
    worksheet: any;

    billings_table_column = [
        { name: '#', sortable: false, no_export: true },
        { name: 'Dealer ID', sortable: false, key: 'dealerId', hidden: true, no_show: true },
        { name: 'Dealer Alias', sortable: false, key: 'dealerIdAlias' },
        { name: 'Dealer Name', sortable: false, key: 'businessName' },
        { name: 'Current Licenses', sortable: false, key: 'totalLicenses' },
        { name: 'Billable Licenses', sortable: false, key: 'billableLicenses' },
        { name: 'Price/License', sortable: false, key: 'perLicense' },
        { name: 'New License Price', sortable: false, key: 'licensePriceNew' },
        { name: 'Base Fee', sortable: false, key: 'baseFee' },
        { name: 'Total Bill', sortable: false, key: 'billing' },
        { name: 'Billing Date', key: 'billingDate', sortable: true, column: 'BillingDate' },
        { name: 'Auto Charge', sortable: false, key: 'autoCharge', hidden: true, no_show: true },
    ];

    subscription: Subscription = new Subscription();
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _dealer: DealerService,
        private _auth: AuthService,
    ) {}

    ngOnInit() {
        if (this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            this.is_dealer_admin = true;
        }
        this.getAllDealerBillings(1);
    }

    getAllDealerBillings(page: number) {
        this.is_loading = false;
        this.subscription.add(
            this._dealer
                .get_all_dealer_values(
                    page,
                    this.search_key,
                    this.sort_column_billings,
                    this.sort_order_billings,
                )
                .pipe(takeUntil(this._unsubscribe))
                .subscribe((response) => {
                    this.setDealerValuesData(response);
                }),
        );
    }

    setDealerValuesData(response) {
        this.alldealervalues_paging = response.paging;
        this.is_loading = true;
        this.initial_load_billings = false;
        if (response.paging.totalEntities > 0) {
            this.alldealervalues = response.paging.entities;
            this.filtered_data_billings = this.alldealervalues;
            this.billing_data = this.billing_mapToUIFormat(this.alldealervalues);
        } else {
            this.filtered_data_billings = [];
        }
    }

    filterData(e) {
        this.search_key = e;
        this.getAllDealerBillings(1);
    }

    private get currentRole() {
        return this._auth.current_role;
    }

    toggleCharge(e) {}

    reloadBilling() {}

    billing_mapToUIFormat(data): any {
        let count = this.alldealervalues_paging.pageStart;
        return data.map((h) => {
            const table = new UI_DEALER_BILLING(
                { value: count++, link: null, editable: false, hidden: false },
                { value: h.dealerId, link: null, editable: false, hidden: true, key: false },
                {
                    value: h.dealerIdAlias,
                    link: `/${this.currentRole}/dealers/${h.dealerId}`,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                    status: true,
                },
                {
                    value: h.businessName ? h.businessName : '--',
                    link: `/${this.currentRole}/dealers/${h.dealerId}`,
                    new_tab_link: true,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.totalLicenses > 0 ? h.totalLicenses : 0,
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.billableLicenses > 0 ? h.billableLicenses : 0,
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.perLicense > 0 ? '$ ' + h.perLicense : '$ ' + 0,
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.licensePriceNew > 0 ? '$ ' + h.licensePriceNew : '$ ' + 0,
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.baseFee > 0 ? '$ ' + h.baseFee : '$ ' + 0,
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.billing > 0 ? '$ ' + h.billing : '$ ' + 0,
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.billingDate > 0 ? (h.billingDate === 1 ? '1st' : '15th') : 0,
                    link: null,
                    editable: false,
                    hidden: false,
                },
                {
                    value: h.autoCharge > 0 ? h.autoCharge : 0,
                    link: null,
                    editable: false,
                    hidden: true,
                },
            );
            return table;
        });
    }

    exportTable() {
        this.workbook_generation = true;
        const header = [];
        this.workbook = new Workbook();
        this.workbook.creator = 'NCompass TV';
        this.workbook.useStyles = true;
        this.workbook.created = new Date();
        this.worksheet = this.workbook.addWorksheet('Billings View');
        Object.keys(this.billings_table_column).forEach((key) => {
            if (
                this.billings_table_column[key].name &&
                !this.billings_table_column[key].no_export
            ) {
                header.push({
                    header: this.billings_table_column[key].name,
                    key: this.billings_table_column[key].key,
                    width: 30,
                    style: { font: { name: 'Arial', bold: true } },
                });
            }
        });
        this.worksheet.columns = header;
        this.getDataForExport();
    }

    getDataForExport() {
        const EXCEL_TYPE =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        this._dealer
            .get_all_dealer_values(
                1,
                this.search_key,
                this.sort_column_billings,
                this.sort_order_billings,
                0,
            )
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                if (response.message) {
                    this.billings_to_export = [];
                    return;
                } else {
                    this.billings_to_export = [...response.paging.entities];
                    this.billings_to_export.map((bill) => {
                        this.modifyDataForExport(bill);
                    });
                }

                this.billings_to_export.forEach((item) => {
                    this.worksheet.addRow(item).font = { bold: false };
                });

                let rowIndex = 1;
                for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
                    this.worksheet.getRow(rowIndex).alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true,
                    };
                }

                this.workbook.xlsx.writeBuffer().then((file: any) => {
                    const blob = new Blob([file], { type: EXCEL_TYPE });
                    const filename = 'Billings' + '.xlsx';
                    saveAs(blob, filename);
                });

                this.workbook_generation = false;
            });
    }

    private modifyDataForExport(data) {
        data.perLicense = '$ ' + data.perLicense;
        data.licensePriceNew = '$ ' + data.licensePriceNew;
        data.baseFee = '$ ' + data.baseFee;
        data.billing = '$ ' + data.billing;
        data.billingDate = data.billingDate > 0 ? (data.billingDate > 1 ? '15th' : '1st') : '';
        data.autoCharge = data.autoCharge > 0 ? 'Yes' : 'No';
    }

    getAdvertisersColumnsAndOrder(data) {
        this.sort_column_billings = data.column;
        this.sort_order_billings = data.order;
        this.getAllDealerBillings(1);
    }
}
