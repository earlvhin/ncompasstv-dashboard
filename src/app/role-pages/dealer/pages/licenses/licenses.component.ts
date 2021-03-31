import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { API_LICENSE } from '../../../../global/models/api_license.model';
import { LicenseService } from '../../../../global/services/license-service/license.service';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { LicenseModalComponent } from '../../../../global/components_shared/license_components/license-modal/license-modal.component';
import { UI_TABLE_LICENSE_BY_HOST } from '../../../../global/models/ui_table-license-by-host.model';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { TitleCasePipe, DatePipe } from '@angular/common';

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
	no_licenses: boolean = false;
	paging_data_license: any;
	subscription: Subscription = new Subscription();
	title: string = "Licenses"
	no_record: boolean;
	no_case: boolean = true;
  	licenses_count: any;
  	licenses_status: any;
	search_data_license: string = "";
	searching_license: boolean = false;
	sort_arrangement: string = 'online';

	// UI Table Column Header
	license_table_column: string[] = [
		'#',
		'License Key',
		'License Alias',
		'Type',
		'Host',
		'Category',
		'Region',
		'City',
		'State',
		'Connection Type',
		'Screen',
		'Create Date',
		'Install Date',
		'Last Push Update',
		// 'Tags',
		// 'Screen',
		// 'Uptime',
		'Status',
	];

	constructor(
		private _dialog: MatDialog,
		private _license: LicenseService,
		private _auth: AuthService,
		private _title: TitleCasePipe,
		private _date: DatePipe
	) { }

	ngOnInit() {
		this.dealers_name = this._auth.current_user_value.roleInfo.businessName;
		this.getLicenses(1);
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
			this._license.get_licenses_total_by_dealer(id).subscribe(
				(data: any) => {

					console.log('data', data);

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
			this._license.get_license_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_data_license, this.sort_arrangement).subscribe(
				data => {
					this.initial_load_license = false;
					this.searching_license = false;
					if(!data.message) {
						this.license_data_api = data.licenses;
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
					this.paging_data_license = data.paging;
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

	sortList(order) {
		this.sort_arrangement = order;
		this.getLicenses(1);
	}

	licenseTable_mapToUI(data): UI_TABLE_LICENSE_BY_HOST[] {
		let count: number = 1;
		console.log("DATA", data)
		return data.map(
			
			({ license, host, screen, screenType }) => {
				return new UI_TABLE_LICENSE_BY_HOST(
					{ value: license.licenseId, link: null , editable: false, hidden: true },
					{ value: host ? host.hostId : '--', link: null , editable: false, hidden: true },
					{ value: count++, link: null , editable: false, hidden: false },
					{ value: license.licenseKey, link: '/dealer/licenses/' + license.licenseId, editable: false, hidden: false, status: true },
					{ value: license.alias ? license.alias : '--', link: '/dealer/licenses/' + license.licenseId, editable: true, label: 'License Alias', id: license.licenseId, hidden: false },
					{ value: screen.screenTypeId ? this._title.transform(screenType.name) : '--', link: null, editable:false, hidden: false },
					{ value: host ? host.name: '--', link: host ? '/dealer/hosts/' + host.hostId : null, editable: false, hidden: false },
					{ value: host ? (host.category ? this._title.transform(host.category) : 'None') : '--', link: null, editable: false, hidden: false },
					{ value: host ? (host.region ? this._title.transform(host.region) : '--') : '--', link: null, editable: false, hidden: false },
					{ value: host ? (host.city ? this._title.transform(host.city) : '--') : '--', link: null, editable: false, hidden: false },
					{ value: host ? (host.state ? this._title.transform(host.state) : '--') : '--', link: null, editable: false, hidden: false },
					{ value: license.internetType ? license.internetType : '--', link: null, editable: false, hidden: false },
					{ value: screen ? (screen.screenName != null ? screen.screenName : '--') : '--', link: screen ? (screen.screenId != null ? '/dealer/screens/' + screen.screenId : null) : null, editable: false, hidden: false },
					{ value: license.dateCreated ? this._date.transform(license.dateCreated) : '--', link: null, editable: false, hidden: false },
					{ value: license.installDate ? this._date.transform(license.installDate) : '--', link: null, editable: false, hidden: false },
					{ value: license.contentsUpdated ? this._date.transform(license.contentsUpdated) : '--', link: null, editable: false, hidden: false },
					{ value: license.isActivated ? 'Active' : 'Inactive', link: null, editable: false, hidden: false },	
					{ value: license.piStatus, link: null, editable: false, hidden: true },	
				)
			}
		);
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
}

