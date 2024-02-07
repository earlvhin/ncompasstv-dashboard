import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { StatisticsService } from 'src/app/global/services/statistics-service/statistics.service';
import { LicenseModalComponent } from 'src/app/global/components_shared/license_components/license-modal/license-modal.component';
import { API_EXPORT_DEALER, API_ORDER } from 'src/app/global/models';
import { BillingService } from 'src/app/global/services';
import { UI_ROLE_DEFINITION } from 'src/app/global/models';

@Component({
    selector: 'app-dealers',
    templateUrl: './dealers.component.html',
    styleUrls: ['./dealers.component.scss'],
})
export class DealersComponent implements OnInit, OnDestroy {
    current_tab: string = 'Dealer';
    title: string = 'Dealers';
    dealer_stats: any;
    '';
    dealers_to_export: API_EXPORT_DEALER[] = [];
    is_dealer_admin: boolean = false;
    update_info: boolean = false;
    workbook: any;
    workbook_generation: boolean = false;
    worksheet: any;

    dealers_table_column_for_export = [
        { name: 'Dealer Alias', key: 'dealerIdAlias' },
        { name: 'Business Name', key: 'businessName' },
        { name: 'Contact Person', key: 'contactPerson' },
        { name: 'Age', key: 'monthAsDealer' },
        { name: 'Tags', key: 'tagsToString' },
        { name: 'Player Count', key: 'playerCount', no_show: true },
        { name: 'Total', key: 'totalLicenses' },
        { name: 'Unassigned', key: 'totalLicensesUnassigned' },
        { name: 'Online', key: 'totalLicensesOnline' },
        { name: 'Offline', key: 'totalLicensesOffline' },
        { name: 'Inactive', key: 'totalLicensesDisabled', no_show: true, hidden: true },
        { name: 'Scheduled', key: 'forInstallationHost' },
        { name: 'Total', key: 'totalHosts' },
        { name: 'Active', key: 'totalHostsActive' },
        { name: 'Total', key: 'totalAdvertisers' },
        { name: 'Active', key: 'totalAdvertisersActive' },
    ];

    orders = 0;

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _billing: BillingService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _stats: StatisticsService,
    ) {}

    ngOnInit() {
        this.getAdminStatistics();
        if (this._auth.current_role === 'dealeradmin') {
            this.is_dealer_admin = true;
        } else {
            this.getOrders();
            this.subscribeToOrderClick();
        }
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    exportTable(): void {
        this.workbook_generation = true;
        const header = [];
        this.workbook = new Workbook();
        this.workbook.creator = 'NCompass TV';
        this.workbook.useStyles = true;
        this.workbook.created = new Date();
        this.worksheet = this.workbook.addWorksheet('Dealers');

        Object.keys(this.dealers_table_column_for_export).forEach((key) => {
            if (
                this.dealers_table_column_for_export[key].name &&
                !this.dealers_table_column_for_export[key].no_export
            ) {
                header.push({
                    header: this.dealers_table_column_for_export[key].name,
                    key: this.dealers_table_column_for_export[key].key,
                    width: 30,
                    style: { font: { name: 'Arial', bold: true } },
                });
            }
        });

        const first_column = [
            'Dealer Alias',
            'Business Name',
            'Contact Person',
            'Age',
            'Tags',
            'Player Count',
            'Licenses',
            '',
            '',
            '',
            '',
            'Hosts',
            '',
            '',
            'Advertisers',
            '',
        ];
        this.worksheet.columns = header;
        this.worksheet.duplicateRow(1, true);
        this.worksheet.getRow(1).values = [];
        this.worksheet.getRow(1).values = first_column;
        this.worksheet.getRow(1).height = 25;
        this.worksheet.getRow(2).height = 20;
        this.worksheet.getCell('A1').alignment = { vertical: 'top', horizontal: 'left' };
        this.worksheet.mergeCells('A1:A2'); // Dealer AliAs
        this.worksheet.mergeCells('B1:B2'); // Business Name
        this.worksheet.mergeCells('C1:C2'); // Contact Person
        this.worksheet.mergeCells('D1:D2'); // Age
        this.worksheet.mergeCells('E1:E2'); // Tags
        this.worksheet.mergeCells('F1:F2'); // Player Count
        this.worksheet.mergeCells('G1:K1'); // Licenses
        this.worksheet.mergeCells('L1:N1'); // Hosts
        this.worksheet.mergeCells('O1:P1'); // Advertisers

        this.worksheet.getRow(1).font = {
            bold: true,
            name: 'Arial',
            size: 11,
        };

        this.getDataForExport();
    }

    openGenerateLicenseModal(): void {
        const dialogRef = this._dialog.open(LicenseModalComponent, {
            height: '400px',
            width: '500px',
        });

        dialogRef.afterClosed().subscribe(() => (this.update_info = true));
    }

    tabSelected(event: { index: number }): void {
        switch (event.index) {
            case 0:
                this.current_tab = 'Dealer';
                break;
            case 1:
                this.current_tab = 'Bills';
                break;
            case 2:
                this.current_tab = 'Invoice';
                break;
            case 3:
                this.current_tab = 'Orders';
                break;
            default:
        }
    }

    private getAdminStatistics(): void {
        this._stats
            .api_get_dealer_total()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                this.setStatistics(response);
            });
    }

    setStatistics(response) {
        this.dealer_stats = {
            basis: response.total,
            basis_label: 'Dealer(s)',
            good_value: response.totalActive,
            good_value_label: 'Active',
            bad_value: response.totalInActive,
            bad_value_label: 'Inactive',
            this_week_value: response.newDealersThisWeek,
            this_week_value_label: 'Dealer(s)',
            this_week_value_description: 'New this week',
            last_week_value: response.newDealersLastWeek,
            last_week_value_label: 'Dealer(s)',
            last_week_value_description: 'New Last Week',
        };
    }

    private getDataForExport(): void {
        this._dealer
            .export_dealers()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                this.setExportDealersData(response);
            });
    }

    setExportDealersData(response) {
        const EXCEL_TYPE =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        this.dealers_to_export = response;

        this.dealers_to_export.forEach((dealer) => {
            this.modifyExportData(dealer);
            this.worksheet.addRow(dealer).font = { bold: false };
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
            const filename = 'Dealers.xlsx';
            saveAs(blob, filename);
        });
        this.workbook_generation = false;
    }

    private getOrders() {
        let start_date = moment(new Date(moment().format('YYYY'))).format('MM-DD-YYYY');
        let end_date = moment().format('MM-DD-YYYY');
        let request = this._billing.get_billing_purchases(1, 0, '', end_date, start_date, '');

        request.pipe(takeUntil(this._unsubscribe)).subscribe((response) => {
            if (response.message) return (this.orders = 0);
            const orders = response.paging.entities as API_ORDER[];
            this.orders = orders.reduce(
                (previous, current) => (current.hasViewed === 0 ? ++previous : previous),
                0,
            );
        });
    }

    private modifyExportData(item: API_EXPORT_DEALER): void {
        item.monthAsDealer = `${item.monthAsDealer} month(s)`;
        item.tagsToString = item.tags.join(',');
    }

    private subscribeToOrderClick(): void {
        this._billing.on_click_order
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(() => this.getOrders());
    }
}
