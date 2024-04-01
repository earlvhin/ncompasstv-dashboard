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
    providers: [TitleCasePipe],
})
export class DealerViewComponent implements OnInit, OnDestroy {
    @ViewChild('dealerMultiSelect', { static: false }) dealerMultiSelect: MatSelect;
    areSearchResultsHidden = false;
    currentRole = this._auth.current_role;
    dealers: API_DEALER[];
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
        private _titleCase: TitleCasePipe,
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

    exportData() {
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

            const locatorAddress =
                license.address + ', ' + license.city + ', ' + license.state + ' ' + license.postalCode;
            const businessName = this.selectedDealers.find(
                (dealer) => dealer.dealerId === license.dealerId,
            ).businessName;

            // used a new object instead of class UI_DEALER_LOCATOR_EXPORT because it will affect other pages if I modify said class
            const marker = {
                businessName,
                host: license.name,
                address: locatorAddress,
                generalCategory: license.generalCategory,
                category: license.category,
                storeHours: this.markStoreHours,
                latitude: license.latitude,
                longitutde: license.longitude,
            };

            this.exportedMapMarker.push(marker);
        });

        const header = Object.keys(this.exportedMapMarker[0]);
        let csv = this.exportedMapMarker.map((row) =>
            header.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(','),
        );
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
                    host.licenses = licensesCopy.filter(
                        (license) => license.hostId === host.hostId && license.status === status,
                    );
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
        let role = this.currentRole;
        if (role === 'dealeradmin') role = 'administrator';
        return [`/${role}/licenses/${licenseId}`];
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
                            host.generalCategory = entities.filter(
                                (pagingDealer) => pagingDealer.dealerId === dealer.dealerId,
                            )[0].generalCategory;
                            return host;
                        });

                        return dealer;
                    });

                    return response;
                }),
            )
            .subscribe(
                (response: { dealers: API_DEALER[]; paging: { entities: API_DEALER[] } }) => {
                    const { dealers } = response;
                    const merged = this.selectedDealersControl.value.concat(dealers);
                    const unique = merged.filter(
                        (dealer, index, merged) =>
                            merged.findIndex((mergedDealer) => mergedDealer.dealerId === dealer.dealerId) === index,
                    );
                    this.dealers = unique;
                    this.filteredDealers.next(unique);
                },
                (error) => {
                    console.error(error);
                },
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
            .getLicensesByHostId(id)
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
                        bad_value_label: 'Offline',
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
                    console.error(error);
                },
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
                host.dealerId,
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

                    host.licenses = Array.from(this.unfilteredLicenses).filter(
                        (license) => license.hostId === host.hostId,
                    );

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
                        host.licenses = host.licenses.filter(
                            (license) => license.status === this.filterLabelStatus.toLowerCase(),
                        );
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
                        (dealer, index, merged) =>
                            merged.findIndex((mergedDealer) => mergedDealer.dealerId === dealer.dealerId) === index,
                    );
                    this.dealers = unique;
                    this.filteredDealers.next(unique);
                },
                (error) => {
                    console.error(error);
                },
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
                }),
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
            Array.from(this.unfilteredDealers).forEach(
                (dealer) => (this.unfilteredHosts = this.unfilteredHosts.concat(dealer.hosts)),
            );
            Array.from(this.unfilteredDealers).forEach(
                (dealer) => (this.unfilteredLicenses = this.unfilteredLicenses.concat(dealer.licenses)),
            );
            this.onSelectDealer();
        });
    }
}
