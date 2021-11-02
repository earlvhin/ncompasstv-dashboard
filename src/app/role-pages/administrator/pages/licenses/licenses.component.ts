import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common'
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver';
import * as moment from 'moment';

import { environment } from 'src/environments/environment';
import { AuthService, HostService, LicenseService } from 'src/app/global/services';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { API_DEALER, UI_LICENSE, UI_HOST_VIEW, UI_TABLE_LICENSE_BY_DEALER, API_HOST } from 'src/app/global/models';
import { UserSortModalComponent } from 'src/app/global/components_shared/media_components/user-sort-modal/user-sort-modal.component';
import { LicenseModalComponent } from 'src/app/global/components_shared/license_components/license-modal/license-modal.component';

@Component({
	selector: 'app-licenses',
	templateUrl: './licenses.component.html',
	styleUrls: ['./licenses.component.scss'],
	providers: [DatePipe, TitleCasePipe]
})

export class LicensesComponent implements OnInit {
	dealers_data: UI_TABLE_LICENSE_BY_DEALER[] = [];
	licenses_data: UI_LICENSE[] = [];
	hosts_data: UI_HOST_VIEW[] = [];
	no_dealer: boolean;
	no_host: boolean;
	no_licenses: boolean;
	filtered_data: UI_TABLE_LICENSE_BY_DEALER[] = [];
	filtered_data_host: UI_HOST_VIEW[] = [];
	filtered_data_licenses: UI_LICENSE[] = [];
	subscription: Subscription = new Subscription();
	title: string = "Licenses";
	tab: any = { tab: 0 };
	licenses_details: any;
    now: any;
	paging_data: any;
	paging_data_licenses: any;
	paging_data_host: any;
	searching: boolean = false;
	searching_licenses: boolean = false;
	searching_hosts: boolean = false;
	initial_load: boolean = true;
	initial_load_licenses: boolean = true;
	initial_load_hosts: boolean = true;
	search_data: string = "";
	search_data_licenses: string = "";
	search_data_host: string = "";
    splitted_text: any;
    sort_column: string = "PiStatus";
	sort_order: string = "desc";
    sort_column_hosts: string = '';
	sort_order_hosts: string = '';

    //for export
    hosts_to_export: any = [];
    licenses_to_export: any = [];
    pageSize: number;
    workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;
	temp_label: any = [];
    temp_array: any = [];
    temp_label_this_week: any = [];
    temp_array_this_week: any = [];
    temp_label_last_week: any = [];
    temp_array_last_week: any = [];

    filters: any = {
        activated: "",
        zone:"",
        status:"",
        dealer:'',
        host:'',
        label_status:"",
        label_zone:"",
        label_dealer: "",
        label_host: ""
    }

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
        { name: 'Screenshot', sortable: false, no_export: true},
		{ name: 'License Key', sortable: true, column:'LicenseKey', key: 'licenseKey'},
		{ name: 'Type', sortable: true, column:'ScreenType', key: 'screenType'},
		{ name: 'Host', sortable: true, column:'HostName', key: 'hostName'},
		{ name: 'Alias', sortable: true, column:'Alias', key: 'alias'},
		{ name: 'Last Push', sortable: true, column:'ContentsUpdated', key:'contentsUpdated'},
		{ name: 'Last Online', sortable: true, column:'TimeIn', key:'timeIn'},
		{ name: 'Net Type', sortable: true, column:'InternetType', key:'internetType'},
		{ name: 'Net Speed', sortable: true, key:'internetSpeed', column:'InternetSpeed'},
		{ name: 'Display', sortable: true, key: 'displayStatus', column:'DisplayStatus'},
		{ name: 'PS Version', sortable: true, key:'server', column:'ServerVersion'},
		{ name: 'UI Version', sortable: true, key:'ui', column:'UiVersion'},
		{ name: 'Anydesk', sortable: true, column:'AnydeskId', key:'anydeskId' },
		{ name: 'Password', sortable: false, key:'password'},		
		{ name: 'Installation Date', sortable: true, column:'InstallDate', key:'installDate'},
		{ name: 'Creation Date', sortable: true, key:'dateCreated', column:'DateCreated'},
	]

    hosts_table_column = [
		{ name: '#', sortable: false, no_export: true},
        { name: 'Host ID', sortable: true, key: 'hostId', hidden: true, no_show: true},
        { name: 'Host Name', sortable: true, column:'HostName', key: 'hostName'},
        { name: 'Dealer Name', sortable: true, column:'BusinessName', key: 'businessName'},
		{ name: 'Address', sortable: true, column:'Address', key: 'address'},
		{ name: 'City', sortable: true, column:'City', key: 'city'},
		{ name: 'Region', sortable: true, column:'Region', no_export: true},
		{ name: 'State', sortable: true, column:'State', key: 'state'},
		{ name: 'Street', sortable: true, column:'Street', no_export: true},
		{ name: 'Postal Code', sortable: true, column:'PostalCode', key:'postalCode'},
		{ name: 'Timezone', sortable: true, column:'TimezoneName', key:'timezoneName'},
		{ name: 'Total Licenses', sortable: true, column:'TotalLicenses', key:'totalLicenses'},
	]

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _date: DatePipe,
		private _host: HostService,
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

    getColumnsAndOrder(data, tab) {
        console.log(data, tab)
        switch(tab) {
            case 'licenses':
                this.sort_column = data.column;
		        this.sort_order = data.order;
                this.getLicenses(1);
                break;
            case 'hosts':
                this.sort_column_hosts = data.column;
		        this.sort_order_hosts = data.order;
                this.getHosts(1)
                break;
            default:
        }
		
		
	}

    sortList(order, page?): void {
		var filter = {
			column: 'PiStatus',
			order: order
		}

		this.getColumnsAndOrder(filter, 'licenses')
	}

	getHosts(page) {
        this.searching_hosts = true;
		this.hosts_data = [];    
        this.subscription.add(
			this._host.get_host_by_page(page, this.search_data_host, this.sort_column_hosts, this.sort_order_hosts).subscribe(
				data => {
                    this.paging_data_host = data.paging;
                    if (data) {
						this.hosts_data = this.hosts_mapToUIFormat(data);
						this.filtered_data_host = this.hosts_mapToUIFormat(data);
					} else {
						if(this.search_data_host == "") {
							this.no_host = true;
						}
						this.filtered_data_host = [];
					}
					this.initial_load_hosts = false;
					this.searching_hosts = false;
				}
			)
		)
	}

    getLicenses(page) {

        this.searching_licenses = true;
		this.hosts_data = [];    
        
		this.subscription.add(
			this._license.get_all_licenses(page, this.search_data_licenses, this.sort_column, this.sort_order, 15, this.filters.status, this.filters.activated, this.filters.zone, this.filters.dealer, this.filters.host).subscribe(
				data => {
                    this.paging_data_licenses = data.paging;

                    if (data.licenses) {
						this.licenses_data = this.licenses_mapToUIFormat(data.licenses);
						this.filtered_data_licenses = this.licenses_mapToUIFormat(data.licenses);
					} else {
						
						if (this.search_data == "") {
							this.no_licenses = true;
						}

						this.filtered_data_licenses = [];
					}
					this.initial_load_licenses = false;
					this.searching_licenses = false;
				}
			)
		);
	}

    onTabChanged(e: { index: number }) {

		switch (e.index) {
			case 1:
				this.pageRequested(1);
				break;
			case 0:
				this.getLicenses(1);
				break;
			case 3:
				this.getHosts(1);
				break;
			default:
		}
		
    }

    filterTable(type: string, value: any) {

        switch(type) {
            case 'status':
                this.filters.status = value;
                this.filters.activated = true;
                this.filters.label_status = value == 1 ? 'Online' : 'Offline'
                break;
            case 'zone':
                this.filters.zone = value
                this.filters.label_zone = value;
                break;
            case 'activated':
                this.filters.status = "";
                this.filters.activated = value;
                this.filters.label_status = 'Inactive';
                break;
            default:
        }

        this.getLicenses(1);
    }

    sortByUser() {
		let dialog = this._dialog.open(UserSortModalComponent, {
			width: '500px',
            data: 'license'
		})

		dialog.afterClosed().subscribe(
			data => {
				if (data) {
                    if(data.dealer.id) {
                        this.filters.dealer = data.dealer.id;
                        this.filters.label_dealer = data.dealer.name;
                    }
					if(data.host.id) {
                        this.filters.host = data.host.id;
                        this.filters.label_host = data.host.name;
                    }
                    this.getLicenses(1);
				}
			}
		)
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
            case 'hosts':
                if (e) {
                    this.search_data_host = e;
                    this.getHosts(1);
                } else {
                    this.search_data_host = "";
                    this.getHosts(1);
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
						basis_sub_label: 'Current Count',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						ad_value: data.totalAd,
						ad_value_label: 'Ad',
						menu_value: data.totalMenu,
						menu_value_label: 'Menu',
						closed_value: data.totalClosed,
						closed_value_label: 'Closed',
						unassigned_value: data.totalUnassignedScreenCount,
						unassigned_value_label: 'Unassigned',
						new_this_week_value: data.newLicensesThisWeek,
						new_this_week_value_label: 'License(s)',
						new_this_week_value_description: 'New this week',
						new_last_week_value: data.newLicensesLastWeek,
						new_last_week_value_label: 'License(s)',
						new_last_week_value_description: 'New last week',
						this_week_ad_value: data.thisWeekTotalAd,
						this_week_menu_value: data.thisWeekTotalMenu,
						this_week_closed_value: data.thisWeekTotalClosed,
						this_week_unassigned_value: data.thisWeekUnassignedCount,
						last_week_ad_value: data.lastWeekTotalAd,
						last_week_menu_value: data.lastWeekTotalMenu,
						last_week_closed_value: data.lastWeekTotalClosed,
						last_week_unassigned_value: data.lastWeekUnassignedCount,
					}

					if (this.licenses_details) {
						this.temp_label.push(this.licenses_details.ad_value_label + ": " + this.licenses_details.ad_value);
						this.temp_label.push(this.licenses_details.menu_value_label+ ": " + this.licenses_details.menu_value);
						this.temp_label.push(this.licenses_details.closed_value_label+ ": " + this.licenses_details.closed_value);
						this.temp_label.push(this.licenses_details.unassigned_value_label+ ": " + this.licenses_details.unassigned_value);
						this.temp_array.push(this.licenses_details.ad_value);
						this.temp_array.push(this.licenses_details.menu_value);
						this.temp_array.push(this.licenses_details.closed_value);
						this.temp_array.push(this.licenses_details.unassigned_value);

                        this.temp_label_this_week.push(this.licenses_details.ad_value_label + ": " + this.licenses_details.this_week_ad_value);
						this.temp_label_this_week.push(this.licenses_details.menu_value_label+ ": " + this.licenses_details.this_week_menu_value);
						this.temp_label_this_week.push(this.licenses_details.closed_value_label+ ": " + this.licenses_details.this_week_closed_value);
						this.temp_label_this_week.push(this.licenses_details.unassigned_value_label+ ": " + this.licenses_details.this_week_unassigned_value);
						this.temp_array_this_week.push(this.licenses_details.this_week_ad_value);
						this.temp_array_this_week.push(this.licenses_details.this_week_menu_value);
						this.temp_array_this_week.push(this.licenses_details.this_week_closed_value);
						this.temp_array_this_week.push(this.licenses_details.this_week_unassigned_value);
                        
                        this.temp_label_last_week.push(this.licenses_details.ad_value_label + ": " + this.licenses_details.last_week_ad_value);
						this.temp_label_last_week.push(this.licenses_details.menu_value_label+ ": " + this.licenses_details.last_week_menu_value);
						this.temp_label_last_week.push(this.licenses_details.closed_value_label+ ": " + this.licenses_details.last_week_closed_value);
						this.temp_label_last_week.push(this.licenses_details.unassigned_value_label+ ": " + this.licenses_details.last_week_unassigned_value);
						this.temp_array_last_week.push(this.licenses_details.last_week_ad_value);
						this.temp_array_last_week.push(this.licenses_details.last_week_menu_value);
						this.temp_array_last_week.push(this.licenses_details.last_week_closed_value);
						this.temp_array_last_week.push(this.licenses_details.last_week_unassigned_value);
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
                    console.log("PD", this.paging_data)
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
                    { 
						value: l.screenshotUrl ? `${environment.base_uri_old}${l.screenshotUrl.replace("/API/", "")}` : null,
						link: l.screenshotUrl ? `${environment.base_uri_old}${l.screenshotUrl.replace("/API/", "")}` : null, 
						editable: false, 
						hidden: false, 
						isImage: true
					},
					{ value: l.licenseKey, link: '/administrator/licenses/' + l.licenseId, new_tab_link: 'true', compressed: true, editable: false, hidden: false, status: true},
					{ value: l.screenType ? this._title.transform(l.screenType) : '--', editable: false, hidden: false },
					{ value: l.hostId ? l.hostName : '--', link: l.hostId ? '/administrator/hosts/' + l.hostId : null, new_tab_link: 'true', editable: false, hidden: false},
					{ value: l.alias ? l.alias : '--', link: '/administrator/licenses/' + l.licenseId, editable: false, new_tab_link: 'true', label: 'License Alias', id: l.licenseId, hidden: false },
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

    hosts_mapToUIFormat(data: { host: API_HOST[] }): UI_HOST_VIEW[] {
		let count = this.paging_data_host.pageStart;

		return data.host.map(
			(h: API_HOST) => {
				const table = new UI_HOST_VIEW(
                    { value: count++, link: null , editable: false, hidden: false},
					{ value: h.hostId, link: null , editable: false, hidden: true, key: false},
					{ value: h.hostName, link: `/${this.currentRole}/hosts/${h.hostId}`, new_tab_link: 'true', compressed: true, editable: false, hidden: false, status: true, business_hours: h.hostId ? true : false, business_hours_label: h.hostId ? this.getLabel(h) : null},
					{ value: h.businessName ? h.businessName: '--', link: `/${this.currentRole}/dealers/${h.dealerId}`, new_tab_link: 'true', editable: false, hidden: false},
					{ value: h.address ? h.address: '--', link: null, new_tab_link: 'true', editable: false, hidden: false},
					{ value: h.city ? h.city: '--', link: null, editable: false, hidden: false },
					{ value: h.region ? h.region:'--', hidden: false },
					{ value: h.state ? h.state:'--', hidden: false },
					{ value: h.street ? h.street:'--', link: null, editable: false, hidden: false },
					{ value: h.postalCode ? h.postalCode:'--', link: null, editable: false, hidden: false },
					{ value: h.timezoneName ? h.timezoneName:'--', link: null, editable: false, hidden: false },
					{ value: h.totalLicenses ? h.totalLicenses:'0', link: null, editable: false, hidden: false },
				);

				return table;
			}
		);
	}

    getLabel(data) {
		this.now = moment().format('d');
		this.now = this.now;
        var storehours = JSON.parse(data.storeHours)
        storehours = storehours.sort((a, b) => {return a.id - b.id;});
		var modified_label = {
			date : moment().format('LL'),
			address: data.address,
			schedule: storehours[this.now] && storehours[this.now].status ? (
				storehours[this.now].periods[0].open == "" && storehours[this.now].periods[0].close == "" 
				? "Open 24 Hours" : storehours[this.now].periods.map(
					i => {
						return i.open + " - " + i.close
					})) : "Closed"
		}
		return modified_label;
	}

    clearFilter() {
        this.filters = {
            activated: "",
            zone:"",
            status:"",
            dealer:'',
            host:'',
            label_status:"",
            label_zone:"",
            label_dealer: "",
            label_host: ""
        }
        this.getLicenses(1);
    }

    splitKey(key) {
        this.splitted_text = key.split("-");
        return this.splitted_text[this.splitted_text.length - 1];
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

    getDataForExport(tab): void {
        this.pageSize = 0;
        switch(tab) {
            case 'licenses':
                this._license.get_all_licenses(1, this.search_data_licenses, this.sort_column, this.sort_order, 0, this.filters.status, this.filters.activated, this.filters.zone, this.filters.dealer, this.filters.host).subscribe(
                    data => {
                        if(!data.message) {
                            const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                            this.licenses_to_export = data.licenses;
                            this.licenses_to_export.forEach((item, i) => {
                                this.modifyItem(item);
                                this.worksheet.addRow(item).font ={
                                    bold: false
                                };
                            });
                            let rowIndex = 1;
                            for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
                                this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                            }
                            this.workbook.xlsx.writeBuffer()
                                .then((file: any) => {
                                    const blob = new Blob([file], { type: EXCEL_TYPE });
                                    const filename = 'Licenses' +'.xlsx';
                                    FileSaver.saveAs(blob, filename);
                                }
                            );
                            this.workbook_generation = false;
                        } else {
                            this.licenses_to_export = [];
                        }
                    }
                )
                break;
            case 'hosts': 
                this._host.get_host_by_page(1, this.search_data_host, this.sort_column_hosts, this.sort_order_hosts, 0).subscribe(
                    data => {
                        if(!data.message) {
                            const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                            this.hosts_to_export = data.host;
                            this.hosts_to_export.forEach((item, i) => {
                                // this.modifyItem(item);
                                this.worksheet.addRow(item).font ={
                                    bold: false
                                };
                            });
                            let rowIndex = 1;
                            for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
                                this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                            }
                            this.workbook.xlsx.writeBuffer()
                                .then((file: any) => {
                                    const blob = new Blob([file], { type: EXCEL_TYPE });
                                    const filename = 'Hosts' +'.xlsx';
                                    FileSaver.saveAs(blob, filename);
                                }
                            );
                            this.workbook_generation = false;
                        } else {
                            this.hosts_to_export = [];
                        }
                    }
                )
                break;
            default:
        }
        
	}

	modifyItem(item) {
        item.displayStatus = item.displayStatus == 1 ? 'ON' : "";
        item.password = item.anydeskId ? this.splitKey(item.licenseId) : '';
        item.piStatus =  item.piStatus == 0 ? 'Offline':'Online';
        item.screenType =  this._title.transform(item.screenType);
        item.contentsUpdated = this._date.transform(item.contentsUpdated, 'MMM dd, yyyy h:mm a');
        item.timeIn = item.timeIn ? this._date.transform(item.timeIn, 'MMM dd, yyyy h:mm a'): '';
        item.installDate = this._date.transform(item.installDate, 'MMM dd, yyyy h:mm a');
        item.dateCreated = this._date.transform(item.dateCreated, 'MMM dd, yyyy');
        item.internetType = this.getInternetType(item.internetType);
        item.internetSpeed = item.internetSpeed == 'Fast' ? 'Good' : item.internetSpeed;
        item.isActivated = item.isActivated == 0 ? 'No' : 'Yes';
        var parse_version = JSON.parse(item.appVersion);
		item.ui = parse_version && parse_version.ui  ? parse_version.ui : '1.0.0';
		item.server = parse_version && parse_version.server  ? parse_version.server : '1.0.0';
	}

	exportTable(tab) {
        this.workbook_generation = true;
		const header = [];
		this.workbook = new Excel.Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
        switch(tab) {
            case 'licenses': 
                this.worksheet = this.workbook.addWorksheet('License View');
                Object.keys(this.license_table_column).forEach(key => {
                    if(this.license_table_column[key].name && !this.license_table_column[key].no_export) {
                        header.push({ header: this.license_table_column[key].name, key: this.license_table_column[key].key, width: 30, style: { font: { name: 'Arial', bold: true}}});
                    }
                });
                break;
            case 'hosts':
                this.worksheet = this.workbook.addWorksheet('Host View');
                Object.keys(this.hosts_table_column).forEach(key => {
                    if(this.hosts_table_column[key].name && !this.hosts_table_column[key].no_export) {
                        header.push({ header: this.hosts_table_column[key].name, key: this.hosts_table_column[key].key, width: 30, style: { font: { name: 'Arial', bold: true}}});
                    }
                });
                break;
            default:
        }
        this.worksheet.columns = header;
		this.getDataForExport(tab);		
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

	private get currentRole() {
		return this._auth.current_role;
	}
}
