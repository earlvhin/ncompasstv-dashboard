import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import * as moment from 'moment';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver';

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
	filtered_data: any = [];
    filtered_data_host: UI_HOST_VIEW[] = [];
    generate: boolean = false;
	hosts$: Observable<API_HOST[]>;
    hosts_data: UI_HOST_VIEW[] = [];
    hosts_to_export: any = [];
    initial_load_hosts: boolean = true;
	no_dealer: boolean = false;
    no_host: boolean;
    now: any;
	subscription: Subscription = new Subscription();
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

    //graph
    label_graph: any = [];
    value_graph: any = [];
    label_graph_detailed: any = [];
    value_graph_detailed: any = [];
    total: number = 0;
    total_detailed: number = 0;
    sub_title: string;
    sub_title_detailed: string;
    start_date: string = '';
    end_date: string = '';
    selected_dealer: string = '';
    number_of_months: number = 0;
    average: number = 0;
    sum: number = 0;
    height_show: boolean = false;
    hosts_graph_data: any = [];

	// UI Table Column Header
	host_table_column: string[] = [
		'#',
		'Dealer Alias',
		'Business Name',
		'Contact Person',
		// 'Region',
		// 'City',
		// 'State',
		'Total',
		'Active',
		'To Install',
		'Recently Added Host'
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
		private _host: HostService,
		private _dealer: DealerService,
        private cdr: ChangeDetectorRef,
	) { }

	ngOnInit() {
		// this.pageRequested(1);
        this.getHostsStatistics();
        this.getHosts(1);
		this.getHostTotal();

	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

    ngAfterContentChecked() : void {
        this.cdr.detectChanges();
    }

    toggleCharts() {
        this.height_show = !this.height_show;
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

	getHostTotal() {
		this.subscription.add(
			this._host.get_host_total().subscribe(
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
				}
			)
		)
	}

	pageRequested(e) {
		this.dealers_data = [];
		this.searching = true;
		this.subscription.add(
			this._dealer.get_dealers_with_host(e, this.search_data).subscribe(
				data => {
					this.initial_load = false;
					this.searching = false;
					this.setData(data)
				}
			)
		)
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
            this.pageRequested(1);
        } else {
            this.getHosts(1)
        }
    }

    getHostsStatistics() {
        this.subscription.add(
			this._host.get_host_statistics(this.selected_dealer, this.start_date, this.end_date).subscribe(
                data => {
                    //reset value
                    this.total_detailed = 0;
                    this.sum = 0;
                    this.hosts_graph_data = [];
                    this.label_graph_detailed = [];
                    this.value_graph_detailed = [];
                    this.average = 0;
                    this.number_of_months = 0;

                    if(!data.message) {                        
                        var months = [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec" ];
                        data.hosts.sort((a, b) => parseFloat(a.month) - parseFloat(b.month));
                        this.hosts_graph_data = [...data.hosts];
                        if(this.selected_dealer) {
                            data.hosts.map(
                                i => {
                                    this.total_detailed = this.total_detailed + i.totalHosts;
                                    this.hosts_graph_data.push(i)
                                    this.label_graph_detailed.push(months[i.month - 1] + " " + i.totalHosts)
                                    this.value_graph_detailed.push(i.totalHosts)
                                    this.sum = this.sum + i.totalHosts;
                                }
                            )
                            this.number_of_months = data.hosts.length;
                            console.log(this.sum, this.number_of_months)
                            this.average = this.sum / this.number_of_months; 
                            this.sub_title_detailed = "Found " + data.hosts.length + " months with record as per shown in the graph."
                            this.generate = true;
                        } else {
                            this.hosts_graph_data = this.hosts_graph_data.filter(item => item.year == new Date().getFullYear());
                            this.hosts_graph_data.map(
                                i => {
                                    this.total = this.total + i.totalHosts;
                                    this.label_graph.push(months[i.month - 1] + " " + i.totalHosts)
                                    this.value_graph.push(i.totalHosts)
                                }
                            )
                        }
                    } else {
                        this.generate = false;
                    }
                }
            )
        )
        this.sub_title = "Total Hosts as per year " + new Date().getFullYear();
    }
    
    compareVal( a, b ) {
        if ( a.last_nom < b.last_nom ){
          return -1;
        }
        if ( a.last_nom > b.last_nom ){
          return 1;
        }
        return 0;
      }
      

    getHosts(page) {
        this.searching_hosts = true;
		this.hosts_data = [];

        this.subscription.add(
			this._host.get_host_by_page(page, this.search_data_host, this.sort_column_hosts, this.sort_order_hosts)
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
				})
		);
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

    exportTable(tab) {
        this.workbook_generation = true;
		const header = [];
		this.workbook = new Excel.Workbook();
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

    getDataForExport(tab): void {
        switch(tab) {
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

    getStartDate(s_date) {
        this.start_date = s_date;
    }
    
    getEndDate(e_date) {
        this.end_date = e_date;
    }
    
    getDealerId(dealer) {
        this.selected_dealer = dealer;
        this.getHostsStatistics();
    }
}
