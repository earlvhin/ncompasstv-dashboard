import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import { environment } from 'src/environments/environment';
import { AuthService, LicenseService } from 'src/app/global/services';
import { API_LICENSE, UI_TABLE_LICENSE_BY_HOST } from 'src/app/global/models';
import { LicenseModalComponent } from 'src/app/global/components_shared/license_components/license-modal/license-modal.component';
import { UserSortModalComponent } from 'src/app/global/components_shared/media_components/user-sort-modal/user-sort-modal.component';

@Component({
	selector: 'app-licenses',
	templateUrl: './licenses.component.html',
	styleUrls: ['./licenses.component.scss'],
	providers: [TitleCasePipe, DatePipe]
})
export class LicensesComponent implements OnInit {
	@Input() no_header: boolean = false;
	dealers_name: string;
	initial_load_license: boolean = true;
	license_info: API_LICENSE[];
	license_data: UI_TABLE_LICENSE_BY_HOST[] = [];
	license_data_api: any;
	filtered_data: UI_TABLE_LICENSE_BY_HOST[] = [];
	row_slug: string = 'license_id';
	row_url: string = `/${this.currentRole}/licenses`;
	license_filtered_data: any = [];
	license_row_slug: string = 'host_id';
	license_row_url: string = `/${this.currentRole}/hosts`;
	licenses_to_export: API_LICENSE['license'][] = [];
	no_licenses_result: boolean = false;
	now: any;
	paging_data_license: any;
	splitted_text: any;
	title: string = 'Licenses';
	no_record: boolean;
	no_case: boolean = true;
	licenses_count: any;
	licenses_status: any;
	search_data_license: string = '';
	searching_license: boolean = false;
	sort_column: string;
	sort_order: string;
	workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;
	is_view_only = false;

    // FOR GRID VIEW
    active_view: string = 'list';
    license_data_for_grid_view: any = [];
    favorites_list: any = [];
    favorite_view: boolean = true;
    show_more_clicked: boolean = false;
    favorites_list_cache: any = [];
    grid_list_cache: any = [];
    no_favorites: boolean;
    total_favorites: 0;
    total_not_favorites: 0;
    hide_all_license: boolean = false;
    no_licenses: boolean;
    paging_data_favorites: any;

	license_table_columns = [
		{ name: '#', sortable: false, no_export: true },
		{ name: 'Screenshot', sortable: false, no_export: true },
		{ name: 'Status', sortable: false, key: 'piStatus', hidden: true, no_show: true },
		{ name: 'License Key', sortable: true, key: 'licenseKey', column: 'LicenseKey' },
		{ name: 'Type', sortable: true, key: 'screenType', column: 'ScreenType' },
		{ name: 'Host', sortable: true, key: 'hostName', column: 'HostName' },
		{ name: 'Alias', sortable: true, key: 'alias', column: 'Alias' },
		{ name: 'Last Push', sortable: true, key: 'contentsUpdated', column: 'ContentsUpdated' },
		{ name: 'Last Disconnect', sortable: true, key: 'timeIn', column: 'TimeIn' },
		{ name: 'Net Type', sortable: true, key: 'internetType', column: 'InternetType' },
		{ name: 'Net Speed', sortable: true, key: 'internetSpeed', column: 'InternetSpeed' },
		{ name: 'Anydesk', sortable: true, key: 'anydeskId', column: 'AnydeskId' },
		{ name: 'Password', sortable: false, key: 'password', hidden: true, no_show: true },
		{ name: 'Display', sortable: true, key: 'displayStatus', column: 'DisplayStatus' },
		{ name: 'Install Date', sortable: true, key: 'installDate', column: 'InstallDate' },
		{ name: 'Zone & Duration', sortable: false, hidden: true, key: 'zone', no_show: true },
		{ name: 'Tags', key: 'tagsToString', no_show: true }
	];

	filters: any = {
		admin_licenses: false,
		isactivated: '',
		assigned: '',
		online: '',
		pending: '',
		activated: '',
		zone: '',
		status: '',
		host: '',
		recent: '',
		days_offline_from: '',
		days_offline_to: '',
		label_status: '',
		label_zone: '',
		label_dealer: '',
		label_admin: ''
	};

	protected _unsubscribe = new Subject<void>();

	constructor(
		private _dialog: MatDialog,
		private _license: LicenseService,
		private _auth: AuthService,
		private _title: TitleCasePipe,
		private _date: DatePipe,
		private _activatedRoute: ActivatedRoute
	) {}

	ngOnInit() {
		let status = this._activatedRoute.snapshot.paramMap.get('status');
		if (status) this.filterTable('status', status === 'Online' ? '1' : '0');
		this.dealers_name = this.currentUser.roleInfo.businessName;
		this.sortList('desc');
		this.getLicenses(1);
		this.getTotalCount(this.currentUser.roleInfo.dealerId);
		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	filterData(data: UI_TABLE_LICENSE_BY_HOST[]) {
		this.filtered_data = data;
	}

	filterTable(type: string, value: any, value2?: any, days?: any) {
		switch (type) {
			case 'status':
				this.resetFilterStatus();
				this.filters.activated = true;
				this.filters.label_status = value == 1 ? 'Online' : 'Offline';
				this.filters.online = value == 1 ? true : false;
                this.filters.isactivated = 1;
				this.filters.assigned = true;
                this.filters.isactivated = 1;
				if (value == 0) {
					var filter = {
						column: 'TimeIn',
						order: 'desc'
					};
					this.getColumnsAndOrder(filter);
				} else {
					this.sortList('desc');
				}
				break;
			case 'zone':
				this.filters.zone = value;
				this.filters.label_zone = value;
                this.sortList('desc');
				break;
			case 'activated':
				this.resetFilterStatus();
				this.filters.status = '';
				this.filters.assigned = true;
				this.filters.label_status = 'Disabled';
                this.sortList('desc');
				break;
			case 'recent':
				this.resetFilterStatus();
				this.filters.status = '';
				this.filters.recent = value;
				this.filters.label_status = 'Recent Installs';
                this.sortList('desc');
				break;
			case 'days_offline':
				this.resetFilterStatus();
				this.filters.status = 0;
				this.filters.days_offline_from = value;
				this.filters.days_offline_to = value2;
				this.filters.label_status = 'Offline for ' + days;
                this.sortList('desc', 'TimeIn');
				break;
			case 'assigned':
				this.resetFilterStatus();
				this.filters.assigned = value;
				this.filters.label_status = value == 'true' ? 'Assigned' : 'Unassigned';
				value == 'true' ? (this.filters.isactivated = 1) : (this.filters.isactivated = '');
				this.filters.label_status = value == 'true' ? 'Assigned' : 'Unassigned';
				this.sortList('desc');
				break;
			case 'pending':
				this.resetFilterStatus();
				this.filters.isactivated = 1;
				this.filters.assigned = true;
				this.filters.pending = value;
				this.filters.label_status = value == 'true' ? 'Pending' : '';
				this.sortList('desc');
                break;
			default:
		}

		this.getLicenses(1);
	}

	resetFilterStatus() {
		this.filters.recent = '';
		this.filters.activated = '';
		this.filters.days_offline_from = '';
		this.filters.days_offline_to = '';
		this.filters.status = '';
		this.filters.assigned = '';
		this.filters.pending = '';
		this.filters.online = '';
	}

	clearFilter() {
		this.filters = {
			admin_licenses: false,
			isactivated: '',
			assigned: '',
			online: '',
			pending: '',
			activated: '',
			recent: '',
			days_offline_from: '',
			days_offline_to: '',
			zone: '',
			status: '',
			host: '',
			label_status: '',
			label_zone: '',
			label_dealer: '',
			label_host: '',
			label_admin: ''
		};
		if(this.active_view === 'grid') {
            this.getFavoriteLicenses(false);
            this.license_data_for_grid_view = [];
            this.getLicenses(1, 24, true)
        } else {
            this.sortList('desc');
            this.getLicenses(1)
        }
	}

	getTotalCount(id: string): void {
		this._license
			.get_licenses_total_by_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					this.licenses_count = {
						basis: data.total,
						basis_label: 'License(s)',
						basis_sub_label: 'Current Count',
						good_value: data.totalAssigned,
						good_value_label: 'Assigned',
						bad_value: data.totalUnAssigned,
						bad_value_label: 'Unassigned',
						breakdown1_value: data.totalOnline,
						breakdown1_label: 'Online',
						breakdown2_value: data.totalOffline,
						breakdown2_label: 'Offline',
						breakdown3_value: data.totalPending,
						breakdown3_label: 'Pending',
						third_value: data.totalDisabled,
						third_value_label: 'Disabled',
						fourth_value: data.totalDisabled,
						fourth_value_label: 'Inactive',

						new_this_week_value: data.newLicensesThisWeek,
						new_this_week_label: 'License(s)',
						new_this_week_description: 'New this week',
						new_last_week_value: data.newLicensesLastWeek,
						new_last_week_label: 'License(s)',
						new_last_week_description: 'New last week'
					};

					this.licenses_status = {
						basis_label: 'License(s)',
						good_value: data.totalOnline,
						good_value_label: 'Online',
						bad_value: data.totalOffline,
						bad_value_label: 'Offline'
					};
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	getLicenses(page: number, pageSize?, fromShowMore?) {
        var favorite: any;
        this.no_licenses_result = false;
		if(this.active_view != 'grid') {
            favorite = '';
            this.searching_license = true;
        } else {
            if(page > 1) {
                this.searching_license = false;
            } else {
                this.searching_license = true;
            }
            favorite = false;
        }

		this._license
			.sort_license_by_dealer_id(
				this.currentUser.roleInfo.dealerId,
				page,
				this.search_data_license,
				this.sort_column,
				this.sort_order,
				pageSize ? pageSize : 15,
				this.filters.status,
				this.filters.days_offline_from,
				this.filters.days_offline_to,
				this.filters.activated,
				this.filters.recent,
				this.filters.zone,
				this.filters.host,
				this.filters.assigned,
				this.filters.pending,
				this.filters.online,
				this.filters.isactivated,
                favorite
			)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
                    this.paging_data_license = data.paging;

                    if(this.active_view === 'grid') {
                        if (data.paging.entities.length > 0) {
                            data.paging.entities.map(
                                entities => {
                                    this.license_data_for_grid_view.push(entities)
                                }
                            )
                            if(fromShowMore && page > 1) {
                                this.grid_list_cache = this.license_data_for_grid_view;
                            }
                            if(this.grid_list_cache.length > 0 && page === 1 && fromShowMore === true) {
                                this.license_data_for_grid_view = this.grid_list_cache;
                            }
                        } else {
                            this.no_licenses_result = true;
                        }
                    } else {
                        if (data.licenses.length > 0) {
                            const mapped = this.mapToLicensesTable(data.licenses);
                            this.license_data = [...mapped];
                            this.license_filtered_data = [...mapped];
                        } else {
                            if (this.search_data_license == '') this.no_licenses_result = true;
                            this.license_filtered_data = [];
                        }
                    }

					this.initial_load_license = false;
                    this.searching_license = false;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => {
				this.initial_load_license = false;
				this.searching_license = false;
			});
	}

    sortDisplay(arrangement) {
        var filter = {
            column: 'DisplayStatus',
            order: arrangement
        };
        this.getColumnsAndOrder(filter);
    }

	licenseFilterData(e) {
        if(e) {
            this.search_data_license = e;
            if(this.active_view === 'grid') {
                this.license_data_for_grid_view = [];
                this.getFavoriteLicenses(false);
                this.getLicenses(1, 24, false)
            } else {
                this.getLicenses(1);
            }
            this.hide_all_license = false;
        } else {
            this.search_data_license = '';
			if(this.active_view === 'grid') {
                this.license_data_for_grid_view = [];
                this.getFavoriteLicenses(false);
                this.getLicenses(1, 24, false)
            } else {
                this.getLicenses(1);
            }
        }
        
	}

	sortList(order: string, column?): void {
		const filter = { column: column ? column : 'PiStatus', order: order };
		this.getColumnsAndOrder(filter);
	}

	getColumnsAndOrder(data: { column: string; order: string }) {
		this.sort_column = data.column;
		this.sort_order = data.order;
		if(this.active_view === 'grid') {
            this.license_data_for_grid_view = [];
            this.getFavoriteLicenses();
            this.getLicenses(1, this.grid_list_cache.length, false)
        } else {
            this.getLicenses(1);
        }
	}

	getLabel(data) {
		this.now = moment().format('d');
		this.now = this.now;
		var storehours = JSON.parse(data.storeHours);
		storehours = storehours.sort((a, b) => {
			return a.id - b.id;
		});
		var modified_label = {
			date: moment().format('LL'),
			address: data.hostAddress,
			schedule:
				storehours[this.now] && storehours[this.now].status
					? storehours[this.now].periods[0].open == '' && storehours[this.now].periods[0].close == ''
						? 'Open 24 Hours'
						: storehours[this.now].periods.map((i) => {
								return i.open + ' - ' + i.close;
						  })
					: 'Closed'
		};
		return modified_label;
	}

	splitKey(key) {
		this.splitted_text = key.split('-');
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
				dealer_id: this.currentUser.roleInfo.dealerId,
				dealer_name: this.dealers_name
			}
		});

		dialog.afterClosed().subscribe((data) => {
			if (data) {
				if (data.host.id) {
					this.filters.host = data.host.id;
					this.filters.label_host = data.host.name;
				}
				if(this.active_view === 'grid') {
                    this.license_data_for_grid_view = [];
                    this.getFavoriteLicenses(false);
                    this.getLicenses(1, 24, false)
                } else {
                    this.getLicenses(1);
                }
                this.hide_all_license = false;
			}
		});
	}

    changeView(view) {
        this.active_view = view;
        if(view === 'grid') {
            this.getFavoriteLicenses(true);
            this.license_data_for_grid_view = [];
            this.getLicenses(1, this.grid_list_cache.length > 0 ? this.grid_list_cache.length : 24)
        } else {
            this.getLicenses(1)
        }
    }

    getFavoriteLicenses(reset?) {
        this.favorites_list = [];
        this._license.sort_license_by_dealer_id(
			this.currentUser.roleInfo.dealerId,
            1,
			!reset ? this.search_data_license : '',
			this.sort_column,
			this.sort_order,
			24,
			this.filters.status,
			this.filters.days_offline_from,
			this.filters.days_offline_to,
			this.filters.activated,
			this.filters.recent,
			this.filters.zone,
			this.filters.host,
			this.filters.assigned,
			this.filters.pending,
			this.filters.online,
			this.filters.isactivated,
            true
		).pipe(takeUntil(this._unsubscribe)).subscribe(
			(data) => {
                if(data.paging.entities.length === 0) {
                    this.no_favorites = true;
                } else {
                    this.paging_data_favorites = data.paging;
                    data.paging.entities.map(
                        entities => {
                            this.favorites_list.push(entities)
                        }
                    )
                    this.favorites_list_cache = this.favorites_list;
                    this.no_favorites = false;
                }
                if(reset) {
                    this.favorites_list_cache = this.favorites_list;
                    this.no_favorites = false;
                }
            }
        )
    }

	getDataForExport(id: string): void {
		const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
		this._license
			.get_license_to_export_duration(
				id,
				this.search_data_license,
				this.sort_column,
				this.sort_order,
				0,
				this.filters.status,
				this.filters.days_offline_from,
				this.filters.days_offline_to,
				this.filters.activated,
				this.filters.recent,
				this.filters.zone,
				this.filters.host,
				this.filters.assigned,
				this.filters.pending,
				this.filters.online,
				this.filters.isactivated
			)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data) => {
				if (!data.message) {
					this.licenses_to_export = data.licenseTemplateZoneExports;

					this.licenses_to_export.forEach((item) => {
						this.modifyItem(item);
						this.worksheet.addRow(item).font = { bold: false };
					});
				}

				let rowIndex = 1;
				for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
					this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
				}
				this.workbook.xlsx.writeBuffer().then((file: any) => {
					const blob = new Blob([file], { type: EXCEL_TYPE });
					const filename = this.dealers_name + '.xlsx';
					saveAs(blob, filename);
				});
				this.workbook_generation = false;
			});
	}

	modifyItem(item: API_LICENSE['license']) {
		item.zone = this.getZoneHours(item);
		item.screenType = this._title.transform(item.screenType);
		item.contentsUpdated = this._date.transform(item.contentsUpdated, 'MMM dd, yyyy h:mm a');
		item.timeIn = item.timeIn ? this._date.transform(item.timeIn, 'MMM dd, yyyy h:mm a') : '';
		item.installDate = this._date.transform(item.installDate, 'MMM dd, yyyy');
		item.internetType = this.getInternetType(item.internetType);
		item.internetSpeed = item.internetSpeed == 'Fast' ? 'Good' : item.internetSpeed;
		item.isActivated = item.isActivated == 0 ? 'Inactive' : 'Active';
		item.piStatus = item.piStatus == 0 ? 'Offline' : 'Online';
		item.displayStatus = item.displayStatus == 1 ? 'ON' : 'OFF';
		item.password = item.anydeskId ? this.splitKey(item.licenseId) : '';
		item.tagsToString = item.tags.join(',');
	}

	getZoneHours(data) {
		if (data.templateName == 'Fullscreen') {
			return 'Main: ' + this.msToTime(data.templateMain);
		} else {
			var data_to_return: any = '';
			if (data.templateBackground != 'NO DATA') {
				data_to_return = data_to_return + 'Background: ' + this.msToTime(data.templateBackground);
			}
			if (data.templateBottom != 'NO DATA') {
				data_to_return = data_to_return + '\n' + 'Bottom: ' + this.msToTime(data.templateBottom);
			}
			if (data.templateHorizontal != 'NO DATA') {
				data_to_return = data_to_return + '\n' + 'Horizontal: ' + this.msToTime(data.templateHorizontal);
			}
			if (data.templateHorizontalSmall != 'NO DATA') {
				data_to_return = data_to_return + '\n' + 'Horizontal Small: ' + this.msToTime(data.templateHorizontalSmall);
			}
			if (data.templateLowerLeft != 'NO DATA') {
				data_to_return = data_to_return + '\n' + 'Lower Left: ' + this.msToTime(data.templateLowerLeft);
			}
			if (data.templateMain != 'NO DATA') {
				data_to_return = data_to_return + '\n' + 'Main: ' + this.msToTime(data.templateMain);
			}
			if (data.templateUpperLeft != 'NO DATA') {
				data_to_return = data_to_return + '\n' + 'Upper Left: ' + this.msToTime(data.templateUpperLeft);
			}
			if (data.templateVertical != 'NO DATA') {
				data_to_return = data_to_return + '\n' + 'Vertical: ' + this.msToTime(data.templateVertical);
			}
			return data_to_return;
		}
	}

	msToTime(input) {
		let totalSeconds = input;
		let hours = Math.floor(totalSeconds / 3600);
		totalSeconds %= 3600;
		let minutes = Math.floor(totalSeconds / 60);
		let seconds = totalSeconds % 60;

		return hours + 'h ' + minutes + 'm ' + seconds + 's ';
	}

	exportTable() {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('Licenses');
		Object.keys(this.license_table_columns).forEach((key) => {
			if (this.license_table_columns[key].name && !this.license_table_columns[key].no_export) {
				header.push({
					header: this.license_table_columns[key].name,
					key: this.license_table_columns[key].key,
					width: 30,
					style: { font: { name: 'Arial', bold: true } }
				});
			}
		});
		this.worksheet.columns = header;
		this.getDataForExport(this.currentUser.roleInfo.dealerId);
	}

	private getInternetType(value: string): string {
		if (!value) return '--';

		if (value.includes('w')) return 'WiFi';

		if (value.includes('eth')) return 'LAN';
	}

	private mapToLicensesTable(data: any): UI_TABLE_LICENSE_BY_HOST[] {
		let count = this.paging_data_license.pageStart;

		return data.map((i) => {
			return new UI_TABLE_LICENSE_BY_HOST(
				{ value: i.licenseId, link: null, editable: false, hidden: true },
				{ value: i.hostId ? i.hostId : '--', link: null, editable: false, hidden: true },
				{ value: count++, link: null, editable: false, hidden: false },
				{
					value: i.screenshotUrl ? `${environment.base_uri}${i.screenshotUrl.replace('/API/', '')}` : null,
					link: i.screenshotUrl ? `${environment.base_uri}${i.screenshotUrl.replace('/API/', '')}` : null,
					editable: false,
					hidden: false,
					isImage: true,
                    new_tab_link: true
				},
				{ 
                    value: i.licenseKey, 
                    link: `/${this.currentRole}/licenses/` + i.licenseId, 
                    editable: false, 
                    hidden: false, 
                    status: true,
                    new_tab_link: true,
                    has_favorites: true,
                    is_favorite: i.isFavorite,
                    show_tags: i.tags != null ? true : false,
                    tags: i.tags != null ? i.tags : []
                },
				{ value: i.screenType ? this._title.transform(i.screenType) : '--', link: null, editable: false, hidden: false },
				{
					value: i.hostId ? i.hostName : '--',
					link: i.hostId ? `/${this.currentRole}/hosts/` + i.hostId : null,
					editable: false,
					hidden: false,
					business_hours: i.hostId ? true : false,
					business_hours_label: i.hostId ? this.getLabel(i) : null,
                    new_tab_link: true,
                    compressed: true,
				},
				{
					value: i.alias ? i.alias : '--',
					link: `/${this.currentRole}/licenses/` + i.licenseId,
					editable: true,
					label: 'License Alias',
					id: i.licenseId,
					hidden: false,
				},
				{ value: i.contentsUpdated ? this._date.transform(i.contentsUpdated) : '--', link: null, editable: false, hidden: false },
				{ value: i.timeIn ? this._date.transform(i.timeIn) : '--', link: null, editable: false, hidden: false },
				{ value: i.internetType ? this.getInternetType(i.internetType) : '--', link: null, editable: false, hidden: false },
				{ value: i.internetSpeed ? i.internetSpeed : '--', link: null, editable: false, hidden: false },
				{ 
                    value: i.anydeskId ? i.anydeskId : '--', 
                    link: null, 
                    editable: false, 
                    hidden: false, 
                    copy: true, 
                    label: 'Anydesk Id', 
                    anydesk: true,
                    password: i.anydeskId ? this.splitKey(i.licenseId) : '--',
                },
				{ value: i.displayStatus == 1 ? 'ON' : 'OFF', link: null, editable: false, hidden: false },
				{ 
                    value: i.installDate ? this._date.transform(i.installDate) : '--', 
                    link: null, 
                    editable: true, 
                    hidden: false,
                    label: 'Install Date',
                    id: i.licenseId 
                },
				{ value: i.piStatus, link: null, editable: false, hidden: true },
				{ value: i.playerStatus, link: null, editable: false, hidden: true },
				{ value: i.isActivated, link: null, editable: false, hidden: true }
			);
		});
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected get currentRole() {
		return this._auth.current_role;
	}

    showMore(event) {
        this.show_more_clicked = true;
        this.getLicenses(event.page, event.pageSize, true)
    }

    toggleFavorites(value) {
        if(value === 'false') {
            this.favorite_view = false;
        } else {
            this.favorites_list = this.favorites_list_cache;
            this.no_favorites = false;
            this.favorite_view = true;
        }
    }

    getTotalShownLicenses() {
        if(this.active_view === 'grid') {
            if(this.favorite_view) {
                return this.favorites_list.length + this.paging_data_license.entities.length;
            } else {
                return this.paging_data_license.entities.length;
            }
        } else {
            return this.paging_data_license.entities.length;
        }
    }
    
    getTotalLicenses() {
        if(this.active_view === 'grid') {
            return this.paging_data_favorites.totalEntities + this.paging_data_license.totalEntities;
        } else {
            return this.paging_data_license.totalEntities;
        }
    }
}
