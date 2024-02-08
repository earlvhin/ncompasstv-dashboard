import { Component, OnInit, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelect } from '@angular/material';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { forkJoin, ReplaySubject, Subject } from 'rxjs';
import * as moment from 'moment';

import { API_CATEGORY, API_HOST, API_LICENSE_PROPS, API_STATE, UI_STORE_HOUR } from 'src/app/global/models';
import { AuthService, LicenseService } from 'src/app/global/services';

@Component({
    selector: 'app-locator-component',
    templateUrl: './locator-component.component.html',
    styleUrls: ['./locator-component.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class LocatorComponentComponent implements OnInit {
    @ViewChild('multi_select', { static: false }) searchSelectDropdown: MatSelect;
    @Input() search_placeholder: string;
    @Input() select_placeholder: string;
    @Input() result_placeholder: string;
    @Input() data_reference: any[];
    @Input() original_reference: API_HOST[];
    @Input() type: string;
    @Input() status = false;
    // categoryOrStateData: API_HOST[][] = [];
    categoryOrStateData: API_STATE[] | API_CATEGORY[] = [];
    currentList: API_HOST[] = [];
    currentPage = 1;
    currentHostIdSelected: string;
    hosts: API_HOST[] = [];
    hostCount = 0;
    hasFinishedMapping = false;
    hasLoadedExpansionData = false;
    filteredData = new ReplaySubject<any[]>(1);
    hasSelectedData = false;
    isCurrentUserDealer = this._auth.current_role === 'dealer';
    isDeselect = false;
    isFormReady = false;
    isSearching = false;
    latitude = 39.7395247;
    licenseCount = 0;
    listControl: AbstractControl;
    longitude = -105.1524133;
    mapMarkers: API_HOST[] = [];
    onlineCount = 0;
    offlineCount = 0;
    pendingCount = 0;
    searchSelectForm: FormGroup;

    private currentRole = this._auth.current_role;
    private newDataReference: API_HOST[] | API_CATEGORY[] | API_STATE[] = [];
    private listBeforeChange = [];
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _formBuilder: FormBuilder,
        private _license: LicenseService,
        private _router: Router,
    ) {}

    ngOnInit() {
        this.initializeForm();
        this.filteredData.next([...this.data_reference]);
        this.newDataReference = [...this.data_reference];
    }

    ngOnChanges() {}

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    onClickHostName(hostId: string): void {
        this.currentHostIdSelected = hostId;
    }

    onCloseSearchSelectMenu(): void {
        this.getLocationLicenses();
    }

    onRemoveResult(removedData: API_HOST | API_CATEGORY | API_STATE): void {
        if (this.type === 'host') {
            const removedHost = removedData as API_HOST;
            const hostIndexToRemove = this.hosts.findIndex((host) => host.hostId === removedHost.hostId);
            const dataHostLocationIndex = this.mapMarkers.findIndex((host) => host.hostId === removedHost.hostId);
            this.hosts.splice(hostIndexToRemove, 1);
            this.mapMarkers.splice(dataHostLocationIndex, 1);
            this.currentList = [...this.mapMarkers];
            this.hostCount = this.mapMarkers.length;
            this._listControl.setValue([...this.mapMarkers], { emitEvent: false });
            this.searchSelectDropdown.compareWith = (a, b) => a && b && a === b;
            this.listBeforeChange = Array.from(this.mapMarkers);
            return;
        }

        const indexToRemove = this.categoryOrStateData.findIndex((data) => data[this.type] === removedData[this.type]);
        this.categoryOrStateData.splice(indexToRemove, 1);
        this._listControl.setValue([...this.categoryOrStateData], { emitEvent: false });
        this.listBeforeChange = Array.from([...this.categoryOrStateData]);
        this.mapMarkers = [...this.mapMarkers].filter((host) => host[this.type] !== removedData[this.type]);
        this.currentList = [...this.mapMarkers];
        this.hostCount = this.mapMarkers.length;
        this.searchSelectDropdown.compareWith = (a, b) => a && b && a === b;
    }

    onClearResults() {
        this._listControl.value.length = 0;
        this.searchSelectDropdown.compareWith = (a, b) => a && b && a === b;
        this.getLocationLicenses();
        this.isSearching = false;
        this.hasSelectedData = false;
    }

    openPageNewTab(page: string, id: string) {
        let role = this.currentRole;
        if (role === 'dealeradmin') role = 'administrator';
        const url = this._router.serializeUrl(this._router.createUrlTree([`/${role}/${page}/${id}`], {}));
        window.open(url, '_blank');
    }

    private getHostLicenses(id: string) {
        return this._license.get_licenses_by_host_id(id).pipe(takeUntil(this._unsubscribe));
    }

    private initializeForm(): void {
        this.searchSelectForm = this._formBuilder.group({
            list: [[], Validators.required],
            searchKeyword: null,
        });

        this.initializeSubscriptions();
        this.listControl = this.searchSelectForm.get('list');
        this.isFormReady = true;
    }

    private onSearchDMA(): void {
        const control = this.searchSelectForm.get('searchKeyword');

        control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000)).subscribe(
            (keyword: string) => {
                if (control.invalid) return;
                this.isSearching = true;

                if (this.type === 'state' ? keyword.length > 1 : keyword.length > 2) {
                    this.data_reference = this.data_reference.filter((data) => {
                        let searchKey: string;

                        switch (this.type) {
                            case 'host':
                                searchKey = this.isCurrentUserDealer ? data.name : data.hostName;
                                break;

                            case 'category':
                                searchKey = data.category;
                                break;

                            default: // state
                                searchKey = data.state;
                        }

                        return searchKey.toLowerCase().indexOf(keyword.toLowerCase()) > -1;
                    });

                    this.isSearching = false;
                    return;
                }

                this.data_reference = [...this.newDataReference];
                this.searchSelectDropdown.compareWith = (a, b) => a && b && a === b;
                this.isSearching = false;
            },

            (error) => {
                this.isSearching = false;
            },
        );
    }

    private onSelectDMA(): void {
        const control = this.searchSelectForm.get('list');
        control.valueChanges.pipe(debounceTime(1000), takeUntil(this._unsubscribe)).subscribe((change: any[]) => {
            if (this.listBeforeChange.length > change.length) {
                const removed = this.listBeforeChange.filter((item) => !change.includes(item))[0];
                this.onRemoveResult(removed);
                this.listBeforeChange = Array.from(change);
                return;
            }

            this.getLocationLicenses();
        });
    }

    private getLocationLicenses() {
        this.hasLoadedExpansionData = false;
        this.licenseCount = 0;
        this.onlineCount = 0;
        this.offlineCount = 0;
        this.pendingCount = 0;
        this.mapMarkers = [];
        this.isSearching = true;
        let requests: any[] = [];
        const currentList: any[] = Array.from(this._listControl.value);
        this.currentList = currentList;
        this.listBeforeChange = Array.from(currentList);

        if (currentList.length <= 0) {
            this.mapMarkers = [];
            this.hasSelectedData = false;
            return;
        }

        currentList.forEach((data) => {
            if (this.type === 'host') {
                requests.push(this.getHostLicenses((data as API_HOST).hostId));
                return;
            }

            this.original_reference
                .filter((host) => {
                    return host[this.type] && host[this.type].toLowerCase().indexOf(data[this.type].toLowerCase()) > -1;
                })
                .forEach((data) => {
                    requests.push(this.getHostLicenses(data.hostId));
                    return data;
                });
        });

        forkJoin(requests)
            .pipe(takeUntil(this._unsubscribe))
            .map((response: API_LICENSE_PROPS[][]) => {
                let flattenedResponse: API_LICENSE_PROPS[] = [];

                response
                    .filter((licenses) => Array.isArray(licenses))
                    .forEach((licenses) => {
                        licenses = licenses.map((license) => {
                            license.status = this.setLicenseStatus(license.installDate, license.piStatus);

                            switch (license.status) {
                                case 'online':
                                    this.onlineCount += 1;
                                    break;

                                case 'pending':
                                    this.pendingCount += 1;
                                    break;

                                default: // offline
                                    this.offlineCount += 1;
                            }
                            this.licenseCount += 1;
                            return license;
                        });

                        flattenedResponse = flattenedResponse.concat(licenses);
                    });

                return flattenedResponse;
            })
            .subscribe(
                (response: API_LICENSE_PROPS[]) => {
                    let results: API_HOST[] | API_CATEGORY[] | API_STATE[];

                    results = currentList.map((data: API_HOST | API_CATEGORY | API_STATE) => {
                        let mapped: API_HOST | API_CATEGORY | API_STATE;

                        switch (this.type) {
                            case 'host':
                                const host = data as API_HOST;
                                host.licenses = response.filter((license) => license.hostId === host.hostId);
                                host.iconUrl = this.setHostIconUrl(host.licenses);
                                mapped = host;
                                this.mapMarkers.push(host);
                                break;

                            default: // category or state
                                const stateOrCategory: API_STATE | API_CATEGORY = data;
                                stateOrCategory.totalLicenses = 0;
                                stateOrCategory.hosts = this.original_reference
                                    .filter((host) => host[this.type] === stateOrCategory[this.type])
                                    .map((host) => {
                                        host.licenses = response.filter((license) => license.hostId === host.hostId);
                                        host.storeHoursParsed = JSON.parse(host.storeHours);
                                        host.mappedStoreHours = this.mapStoreHours(host.storeHoursParsed);
                                        host.iconUrl = this.setHostIconUrl(host.licenses);
                                        stateOrCategory.totalLicenses += host.licenses.length;
                                        this.mapMarkers.push(host);
                                        return host;
                                    });
                                mapped = stateOrCategory;
                                break;
                        }

                        return mapped;
                    });

                    this.hostCount = this.mapMarkers.length;
                    if (this.type === 'host') this.hosts = results as API_HOST[];
                    else this.categoryOrStateData = results as API_CATEGORY[] | API_STATE[];
                    this.hasFinishedMapping = true;
                    this.hasSelectedData = true;
                    this.hasLoadedExpansionData = true;
                },
                (error) => {
                    console.error(error);
                },
            );
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

    private setLicenseStatus(installationDate: string, piStatus: number) {
        const isFutureInstallation = moment(installationDate).isAfter(new Date());

        if (isFutureInstallation) return 'pending';

        if (piStatus === 1) return 'online';

        return 'offline';
    }

    protected get _listControl() {
        return this.searchSelectForm.get('list');
    }

    protected initializeSubscriptions(): void {
        this.onSearchDMA();
        this.onSelectDMA();
    }
}
