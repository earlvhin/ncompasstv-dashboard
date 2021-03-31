import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { DatePipe, TitleCasePipe } from '@angular/common'
import { API_DEALER } from '../../../../global/models/api_dealer.model';
import { HostService } from '../../../../global/services/host-service/host.service';
import { LicenseService } from '../../../../global/services/license-service/license.service';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { LicenseModalComponent } from '../../../../global/components_shared/license_components/license-modal/license-modal.component';
import { UI_TABLE_LICENSE_BY_DEALER } from '../../../../global/models/ui_table-license-by-dealer.model';

@Component({
	selector: 'app-licenses',
	templateUrl: './licenses.component.html',
	styleUrls: ['./licenses.component.scss'],
	providers: [DatePipe, TitleCasePipe]
})

export class LicensesComponent implements OnInit {
	dealers_data: UI_TABLE_LICENSE_BY_DEALER[] = [];
	no_dealer: boolean;
	filtered_data: UI_TABLE_LICENSE_BY_DEALER[] = [];
	subscription: Subscription = new Subscription();
	title: string = "Licenses";
	tab: any = { tab: 2 };
	licenses_details: any;
	paging_data: any;
	searching: boolean = false;
	initial_load: boolean = true;
	search_data: string = "";

	// UI Table Column Header
	license_table_column: string[] = [
		'#',
		'Dealer Alias',
		'Business Name',
		'Contact Person',
		'Region',
		'City',
		'State',
		'Total',
		'Active',
		'Inactive',
		'Online',
		'Offline',
		'Recent Purchase Date',
		'Quantity'
	]

	constructor(
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _date: DatePipe,
		private _host: HostService,
		private _license: LicenseService,
		private _title: TitleCasePipe
	) { }

	ngOnInit() {
		this.getLicensesTotal();
		this.pageRequested(1);
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	filterData(e) {
		if (e) {
			this.search_data = e;
			this.pageRequested(1);
		} else {
			this.search_data = "";
			this.pageRequested(1);
		}
	}
	
	getLicensesTotal () {
		this.subscription.add(
			this._license.get_licenses_total().subscribe(
				(data: any) => {
					this.licenses_details = {
						basis: data.total,
						basis_label: 'License(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						new_this_week_value: data.newLicensesThisWeek,
						new_this_week_value_label: 'License(s)',
						new_this_week_value_description: 'New this week',
						new_last_week_value: data.newLicensesLastWeek,
						new_last_week_value_label: 'License(s)',
						new_last_week_value_description: 'New last week'
					}
				}
			)
		)
	}

	pageRequested(e) {
		this.searching = true;
		this.dealers_data = [];
		this.subscription.add(
			this._dealer.get_dealers_with_license(e, this.search_data).subscribe(
				data => {
					if (data.dealers) {
						this.dealers_data = this.dealers_mapToUIFormat(data.dealers);
						this.filtered_data = this.dealers_mapToUIFormat(data.dealers);
					} else {
						if(this.search_data == "") {
							this.no_dealer = true;
						}
						this.filtered_data = [];
					}
					this.paging_data = data.paging;
					this.initial_load = false;
					this.searching = false;
				}
			)
		)
	}

	dealers_mapToUIFormat(data): UI_TABLE_LICENSE_BY_DEALER[] {
		let count: number = 1;
		return data.filter(
			i => i.licenses.length > 0
		).map(
			(dealer: API_DEALER) => {
				return new UI_TABLE_LICENSE_BY_DEALER(
					{ value: dealer.dealerId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: dealer.dealerIdAlias ? dealer.dealerIdAlias : '--',  link: '/administrator/dealers/' +  dealer.dealerId, query: '2', editable: false, hidden: false},
					{ value: this._title.transform(dealer.businessName),  link: '/administrator/dealers/' +  dealer.dealerId, editable: false, hidden: false},
					{ value: this._title.transform(dealer.contactPerson), link: null , editable: false, hidden: false},
					{ value: dealer.region, link: null , editable: false, hidden: false},
					{ value: dealer.city, link: null , editable: false, hidden: false},
					{ value: dealer.state, link: null , editable: false, hidden: false},
					{ value: dealer.licenses.length, link: null , editable: false, hidden: false},
					{ value: dealer.licenses.length > 0 ? dealer.licenses.filter(i => i.hostId != null).length : 0, link: null , editable: false, hidden: false},
					{ value: dealer.licenses.length > 0 ? dealer.licenses.filter(i => i.hostId == null).length : 0, link: null , editable: false, hidden: false},
					{ value: dealer.licenses.length > 0 ? dealer.licenses.filter(i => i.piStatus == 1).length : 0, link: null , editable: false, hidden: false, online_field: true},
					{ value: dealer.licenses.length > 0 ? dealer.licenses.filter(i => i.piStatus != 1).length : 0, link: null , editable: false, hidden: false, offline_field: true},
					{ value: dealer.licenses.length > 0 ? this._date.transform(dealer.licenses[0].dateCreated) : '--', link: null , editable: false, hidden: false},
					{ value: dealer.licenses.length > 0 ? dealer.licenses.filter(i => this._date.transform(i.dateCreated) == this._date.transform(dealer.licenses[0].dateCreated)).length : 0, link: null , editable: false, hidden: false},
				)
			}
		)
	}

	openGenerateLicenseModal(): void {
		let dialogRef = this._dialog.open(LicenseModalComponent, {
			height: '400px',
			width: '500px'
		});

		dialogRef.afterClosed().subscribe(result => {
			this.ngOnInit() 
		});
	}
}
