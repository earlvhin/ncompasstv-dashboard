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
    selector: 'app-license-modal',
    templateUrl: './target-license.component.html',
    styleUrls: ['./target-license.component.scss'],
    providers: [TitleCasePipe],
})
export class TargetLicenseModal implements OnInit, OnDestroy {
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
    hostCheckboxSelected: boolean = false;
    isFiltered = false;
    selectedDealerHostLicense = [];

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

    onClearSelection() {
        this.selectedDealersControl.value.length = 0;
        this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
        this.selectedDealers = [];
        this.unfilteredDealers = [];
        this.unfilteredLicenses = [];
        this.unfilteredHosts = [];
        this.mapMarkers = [];
    }

    // onExpandHost(hostId: string, dealerId: string) {
    //     if (hostId === this.expandedHostId) return;
    //     this.expandedHostId = hostId;
    // }

    // onFilterLicensesByStatus(status: string) {
    //     let licenseCount = 0;
    //     const dealersCopy = Array.from(this.unfilteredDealers);
    //     this.expandedHostId = null;
    //     this.expandedDealerId = null;

    //     this.selectedDealers = dealersCopy.map((dealer) => {
    //         dealer.totalLicenseCount = 0;
    //         const hostsCopy = Array.from(this.unfilteredHosts).filter((host) => host.dealerId === dealer.dealerId);
    //         dealer.hosts = hostsCopy
    //             .map((host) => {
    //                 const licensesCopy = Array.from(this.unfilteredLicenses);
    //                 host.licenses = licensesCopy.filter(
    //                     (license) => license.hostId === host.hostId && license.status === status,
    //                 );
    //                 return host;
    //             })
    //             .filter((host) => host.licenses.length > 0);

    //         dealer.hosts.forEach((host) => {
    //             dealer.totalLicenseCount += host.licenses.length;
    //             licenseCount += host.licenses.length;
    //         });

    //         return dealer;
    //     });

    //     this.mapMarkers = this.mapMarkersToUI();
    //     this.totalLicenses = licenseCount;
    //     this.filterLabelStatus = this._titleCase.transform(status);
    //     this.hasStatusFilter = true;
    // }

    onRemoveDealer(index: number) {
        this.selectedDealersControl.value.splice(index, 1);
        this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
        this.onSelectDealer();
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

    // private getLicenseByHost(id: string): void {
    //     this.isLoadingLicenseCount = true;

    //     this._license
    //         .getLicensesByHostId(id)
    //         .pipe(takeUntil(this._unsubscribe))
    //         .subscribe(
    //             (response: any) => {
    //                 let online = 0;
    //                 const statistics = {
    //                     basis: 0,
    //                     basis_label: 'Licenses',
    //                     good_value: 0,
    //                     good_value_label: 'Online',
    //                     bad_value: 0,
    //                     bad_value_label: 'Offline',
    //                 };

    //                 if (response.message) {
    //                     this.hostLicenses = [];
    //                     return;
    //                 }

    //                 this.hostLicenses = response;

    //                 if (this.filterStatus) this.hostLicenses.filter((x) => x.piStatus === this.filterStatus);

    //                 this.hostLicenses.forEach((license) => {
    //                     if (license.piStatus == 1) online += 1;
    //                 });

    //                 statistics.basis = this.hostLicenses.length;
    //                 statistics.good_value = online;
    //                 statistics.bad_value = this.hostLicenses.length - online;
    //             },
    //             (error) => {
    //                 console.error(error);
    //             },
    //         )
    //         .add(() => setTimeout(() => (this.isLoadingLicenseCount = false), 1000));
    // }

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
        console.log('SELECTED!', this.unfilteredDealers);

        console.log(this.selectedDealerHostLicense);

        // console.log("ALERT!!!!")
        // this.selectedHosts = [];
        // this.selectedLicenses = [];
        // this.expandedHostId = null;
        // this.expandedDealerId = null;

        this.selectedDealers = Array.from(this.unfilteredDealers).map((dealer) => {
            // set host licenses and filter hosts with no licenses
            dealer.hosts = Array.from(this.unfilteredHosts)
                .filter((host) => host.dealerId === dealer.dealerId)
                .map((host) => {
                    console.log(host);
                    host.licenses = Array.from(this.unfilteredLicenses).filter(
                        (license) => license.hostId === host.hostId,
                    );

                    this.selectedLicenses = this.selectedLicenses.concat(host.licenses);
                    return host;
                })
                .filter((host) => host.licenses.length > 0);

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

    public selectAllHostAndLicenses(e: { checked: boolean }, dealerId) {
        if (!e.checked) {
            this.selectedDealerHostLicense = [...this.selectedDealerHostLicense.filter((i) => !i.dealerId)];
            console.log(this.selectAllHostAndLicenses);
            return;
        }

        this.selectedDealerHostLicense = [
            ...this.selectedDealers.map((dealer: any) => {
                if (dealer && dealer.dealerId === dealerId) {
                    const mappedLicenses = dealer.licenses.map((l: any) => ({
                        hostId: l.hostId,
                        dealerId: l.dealerId,
                        licenseId: l.licenseId,
                    }));

                    return mappedLicenses;
                }
            }),
        ];
    }

    public isDealerSelected(dealerId: string) {
        return this.selectedDealerHostLicense.some((obj) => obj.dealerId === dealerId);
    }

    public isHostSelected(hostId: string) {
        console.log(
            '#isHostSelected',
            hostId,
            this.selectedDealerHostLicense.some((obj) => obj.hostId === hostId),
        );
        return this.selectedDealerHostLicense.some((obj) => obj.hostId === hostId);
    }

    public isLicenseSelected(licenseId: string) {
        console.log('#isLicenseSelected activated');
        return this.selectedDealerHostLicense.some((obj) => obj.licenseId === licenseId);
    }
}
