import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import { API_DEALER, API_HOST, UI_TABLE_HOSTS_BY_DEALER, UI_HOST_VIEW } from 'src/app/global/models';
import { AuthService, HostService } from 'src/app/global/services';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';

@Component({
	selector: 'app-hosts',
	templateUrl: './hosts.component.html',
	styleUrls: ['./hosts.component.scss']
})

export class HostsComponent implements OnInit {
	dealers_data: UI_TABLE_HOSTS_BY_DEALER[] = [];
    diff_hours: any;
	filtered_data: any = [];
    filtered_data_host: UI_HOST_VIEW[] = [];
	hosts$: Observable<API_HOST[]>;
    hosts_data: UI_HOST_VIEW[] = [];
    hosts_to_export: API_HOST[] = [];
    hour_diff: any;
    hour_diff_temp: any;
    initial_load_hosts: boolean = true;
	no_dealer: boolean = false;
    no_host: boolean;
    now: any;
	tab: any = { tab: 1 };
	title: string = "Hosts";
	host_details : any;
	paging_data: any;
    paging_data_host: any;
	searching: boolean = false;
	initial_load: boolean = true;
	search_data: string = "";
    search_data_host: string = "";
    searching_hosts: boolean = false;
    sort_column_hosts: string = '';
	sort_order_hosts: string = '';
    workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

	dealers_table_columns = [
		'#',
		'Dealer Alias',
		'Business Name',
		'Contact Person',
		'Total',
		'Active',
		'To Install',
		'Recently Added Host'
	];

    hosts_table_column = [
		{ name: '#', sortable: false, no_export: true },
        { name: 'Host ID', sortable: true, key: 'hostId', hidden: true, no_show: true },
        { name: 'Host Name', sortable: true, column:'HostName', key: 'hostName' },
        { name: 'Category', hidden: true, no_show: true, key:'category' },
        { name: 'General Category', hidden: true, no_show: true, key:'generalCategory' },
        { name: 'Dealer Name', sortable: true, column:'BusinessName', key: 'businessName' },
		{ name: 'Address', sortable: true, column:'Address', key: 'address' },
		{ name: 'City', sortable: true, column:'City', key: 'city' },
		{ name: 'State', sortable: true, column:'State', key: 'state' },
		{ name: 'Postal Code', sortable: true, column:'PostalCode', key:'postalCode' },
		{ name: 'Timezone', sortable: true, column:'TimezoneName', key:'timezoneName' },
		{ name: 'Total Licenses', sortable: true, column:'TotalLicenses', key:'totalLicenses' },
        { name: 'Tags', hidden: true, no_show: true, key:'tagsToString' },
        { name: 'Business Hours', sortable: false, key:'storeHoursParse', hidden: true, no_show: true},
        { name: 'Total Business Hours', sortable: false, key:'storeHoursTotal', hidden: true, no_show: true},
        { name: 'DMA Rank', sortable: false, hidden: true, key:'dmaRank', no_show: true},		
        { name: 'DMA Code', sortable: false, hidden: true, key:'dmaCode', no_show: true},		
        { name: 'DMA Name', sortable: false, hidden: true, key:'dmaName', no_show: true},	
	];

	protected _unsubscribe = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _host: HostService,
		private _dealer: DealerService,
        private cdr: ChangeDetectorRef,
	) { }

	ngOnInit() {
        this.getHosts(1);
		this.getHostTotal();

	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

    ngAfterContentChecked() : void {
        this.cdr.detectChanges();
    }

    filterData(e, tab) {
        switch(tab) {
            case 'dealer':
                if (e) {
                    this.search_data = e;
			        this.pageRequested(1);
                } else {
                    this.search_data = "";
			        this.pageRequested(1);
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
        }
  
	}

	getHostTotal(): void {

		this._host.get_host_total().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					this.host_details = {
						basis: data.total,
						basis_label: 'Host(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						new_this_week_value: data.newHostsThisWeek,
						new_this_week_value_label: 'Host(s)',
						new_this_week_value_description: 'New this week',
						new_last_week_value: data.newHostsLastWeek,
						new_last_week_value_label: 'Host(s)',
						new_last_week_value_description: 'New last week'
					}					
				},
				error => console.log('Error retrieving host total', error)
			);

	}

	pageRequested(page: number) {
		this.dealers_data = [];
		this.searching = true;

		this._dealer.get_dealers_with_host(page, this.search_data).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
					this.initial_load = false;
					this.searching = false;
					this.setData(data);
				},
				error => console.log('Error retrieving dealer hosts', error)
			);
	}

	setData(data) {
        this.paging_data = data.paging;
		if (data.dealers) {
			this.dealers_data = this.dealers_mapToUIFormat(data.dealers);
			this.filtered_data = this.dealers_mapToUIFormat(data.dealers);
		} else {
			this.no_dealer = true;
			this.filtered_data = [];
		}
	}

	dealers_mapToUIFormat(data: API_DEALER[]): UI_TABLE_HOSTS_BY_DEALER[] {
		let count = this.paging_data.pageStart;
		return data.filter(
			(dealer: API_DEALER) => {
				if (dealer.hosts.length > 0) {
					return dealer;
        		}
			}
		).map(
			(dealer: API_DEALER) => {
				if(dealer.hosts) {
					return new UI_TABLE_HOSTS_BY_DEALER(
						{ value: dealer.dealerId, link: null , editable: false, hidden: true},
						{ value: count++, link: null , editable: false, hidden: false},
						{ value: dealer.dealerIdAlias ? dealer.dealerIdAlias : '--', link: '/administrator/dealers/' +  dealer.dealerId, new_tab_link:false, editable: false, hidden: false},
						{ value: dealer.businessName, link: '/administrator/dealers/' +  dealer.dealerId, editable: false, hidden: false},
						{ value: dealer.contactPerson, link: null, editable: false, hidden: false},
						// { value: dealer.region, link: null, editable: false, hidden: false},
						// { value: dealer.city, link: null, editable: false, hidden: false},
						// { value: dealer.state, link: null, editable: false, hidden: false},
						{ value: dealer.hosts.length, link: null, editable: false, hidden: false},
						{ value: dealer.activeHost, link: null, editable: false, hidden: false},
						{ value: dealer.forInstallationHost, link: null, editable: false, hidden: false},
						{ value: dealer.hosts[0] ? dealer.hosts[0].name : '---', link: dealer.hosts[0] ? '/administrator/hosts/' +  dealer.hosts[0].hostId : null, editable: false, hidden: false},
					)
				} else {
					return new UI_TABLE_HOSTS_BY_DEALER(
						{ value: dealer.dealerId, link: null , editable: false, hidden: true},
						{ value: count++, link: null , editable: false, hidden: false},
						{ value: dealer.dealerIdAlias ? dealer.dealerIdAlias : '--', link: '/administrator/dealers/' + dealer.dealerId, editable: false, hidden: false},
						{ value: dealer.businessName, link: '/administrator/dealers/' +  dealer.dealerId, editable: false, hidden: false},
						{ value: dealer.contactPerson, link: null, editable: false, hidden: false},
						// { value: dealer.region, link: null, editable: false, hidden: false},
						// { value: dealer.city, link: null, editable: false, hidden: false},
						// { value: dealer.state, link: null, editable: false, hidden: false},
						{ value: 0, link: null , editable: false, hidden: false},
						{ value: dealer.activeHost, link: null, editable: false, hidden: false},
						{ value: dealer.forInstallationHost, link: null, editable: false, hidden: false},
						{ value: '--', link: null, editable: false, hidden: false},
					)
				}
			}
		)
	}

    onTabChanged(e) {
        if(e.index == 1) {
            this.search_data = "";
            this.pageRequested(1);
        } else {
            console.log("HERE")
            this.search_data_host = "";
            this.ngOnInit();
        }
    }

    getHosts(page: number): void {
        this.searching_hosts = true;
		this.hosts_data = [];

		this._host.get_host_by_page(page, this.search_data_host, this.sort_column_hosts, this.sort_order_hosts)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					if (response.message) {
						if (this.search_data_host == '') this.no_host = true;
						this.filtered_data_host = [];
						return;
					}

					this.paging_data_host = response.paging;
					const mappedData = this.hosts_mapToUIFormat(response.host);
					this.hosts_data = [...mappedData];
					this.filtered_data_host = [...mappedData];

				}
			)
			.add(() => {
				this.initial_load_hosts = false;
				this.searching_hosts = false;
			});
	}

    hosts_mapToUIFormat(data: API_HOST[]): UI_HOST_VIEW[] {
		let count = this.paging_data_host.pageStart;
		return data.map(
			h => {
				const table = new UI_HOST_VIEW(
                    { value: count++, link: null , editable: false, hidden: false},
					{ value: h.hostId, link: null , editable: false, hidden: true, key: false},
					{ value: h.hostName, link: `/${this.currentRole}/hosts/${h.hostId}`, new_tab_link: 'true', compressed: true, editable: false, hidden: false, status: true, business_hours: h.hostId ? true : false, business_hours_label: h.hostId ? this.getLabel(h) : null},
					{ value: h.businessName ? h.businessName: '--', link: `/${this.currentRole}/dealers/${h.dealerId}`, new_tab_link: 'true', editable: false, hidden: false},
					{ value: h.address ? h.address: '--', link: null, new_tab_link: 'true', editable: false, hidden: false},
					{ value: h.city ? h.city: '--', link: null, editable: false, hidden: false },
					{ value: h.state ? h.state:'--', hidden: false },
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
        let storehours = JSON.parse(data.storeHours)
        storehours = storehours.sort((a, b) => {return a.id - b.id;});
		let modified_label = {
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

    getStoreHourseParse(data) {
        let days = [];
        if(data.storeHours) {
            let storehours = JSON.parse(data.storeHours)
            storehours = storehours.sort((a, b) => {return a.id - b.id;});
            storehours.map(
                day => {
                    if(day.status) {
                        day.periods.map(
                            period => {
                                if(period.open == '' && period.close == '') {
                                    days.push(day.day + ' : Open 24 hrs')
                                } else {
                                    days.push(day.day + ' : ' + period.open + ' - ' + period.close)
                                }
                            }
                        )
                    } else {
                        days.push(day.day + ' : ' + 'Closed')
                    }
                }
            )
            data.storeHoursParse = days.toString();
            data.storeHoursParse = data.storeHoursParse.split(",").join("\n");
        }
	}

    exportTable(tab) {
        this.workbook_generation = true;
		const header = [];
		this.workbook = new Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
        switch(tab) {
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

    getDataForExport(tab: string): void {
		const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

        switch (tab) {
            case 'hosts': 
                this._host.get_host_by_page(1, this.search_data_host, this.sort_column_hosts, this.sort_order_hosts, 0)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe(
						response => {

							if (response.message) {
								this.hosts_to_export = [];
								return;
							} else {
                                response.host.map(
                                    host => {
                                        host.storeHoursTotal = this.getTotalHours(host);
                                        this.getStoreHourseParse(host)
                                        this.modifyDataForExport(host);
                                    }
                                )
							    this.hosts_to_export = [...response.host];
                            }

							this.hosts_to_export.forEach(
								(item) => {
									this.worksheet.addRow(item).font = { bold: false };
								}
							);

							let rowIndex = 1;

							for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
								this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
							}

							this.workbook.xlsx.writeBuffer()
								.then((file: any) => {
									const blob = new Blob([file], { type: EXCEL_TYPE });
									const filename = 'Hosts' +'.xlsx';
									saveAs(blob, filename);
								}
							);

							this.workbook_generation = false;
						}
					);

                break;

            default:
        }
	}

    getTotalHours(data) {
        if (data.storeHours) {
            data.storeHoursForTotal = JSON.parse(data.storeHours)
            this.hour_diff_temp = [];
            data.storeHoursForTotal.map(
                hours => {
                    if(hours.status) {
                        hours.periods.map(
                            period => {
                                this.diff_hours = 0;
                                if(period.open && period.close) {
                                    let close = moment(period.close,"H:mm A");
                                    let open = moment(period.open,"H:mm A");
    
                                    let time_start = new Date("01/01/2007 " + open.format("HH:mm:ss"));
                                    let time_end = new Date("01/01/2007 " + close.format("HH:mm:ss"));
                                    
                                    if(time_start.getTime() > time_end.getTime()) {
                                        time_end = new Date(time_end.getTime() + 60 * 60 * 24 * 1000);
                                        this.diff_hours = (time_end.getTime() - time_start.getTime()) / 1000;
                                    } else {
                                        this.diff_hours = (time_end.getTime() - time_start.getTime()) / 1000;
                                    }
                                } else {
                                    this.diff_hours = 86400;
                                }
                                this.hour_diff_temp.push(this.diff_hours)
                            }
                        )
                    } else {

                    }
                }
            )
            this.hour_diff = 0;
            this.hour_diff_temp.map(
                hour => {
                    this.hour_diff += hour;
                }
            )
        } else {
        }
        return this.msToTime(this.hour_diff); 
    }

    msToTime(input) {
        let totalSeconds = input
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;

        return hours + "h " + minutes + "m " + seconds + "s "
    }

    getColumnsAndOrder(data, tab) {
        switch(tab) {
            case 'hosts':
                this.sort_column_hosts = data.column;
		        this.sort_order_hosts = data.order;
                this.getHosts(1)
                break;
            default:
        }	
	}

	private get currentRole() {
		return this._auth.current_role;
	}

	private modifyDataForExport(data) {
        data.storeHours = data.storeHours;
		data.storeHoursTotal = data.storeHoursTotal;
        data.tagsToString = data.tags.join(','); 
	}
}
