import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { DatePipe, TitleCasePipe } from '@angular/common'
import { API_DEALER } from '../../../../global/models/api_dealer.model';
import { HostService } from '../../../../global/services/host-service/host.service';
import { LicenseService } from '../../../../global/services/license-service/license.service';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { LicenseModalComponent } from '../../../../global/components_shared/license_components/license-modal/license-modal.component';
import { UI_TABLE_LICENSE_BY_DEALER } from '../../../../global/models/ui_table-license-by-dealer.model';
import { UI_LICENSE } from '../../../../global/models/ui_dealer-license.model';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-licenses',
	templateUrl: './licenses.component.html',
	styleUrls: ['./licenses.component.scss'],
	providers: [DatePipe, TitleCasePipe]
})

export class LicensesComponent implements OnInit {
	dealers_data: UI_TABLE_LICENSE_BY_DEALER[] = [];
	licenses_data: UI_LICENSE[] = [];
	no_dealer: boolean;
	no_licenses: boolean;
	filtered_data: UI_TABLE_LICENSE_BY_DEALER[] = [];
	filtered_data_licenses: UI_LICENSE[] = [];
	subscription: Subscription = new Subscription();
	title: string = "Licenses";
	tab: any = { tab: 0 };
	licenses_details: any;
	paging_data: any;
	paging_data_licenses: any;
	searching: boolean = false;
	searching_licenses: boolean = false;
	initial_load: boolean = true;
	initial_load_licenses: boolean = true;
	search_data: string = "";
	search_data_licenses: string = "";
    splitted_text: any;

	// UI Table Column Header
	dealers_table_column: string[] = [
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

    // UI Table Column Header
	license_table_column = [
		{ name: '#', sortable: false, no_export: true},
        { name: 'Status', sortable: false, key: 'piStatus', hidden: true, no_show: true},
		{ name: 'License Key', sortable: false, column:'LicenseKey', key: 'licenseKey'},
		{ name: 'Type', sortable: false, column:'ScreenType', key: 'screenType'},
		{ name: 'Host', sortable: false, column:'HostName', key: 'hostName'},
		{ name: 'Alias', sortable: false, column:'Alias', key: 'alias'},
		{ name: 'Last Push', sortable: false, column:'ContentsUpdated', key:'contentsUpdated'},
		{ name: 'Last Online', sortable: false, column:'TimeIn', key:'timeIn'},
		{ name: 'Net Type', sortable: false, column:'InternetType', key:'internetType'},
		{ name: 'Net Speed', sortable: false, key:'internetSpeed'},
		{ name: 'Display', sortable: false, key: 'displayStatus'},
		{ name: 'PS Version', sortable: false, key:'server', column:'ServerVersion'},
		{ name: 'UI Version', sortable: false, key:'ui', column:'UiVersion'},
		{ name: 'Anydesk', sortable: false, column:'ScreenName', key:'screenName' },
		{ name: 'Password', sortable: false, column:'TemplateName', key:'templateName'},		
		{ name: 'Installation Date', sortable: false, column:'InstallDate', key:'installDate'},
		{ name: 'Creation Date', sortable: false, key:'dateCreated'},
	]

	constructor(
		private _route: ActivatedRoute,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _date: DatePipe,
		private _license: LicenseService,
		private _title: TitleCasePipe,
        private cdr: ChangeDetectorRef,
	) { }

	ngOnInit() {
		this.getLicensesTotal();
        this.getLicenses(1);
	}

    ngAfterContentChecked() : void {
        this.cdr.detectChanges();
    }

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	getLicenses(page) {
        this.searching_licenses = true;
		this.licenses_data = [];    
        this.subscription.add(
			this._license.get_all_licenses(page, this.search_data_licenses).subscribe(
				data => {
                    this.paging_data_licenses = data.paging;
                    if (data.licenses) {
						this.licenses_data = this.licenses_mapToUIFormat(data.licenses);
						this.filtered_data_licenses = this.licenses_mapToUIFormat(data.licenses);
					} else {
						if(this.search_data == "") {
							this.no_licenses = true;
						}
						this.filtered_data_licenses = [];
					}
					this.initial_load_licenses = false;
					this.searching_licenses = false;
				}
			)
		)
	}

    onTabChanged(e) {
        if(e.index == 1) {
            this.pageRequested(1);
        } else {
            this.getLicenses(1);
        }
    }

	filterData(e, tab) {
        switch(tab) {
            case 'licenses':
                if (e) {
                    this.search_data_licenses = e;
                    this.getLicenses(1);
                } else {
                    this.search_data_licenses = "";
                    this.getLicenses(1);
                }    
                break;
            default:
                if (e) {
                    this.search_data = e;
                    this.pageRequested(1);
                } else {
                    this.search_data = "";
                    this.pageRequested(1);
                }
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
                    this.paging_data = data.paging;
                    if (data.dealers) {
						this.dealers_data = this.dealers_mapToUIFormat(data.dealers);
						this.filtered_data = this.dealers_mapToUIFormat(data.dealers);
					} else {
						if(this.search_data == "") {
							this.no_dealer = true;
						}
						this.filtered_data = [];
					}
					this.initial_load = false;
					this.searching = false;
				}
			)
		)
	}

	dealers_mapToUIFormat(data): UI_TABLE_LICENSE_BY_DEALER[] {
		let count = this.paging_data.pageStart;
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

    licenses_mapToUIFormat(data): UI_LICENSE[] {
		let count = this.paging_data_licenses.pageStart;
		return data.map(
			(l: any) => {
				const table = new UI_LICENSE(
                    { value: count++, link: null , editable: false, hidden: false},
					{ value: l.licenseId, link: null , editable: false, hidden: true, key: false, table: 'license'},
					{ value: l.licenseKey, link: '/administrator/licenses/' + l.licenseId, compressed: true, editable: false, hidden: false, status: true},
					{ value: l.screenType ? this._title.transform(l.screenType) : '--', editable: false, hidden: false },
					{ value: l.hostId ? l.hostName : '--', link: l.hostId ? '/administrator/hosts/' + l.hostId : null, editable: false, hidden: false},
					{ value: l.alias ? l.alias : '--', link: '/administrator/licenses/' + l.licenseId, editable: false, label: 'License Alias', id: l.licenseId, hidden: false },
					{ value: l.contentsUpdated ? l.contentsUpdated : '--', label: 'Last Push', hidden: false },
					{ value: l.timeIn ? this._date.transform(l.timeIn, 'MMM dd, y h:mm a') : '--', hidden: false },
					{ value: l.internetType ? this.getInternetType(l.internetType) : '--', link: null, editable: false, hidden: false },
					{ value: l.internetSpeed ? (l.internetSpeed == 'Fast' ? 'Good' : l.internetSpeed) : '--', link: null, editable: false, hidden: false },
					{ value: l.displayStatus == 1 ? 'ON' : "N/A", link: null, editable: false, hidden: false },
					{ value: l.serverVersion ? l.serverVersion : '1.0.0', link: null, editable: false, hidden: false },
					{ value: l.uiVersion ? l.uiVersion : '1.0.0', link: null, editable: false, hidden: false },
                    { value: l.anydeskId ? l.anydeskId : '--', link: null, editable: false, hidden: false, copy: true, label: 'Anydesk Id' },
					{ value: l.anydeskId ? this.splitKey(l.licenseId) : '--', link: null, editable: false, hidden: false, copy:true, label: 'Anydesk Password' },
					{ value: l.installDate && !l.installDate.includes('Invalid') ? this._date.transform(l.installDate, 'MMM dd, y') : '--', link: null, editable: false, label: 'Install Date', hidden: false, id: l.licenseId },
					{ value: l.dateCreated ? this._date.transform(l.dateCreated, 'MMM dd, y') : '--', link: null, editable: false, hidden: false },
					{ value: l.piStatus, link: null , editable: false, hidden: true },
				);
				return table;
			}
		);
	}

    splitKey(key) {
        this.splitted_text = key.split("-");
        return this.splitted_text[this.splitted_text.length - 1];
    }

    private getInternetType(value: string): string {
		if(value) {
			value = value.toLowerCase();
			if (value.includes('w')) {
				return 'WiFi';
			}
			if (value.includes('eth')) {
				return 'LAN';
			}
		}
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
