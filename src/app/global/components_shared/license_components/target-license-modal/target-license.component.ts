import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MatSelect } from '@angular/material';
import { AgmInfoWindow } from '@agm/core';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import { API_DEALER, API_HOST, API_LICENSE_PROPS, UI_HOST_LOCATOR_MARKER_DEALER_MODE } from 'src/app/global/models';
import { AuthService, DealerService, LicenseService, UpdateService } from 'src/app/global/services';

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
    // filterLabelStatus: string;
    // filterStatus: string;
    // hasStatusFilter = false;
    hostLicenses: API_LICENSE_PROPS[] = [];
    hostCheckboxSelected: boolean = false;
    isFiltered = false;
    selectedDealerHostLicense = [];
    unselectedDealerHostLicense = [];

    isLoadingData = true;
    isLoadingHosts = true;
    isLoadingLicenseCount = false;
    isSearching = false;
    isChecked: boolean = false;
    selectedDealers: API_DEALER[];
    selectedDealersControl = this.dealerSelection.get('selectedDealers');
    selectedHosts: API_HOST[];
    selectedLicenses: API_LICENSE_PROPS[] = [];

    private unfilteredHosts: API_HOST[] = [];
    private unfilteredLicenses: API_LICENSE_PROPS[] = [];
    private unfilteredDealers: API_DEALER[] = [];
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dealer: DealerService,
        private _license: LicenseService,
        private _formBuilder: FormBuilder,
        private _dialog_ref: MatDialogRef<TargetLicenseModal>,
    ) {}

    ngOnInit() {
        this.getDealers(1);
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
        this.selectedDealerHostLicense = [];
    }

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

    private onSelectDealer() {
        this.selectedDealers = Array.from(this.unfilteredDealers).map((dealer) => {
            // set host licenses and filter hosts with no licenses
            dealer.hosts = Array.from(this.unfilteredHosts)
                .filter((host) => host.dealerId === dealer.dealerId)
                .map((host) => {
                    host.licenses = Array.from(this.unfilteredLicenses).filter(
                        (license) => license.hostId === host.hostId,
                    );

                    this.selectedLicenses = this.selectedLicenses.concat(host.licenses);
                    return host;
                })
                .filter((host) => host.licenses.length > 0);

            return dealer;
        });
        this.selectedDealerHostLicense = this.mapSelectedDealerHostLicense(this.selectedDealers).filter(
            (i: any) => i.isUpdateEnabled,
        );
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
    x;
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

    private updateToggleSettings(data: { licenseIds: string[]; enableUpdates: boolean }) {
        this._license
            .update_toggle_settings(data)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe({
                next: (res) => {
                    this._dialog_ref.close();
                },
                error: (err) => {
                    console.error(err);
                },
            });
    }

    public onSubmit() {
        if (this.unselectedDealerHostLicense.length) {
            const ids = this.unselectedDealerHostLicense.map((i) => i.licenseId);
            const data = {
                licenseIds: ids,
                enableUpdates: false,
            };

            this.updateToggleSettings(data);
        }

        if (this.selectedDealerHostLicense.length) {
            const ids = this.selectedDealerHostLicense.map((i) => i.licenseId);
            const data = {
                licenseIds: ids,
                enableUpdates: true,
            };
            this.updateToggleSettings(data);
        }

        return false;
    }

    private mapSelectedDealerHostLicense(dealers: API_DEALER[], dealerId?: string) {
        if (!dealerId) {
            const mapped = dealers.reduce((acc: any[], d) => {
                return acc.concat(
                    d.licenses.map((l: any) => ({
                        hostId: l.hostId,
                        dealerId: l.dealerId,
                        licenseId: l.licenseId,
                        isUpdateEnabled: l.enableUpdates,
                    })),
                );
            }, []);

            return mapped;
        }

        const filteredLicenses = dealers.reduce((acc: any[], dealer: any) => {
            if (dealer && dealer.dealerId === dealerId) {
                return [
                    ...acc,
                    ...dealer.licenses.map((l: any) => ({
                        hostId: l.hostId,
                        dealerId: l.dealerId,
                        licenseId: l.licenseId,
                    })),
                ];
            }
            return acc;
        }, []);

        return filteredLicenses;
    }

    public selectAllHostAndLicenses(e: { checked: boolean }, dealerId) {
        this.isChecked = e.checked;
        if (!e.checked) {
            this.unselectedDealerHostLicense = [
                ...this.unselectedDealerHostLicense,
                ...this.selectedDealerHostLicense.filter((i) => i.dealerId == dealerId),
            ];
            this.selectedDealerHostLicense = [...this.selectedDealerHostLicense.filter((i) => i.dealerId !== dealerId)];
            return;
        }

        this.unselectedDealerHostLicense = [...this.unselectedDealerHostLicense.filter((i) => i.dealerId !== dealerId)];

        this.selectedDealerHostLicense = [
            ...this.selectedDealerHostLicense,
            ...this.mapSelectedDealerHostLicense(this.selectedDealers, dealerId),
        ];
    }

    public selectLicense(e: { checked: boolean }, dealerId, licenseId) {
        this.isChecked = e.checked;

        if (!e.checked) {
            this.unselectedDealerHostLicense = [
                ...this.unselectedDealerHostLicense,
                ...this.selectedDealerHostLicense.filter((i) => i.licenseId == licenseId),
            ];
            this.selectedDealerHostLicense = [
                ...this.selectedDealerHostLicense.filter((i) => i.licenseId !== licenseId),
            ];
            return;
        }

        this.unselectedDealerHostLicense = [
            ...this.unselectedDealerHostLicense.filter((i) => i.licenseId !== licenseId),
        ];

        /** @TODO - set actual interface instead of any */
        this.selectedDealers.forEach((dealer: any) => {
            if (dealer && dealer.dealerId === dealerId) {
                this.selectedDealerHostLicense.push(
                    dealer.licenses
                        .filter((license: any) => license.licenseId == licenseId)
                        .map((l) => {
                            return {
                                licenseId: l.licenseId,
                                hostId: l.hostId,
                                dealerId: l.dealerId,
                            };
                        })[0],
                );
            }
        });
    }

    public selectHost(e: { checked: boolean }, dealerId, hostId) {
        this.isChecked = e.checked;
        if (!e.checked) {
            this.unselectedDealerHostLicense = [
                ...this.unselectedDealerHostLicense,
                ...this.selectedDealerHostLicense.filter((i) => i.hostId == hostId),
            ];
            this.selectedDealerHostLicense = [...this.selectedDealerHostLicense.filter((i) => i.hostId !== hostId)];
            return;
        }

        this.unselectedDealerHostLicense = [...this.unselectedDealerHostLicense.filter((i) => i.hostId !== hostId)];

        /** @TODO - set actual interface instead of any */
        this.selectedDealers.forEach((dealer: any) => {
            if (dealer && dealer.dealerId === dealerId) {
                this.selectedDealerHostLicense = [
                    ...this.selectedDealerHostLicense,
                    ...dealer.licenses
                        .filter((license: any) => license.hostId == hostId)
                        .map((l) => ({
                            licenseId: l.licenseId,
                            hostId: l.hostId,
                            dealerId: l.dealerId,
                        })),
                ];
            }
        });
    }

    public isDealerSelected(dealerId: string) {
        return this.selectedDealerHostLicense.some((obj) => obj.dealerId === dealerId);
    }

    public isHostSelected(hostId: string) {
        return this.selectedDealerHostLicense.some((obj) => obj.hostId === hostId);
    }

    public isLicenseSelected(licenseId: string) {
        return this.selectedDealerHostLicense.some((obj) => obj.licenseId === licenseId);
    }
}
