import { Component, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { API_HOST } from '../../../../global/models/api_host.model';
import { API_DEALER } from '../../../../global/models/api_dealer.model';
import { HostService } from '../../../../global/services/host-service/host.service';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { UI_DEALER_HOSTS } from '../../../../global/models/ui_dealer_hosts.model';
import { UserService } from '../../../../global/services/user-service/user.service';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { TitleCasePipe } from '@angular/common'
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver'; 

@Component({
	selector: 'app-hosts',
	templateUrl: './hosts.component.html',
	styleUrls: ['./hosts.component.scss'],
	providers: [TitleCasePipe]
})

export class HostsComponent implements OnInit {
	filtered_data: any = [];
	host_data: any = [];
	host_filtered_data: any = [];
    hosts_to_export: any = [];
    initial_load: boolean = true;
	subscription: Subscription = new Subscription();
	host_count: any;
	no_hosts: boolean = false;
    pageSize: number;
    paging_data: any;
	search_data: string = "";
    searching: boolean = false;
    temp_array: any = [];	
    workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

    host_table_column = [
		{ name: '#', no_export: true},
		{ name: 'Name', key: 'name'},
		{ name: 'Address', key: 'address'},
		{ name: 'City', key: 'city'},
		{ name: 'Postal Code', key: 'postalCode'},
		{ name: 'Number of Licenses', key: 'totalLicenses'},
		{ name: 'Category', key: 'category'},
		{ name: 'Status', key: 'status'},
        { name: 'Notes', sortable: false, key: 'notes'},
        { name: 'Others', sortable: false, key: 'others'},
	];

	constructor(
    	private _user: UserService,
		private _host: HostService,
    	private _dealer: DealerService,
		private _auth: AuthService,
		private _title: TitleCasePipe
	) { }

	ngOnInit() {
		this.getHosts(1);
		this.getTotalCount(this._auth.current_user_value.roleInfo.dealerId);
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	filterData(data) {
		this.filtered_data = data;
	}

	getTotalCount(id) {
		this.subscription.add(
			this._host.get_host_total_per_dealer(id).subscribe(
				(data: any) => {
					this.host_count = {
						basis: data.total,
						basis_label: 'Host(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						new_this_week_value: data.newHostsThisWeek,
						new_this_week_label: 'Host(s)',
						new_this_week_description: 'New this week',
						new_last_week_value: data.newHostsLastWeek,
						new_last_week_label: 'Host(s)',
						new_last_week_description: 'New last week'
					}
				}
			)
		)
	}

	hostFilterData(e) {
		if (e) {
			this.search_data = e;
			this.getHosts(1);
		} else {
			this.search_data = "";
			this.getHosts(1);
		}
	}

	getHosts(page) {
		this.searching = true;
		this.host_data = [];
		this.host_filtered_data = [];
		this.temp_array = [];
		this.subscription.add(
			this._host.get_host_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_data).subscribe(
				data => {
					this.initial_load = false;
					this.searching = false;
                    this.paging_data = data.paging;
					if(!data.message) {
						this.host_data = this.hosts_mapToUIFormat(data.paging.entities);
						this.host_filtered_data = this.hosts_mapToUIFormat(data.paging.entities);
					} else {
						if(this.search_data == "") {
							this.no_hosts = true;
						}
						this.host_data=[];
						this.host_filtered_data = [];
					}
				}
			)
		)
	}

	hosts_mapToUIFormat(data) {
		let count = this.paging_data.pageStart;
		return data.map(
			hosts => {
				return new UI_DEALER_HOSTS(
					{ value: hosts.hostId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: hosts.name, link: '/dealer/hosts/' + hosts.hostId, editable: false, hidden: false},
					{ value: hosts.address, link: null, editable: false, hidden: false},
					{ value: hosts.city, link: null, editable: false, hidden: false},
					{ value: hosts.postalCode, link: null, editable: false, hidden: false},
					{ value: hosts.totalLicenses, link: null, editable: false, hidden: false},
					{ value: hosts.category ? this._title.transform(hosts.category.replace(/_/g , " ")) : '--', link: null, editable: false, hidden: false},
					{ value: hosts.status ? (hosts.status === 'A' ? 'Active' : 'Inactive') : 'Inactive', link: null, editable: false, hidden: false},
					{ value: hosts.notes ? hosts.notes : '--', link: null, editable: false, hidden: false},
					{ value: hosts.others ? hosts.others : '--', link: null, editable: false, hidden: false},
				)
			}
		)
	}

    getDataForExport() {
        this.pageSize = 0;
        this._host.get_host_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, 1, '', this.pageSize).subscribe(
            data => {
                if(!data.message) {
                    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                    this.hosts_to_export = data.paging.entities;
                    this.hosts_to_export.forEach((item, i) => {
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
                            const filename = this._auth.current_user_value.roleInfo.businessName+'-HOSTS' +'.xlsx';
                            FileSaver.saveAs(blob, filename);
                        }
                    );
                    this.workbook_generation = false;
                } else {
                    this.hosts_to_export = [];
                }
            }
        )
	}

    exportTable() {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Excel.Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('HOSTS');
		Object.keys(this.host_table_column).forEach(key => {
			if(this.host_table_column[key].name && !this.host_table_column[key].no_export) {
				header.push({ header: this.host_table_column[key].name, key: this.host_table_column[key].key, width: 30, style: { font: { name: 'Arial', bold: true}}});
			}
		});
        this.worksheet.columns = header;
		this.getDataForExport();		
	}
}