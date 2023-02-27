import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';
import { AuthService, HostService, LicenseService } from 'src/app/global/services';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import {
	API_DEALER,
	UI_LICENSE,
	UI_HOST_VIEW,
	UI_TABLE_LICENSE_BY_DEALER,
	API_HOST,
	API_LICENSE_PROPS,
	UI_ROLE_DEFINITION_TEXT
} from 'src/app/global/models';
import { UserSortModalComponent } from 'src/app/global/components_shared/media_components/user-sort-modal/user-sort-modal.component';
import { LicenseModalComponent } from 'src/app/global/components_shared/license_components/license-modal/license-modal.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-licenses',
	templateUrl: './licenses.component.html',
	styleUrls: ['./licenses.component.scss'],
	providers: [DatePipe, TitleCasePipe]
})
export class LicensesComponent implements OnInit {
    active_view: string = 'list';
	dealers_data: UI_TABLE_LICENSE_BY_DEALER[] = [];
	licenses_data: UI_LICENSE[] = [];
	hosts_data: UI_HOST_VIEW[] = [];
	hour_diff: number;
	hour_diff_temp: any;
	no_dealer: boolean;
	no_host: boolean;
	no_licenses: boolean;
	no_licenses_result: boolean;
	no_favorites: boolean;
	filtered_data: UI_TABLE_LICENSE_BY_DEALER[] = [];
	filtered_data_host: UI_HOST_VIEW[] = [];
	filtered_data_licenses: UI_LICENSE[] = [];
	is_dealer_admin: boolean = false;
	title: string = 'Licenses';
	tab: any = { tab: 0 };
	licenses_details: any;
	now: any;
	paging_data: any;
	paging_data_favorites: any;
	paging_data_licenses: any;
	paging_data_host: any;
	searching: boolean = false;
	searching_licenses: boolean = false;
	searching_hosts: boolean = false;
	hide_all_license: boolean = true;
	initial_load: boolean = true;
	initial_load_licenses: boolean = true;
	initial_load_hosts: boolean = true;
    is_favorite: boolean = false;
    favorites_list: any = [];
	search_data: string = '';
	search_data_licenses: string = '';
	search_data_host: string = '';
	splitted_text: any;
	sort_column: string = 'PiStatus';
	sort_order: string = 'desc';
	sort_column_hosts: string = '';
	sort_order_hosts: string = '';
	has_sort: boolean = false;
    license_data_for_grid_view: any = [];
    favorite_view: boolean = true;
    show_more_clicked: boolean = false;
    favorites_list_cache: any = [];
    grid_list_cache: any = [];
    total_favorites: 0;
    total_not_favorites: 0;

	//for export
	hosts_to_export: API_HOST[] = [];
	licenses_to_export: any[] = [];
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
    url_link: any;

	diff_hours: any;

	filters: any = {
		admin_licenses: false,
		isactivated: '',
		assigned: '',
		online: '',
		pending: '',
		activated: '',
		zone: '',
		status: '',
		dealer: '',
		host: '',
		recent: '',
		days_offline_from: '',
		days_offline_to: '',
		label_status: '',
		label_zone: '',
		label_dealer: '',
		label_admin: ''
	};

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
	];

	// UI Table Column Header
	license_table_column = [
		{ name: '#', sortable: false, no_export: true },
		{ name: 'Status', sortable: false, key: 'new_status', hidden: true, no_show: true },
		{ name: 'Screenshot', sortable: false, no_export: true },
		{ name: 'License Key', sortable: true, column: 'LicenseKey', key: 'licenseKey' },
		{ name: 'Type', sortable: true, column: 'ScreenType', key: 'screenType', hidden: true, no_show: true },
		{ name: 'Dealer', sortable: true, column: 'BusinessName', key: 'businessName' },
		{ name: 'Host', sortable: true, column: 'HostName', key: 'hostName' },
		{ name: 'Alias', sortable: true, column: 'Alias', key: 'alias' },
		{ name: 'Last Push', sortable: true, column: 'ContentsUpdated', key: 'contentsUpdated' },
		{ name: 'Last Disconnect', sortable: true, column: 'TimeIn', key: 'timeIn' },
		{ name: 'Net Type', sortable: true, column: 'InternetType', key: 'internetType', hidden: true, no_show: true },
		{ name: 'Net Speed', sortable: true, key: 'internetSpeed', column: 'InternetSpeed', hidden: true, no_show: true },
		{ name: 'Upload Speed', sortable: true, key: 'upload', hidden: true, no_show: true },
		{ name: 'Download Speed', sortable: true, key: 'download', hidden: true, no_show: true },
		{ name: 'Display', sortable: true, key: 'displayStatus', column: 'DisplayStatus' },
		{ name: 'PS Version', sortable: true, key: 'server', column: 'ServerVersion', hidden: true, no_show: true },
		{ name: 'UI Version', sortable: true, key: 'ui', column: 'UiVersion', hidden: true, no_show: true },
		{ name: 'Pi Version', sortable: false, key: 'piVersion', hidden: true, no_show: true },
		{ name: 'Memory', sortable: false, key: 'memory', hidden: true, no_show: true },
		{ name: 'Storage', sortable: false, key: 'totalStorage', hidden: true, no_show: true },
		{ name: 'Anydesk', sortable: true, column: 'AnydeskId', key: 'anydeskId' },
		{ name: 'Password', sortable: false, key: 'password', hidden: true, no_show: true },
		{ name: 'Installation Date', sortable: true, column: 'InstallDate', key: 'installDate' },
		{ name: 'Creation Date', sortable: true, key: 'dateCreated', column: 'DateCreated', hidden: true, no_show: true },
		{ name: 'Zone & Duration', sortable: false, hidden: true, key: 'zone', no_show: true },
		{ name: 'Tags', key: 'tagsToString', no_show: true }
	];

	hosts_table_column = [
		{ name: '#', sortable: false, no_export: true },
		{ name: 'Host ID', sortable: true, key: 'hostId', hidden: true, no_show: true },
		{ name: 'Host Name', sortable: true, column: 'HostName', key: 'hostName' },
		{ name: 'Category', key: 'category', no_show: true, hidden: true },
		{ name: 'General Category', hidden: true, no_show: true, key: 'generalCategory' },
		{ name: 'Dealer Name', sortable: true, column: 'BusinessName', key: 'businessName' },
		{ name: 'Address', sortable: true, column: 'Address', key: 'address' },
		{ name: 'City', sortable: true, column: 'City', key: 'city' },
		{ name: 'State', sortable: true, column: 'State', key: 'state' },
		{ name: 'Postal Code', sortable: true, column: 'PostalCode', key: 'postalCode' },
		{ name: 'Timezone', sortable: true, column: 'TimezoneName', key: 'timezoneName' },
		{ name: 'Total Licenses', sortable: true, column: 'TotalLicenses', key: 'totalLicenses' },
		{ name: 'Tags', key: 'tagsToString', no_show: true, hidden: true },
		{ name: 'Total Business Hours', sortable: false, key: 'storeHours', hidden: true, no_show: true },
		{ name: 'DMA Rank', sortable: false, hidden: true, key: 'dmaRank', no_show: true },
		{ name: 'DMA Code', sortable: false, hidden: true, key: 'dmaCode', no_show: true },
		{ name: 'DMA Name', sortable: false, hidden: true, key: 'dmaName', no_show: true },
		{ name: 'Latitude', sortable: false, hidden: true, key: 'latitude', no_show: true },
		{ name: 'Longitude', sortable: false, hidden: true, key: 'longitude', no_show: true }
	];

	protected _unsubscribe = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _date: DatePipe,
		private _host: HostService,
		private _license: LicenseService,
		private _title: TitleCasePipe,
		private cdr: ChangeDetectorRef,
		private _activatedRoute: ActivatedRoute,
        private router: Router
	) {}

	ngOnInit() {
		if (this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
			this.is_dealer_admin = true;
		}
		let status = this._activatedRoute.snapshot.paramMap.get('status');
		if (status) {
			this.filterTable('status', status === 'Online' ? '1' : '0');
		}
		this.getLicensesTotal();

		this.getLicenses(1);

        let link= `${environment.base_uri}`;
        this.url_link = link.replace('/api/', '');
	}

	ngAfterContentChecked(): void {
		this.cdr.detectChanges();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getColumnsAndOrder(data, tab) {
		switch (tab) {
			case 'licenses':
				this.has_sort = true;
				this.sort_column = data.column;
				this.sort_order = data.order;
				if(this.active_view === 'grid') {
                    this.license_data_for_grid_view = [];
                    this.getFavoriteLicenses();
                    this.getLicenses(1, this.grid_list_cache.length, false)
                } else {
                    this.getLicenses(1);
                }
				break;
			case 'hosts':
				this.has_sort = true;
				this.sort_column_hosts = data.column;
				this.sort_order_hosts = data.order;
				this.getHosts(1);
				break;
			default:
		}
	}

	sortList(order, page?): void {
		var filter = {
			column: 'PiStatus',
			order: order
		};

		this.getColumnsAndOrder(filter, 'licenses');
	}

	getHosts(page: number) {
		this.searching_hosts = true;
		this.hosts_data = [];

		const filters = {
			page,
			search: this.search_data_host,
			sortColumn: this.sort_column_hosts,
			sortOrder: this.sort_order_hosts
		};

		let request = this.has_sort ? this._host.get_host_by_page(filters) : this._host.get_host_fetch(filters);

		request
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					if (response.message) {
						if (this.search_data_host == '') this.no_host = true;
						this.filtered_data_host = [];
						return;
					}

					this.paging_data_host = response.paging;
					const mappedData = this.mapToHostsTable([...response.paging.entities]);
					this.hosts_data = [...mappedData];
					this.filtered_data_host = [...mappedData];
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => {
				this.initial_load_hosts = false;
				this.searching_hosts = false;
			});
	}

    sortDisplay(arrangement) {
        var filter = {
            column: 'DisplayStatus',
            order: arrangement
        };
        this.getColumnsAndOrder(filter, 'licenses');
    }

    getFavoriteLicenses(reset?) {
        this.favorites_list = [];
        this._license.get_all_licenses(
			1,
			!reset ? this.search_data_licenses : '',
			this.sort_column,
			this.sort_order,
			0,
			this.filters.admin_licenses,
			this.filters.status,
			this.filters.days_offline_from,
			this.filters.days_offline_to,
			this.filters.activated,
			this.filters.recent,
			this.filters.zone,
			this.filters.dealer,
			this.filters.host,
			this.filters.assigned,
			this.filters.pending,
			this.filters.online,
			this.filters.isactivated,
            true,
		).pipe(takeUntil(this._unsubscribe)).subscribe(
			(data) => {
                if(data.licenses.length === 0) {
                    this.no_favorites = true;
                } else {
                    data.licenses.map(
                        entities => {
                            this.favorites_list.push(entities)
                        }
                    )
                    this.favorites_list_cache = this.favorites_list;
                    this.no_favorites = false;
                    this.paging_data_favorites = data.paging;
                }
                if(reset) {
                    this.favorites_list_cache = this.favorites_list;
                    this.no_favorites = false;
                }
            }
        )
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

	getLicenses(page: number, pageSize?, fromShowMore?) {
		this.hosts_data = [];
        var favorite: any;
        this.no_licenses_result = false;
        if(this.active_view != 'grid') {
            favorite = '';
            this.searching_licenses = true;
        } else {
            if(page > 1) {
                this.searching_licenses = false;
            } else {
                this.searching_licenses = true;
            }
            favorite = false;
        }
		// if (this.has_sort) {
			this._license
				.get_all_licenses(
					page,
					this.search_data_licenses,
					this.sort_column,
					this.sort_order,
					pageSize ? pageSize : 15,
					this.filters.admin_licenses,
					this.filters.status,
					this.filters.days_offline_from,
					this.filters.days_offline_to,
					this.filters.activated,
					this.filters.recent,
					this.filters.zone,
					this.filters.dealer,
					this.filters.host,
					this.filters.assigned,
					this.filters.pending,
					this.filters.online,
					this.filters.isactivated,
                    favorite,
				)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
                        this.paging_data_licenses = data.paging;
                        
                        if(this.active_view === 'grid') {
                            if (data.licenses.length > 0) {
                                data.licenses.map(
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
                                this.licenses_data = [...mapped];
                                this.filtered_data_licenses = [...mapped];
                            } else {
                                if (this.search_data == '') this.no_licenses = true;
                                this.filtered_data_licenses = [];
                            }
                        }

                        this.initial_load_licenses = false;
                        this.searching_licenses = false;
					},
					(error) => {
						throw new Error(error);
					}
				);
		} else {
			this._license
				.get_all_licenses_fetch(
					page,
					this.search_data_licenses,
					this.sort_column,
					this.sort_order,
					pageSize ? pageSize : 15,
					this.filters.admin_licenses,
					this.filters.status,
					this.filters.days_offline_from,
					this.filters.days_offline_to,
					this.filters.activated,
					this.filters.recent,
					this.filters.zone,
					this.filters.dealer,
					this.filters.host,
					this.filters.assigned,
					this.filters.pending,
					this.filters.online,
					this.filters.isactivated
				)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						this.paging_data_licenses = data.paging;
		// 				if (data.paging.entities) {
		// 					const mapped = this.mapToLicensesTable(data.paging.entities);
		// 					this.licenses_data = [...mapped];
		// 					this.filtered_data_licenses = [...mapped];
		// 				} else {
		// 					if (this.search_data == '') this.no_licenses = true;
		// 					this.filtered_data_licenses = [];
		// 				}

		// 				this.initial_load_licenses = false;
		// 				this.searching_licenses = false;
        //                 if(this.active_view === 'grid') {
        //                     data.licenses.map(
        //                         entities => {
        //                             this.license_data_for_grid_view.push(entities)
        //                         }
        //                     )
        //                 }
		// 			},
		// 			(error) => {
		// 				throw new Error(error);
		// 			}
		// 		);
		// }
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
			case 2:
				if (this.is_dealer_admin) {
					this.getHosts(1);
				}
				break;
			default:
		}
	}

	filterTable(type: string, value: any, value2?: any, days?: any) {
		switch (type) {
			case 'status':
				this.resetFilterStatus();
				// this.filters.status = value;
				this.filters.activated = true;
				this.filters.label_status = value == 1 ? 'Online' : 'Offline';
				if (value == 1) {
					this.filters.online = true;
                    this.sortList('desc');
				} else {
					this.filters.online = false;
				}
				this.filters.assigned = true;
				this.filters.isactivated = 1;
                if (value === 0) {
                    var filter = {
                        column: 'TimeIn',
                        order: 'desc'
                    };
                    this.getColumnsAndOrder(filter, 'licenses');
				}
				this.filters.assigned = true;
				this.filters.isactivated = 1;
			    break;
			case 'zone':
				this.filters.zone = value;
				this.filters.label_zone = value;
				this.sortList('desc');
				break;
			case 'activated':
				this.resetFilterStatus();
				this.filters.status = '';
				// this.filters.activated = value;
				this.filters.isactivated = 0;
				this.filters.assigned = true;
				this.filters.label_status = 'Inactive';
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
				this.sortList('desc');
				break;
			case 'assigned':
				this.resetFilterStatus();
				this.filters.assigned = value;
				value == 'true' ? (this.filters.isactivated = 1) : (this.filters.isactivated = '');
				this.filters.label_status = value == 'true' ? 'Assigned' : 'Unassigned';
				this.sortList('desc');
				break;
			case 'pending':
				this.resetFilterStatus();
				this.filters.assigned = true;
				this.filters.isactivated = 1;
				this.filters.pending = value;
				this.filters.label_status = value == 'true' ? 'Pending' : '';
				this.sortList('desc');
				break;
			default:
		}
		// if(this.active_view === 'grid') {
        //     this.license_data_for_grid_view = [];
        //     this.getFavoriteLicenses(true);
        //     this.getLicenses(1, 24)
        // } else {
        //     this.getLicenses(1);
        // }
	}

	resetFilterStatus() {
		this.filters.recent = '';
		this.filters.activated = '';
		this.filters.days_offline = '';
		this.filters.status = '';
		this.filters.assigned = '';
		this.filters.pending = '';
		this.filters.online = '';
	}

	sortByUser() {
		let dialog = this._dialog.open(UserSortModalComponent, {
			width: '500px',
			data: 'license'
		});

		dialog.afterClosed().subscribe((data) => {
			if (data) {
				if (data.dealer.id) {
					this.filters.dealer = data.dealer.id;
					this.filters.label_dealer = data.dealer.name;
				}
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

	filterData(e, tab) {
		switch (tab) {
			case 'licenses':
				if (e) {
					this.has_sort = true;
					this.search_data_licenses = e;
                    if(this.active_view === 'grid') {
                        this.license_data_for_grid_view = [];
                        this.getFavoriteLicenses(false);
                        this.getLicenses(1, 24, false)
                    } else {
                        this.getLicenses(1);
                    }
                    this.hide_all_license = false;
				} else {
					this.has_sort = false;
					this.search_data_licenses = '';
					if(this.active_view === 'grid') {
                        this.license_data_for_grid_view = [];
                        this.getFavoriteLicenses(false);
                        this.getLicenses(1, 24, false)
                    } else {
                        this.getLicenses(1);
                    }
				}
				break;
			case 'hosts':
				if (e) {
					this.has_sort = true;
					this.search_data_host = e;
					this.getHosts(1);
				} else {
					this.has_sort = false;
					this.search_data_host = '';
					this.getHosts(1);
				}
				break;
			default:
				if (e) {
					this.search_data = e;
					this.pageRequested(1);
				} else {
					this.search_data = '';
					this.pageRequested(1);
				}
		}
	}

	getLicensesTotal() {
		this._license
			.get_licenses_total()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					this.licenses_details = {
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
						third_value: data.totalAdminLicenses,
						third_value_label: 'Demo',
						fourth_value: data.totalDisabled,
						fourth_value_label: 'Inactive',

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
						last_week_unassigned_value: data.lastWeekUnassignedCount
					};

					if (this.is_dealer_admin) {
						delete this.licenses_details['third_value'];
						delete this.licenses_details['third_value_label'];
					}

					if (this.licenses_details) {
						this.temp_label.push(this.licenses_details.ad_value_label + ': ' + this.licenses_details.ad_value);
						this.temp_label.push(this.licenses_details.menu_value_label + ': ' + this.licenses_details.menu_value);
						this.temp_label.push(this.licenses_details.closed_value_label + ': ' + this.licenses_details.closed_value);
						this.temp_label.push(this.licenses_details.unassigned_value_label + ': ' + this.licenses_details.unassigned_value);
						this.temp_array.push(this.licenses_details.ad_value);
						this.temp_array.push(this.licenses_details.menu_value);
						this.temp_array.push(this.licenses_details.closed_value);
						this.temp_array.push(this.licenses_details.unassigned_value);

						this.temp_label_this_week.push(this.licenses_details.ad_value_label + ': ' + this.licenses_details.this_week_ad_value);
						this.temp_label_this_week.push(this.licenses_details.menu_value_label + ': ' + this.licenses_details.this_week_menu_value);
						this.temp_label_this_week.push(
							this.licenses_details.closed_value_label + ': ' + this.licenses_details.this_week_closed_value
						);
						this.temp_label_this_week.push(
							this.licenses_details.unassigned_value_label + ': ' + this.licenses_details.this_week_unassigned_value
						);
						this.temp_array_this_week.push(this.licenses_details.this_week_ad_value);
						this.temp_array_this_week.push(this.licenses_details.this_week_menu_value);
						this.temp_array_this_week.push(this.licenses_details.this_week_closed_value);
						this.temp_array_this_week.push(this.licenses_details.this_week_unassigned_value);

						this.temp_label_last_week.push(this.licenses_details.ad_value_label + ': ' + this.licenses_details.last_week_ad_value);
						this.temp_label_last_week.push(this.licenses_details.menu_value_label + ': ' + this.licenses_details.last_week_menu_value);
						this.temp_label_last_week.push(
							this.licenses_details.closed_value_label + ': ' + this.licenses_details.last_week_closed_value
						);
						this.temp_label_last_week.push(
							this.licenses_details.unassigned_value_label + ': ' + this.licenses_details.last_week_unassigned_value
						);
						this.temp_array_last_week.push(this.licenses_details.last_week_ad_value);
						this.temp_array_last_week.push(this.licenses_details.last_week_menu_value);
						this.temp_array_last_week.push(this.licenses_details.last_week_closed_value);
						this.temp_array_last_week.push(this.licenses_details.last_week_unassigned_value);
					}
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	pageRequested(page: number) {
		this.searching = true;
		this.dealers_data = [];

		this._dealer
			.get_dealers_with_license(page, this.search_data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data) => {
				this.paging_data = data.paging;

				if (data.dealers) {
					const mapped = this.mapToDealersTable(data.dealers);
					this.dealers_data = [...mapped];
					this.filtered_data = [...mapped];
				} else {
					if (this.search_data == '') this.no_dealer = true;
					this.filtered_data = [];
				}

				this.initial_load = false;
				this.searching = false;
			});
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

	clearFilter() {
		this.filters = {
			admin_licenses: false,
			assigned: '',
			isactivated: '',
			online: '',
			pending: '',
			activated: '',
			recent: '',
			days_offline_from: '',
		    days_offline_to: '',
			zone: '',
			status: '',
			dealer: '',
			host: '',
			label_status: '',
			label_zone: '',
			label_dealer: '',
			label_host: '',
			label_admin: ''
		};
        // this.hide_all_license = true;
        if(this.active_view === 'grid') {
            this.getFavoriteLicenses(false);
            this.has_sort = true;
            this.license_data_for_grid_view = [];
            this.getLicenses(1, 24, true)
        } else {
            this.sortList('desc');
            this.getLicenses(1)
        }
	}

	splitKey(key) {
		this.splitted_text = key.split('-');
		return this.splitted_text[this.splitted_text.length - 1];
	}

	openGenerateLicenseModal(): void {
		let dialogRef = this._dialog.open(LicenseModalComponent, {
			height: '400px',
			width: '500px'
		});

		dialogRef.afterClosed().subscribe((result) => {
			this.ngOnInit();
		});
	}

	getDataForExport(tab: string): void {
		this.pageSize = 0;
		const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
		this.filters.isactivated = '';
		switch (tab) {
			case 'licenses':
				this._license
					.get_all_licenses_duration(
						0,
						this.search_data_licenses,
						this.sort_column,
						this.sort_order,
						0,
						this.filters.admin_licenses,
						this.filters.status,
						this.filters.days_offline_from,
						this.filters.days_offline_to,
						this.filters.activated,
						this.filters.recent,
						this.filters.zone,
						this.filters.dealer,
						this.filters.host,
						this.filters.assigned,
						this.filters.pending,
						this.filters.online,
						this.filters.isactivated
					)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe((data: any) => {
						if (data.message) {
							this.licenses_to_export = [];
							return;
						}
						data.licenses.map((license) => {
							if (license.appVersion) {
								license.apps = JSON.parse(license.appVersion);
							} else {
								license.apps = null;
							}
							if (license.internetInfo) {
								license.internetInfo = JSON.parse(license.internetInfo);
								license.upload = Math.round(license.internetInfo.uploadMbps * 100) / 100 + ' mbps';
								license.download = Math.round(license.internetInfo.downloadMbps * 100) / 100 + ' mbps';
							}
						});
						this.licenses_to_export = data.licenses;

						this.licenses_to_export.forEach((item) => {
							this.mapLicensesForExport(item);
							this.worksheet.addRow(item).font = { bold: false };
						});

						let rowIndex = 1;
						for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
							this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
						}

						this.workbook.xlsx.writeBuffer().then((file: any) => {
							const blob = new Blob([file], { type: EXCEL_TYPE });
							const filename = 'Licenses' + '.xlsx';
							saveAs(blob, filename);
						});

						this.workbook_generation = false;
					});

				break;
			case 'hosts':
				const filters = {
					page: 1,
					search: this.search_data_host,
					sortColumn: this.sort_column_hosts,
					sortOrder: this.sort_order_hosts,
					pageSize: 0
				};

				this._host.get_host_fetch_export(filters).subscribe((response) => {
					if (response.message) {
						this.hosts_to_export = [];
						return;
					} else {
						response.host.map((host) => {
							host.storeHours = this.getTotalHours(host);
							this.mapHostsForExport(host);
						});
						this.hosts_to_export = response.host;
					}

					this.hosts_to_export.forEach((item) => {
						this.worksheet.addRow(item).font = { bold: false };
					});

					let rowIndex = 1;

					for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
						this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
					}

					this.workbook.xlsx.writeBuffer().then((file: any) => {
						const blob = new Blob([file], { type: EXCEL_TYPE });
						const filename = 'Hosts' + '.xlsx';
						saveAs(blob, filename);
					});

					this.workbook_generation = false;
				});

				break;
			default:
		}
	}

	showAdminLicenses(value) {
		this.filters.admin_licenses = value;
		this.getLicenses(1);
	}

	getTotalHours(data) {
		if (data.storeHours) {
			data.storeHours = JSON.parse(data.storeHours);
			this.hour_diff_temp = [];
			data.storeHours.map((hours) => {
				if (hours.status) {
					hours.periods.map((period) => {
						this.diff_hours = 0;
						if (period.open && period.close) {
							var close = moment(period.close, 'H:mm A');
							var open = moment(period.open, 'H:mm A');

							var time_start = new Date('01/01/2007 ' + open.format('HH:mm:ss'));
							var time_end = new Date('01/01/2007 ' + close.format('HH:mm:ss'));

							if (time_start.getTime() > time_end.getTime()) {
								time_end = new Date(time_end.getTime() + 60 * 60 * 24 * 1000);
								this.diff_hours = (time_end.getTime() - time_start.getTime()) / 1000;
							} else {
								this.diff_hours = (time_end.getTime() - time_start.getTime()) / 1000;
							}
						} else {
							this.diff_hours = 86400;
						}
						this.hour_diff_temp.push(this.diff_hours);
					});
				} else {
				}
			});
			this.hour_diff = 0;
			this.hour_diff_temp.map((hour) => {
				this.hour_diff += hour;
			});
		} else {
		}
		return this.msToTime(this.hour_diff);
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
		let seconds = Math.floor(totalSeconds % 60);
		return hours + 'h ' + minutes + 'm ' + seconds + 's ';
	}

	exportTable(tab) {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
		switch (tab) {
			case 'licenses':
				this.worksheet = this.workbook.addWorksheet('License View');
				Object.keys(this.license_table_column).forEach((key) => {
					if (this.license_table_column[key].name && !this.license_table_column[key].no_export) {
						header.push({
							header: this.license_table_column[key].name,
							key: this.license_table_column[key].key,
							width: 30,
							style: { font: { name: 'Arial', bold: true } }
						});
					}
				});
				break;
			case 'hosts':
				this.worksheet = this.workbook.addWorksheet('Host View');
				Object.keys(this.hosts_table_column).forEach((key) => {
					if (this.hosts_table_column[key].name && !this.hosts_table_column[key].no_export) {
						header.push({
							header: this.hosts_table_column[key].name,
							key: this.hosts_table_column[key].key,
							width: 30,
							style: { font: { name: 'Arial', bold: true } }
						});
					}
				});
				break;
			default:
		}
		this.worksheet.columns = header;
		this.getDataForExport(tab);
	}

	private getInternetType(value: string): string {
		if (value) {
			value = value.toLowerCase();
			if (value.includes('w')) {
				return 'WiFi';
			}
			if (value.includes('eth')) {
				return 'LAN';
			}
		}
	}

	private mapLicensesForExport(item) {
		item.new_status = this.checkStatusForExport(item);
		item.zone = this.getZoneHours(item);
		item.piVersion = item.apps ? item.apps.rpi_model : '';
		item.displayStatus = item.displayStatus == 1 ? 'ON' : '';
		item.password = item.anydeskId ? this.splitKey(item.licenseId) : '';
		item.piStatus = item.piStatus == 0 ? 'Offline' : 'Online';
		item.screenType = this._title.transform(item.screenType);
		item.contentsUpdated = this._date.transform(item.contentsUpdated, 'MMM dd, yyyy h:mm a');
		item.timeIn = item.timeIn ? this._date.transform(item.timeIn, 'MMM dd, yyyy h:mm a') : '';
		item.installDate = this._date.transform(item.installDate, 'MMM dd, yyyy');
		item.dateCreated = this._date.transform(item.dateCreated, 'MMM dd, yyyy');
		item.internetType = this.getInternetType(item.internetType);
		item.internetSpeed = item.internetSpeed == 'Fast' ? 'Good' : item.internetSpeed;
		item.isActivated = item.isActivated == 0 ? 'No' : 'Yes';
		const parse_version = JSON.parse(item.appVersion);
		item.ui = parse_version && parse_version.ui ? parse_version.ui : '1.0.0';
		item.server = parse_version && parse_version.server ? parse_version.server : '1.0.0';
		item.tagsToString = item.tags.join(',');
	}

	private mapToDealersTable(data): UI_TABLE_LICENSE_BY_DEALER[] {
		let count = this.paging_data.pageStart;
		return data
			.filter((i) => i.licenses.length > 0)
			.map((dealer: API_DEALER) => {
				return new UI_TABLE_LICENSE_BY_DEALER(
					{ value: dealer.dealerId, link: null, editable: false, hidden: true },
					{ value: count++, link: null, editable: false, hidden: false },
					{
						value: dealer.dealerIdAlias ? dealer.dealerIdAlias : '--',
						link: '/administrator/dealers/' + dealer.dealerId,
						query: '2',
						editable: false,
						hidden: false,
						new_tab_link: true
					},
					{
						value: this._title.transform(dealer.businessName),
						link: '/administrator/dealers/' + dealer.dealerId,
						editable: false,
						hidden: false,
						new_tab_link: true
					},
					{ value: this._title.transform(dealer.contactPerson), link: null, editable: false, hidden: false },
					{ value: dealer.region, link: null, editable: false, hidden: false },
					{ value: dealer.city, link: null, editable: false, hidden: false },
					{ value: dealer.state, link: null, editable: false, hidden: false },
					{ value: dealer.licenses.length, link: null, editable: false, hidden: false },
					{
						value: dealer.licenses.length > 0 ? dealer.licenses.filter((i) => i.hostId != null).length : 0,
						link: null,
						editable: false,
						hidden: false
					},
					{
						value: dealer.licenses.length > 0 ? dealer.licenses.filter((i) => i.hostId == null).length : 0,
						link: null,
						editable: false,
						hidden: false
					},
					{
						value: dealer.licenses.length > 0 ? dealer.licenses.filter((i) => i.piStatus == 1).length : 0,
						link: null,
						editable: false,
						hidden: false,
						online_field: true
					},
					{
						value: dealer.licenses.length > 0 ? dealer.licenses.filter((i) => i.piStatus != 1).length : 0,
						link: null,
						editable: false,
						hidden: false,
						offline_field: true
					},
					{
						value: dealer.licenses.length > 0 ? this._date.transform(dealer.licenses[0].dateCreated) : '--',
						link: null,
						editable: false,
						hidden: false
					},
					{
						value:
							dealer.licenses.length > 0
								? dealer.licenses.filter(
										(i) => this._date.transform(i.dateCreated) == this._date.transform(dealer.licenses[0].dateCreated)
								  ).length
								: 0,
						link: null,
						editable: false,
						hidden: false
					}
				);
			});
	}

	private mapToHostsTable(data: API_HOST[]): UI_HOST_VIEW[] {
		let count = this.paging_data_host.pageStart;
		let role = this._auth.current_role;
		if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
			role = UI_ROLE_DEFINITION_TEXT.administrator;
		}

		return data.map((h: API_HOST) => {
			const table = new UI_HOST_VIEW(
				{ value: count++, link: null, editable: false, hidden: false },
				{ value: h.hostId, link: null, editable: false, hidden: true, key: false },
				{
					value: h.hostName,
					link: `/` + role + `/hosts/${h.hostId}`,
					new_tab_link: true,
					compressed: true,
					editable: false,
					hidden: false,
					status: true,
					business_hours: h.hostId ? true : false,
					business_hours_label: h.hostId ? this.getLabel(h) : null
				},
				{
					value: h.businessName ? h.businessName : '--',
					link: `/` + role + `/dealers/${h.dealerId}`,
					new_tab_link: true,
					editable: false,
					hidden: false
				},
				{ value: h.address ? h.address : '--', link: null, new_tab_link: true, editable: false, hidden: false },
				{ value: h.city ? h.city : '--', link: null, editable: false, hidden: false },
				// { value: h.region ? h.region:'--', hidden: false },
				{ value: h.state ? h.state : '--', hidden: false },
				// { value: h.street ? h.street:'--', link: null, editable: false, hidden: false },
				{ value: h.postalCode ? h.postalCode : '--', link: null, editable: false, hidden: false },
				{ value: h.timezoneName ? h.timezoneName : '--', link: null, editable: false, hidden: false },
				{ value: h.totalLicenses ? h.totalLicenses : '0', link: null, editable: false, hidden: false },
				{ value: h.status, editable: false, hidden: false }
			);

			return table;
		});
	}

	private mapToLicensesTable(data): UI_LICENSE[] {
		let count = this.paging_data_licenses.pageStart;
		return data.map((l: any) => {
			const table = new UI_LICENSE(
				{ value: count++, link: null, editable: false, hidden: false },
				{ value: l.licenseId, link: null, editable: false, hidden: true, key: false, table: 'license' },
				{
					value: l.screenshotUrl ? `${environment.base_uri}${l.screenshotUrl.replace('/API/', '')}` : null,
					link: l.screenshotUrl ? `${environment.base_uri}${l.screenshotUrl.replace('/API/', '')}` : null,
					editable: false,
					hidden: false,
					isImage: true,
				},
				{
					value: l.licenseKey,
					link: '/administrator/licenses/' + l.licenseId,
					new_tab_link: true,
					// compressed: true,
					editable: false,
					hidden: false,
					status: true,
                    show_tags: l.tags != null ? true : false,
                    tags: l.tags != null ? l.tags : []
				},
				// { value: l.screenType ? this._title.transform(l.screenType) : '--', editable: false, hidden: false },
				{
					value: l.dealerId ? l.businessName : '--',
					link: '/administrator/dealers/' + l.dealerId,
					new_tab_link: true,
					editable: false,
					hidden: false,
                    compressed: true,
				},
				{
					value: l.hostId ? l.hostName : '--',
					link: l.hostId ? '/administrator/hosts/' + l.hostId : null,
					new_tab_link: true,
					editable: false,
					hidden: false,
					business_hours: l.hostId ? true : false,
					business_hours_label: l.hostId ? this.getLabel(l) : null,
                    compressed: true,
				},
				{
					value: l.alias ? l.alias : '--',
					link: '/administrator/licenses/' + l.licenseId,
					editable: false,
					new_tab_link: true,
					label: 'License Alias',
					id: l.licenseId,
					hidden: false
				},
				{ value: l.contentsUpdated ? l.contentsUpdated : '--', label: 'Last Push', hidden: false },
				{ value: l.timeIn ? this._date.transform(l.timeIn, 'MMM dd y \n h:mm a') : '--', hidden: false },
				{ value: l.displayStatus == 1 ? 'ON' : 'OFF', link: null, editable: false, hidden: false },
				{ value: l.anydeskId ? l.anydeskId : '--', link: null, editable: false, hidden: false, copy: true, label: 'Anydesk Id' },
				{ 
                    value: l.anydeskId ? l.anydeskId : '--', 
                    link: null, 
                    editable: false, 
                    hidden: false, 
                    copy: true, 
                    label: 'Anydesk Id',
                    anydesk: true,
                    password: l.anydeskId ? this.splitKey(l.licenseId) : '--',
                },
				{
					value: l.installDate && !l.installDate.includes('Invalid') ? this._date.transform(l.installDate, 'MMM dd, y') : '--',
					link: null,
					editable: false,
					label: 'Install Date',
					hidden: false,
					id: l.licenseId
				},
				// { value: l.dateCreated ? this._date.transform(l.dateCreated, 'MMM dd, y') : '--', link: null, editable: false, hidden: false },
				{ value: this.checkStatus(l), link: null, editable: false, hidden: true, label: this.checkStatusForExport(l), new_status: true },
				{ value: l.playerStatus, link: null, editable: false, hidden: true },
				{ value: l.isActivated, link: null, editable: false, hidden: true }
			);
			return table;
		});
	}

	checkStatus(license) {
		let currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		if (new Date(license.installDate) <= currentDate && license.isActivated === 1 && license.hostName && license.piStatus === 1) {
			return 'text-primary';
		} else if (new Date(license.installDate) <= currentDate && license.isActivated === 1 && license.hostName && license.piStatus === 0) {
			return 'text-danger';
		} else if (new Date(license.installDate) > currentDate && license.hostName && license.isActivated === 1) {
			return 'text-orange';
		} else if (license.isActivated === 0 && license.hostName) {
			return 'text-light-gray';
		} else {
			return 'text-gray';
		}
	}

	checkStatusForExport(license) {
		let currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		if (new Date(license.installDate) <= currentDate && license.isActivated === 1 && license.hostName && license.piStatus === 1) {
			return 'Online';
		} else if (new Date(license.installDate) <= currentDate && license.isActivated === 1 && license.hostName && license.piStatus === 0) {
			return 'Offline';
		} else if (new Date(license.installDate) > currentDate && license.hostName && license.isActivated === 1) {
			return 'Pending';
		} else if (license.isActivated === 0 && license.hostName) {
			return 'Inactive';
		} else {
			return 'Unassigned';
		}
	}

	private mapHostsForExport(data) {
		data.storeHours = data.storeHours;
		data.generalCategory = data.generalCategory ? data.generalCategory : 'Others';
		data.tagsToString = data.tags.join(',');
	}

	private get currentRole() {
		return this._auth.current_role;
	}

    changeView(view) {
        this.active_view = view;
        if(view === 'grid') {
            this.getFavoriteLicenses(true);
            this.has_sort = true;
            this.license_data_for_grid_view = [];
            this.getLicenses(1, this.grid_list_cache.length > 0 ? this.grid_list_cache.length : 24)
        } else {
            this.getLicenses(1)
        }
    }

    formulateScreenshotURL(url) {
        return `${environment.base_uri}${url.replace('/API/', '')}`;
    }

    showAllLicenses() {
        this.hide_all_license = false;
    }

    copyToClipboard(val: string) {
		//create artificial textbox for selector
		const selBox = document.createElement('textarea');
		selBox.style.position = 'fixed';
		selBox.style.left = '0';
		selBox.style.top = '0';
		selBox.style.opacity = '0';
		selBox.value = val;
		document.body.appendChild(selBox);
		selBox.focus();
		selBox.select();
		document.execCommand('copy');
		document.body.removeChild(selBox);
	}

    getAnydeskPassword(id) {
        return this.splitKey(id)
    }

    addToFavorites(id) {
        this._license
			.add_license_favorite(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
                response => {
                    if(!response) {
                        this.license_data_for_grid_view = this.license_data_for_grid_view.filter((license) => {
					        return license.licenseId != id;
				        })
                        this.openConfirmationModal('success', 'Success!', 'License successfully added to Favorites');
                    } else {
                        this.openConfirmationModal('error', 'Error!', response.message);
                    }
                }
            )
    }
    
    removeToFavorites(license) {
        var id = license.licenseId;
        this._license
			.remove_license_favorite(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
                response => {
                    if(!response) {
                        this.openConfirmationModal('success', 'Success!', 'License successfully removed to Favorites');
                        this.license_data_for_grid_view.push(license)
                    } else {
                        this.openConfirmationModal('error', 'Error!', response.message);
                    }
                }
            )
    }

    openConfirmationModal(status, message, data): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});

		dialog.afterClosed().subscribe(() => {
            if(status === 'success') {
                this.getFavoriteLicenses(false);
            };
        });
	}

    protected get roleRoute() {
		return this._auth.roleRoute;
	}

    showMore(event) {
        this.show_more_clicked = true;
        this.getLicenses(event.page, event.pageSize, true)
    }
    
    getTotalShownLicenses() {
        if(this.active_view === 'grid') {
            if(this.favorite_view) {
                return this.favorites_list.length + this.paging_data_licenses.entities.length;
            } else {
                return this.paging_data_licenses.entities.length;
            }
        } else {
            return this.paging_data_licenses.entities.length;
        }
    }
    
    getTotalLicenses() {
        if(this.active_view === 'grid') {
            return this.paging_data_favorites.totalEntities + this.paging_data_licenses.totalEntities;
        } else {
            return this.paging_data_licenses.totalEntities;
        }
    }
    
}
