import { Component, OnInit, Input, EventEmitter, Output, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AgmInfoWindow } from '@agm/core';
import { MatSelect } from '@angular/material';
import { debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { forkJoin, ReplaySubject, Subject } from 'rxjs';
import * as moment from 'moment';

import { API_DMA, API_DMA_HOST, PAGING, UI_STORE_HOUR } from 'src/app/global/models';
import { ExportService, HostService, LicenseService, AuthService } from 'src/app/global/services';
import { hostReportError } from 'rxjs/internal-compatibility';
import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';
import { Console } from 'console';

@Component({
	selector: 'app-locator-component',
	templateUrl: './locator-component.component.html',
	styleUrls: ['./locator-component.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class LocatorComponentComponent implements OnInit {
	@ViewChild('multi_select', { static: false }) searchSelectDropdown: MatSelect;
	@Input() search_placeholder;
	@Input() select_placeholder;
	@Input() result_placeholder;
	@Input() data_reference;
	@Input() original_reference;
	@Input() is_host;
	@Input() is_category;
	@Input() is_state;
	@Input() status: boolean = false;

	currentList: any = [];
	compressed_data_array: any = [];
	filtered_data_array: any = [];
	host_count = 0;
	host_licenses_count = 0;
	merge_filtered_data_array: any = [];
	new_data_reference: any = [];
	currentListLicenses: any = [];
	currentRole: string;
	mergeList: any = [];
	currentHostIdSelected: string;
	currentPage = 1;
	dataHostLocations: any = [];
	dmaOrderList: { dmaRank: number; dmaCode: string }[] = [];
	filteredData = new ReplaySubject<any[]>(1);
	hasSelectedData = false;
	isDeselect = false;
	isFormReady = false;
	isSearching = false;
	is_searching = false;
	latitude = 39.7395247;
	licenses_count = 0;
	longitude = -105.1524133;
	online = 0;
	offline = 0;
	total_host = 0;
	// searchKeyword = '';
	searchSelectForm: FormGroup;

	protected _unsubscribe = new Subject<void>();

	constructor(
		private _export: ExportService,
		private _formBuilder: FormBuilder,
		private _host: HostService,
		private _license: LicenseService,
		private _auth: AuthService,
		private _router: Router
	) {}

	ngOnInit() {
		this.currentRole = Object.keys(UI_ROLE_DEFINITION).find((key) => UI_ROLE_DEFINITION[key] === this.currentUser.role_id);
		this.initializeForm();
		this.filteredData.next([...this.data_reference]);
		this.new_data_reference = [...this.data_reference];
	}

	ngOnChanges() {}

	protected get currentUserIsDealer() {
		return this.currentUser.role_id === UI_ROLE_DEFINITION.dealer;
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onClickExpandHostSearchResult(): void {}

	onClickHostName(hostId: string): void {
		this.currentHostIdSelected = hostId;
	}

	onClickMarkedHostLocation(hostId: string, window: AgmInfoWindow): void {}

	onCloseSearchSelectMenu(): void {
		this.updateSelectionLocations();
	}

	onDeselectResult(index: number, data): void {
		this._listControl.value.splice(index, 1);
		this.searchSelectDropdown.compareWith = (a, b) => a && b && a === b;
		if (this.is_state || this.is_category) {
			if (this.is_category) {
				const index2 = this.merge_filtered_data_array.findIndex((object) => {
					return object[0].category === data.category;
				});
				this.merge_filtered_data_array.splice(index2, 1);
			}
		}
		this.is_searching = false;
		this.isDeselect = true;
		this.updateSelectionLocations();
	}

	onClearResult() {
		this.is_searching = false;
		this._listControl.value.length = 0;
		this.searchSelectDropdown.compareWith = (a, b) => a && b && a === b;
		this.updateSelectionLocations();
		this.hasSelectedData = false;
	}

	// private getAllDMAByRank(pageSize = 15) {
	// 	return this._host.get_all_dma(this.currentPage, this.searchKeyword, pageSize).pipe(takeUntil(this._unsubscribe));
	// }

	// private getHostsByDMA(rank: number, code: string, name: string) {
	// 	return this._host.get_dma_hosts_by_rank(rank, code, name).pipe(takeUntil(this._unsubscribe));
	// }

	private getHostLicenses(id) {
		return this._license.get_licenses_by_host_id(id).pipe(takeUntil(this._unsubscribe));
	}

	private initializeForm(): void {
		this.searchSelectForm = this._formBuilder.group({
			list: [[], Validators.required],
			searchKeyword: null
		});

		this.initializeSubscriptions();
		this.isFormReady = true;
	}

	private onSearchDMA(): void {
		const control = this.searchSelectForm.get('searchKeyword');

		control.valueChanges
			.pipe(
				takeUntil(this._unsubscribe),
				debounceTime(1000),
				map((keyword) => {
					if (this.is_state ? keyword.length > 1 : keyword.length > 2) {
						this.isSearching = true;
						if (this.is_host) {
							this.data_reference = this.data_reference.filter((data) => {
								if (!this.currentUserIsDealer) {
									return data.hostName.toLowerCase().indexOf(keyword.toLowerCase()) > -1;
								} else {
									return data.name.toLowerCase().indexOf(keyword.toLowerCase()) > -1;
								}
							});
						} else if (this.is_category) {
							this.data_reference = this.data_reference.filter((data) => {
								return data.category.toLowerCase().indexOf(keyword.toLowerCase()) > -1;
							});
						} else if (this.is_state) {
							this.data_reference = this.data_reference.filter((data) => {
								return data.state.toLowerCase().indexOf(keyword.toLowerCase()) > -1;
							});
						}
					} else {
						this.isSearching = true;
						this.data_reference = this.new_data_reference;
					}
					if (control.invalid) return;
					this.isSearching = false;
				})
			)
			.subscribe(() => {
				this.searchSelectDropdown.compareWith = (a, b) => a && b && a === b;
			});
	}

	private onSelectDMA(): void {
		const control = this.searchSelectForm.get('list');
		control.valueChanges.pipe(tap(), takeUntil(this._unsubscribe)).subscribe(() => {
			this.isDeselect = false;
			this.updateSelectionLocations();
		});
	}

	getLink(page: string, id: string) {
		const url = this._router.serializeUrl(this._router.createUrlTree([`/${this.currentRole}/${page}/${id}`], {}));
		window.open(url, '_blank');
	}

	private updateSelectionLocations() {
		let requests: any[] = [];
		this.is_searching = true;
		const currentList = this._listControl.value;
		this.currentList = currentList;

		if (currentList.length <= 0) {
			this.dataHostLocations = [];
			this.filtered_data_array = [];
			this.merge_filtered_data_array = [];
			this.hasSelectedData = false;
			return;
		}
		if (this.is_host) {
			currentList.forEach((host) => {
				host.storeHoursParsed = JSON.parse(host.storeHours);
				host.mappedStoreHours = this.mapStoreHours(host.storeHoursParsed);
				requests.push(this.getHostLicenses(host.hostId));
			});
		} else if (this.is_category) {
			currentList.forEach((category) => {
				this.filtered_data_array = this.original_reference.filter((host) => {
					return host.category.toLowerCase().indexOf(category.category.toLowerCase()) > -1;
				});
			});
			if (!this.isDeselect) {
				if (this.filtered_data_array.length > 0) {
					this.filtered_data_array.map((host) => {
						host.storeHoursParsed = JSON.parse(host.storeHours);
						host.mappedStoreHours = this.mapStoreHours(host.storeHoursParsed);
						requests.push(this.getHostLicenses(host.hostId));
					});
				}
			} else {
				this.compressed_data_array = [];
				var to_compress = this.merge_filtered_data_array.map((host) => {
					host.map((inner) => {
						this.compressed_data_array.push(inner);
					});
				});
				this.dataHostLocations = [...this.compressed_data_array];
			}
		} else if (this.is_state) {
			currentList.forEach((state) => {
				this.filtered_data_array = this.original_reference.filter((host) => {
					return host.state.toLowerCase().indexOf(state.state.toLowerCase()) > -1;
				});
			});
			this.filtered_data_array.map((host) => {
				host.storeHoursParsed = JSON.parse(host.storeHours);
				host.mappedStoreHours = this.mapStoreHours(host.storeHoursParsed);
				requests.push(this.getHostLicenses(host.hostId));
			});
		}

		forkJoin(requests)
			.pipe(
				takeUntil(this._unsubscribe),
				map((response) => {
					this.currentListLicenses = response;
					if (this.is_host) {
						this.mergeList = this.currentList.map((item, i) => ({ ...item, licenses: this.currentListLicenses[i] }));
						this.dataHostLocations = [...this.mergeList];
					} else if (this.is_category || this.is_state) {
						this.mergeList = this.filtered_data_array.map((item, i) => ({ ...item, licenses: this.currentListLicenses[i] }));
						this.merge_filtered_data_array.push([...this.mergeList]);
					}
					this.mapMergeList();
				})
			)
			.subscribe(
				() => {
					this.hasSelectedData = true;
					this.online = 0;
					this.offline = 0;
					this.licenses_count = 0;
					this.is_searching = false;
					if (this.is_host) {
						this.mergeList.filter((data) => {
							this.licenses_count = data.licenses.length + this.licenses_count;
							data.licenses.filter((license) => {
								if (license.piStatus === 0) {
									this.offline = this.offline + 1;
								} else {
									this.online = this.online + 1;
								}
							});
						});
					} else {
						this.host_count = 0;
						this.licenses_count = 0;
						this.compressed_data_array = [];
						this.merge_filtered_data_array.filter((data) => {
							this.host_count = this.host_count + data.length;
							data.host_licenses_count = 0;
							// this.host_licenses_count = 0;
							data.map((inner_data) => {
								if (inner_data.licenses) {
									this.licenses_count = inner_data.licenses.length + this.licenses_count;
									data.host_licenses_count = data.host_licenses_count + inner_data.licenses.length;
									inner_data.licenses.filter((license) => {
										if (license.piStatus === 0) {
											this.offline = this.offline + 1;
										} else {
											this.online = this.online + 1;
										}
									});
								}
							});
						});

						var to_compress = this.merge_filtered_data_array.map((host) => {
							host.map((inner) => {
								this.compressed_data_array.push(inner);
							});
						});
						this.dataHostLocations = [...this.compressed_data_array];
					}
				},
				(error) => {
					// throw new Error(error);
				}
			)
			.add();
	}

	private mapStoreHours(storeHours: UI_STORE_HOUR[]) {
		let days = [];

		storeHours = storeHours.sort((a, b) => {
			return a.id - b.id;
		});

		storeHours.map((hour) => {
			if (!hour.status) {
				days.push(`${hour.day} : Closed`);
				return;
			}

			hour.periods.map((period) => {
				if (period.open === '' && period.close === '') days.push(`${hour.day} : Open 24 hrs`);
				else days.push(`${hour.day} : ${period.open} - ${period.close}`);
			});
		});

		return days.toString().split(',').join('\n');
	}

	mapMergeList() {
		this.mergeList.map((data) => {
			let icon_url;
			let online: any = 0;
			let license_online_percentage;

			online = data.licenses.filter((i) => i.piStatus == 1);
			license_online_percentage = (online.length / data.licenses.length) * 100;

			if (license_online_percentage == 100) {
				data.icon_url = 'assets/media-files/markers/online_all.png';
			} else if (license_online_percentage >= 51 && license_online_percentage < 100) {
				data.icon_url = 'assets/media-files/markers/online_many.png';
			} else if (license_online_percentage < 51 && license_online_percentage > 0) {
				data.icon_url = 'assets/media-files/markers/online_few.png';
			} else {
				data.icon_url = 'assets/media-files/markers/offline.png';
			}
		});
	}

	protected get _listControl() {
		return this.searchSelectForm.get('list');
	}

	protected initializeSubscriptions(): void {
		this.onSearchDMA();
		this.onSelectDMA();
	}
}
