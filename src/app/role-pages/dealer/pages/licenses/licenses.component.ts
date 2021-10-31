import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { API_LICENSE } from '../../../../global/models/api_license.model';
import { LicenseService } from '../../../../global/services/license-service/license.service';
import { LicenseModalComponent } from '../../../../global/components_shared/license_components/license-modal/license-modal.component';
import { UI_TABLE_LICENSE_BY_HOST } from '../../../../global/models/ui_table-license-by-host.model';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { TitleCasePipe, DatePipe } from '@angular/common';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver';
import { environment } from 'src/environments/environment';
import { UserSortModalComponent } from '../../../../global/components_shared/media_components/user-sort-modal/user-sort-modal.component';

@Component({
	selector: 'app-licenses',
	templateUrl: './licenses.component.html',
	styleUrls: ['./licenses.component.scss'],
	providers: [TitleCasePipe, DatePipe]
})

export class LicensesComponent implements OnInit {
	dealers_name: string;
	initial_load_license: boolean = true;
	license_info: API_LICENSE[]; 
	license_data: UI_TABLE_LICENSE_BY_HOST[] = [];
	license_data_api: any;
	filtered_data: UI_TABLE_LICENSE_BY_HOST[] = [];
	row_slug: string = "license_id";
	row_url: string = "/dealer/licenses";
	license_filtered_data: any = [];
	license_row_slug: string = "host_id";
	license_row_url: string = "/dealer/hosts";
	licenses_to_export: any = [];
	no_licenses: boolean = false;
	paging_data_license: any;
    splitted_text: any;
	subscription: Subscription = new Subscription();
	title: string = "Licenses"
	no_record: boolean;
	no_case: boolean = true;
  	licenses_count: any;
  	licenses_status: any;
	search_data_license: string = "";
	searching_license: boolean = false;
	sort_column: string;
	sort_order: string;
	workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

	license_table_columns = [
		{ name: '#', sortable: false, no_export: true},
		{ name: 'Screenshot', sortable: false, no_export: true },
        { name: 'Status', sortable: false, key: 'piStatus', hidden: true, no_show: true},
		{ name: 'License Key', sortable: true, key: 'licenseKey', column:'LicenseKey'},
        { name: 'Type', sortable: true, key: 'screenType', column:'ScreenType'},
		{ name: 'Host', sortable: true, key: 'hostName', column:'HostName' },
		{ name: 'Alias', sortable: true, key: 'alias', column:'Alias' },
		{ name: 'Last Push', sortable: true, key: 'contentsUpdated', column:'ContentsUpdated'},
		{ name: 'Last Online', sortable: true, key: 'timeIn', column:'TimeIn'},
		{ name: 'Net Type', sortable: true, key:'internetType', column: 'InternetType'},
		{ name: 'Net Speed', sortable: true, key:'internetSpeed', column: 'InternetSpeed'},
		{ name: 'Anydesk', sortable: true, key:'anydeskId', column: 'AnydeskId'},
		{ name: 'Password', sortable: false, key:'password'},
		{ name: 'Display', sortable: true, key:'displayStatus', column: 'DisplayStatus'},
		{ name: 'Install Date', sortable: true, key:'installDate', column: 'InstallDate' },
		{ name: 'Creation Date', sortable: true, key:'dateCreated', column: 'DateCreated' },
        { name: 'Zone & Duration', sortable: false, hidden: true, key:'zone', no_show: true},		
	];

    filters: any = {
        activated: "",
        zone:"",
        status:"",
        host:"",
        label_status:"",
        label_zone:"",
        label_dealer: "",
        label_host: ""
    }

	constructor(
		private _dialog: MatDialog,
		private _license: LicenseService,
		private _auth: AuthService,
		private _title: TitleCasePipe,
		private _date: DatePipe
	) { }

	ngOnInit() {
		this.dealers_name = this._auth.current_user_value.roleInfo.businessName;
        this.sortList('desc')
		this.getLicenses(1);
		this.getTotalCount(this._auth.current_user_value.roleInfo.dealerId);
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	filterData(data) {
		this.filtered_data = data;
	}

    filterTable(type, value) {
        switch(type) {
            case 'status':
                this.filters.status = value
                this.filters.activated = "";
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

    clearFilter() {
        this.filters = {
            activated: "",
            zone:"",
            status:"",
            host:"",
            label_status:"",
            label_zone:"",
            label_dealer: "",
            label_host: ""
        }
        this.getLicenses(1);
    }
	  
	getTotalCount(id) {
		this.subscription.add(
			this._license.get_licenses_total_by_dealer(id).subscribe(
				(data: any) => {
					this.licenses_count = {
						basis: data.total,
						basis_label: 'License(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						new_this_week_value: data.newLicensesThisWeek,
						new_this_week_label: 'License(s)',
						new_this_week_description: 'New this week',
						new_last_week_value: data.newLicensesLastWeek,
						new_last_week_label: 'License(s)',
						new_last_week_description: 'New last week'
					}

					this.licenses_status = {
						basis_label: 'License(s)',
						good_value: data.totalOnline,
						good_value_label: 'Online',
						bad_value: data.totalOffline,
						bad_value_label: 'Offline'
					};
					
				}
			)
		);
	}

	getLicenses(page) {
		this.searching_license = true;
		this.subscription.add(
			this._license.sort_license_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_data_license, this.sort_column, this.sort_order, 15, this.filters.status, this.filters.activated, this.filters.zone, this.filters.host).subscribe(
				data => {
					this.initial_load_license = false;
					this.searching_license = false;
                    this.paging_data_license = data.paging;
					if(!data.message) {
						this.license_data_api = data.paging.entities;
						this.license_data = this.licenseTable_mapToUI(this.license_data_api);
						this.filtered_data = this.licenseTable_mapToUI(this.license_data_api);
						this.license_filtered_data = this.licenseTable_mapToUI(this.license_data_api);
					} else {
						if(this.search_data_license == "") {
							this.no_licenses = true;
						}
						this.license_data=[];
						this.license_filtered_data = [];
					}
				}
			)
		)
	}

	licenseFilterData(e) {
		if (e) {
			this.search_data_license = e;
			this.getLicenses(1);
		} else {
			this.search_data_license = "";
			this.getLicenses(1);
		}
	}

	sortList(order): void {
		var filter = {
			column: 'PiStatus',
			order: order
		}
		this.getColumnsAndOrder(filter)
	}

    getColumnsAndOrder(data) {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.getLicenses(1);
	}


	licenseTable_mapToUI(data): UI_TABLE_LICENSE_BY_HOST[] {
		let count = this.paging_data_license.pageStart;
		
		return data.map(
			i => {
				return new UI_TABLE_LICENSE_BY_HOST(
					{ value: i.licenseId, link: null , editable: false, hidden: true },
					{ value: i.hostId ? i.hostId : '--', link: null , editable: false, hidden: true },
					{ value: count++, link: null , editable: false, hidden: false },
					{ 
						value: i.screenshotUrl ? `${environment.base_uri_old}${i.screenshotUrl.replace("/API/", "")}` : null,
						link: i.screenshotUrl ? `${environment.base_uri_old}${i.screenshotUrl.replace("/API/", "")}` : null, 
						editable: false, 
						hidden: false, 
						isImage: true
					},
                    { value: i.licenseKey, link: '/dealer/licenses/' + i.licenseId, editable: false, hidden: false, status: true },
                    { value: i.screenType ? this._title.transform(i.screenType) : '--', link: null, editable:false, hidden: false },
                    { value: i.hostId ? i.hostName: '--', link: i.hostId ? '/dealer/hosts/' + i.hostId : null, editable: false, hidden: false },
                    { value: i.alias ? i.alias : '--', link: '/dealer/licenses/' + i.licenseId, editable: true, label: 'License Alias', id: i.licenseId, hidden: false },
                    { value: i.contentsUpdated ? this._date.transform(i.contentsUpdated) : '--', link: null, editable: false, hidden: false },
                    { value: i.timeIn ? this._date.transform(i.timeIn) : '--', link: null, editable: false, hidden: false },
                    { value: i.internetType ? this.getInternetType(i.internetType) : '--', link: null, editable: false, hidden: false },
                    { value: i.internetSpeed ? i.internetSpeed : '--', link: null, editable: false, hidden: false },
                    { value: i.anydeskId ? i.anydeskId : '--', link: null, editable: false, hidden: false, copy: true, label: 'Anydesk Id' },
                    { value: i.anydeskId ? this.splitKey(i.licenseId) : '--', link: null, editable: false, hidden: false, copy:true, label: 'Anydesk Password' },
                    { value: i.displayStatus == 1 ? 'ON' : "N/A", link: null, editable: false, hidden: false },
					{ value: i.installDate ? this._date.transform(i.installDate) : '--', link: null, editable: false, hidden: false },
					{ value: i.dateCreated ? this._date.transform(i.dateCreated) : '--', link: null, editable: false, hidden: false },
					{ value: i.piStatus, link: null, editable: false, hidden: true }
				);
			}
		);
	}

    splitKey(key) {
        this.splitted_text = key.split("-");
        return this.splitted_text[this.splitted_text.length - 1];
    }

	openGenerateLicenseModal(): void {
		this._dialog.open(LicenseModalComponent, {
			height: '450px',
			width: '600px'
		});
	}

	reloadLicense() {
		this.license_data = [];
		this.ngOnInit();
	}

    sortByUser() {
		let dialog = this._dialog.open(UserSortModalComponent, {
			width: '500px',
            data: {
                view: 'license',
                is_dealer: true,
                dealer_id: this._auth.current_user_value.roleInfo.dealerId,
                dealer_name: this.dealers_name
            }
		})

		dialog.afterClosed().subscribe(
			data => {
				if (data) {
					if(data.host.id) {
                        this.filters.host = data.host.id;
                        this.filters.label_host = data.host.name;
                    }
                    this.getLicenses(1);
				}
			}
		)
	}

	getDataForExport(id): void {
		this.subscription.add(
			this._license.get_license_to_export_duration(id, this.search_data_license, this.sort_column, this.sort_order, 0, this.filters.status, this.filters.activated, this.filters.zone, this.filters.host).subscribe(
				data => {
                    console.log("DD", data)
                    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
					this.licenses_to_export = data.licenseTemplateZoneExports;
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
							const filename = this.dealers_name	+ '.xlsx';
							FileSaver.saveAs(blob, filename);
						}
					);
					this.workbook_generation = false;
				}
			)
		);
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

	modifyItem(item) {
        item.zone = this.getZoneHours(item);
		item.screenType =  this._title.transform(item.screenType);
		item.contentsUpdated = this._date.transform(item.contentsUpdated, 'MMM dd, yyyy h:mm a');
		item.timeIn = item.timeIn ? this._date.transform(item.timeIn, 'MMM dd, yyyy h:mm a'): '';
		item.installDate = this._date.transform(item.installDate, 'MMM dd, yyyy h:mm a');
		item.dateCreated = this._date.transform(item.dateCreated, 'MMM dd, yyyy');
		item.internetType = this.getInternetType(item.internetType);
		item.internetSpeed = item.internetSpeed == 'Fast' ? 'Good' : item.internetSpeed;
		item.isActivated = item.isActivated == 0 ? 'Inactive' : 'Active';
        item.piStatus =  item.piStatus == 0 ? 'Offline':'Online';
        item.displayStatus = item.displayStatus == 1 ? 'ON' : "";
        item.password = item.anydeskId ? this.splitKey(item.licenseId) : '';
	}

    getZoneHours(data) {
        if(data.templateName == 'Fullscreen') {
            return "Main: " + this.msToTime(data.templateMain)
        } else {
            var data_to_return: any = '';
            if(data.templateBackground != 'NO DATA') {
                data_to_return = data_to_return + "Background: " + this.msToTime(data.templateBackground);
            }
            if (data.templateBottom != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Bottom: " + this.msToTime(data.templateBottom);
            } 
            if (data.templateHorizontal != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Horizontal: " + this.msToTime(data.templateHorizontal);
            } 
            if (data.templateHorizontalSmall != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Horizontal Small: " + this.msToTime(data.templateHorizontalSmall)
            } 
            if (data.templateLowerLeft != 'NO DATA') {
                console.log("LL")
                data_to_return = data_to_return + "\n" + "Lower Left: " + this.msToTime(data.templateLowerLeft)
            } 
            if (data.templateMain != 'NO DATA') {
                console.log("M")
                data_to_return = data_to_return + "\n" + "Main: " + this.msToTime(data.templateMain)
            } 
            if (data.templateUpperLeft != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Upper Left: " + this.msToTime(data.templateUpperLeft)
            } 
            if (data.templateVertical != 'NO DATA') {
                data_to_return = data_to_return + "\n" + "Vertical: " + this.msToTime(data.templateVertical)
            }
            return data_to_return;
        }
    }

    msToTime(input) {
        var totalHours, totalMinutes, totalSeconds, hours, minutes, seconds, result='';
        totalSeconds = input;
        // totalSeconds = input / 1000;
        totalMinutes = totalSeconds / 60;
        totalHours = totalMinutes / 60;
        seconds = Math.floor(totalSeconds) % 60;
        minutes = Math.floor(totalMinutes) % 60;
        hours = Math.floor(totalHours) % 60;
        if (hours !== 0) {
            result += hours+'h ';
            if (minutes.toString().length == 1) {
                minutes = '0'+minutes;
            }
        }
        result += minutes+'m ';
        if (seconds.toString().length == 1) {
            seconds = '0'+seconds;
        }
        result += seconds + 's';
        return result;
    }

	exportTable() {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Excel.Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('Licenses');
		Object.keys(this.license_table_columns).forEach(key => {
			if(this.license_table_columns[key].name && !this.license_table_columns[key].no_export) {
				header.push({ header: this.license_table_columns[key].name, key: this.license_table_columns[key].key, width: 30, style: { font: { name: 'Arial', bold: true}}});
			}
		});
		this.worksheet.columns = header;
		this.getDataForExport(this._auth.current_user_value.roleInfo.dealerId);		
	}
}

