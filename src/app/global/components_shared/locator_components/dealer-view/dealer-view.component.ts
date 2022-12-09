import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { MatSelect } from '@angular/material';
import { AgmInfoWindow } from '@agm/core';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import { API_DEALER, API_HOST, API_LICENSE_PROPS, UI_HOST_LOCATOR_MARKER_DEALER_MODE } from 'src/app/global/models';
import { AuthService, DealerService, LicenseService } from 'src/app/global/services';

@Component({
	selector: 'app-dealer-view',
	templateUrl: './dealer-view.component.html',
	styleUrls: ['./dealer-view.component.scss'],
	providers: [TitleCasePipe]
})
export class DealerViewComponent implements OnInit, OnDestroy {
	@ViewChild('dealerMultiSelect', { static: false }) dealerMultiSelect: MatSelect;
	areSearchResultsHidden = false;
	currentRole = this._auth.current_role;
	dealers: API_DEALER[];
	filteredDealers = new ReplaySubject<API_DEALER[]>(1);
	dealers_data: Array<any> = [];
	expansion_id: string;
	host_licenses: API_LICENSE_PROPS[] = [];
	is_search: boolean = false;
	lat: number = 39.7395247;
	license_card: any;
	lng: number = -105.1524133;
	loading_data: boolean = true;
	loading_hosts: boolean = true;
	loading_license_count: boolean = false;
	loading_search: boolean = false;
	location_selected: boolean = false;
	map_marker: UI_HOST_LOCATOR_MARKER_DEALER_MODE[];
	selected_dealer: any;
	unfiltered_selected_dealer: API_DEALER[];
	selected_dealer_hosts: any;
	unfiltered_dealer_hosts: any;
	unfiltered_licenses: Array<any> = [];
	storehours: any;
	paging: any;
	previous_marker: AgmInfoWindow;
	filterStatus: any;
	filterLabelStatus: any;
	selected_licenses: Array<any> = [];
	filtered_licenses: Array<any> = [];
	selected_hosts: Array<any> = [];
	isFiltered: any = false;
	online_licenses: number = 0;
	offline_licenses: number = 0;
	host_online_licenses: any;
	host_offline_licenses: any;
	exported_map_marker: any[];
	markStoreHours: any;
	form = this._form_builder.group({ selectedDealers: [[], Validators.required] });
	selectedDealersControl = this.form.get('selectedDealers');
	dealerFilterControl = new FormControl(null);
	dealerSelection = this._formBuilder.group({ selectedDealers: [[], Validators.required] });
	expandedDealerId: string;
	expandedHostId: string = null;
	filteredDealers = new ReplaySubject<API_DEALER[]>(1);
	filterLabelStatus: string;
	filterStatus: string;
	hasStatusFilter = false;
	hostLicenses: API_LICENSE_PROPS[] = [];
	isFiltered = false;

	isLoadingData = true;
	isLoadingHosts = true;
	isLoadingLicenseCount = false;
	isSearching = false;
	lat = 39.7395247;
	lng = -105.1524133;
	mapMarkers: UI_HOST_LOCATOR_MARKER_DEALER_MODE[];
	previousMarker: AgmInfoWindow;
	selectedLocation = false;
	selectedDealers: API_DEALER[];
	selectedDealersControl = this.dealerSelection.get('selectedDealers');
	selectedHosts: API_HOST[];
	selectedLicenses: API_LICENSE_PROPS[] = [];
	totalLicenses = 0;
	totalOfflineLicenses = 0;
	totalOnlineLicenses = 0;
	totalPendingLicenses = 0;

	private exportedMapMarker: any[];
	private markStoreHours: string;
	private unfilteredHosts: API_HOST[] = [];
	private unfilteredLicenses: API_LICENSE_PROPS[] = [];
	private unfilteredDealers: API_DEALER[] = [];
	protected _unsubscribe = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _license: LicenseService,
		private _formBuilder: FormBuilder,
		private _titleCase: TitleCasePipe
	) {}

	ngOnInit() {
		this.getDealers(1);
		this.totalOnlineLicenses = 0;
		this.totalOfflineLicenses = 0;
		this.totalPendingLicenses = 0;
		this.subscribeToDealerSearch();
		this.subscribeToDealerSelect();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onExpandHost(hostId: string): void {
		if (hostId === this.current_host_id_selected) return;
		this.host_licenses = [];
		this.expansion_id = hostId;
		this.clicked_marker_id = hostId;
		this.current_host_id_selected = hostId;
		this.getLicenseByHost(hostId);
	}

	onMarkerClick(hostId: string, dealerId: string, window: AgmInfoWindow): void {
		this.getLicenseByHost(hostId);
		this.clicked_dealer_id = dealerId;
		this.clicked_marker_id = hostId;
		this.expansion_id = hostId;
		if (this.previous_marker) this.previous_marker.close();
		this.previous_marker = window;
	}

	searchBoxTrigger(event: { is_search: boolean; page: number }): void {
		this.is_search = event.is_search;
		this.getDealers(event.page);
	}

	searchData(key: string): void {
		this.loading_search = true;

		this._dealer
			.get_search_dealer_with_host(key)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { dealers: API_DEALER[]; paging: { entities: any[] } }) => {
					const { dealers, paging } = response;
					const { entities } = paging;

					this.paging = paging;

					if (entities.length <= 0) {
						this.dealers_data = [];
						return;
					}

					this.dealers_data = dealers;
					const merged = this.selectedDealersControl.value.concat(dealers);
					
                    const unique = merged.filter(
						(dealer, index, merged) => merged.findIndex((mergedDealer) => mergedDealer.dealerId === dealer.dealerId) === index
					);
					this.dealers = unique;
					this.filteredDealers.next(unique);
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => (this.loading_search = false));
	}

	setLink(licenseId: string) {
		return [`/${this.currentRole}/licenses/${licenseId}`];
	}

	private get currentRole() {
		return this._auth.current_role;
	}

	private getDealers(page: number): void {
		if (page > 1) this.loading_data = true;
		else this.loading_search = true;

		this._dealer
			.get_dealers_with_host(page, '')
			.pipe(
				takeUntil(this._unsubscribe),
				// mapped the response because generalCategory is only found in paging.entities
				map((response: { dealers: API_DEALER[]; paging: { entities: API_DEALER[] } }) => {
					const { entities } = response.paging;

					response.dealers = response.dealers.map((dealer) => {
						dealer.hosts = dealer.hosts.map((host) => {
							host.generalCategory = entities.filter((pagingDealer) => pagingDealer.dealerId === dealer.dealerId)[0].generalCategory;
							return host;
						});

						return dealer;
					});

					return response;
				})
			)
			.subscribe(
				(response: { dealers: API_DEALER[]; paging: { entities: API_DEALER[] } }) => {
					const { dealers, paging } = response;
					this.paging = paging;
					const merged = this.selectedDealersControl.value.concat(dealers);
					const unique = merged.filter(
						(dealer, index, merged) => merged.findIndex((mergedDealer) => mergedDealer.dealerId === dealer.dealerId) === index
					);
					this.dealers = unique;
					this.filteredDealers.next(unique);
					this.dealers_data = dealers;
					this.loading_data = false;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => {
				this.loading_search = false;
				this.loading_hosts = false;
				this.loading_data = false;
			});
	}

	private getLicenseByHost(id: string): void {
		this.loading_license_count = true;

		this._license
			.get_licenses_by_host_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: any) => {
					let online = 0;
					const statistics = {
						basis: 0,
						basis_label: 'Licenses',
						good_value: 0,
						good_value_label: 'Online',
						bad_value: 0,
						bad_value_label: 'Offline'
					};

					if (response.message) {
						this.host_licenses = [];
						this.license_card = statistics;
						return;
					}

					// const licenses: API_LICENSE_PROPS[] = response;
					this.host_licenses = response;

					this.host_licenses = this.host_licenses.filter((license) => license.isActivated === 1);

					if (this.filterStatus !== null) {
						this.host_licenses.filter((x) => x.piStatus === this.filterStatus);
					}

					this.host_licenses.forEach((license) => {
						if (license.piStatus == 1) online += 1;
					});

					this.host_online_licenses = online;
					this.host_offline_licenses = this.host_licenses.length - online;
					statistics.basis = this.host_licenses.length;
					statistics.good_value = online;
					statistics.bad_value = this.host_licenses.length - online;
					this.license_card = statistics;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => setTimeout(() => (this.loading_license_count = false), 1000));
	}

	private mapMarkersToUI(hosts: any[], licenses: any[]): any[] {
		if (hosts) {
			return hosts.map((h: API_HOST) => {
				let icon_url;
				let online: any = 0;
				let license_online_percentage;

				const host_license = licenses.filter((license: API_LICENSE_PROPS) => license.hostId === h.hostId);

				if (host_license.length > 0) {
					online = host_license.filter((i: API_LICENSE_PROPS) => i.piStatus == 1);
					license_online_percentage = (online.length / host_license.length) * 100;
				}

				if (license_online_percentage == 100) {
					icon_url = 'assets/media-files/markers/online_all.png';
				} else if (license_online_percentage >= 51 && license_online_percentage < 100) {
					icon_url = 'assets/media-files/markers/online_many.png';
				} else if (license_online_percentage < 51 && license_online_percentage > 0) {
					icon_url = 'assets/media-files/markers/online_few.png';
				} else {
					icon_url = 'assets/media-files/markers/offline.png';
				}

				const mapped = new UI_HOST_LOCATOR_MARKER_DEALER_MODE(
					h.hostId,
					h.name,
					h.latitude,
					h.longitude,
					license_online_percentage,
					icon_url,
					h.address,
					h.category,
					h.parsedStoreHours,
					h.state,
					h.postalCode,
					h.city,
					h.dealerId
				);

				mapped.generalCategory = h.generalCategory;
				return mapped;
			});
		}
	}

	public filterDealerHosts(value) {
		this.online_licenses = 0;
		this.offline_licenses = 0;
		this.isFiltered = true;
		this.filterStatus = value;
		this.filterLabelStatus = value == 1 ? 'Online' : 'Offline';
		this.selected_dealer_hosts = this.unfiltered_dealer_hosts;
		this.selected_licenses = this.unfiltered_licenses;
		this.selected_dealer.forEach((dealer) => {
			dealer.hosts = this.selected_dealer_hosts.filter((x) => x.dealerId === dealer.dealerId);
			dealer.licenses = this.selected_licenses.filter((x) => x.dealerId === dealer.dealerId);
			dealer.onlineLicenseCount = dealer.licenses.filter((x) => x.piStatus === 1).length;
			dealer.offlineLicenseCount = dealer.licenses.length - dealer.onlineLicenseCount;
		});
		this.selected_dealer_hosts.forEach((x) => {
			this.getLicenseByHost(x.hostId);
		});
		this.filtered_licenses = this.selected_licenses.filter((x) => x.piStatus === value);
		this.selected_licenses = this.filtered_licenses;
		if (value == 1) {
			this.online_licenses = this.filtered_licenses.length;
		} else {
			this.offline_licenses = this.filtered_licenses.length;
		}

		this.selected_hosts = this.filtered_licenses.map((t) => t.hostId);
		this.selected_dealer_hosts = this.selected_dealer_hosts.filter((x) => this.selected_hosts.includes(x.hostId));
		this.selected_dealer.forEach((dealer) => {
			dealer.hosts = dealer.hosts.filter((x) => this.selected_hosts.includes(x.hostId));
			dealer.licenses = dealer.licenses.filter((x) => x.piStatus === value);
			dealer.onlineLicenseCount = value == 1 ? dealer.licenses.length : 0;
			dealer.offlineLicenseCount = value == 0 ? dealer.licenses.length : 0;
		});

		this.selected_dealer_hosts.forEach((x) => {
			this.getLicenseByHost(x.hostId);
		});
		this.map_marker = this.mapMarkersToUI(this.selected_dealer_hosts, this.filtered_licenses);
	}

	public clearFilter() {
		this.isFiltered = false;
		this.filterStatus = '';
		this.filterLabelStatus = '';
		this.selected_dealer_hosts = this.unfiltered_dealer_hosts;
		this.selected_licenses = this.unfiltered_licenses;
		this.selected_dealer.forEach((dealer) => {
			dealer.hosts = this.selected_dealer_hosts.filter((x) => x.dealerId === dealer.dealerId);
			dealer.licenses = this.selected_licenses.filter((x) => x.dealerId === dealer.dealerId);
			dealer.onlineLicenseCount = dealer.licenses.filter((x) => x.piStatus === 1).length;
			dealer.offlineLicenseCount = dealer.licenses.length - dealer.onlineLicenseCount;
		});

		this.selected_dealer_hosts.forEach((x) => {
			this.getLicenseByHost(x.hostId);
		});
		this.map_marker = this.mapMarkersToUI(this.selected_dealer_hosts, this.selected_licenses);
		this.online_licenses = 0;
		this.offline_licenses = 0;
		this.selected_licenses.forEach((license) => {
			if (license.piStatus === 1) this.online_licenses += 1;
			else {
				if (!license.hostId) return;
				this.offline_licenses += 1;
			}
		});
	}

	exportToCSV() {
		const replacer = (key, value) => (value === null ? '' : value);
		this.exportedMapMarker = [];
		let isStatus = true;

		this.mapMarkers.forEach((license) => {
			const data = [...license.storeHours];
			this.markStoreHours = '';
			data.forEach((obj) => {
				Object.entries(obj).forEach(([key, value]) => {
					if (key === 'day') {
						this.markStoreHours += value;
					}

					if (key === 'status') {
						if (value) {
							isStatus = true;
						} else {
							isStatus = false;
						}
					}

					if (key === 'periods') {
						const periods = [...value];
						periods.forEach((x) => {
							Object.entries(x).forEach(([key, value]) => {
								if (key === 'open') {
									if (value !== '') {
										this.markStoreHours += ' (' + value + ' - ';
									} else {
										if (isStatus) {
											this.markStoreHours += ' ( Open 24 hours ) ';
										} else {
											this.markStoreHours += ' ( Closed ) ';
										}
									}
								}
								if (key === 'close') {
									if (value !== '') {
										this.markStoreHours += value + ') | ';
									} else {
										this.markStoreHours += value + ' | ';
									}
								}
							});
						});
					}
				});
			});

			const locatorAddress = license.address + ', ' + license.city + ', ' + license.state + ' ' + license.postalCode;
			const businessName = this.selectedDealers.find((dealer) => dealer.dealerId === license.dealerId).businessName;

			// used a new object instead of class UI_DEALER_LOCATOR_EXPORT because it will affect other pages if I modify said class
			const marker = {
				businessName,
				host: license.name,
				address: locatorAddress,
				generalCategory: license.generalCategory,
				category: license.category,
				storeHours: this.markStoreHours,
				latitude: license.latitude,
				longitutde: license.longitude
			};

			this.exportedMapMarker.push(marker);
		});

		const header = Object.keys(this.exportedMapMarker[0]);
		let csv = this.exportedMapMarker.map((row) => header.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(','));
		csv.unshift(header.join(','));
		let csvArray = csv.join('\r\n');

		const blob = new Blob([csvArray], { type: 'text/csv' });
		let dealers = '';
		this.selectedDealers.forEach((dealer) => (dealers += dealer.businessName + '_'));
		let fileName = dealers + 'MapLocator.csv';
		saveAs(blob, fileName);
	}

	hideSearchResults() {
		this.areSearchResultsHidden = !this.areSearchResultsHidden;
	}

	onClearFilter() {
		const dealersCopy = Array.from(this.unfilteredDealers);
		this.expandedHostId = null;
		this.expandedDealerId = null;

		this.selectedDealers = dealersCopy.map((dealer) => {
			dealer.totalLicenseCount = 0;
			const hostsCopy = Array.from(this.unfilteredHosts).filter((host) => host.dealerId === dealer.dealerId);
			dealer.hosts = hostsCopy.map((host) => {
				host.licenses = Array.from(this.unfilteredLicenses).filter((license) => license.hostId === host.hostId);
				return host;
			});
			dealer.hosts.forEach((host) => {
				dealer.totalLicenseCount += host.licenses.length;
			});

			return dealer;
		});

		this.mapMarkers = this.mapMarkersToUI(false);
		this.hasStatusFilter = false;
	}

	onClearSelection() {
		this.selectedDealersControl.value.length = 0;
		this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
		this.selectedDealers = [];
		this.unfilteredDealers = [];
		this.unfilteredLicenses = [];
		this.unfilteredHosts = [];
		this.mapMarkers = [];
	}

	onExpandHost(hostId: string, dealerId: string) {
		if (hostId === this.expandedHostId) return;
		this.expandedHostId = hostId;
	}

	onFilterLicensesByStatus(status: string) {
		let licenseCount = 0;
		const dealersCopy = Array.from(this.unfilteredDealers);
		this.expandedHostId = null;
		this.expandedDealerId = null;

		this.selectedDealers = dealersCopy.map((dealer) => {
			dealer.totalLicenseCount = 0;
			const hostsCopy = Array.from(this.unfilteredHosts).filter((host) => host.dealerId === dealer.dealerId);
			dealer.hosts = hostsCopy
				.map((host) => {
					const licensesCopy = Array.from(this.unfilteredLicenses);
					host.licenses = licensesCopy.filter((license) => license.hostId === host.hostId && license.status === status);
					return host;
				})
				.filter((host) => host.licenses.length > 0);

			dealer.hosts.forEach((host) => {
				dealer.totalLicenseCount += host.licenses.length;
				licenseCount += host.licenses.length;
			});

			return dealer;
		});

		this.mapMarkers = this.mapMarkersToUI();
		this.totalLicenses = licenseCount;
		this.filterLabelStatus = this._titleCase.transform(status);
		this.hasStatusFilter = true;
	}

	onRemoveDealer(index: number) {
		this.selectedDealersControl.value.splice(index, 1);
		this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
		this.onSelectDealer();
	}
	
	onSelectPinnedLocation(hostId: string, dealerId: string, window: AgmInfoWindow): void {
		this.getLicenseByHost(hostId);
		this.expandedDealerId = dealerId;
		this.expandedHostId = hostId;
		if (this.previousMarker) this.previousMarker.close();
		this.previousMarker = window;
	}

	removeNoLicensesHost(hostsList) {
		hostsList = hostsList.filter((host) => host.licenses.length > 0);
		return hostsList;
	}

	setLink(licenseId: string) {
		return [`/${this.currentRole}/licenses/${licenseId}`];
	}

	private getDealers(page: number): void {
		if (page > 1) this.isLoadingData = true;
		else this.isSearching = true;

		this._dealer
			.get_dealers_with_host(page, '', true)
			.pipe(
				takeUntil(this._unsubscribe),
				// mapped the response because generalCategory is only found in paging.entities
				map((response: { dealers: API_DEALER[]; paging: { entities: API_DEALER[] } }) => {
					const { entities } = response.paging;

					response.dealers = response.dealers.map((dealer) => {
						dealer.hosts = dealer.hosts.map((host) => {
							host.generalCategory = entities.filter((pagingDealer) => pagingDealer.dealerId === dealer.dealerId)[0].generalCategory;
							return host;
						});

						return dealer;
					});

					return response;
				})
			)
			.subscribe(
				(response: { dealers: API_DEALER[]; paging: { entities: API_DEALER[] } }) => {
					const { dealers } = response;
					const merged = this.selectedDealersControl.value.concat(dealers);
					const unique = merged.filter(
						(dealer, index, merged) => merged.findIndex((mergedDealer) => mergedDealer.dealerId === dealer.dealerId) === index
					);
					this.dealers = unique;
					this.filteredDealers.next(unique);
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => {
				this.isSearching = false;
				this.isLoadingHosts = false;
				this.isLoadingData = false;
			});
	}

	private getLicenseByHost(id: string): void {
		this.isLoadingLicenseCount = true;

		this._license
			.get_licenses_by_host_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: any) => {
					let online = 0;
					const statistics = {
						basis: 0,
						basis_label: 'Licenses',
						good_value: 0,
						good_value_label: 'Online',
						bad_value: 0,
						bad_value_label: 'Offline'
					};

					if (response.message) {
						this.hostLicenses = [];
						return;
					}

					this.hostLicenses = response;

					if (this.filterStatus) this.hostLicenses.filter((x) => x.piStatus === this.filterStatus);

					this.hostLicenses.forEach((license) => {
						if (license.piStatus == 1) online += 1;
					});

					statistics.basis = this.hostLicenses.length;
					statistics.good_value = online;
					statistics.bad_value = this.hostLicenses.length - online;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => setTimeout(() => (this.isLoadingLicenseCount = false), 1000));
	}

	private mapMarkersToUI(useCurrentHosts = true): UI_HOST_LOCATOR_MARKER_DEALER_MODE[] {
		let hosts: API_HOST[] = [];
		Array.from(this.selectedDealers).forEach((dealer) => (hosts = hosts.concat(dealer.hosts)));

		if (!useCurrentHosts) hosts = Array.from(this.unfilteredHosts);

		return hosts.map((host) => {
			let onlinePercentage: number;

			const mapped = new UI_HOST_LOCATOR_MARKER_DEALER_MODE(
				host.hostId,
				host.name,
				host.latitude,
				host.longitude,
				onlinePercentage,
				host.iconUrl,
				host.address,
				host.category,
				host.parsedStoreHours,
				host.state,
				host.postalCode,
				host.city,
				host.dealerId
			);

			mapped.generalCategory = host.generalCategory;
			return mapped;
		});
	}

	private onSelectDealer() {
		this.totalOnlineLicenses = 0;
		this.totalOfflineLicenses = 0;
		this.totalPendingLicenses = 0;
		this.selectedHosts = [];
		this.selectedLicenses = [];
		this.expandedHostId = null;
		this.expandedDealerId = null;

		this.selectedDealers = Array.from(this.unfilteredDealers).map((dealer) => {
			dealer.totalLicenseCount = 0;
			dealer.onlineLicenseCount = 0;
			dealer.pendingLicenseCount = 0;
			dealer.offlineLicenseCount = 0;

			// set host licenses and filter hosts with no licenses
			dealer.hosts = Array.from(this.unfilteredHosts)
				.filter((host) => host.dealerId === dealer.dealerId)
				.map((host) => {
					host.latitude = host.latitude ? parseFloat(host.latitude).toFixed(5) : '-';
					host.longitude = host.longitude ? parseFloat(host.longitude).toFixed(5) : '-';
					host.parsedStoreHours = host.storeHours ? JSON.parse(host.storeHours) : '-';

					host.licenses = Array.from(this.unfilteredLicenses).filter((license) => license.hostId === host.hostId);

					host.licenses = host.licenses.map((license) => {
						license.status = this.setLicenseStatus(license.installDate, license.piStatus);

						switch (license.status) {
							case 'online':
								this.totalOnlineLicenses++;
								dealer.onlineLicenseCount++;
								break;

							case 'pending':
								this.totalPendingLicenses++;
								dealer.pendingLicenseCount++;
								break;

							default: // offline
								this.totalOfflineLicenses++;
								dealer.offlineLicenseCount++;
						}

						return license;
					});

					if (this.hasStatusFilter) {
						host.licenses = host.licenses.filter((license) => license.status === this.filterLabelStatus.toLowerCase());
						dealer.totalLicenseCount += host.licenses.length;
					}

					host.iconUrl = this.setHostIconUrl(host.licenses);

					this.selectedLicenses = this.selectedLicenses.concat(host.licenses);
					return host;
				})
				.filter((host) => host.licenses.length > 0);

			if (this.hasStatusFilter) dealer.hosts = dealer.hosts.filter((host) => host.licenses.length > 0);

			this.selectedHosts = this.selectedHosts.concat(dealer.hosts);

			return dealer;
		});

		this.mapMarkers = this.mapMarkersToUI();
		this.selectedLocation = true;

		// if (this.isFiltered) this.filterLicensesByStatus(this.filterStatus);
	}

	private searchDealers(key: string): void {
		this.isSearching = true;

		this._dealer
			.get_search_dealer_with_host(key)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { dealers: API_DEALER[]; paging: { entities: any[] } }) => {
					const { dealers, paging } = response;
					const { entities } = paging;

					if (entities.length <= 0) {
						this.dealers = [];
						return;
					}

					const merged = this.selectedDealersControl.value.concat(dealers);
					const unique = merged.filter(
						(dealer, index, merged) => merged.findIndex((mergedDealer) => mergedDealer.dealerId === dealer.dealerId) === index
					);
					this.dealers = unique;
					this.filteredDealers.next(unique);
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => (this.isSearching = false));
	}

	private setLicenseStatus(installationDate: string, piStatus: number) {
		const isFutureInstallation = moment(installationDate).isAfter(new Date());

		if (isFutureInstallation) return 'pending';

		if (piStatus === 1) return 'online';

		return 'offline';
	}

	private setHostIconUrl(licenses: API_LICENSE_PROPS[]) {
		const ASSETS_DIRECTORY = 'assets/media-files/markers';

		const onlineCount = licenses.filter((license) => license.status === 'online').length;
		const offlineCount = licenses.filter((license) => license.status === 'offline').length;
		const pendingCount = licenses.filter((license) => license.status === 'pending').length;

		if (licenses.length === onlineCount) return `${ASSETS_DIRECTORY}/online_all.png`;
		if (licenses.length === offlineCount) return `${ASSETS_DIRECTORY}/offline.png`;
		if (licenses.length === pendingCount) return `${ASSETS_DIRECTORY}/pending.png`;

		const onlinePercentage = (onlineCount / licenses.length) * 100;
		if (onlinePercentage <= 50) return `${ASSETS_DIRECTORY}/online_few.png`;
		else return `${ASSETS_DIRECTORY}/online_many.png`;
	}

	private subscribeToDealerSearch(): void {
		const control = this.dealerFilterControl;

		control.valueChanges
			.pipe(
				takeUntil(this._unsubscribe),
				debounceTime(1000),
				map((keyword) => {
					if (control.invalid) return;

					if (keyword && keyword.trim().length > 0) this.searchDealers(keyword);
					else this.getDealers(1);
				})
			)
			.subscribe(() => (this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId));
	}

	private subscribeToDealerSelect() {
		this.dealerSelection.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
			if (this.dealerSelection.invalid) return;
			this.unfilteredDealers = [];
			this.unfilteredHosts = [];
			this.unfilteredLicenses = [];
			this.unfilteredDealers = Array.from(this.selectedDealersControl.value as API_DEALER[]);
			Array.from(this.unfilteredDealers).forEach((dealer) => (this.unfilteredHosts = this.unfilteredHosts.concat(dealer.hosts)));
			Array.from(this.unfilteredDealers).forEach((dealer) => (this.unfilteredLicenses = this.unfilteredLicenses.concat(dealer.licenses)));
			this.onSelectDealer();
		});

		this.onSelectDealer(selectedDealers);
	}

    toggleOverMap() {
        this.status = !this.status; 
    }

	onSelectDealer(selectedDealers): void {
		this.online_licenses = 0;
		this.offline_licenses = 0;
		this.selected_dealer_hosts = [];
		this.selected_licenses = [];
		this.selected_dealer = this.dealers.filter((dealer) => selectedDealers.includes(dealer.dealerId));
		this.unfiltered_selected_dealer = this.dealers.filter((dealer) => selectedDealers.includes(dealer.dealerId));

		this.selected_dealer.forEach((dealer) => {
			dealer.onlineLicenseCount = 0;
			dealer.offlineLicenseCount = 0;

			dealer.hosts.map((host) => {
				this.selected_dealer_hosts.push(host);
			});

			dealer.licenses.map((license) => {
				if (!license.hostId) return;
				if (license.isActivated === 1) {
					this.selected_licenses.push(license);
				}
			});

			this.selected_licenses.forEach((license) => {
				if (!license.hostId) return;

				if (license.piStatus === 1) {
					this.online_licenses += 1;
					dealer.onlineLicenseCount += 1;
					return;
				}

				this.offline_licenses += 1;
				dealer.offlineLicenseCount += 1;
			});
		});


		this.selected_dealer_hosts.forEach((x) => {
			x.storeHours ? (x.parsedStoreHours = JSON.parse(x.storeHours)) : (x.parsedStoreHours = '-');
			x.latitude ? (x.latitude = parseFloat(x.latitude).toFixed(5)) : '-';
			x.longitude ? (x.longitude = parseFloat(x.longitude).toFixed(5)) : '-';
			x.licenses = [];
			this.selected_licenses.forEach((license: API_LICENSE_PROPS) => {
				if (license.hostId === x.hostId) {
					if (license.isActivated === 1) {
						x.licenses.push(license);
					}
				}
			});
		});

        //FILTER NO LICENSE HOSTS
        this.selected_dealer.forEach((dealer) => {
           dealer.hosts = this.removeNoLicensesHost(dealer.hosts);
        })

		this.unfiltered_dealer_hosts = this.selected_dealer_hosts;
		this.unfiltered_licenses = this.selected_licenses;
        this.selected_dealer_hosts = this.removeNoLicensesHost(this.selected_dealer_hosts);
		this.map_marker = this.mapMarkersToUI(this.selected_dealer_hosts, this.selected_licenses);
		this.selected_dealer_hosts.forEach((x) => {
			x.icon_url = this.map_marker.filter((y) => y.hostId === x.hostId)[0].icon_url;
		});
		this.location_selected = true;
		if (this.isFiltered) {
			this.filterDealerHosts(this.filterStatus);
		}
	}

    removeNoLicensesHost(hostsList) {
        hostsList = hostsList.filter((host) => host.licenses.length > 0)
        return hostsList
    }
}
