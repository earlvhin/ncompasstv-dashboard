import { Component, OnInit } from '@angular/core';
import { AgmInfoWindow } from '@agm/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { saveAs } from 'file-saver';

import {
    API_DEALER_LICENSE,
    API_HOST,
    API_LICENSE_PROPS,
    PAGING,
    UI_DEALER_LOCATOR_EXPORT,
    UI_HOST_LOCATOR_MARKER_DEALER_MODE,
} from 'src/app/global/models';
import { AuthService, HostService, LicenseService } from 'src/app/global/services';
@Component({
    selector: 'app-license-view',
    templateUrl: './license-view.component.html',
    styleUrls: ['./license-view.component.scss'],
})
export class LicenseViewComponent implements OnInit {
    clicked_marker_id: string;
    dealer_licenses_data: API_DEALER_LICENSE[] = [];
    expansion_id: string;
    filterStatus: number;
    filterLabelStatus: string;
    host_licenses: API_LICENSE_PROPS[] = [];
    isFiltered = false;
    lat = 39.7395247;
    lng = -105.1524133;
    loading_data = true;
    loading_licenses = true;
    loading_license_count = false;
    loading_search = false;
    location_selected = false;
    map_markers: UI_HOST_LOCATOR_MARKER_DEALER_MODE[];
    online_licenses = 0;
    offline_licenses = 0;
    paging: PAGING;
    search_keyword = false;
    selected_dealer_hosts: API_HOST[];
    selected_licenses: API_LICENSE_PROPS[] = [];
    status: boolean = false;

    private businessName: string;
    private current_host_id_selected = '';
    private exported_map_marker: UI_DEALER_LOCATOR_EXPORT[];
    private filtered_licenses: API_LICENSE_PROPS[] = [];
    private currentHostsPage = 1;
    private license_page_count: number = 1;
    private license_search_results: API_LICENSE_PROPS[];
    private markStoreHours: string;
    private previous_marker: AgmInfoWindow;
    private search_license_id: string;
    private selected_host_ids: string[] = [];
    private unfiltered_dealer_hosts: API_HOST[];
    private unfiltered_licenses: API_LICENSE_PROPS[] = [];
    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _host: HostService,
        private _license: LicenseService,
    ) {}

    ngOnInit() {
        this.online_licenses = 0;
        this.offline_licenses = 0;
        this.selected_dealer_hosts = [];
        this.selected_licenses = [];
        this.dealer_licenses_data = [];
        this.getDealerHosts(1);
        this.getDealerLicenses(this.license_page_count++);
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    clearFilter(): void {
        this.isFiltered = false;
        this.filterStatus = null;
        this.filterLabelStatus = '';
        this.selected_dealer_hosts = this.unfiltered_dealer_hosts;
        this.selected_licenses = this.unfiltered_licenses;
        this.selected_dealer_hosts.forEach((host) => this.getLicenseByHost(host.hostId));
        this.map_markers = this.mapMarkersToUI(this.selected_dealer_hosts, this.selected_licenses);
        this.online_licenses = 0;
        this.offline_licenses = 0;

        this.selected_licenses.forEach((license) => {
            if (license.piStatus == 1) this.online_licenses += 1;
        });

        this.offline_licenses = this.selected_licenses.length - this.online_licenses;
    }

    exportToCSV(): void {
        let isStatus = true;
        const replacer = (key, value) => (value === null ? '' : value);
        this.exported_map_marker = [];

        this.map_markers.forEach((license) => {
            const storeHours = [...license.storeHours];
            this.markStoreHours = '';

            storeHours.forEach((hour) => {
                Object.entries(hour).forEach(([key, value]) => {
                    if (key === 'day') this.markStoreHours += value;

                    if (key === 'status') {
                        if (value) isStatus = true;
                        else isStatus = false;
                    }

                    if (key === 'periods') {
                        const periods = [...value];

                        periods.forEach((period) => {
                            Object.entries(period).forEach(([key, value]) => {
                                if (key === 'open') {
                                    if (value !== '') this.markStoreHours += ' (' + value + ' - ';
                                    else {
                                        if (isStatus) this.markStoreHours += ' ( Open 24 hours ) ';
                                        else this.markStoreHours += ' ( Closed ) ';
                                    }
                                }

                                if (key === 'close') {
                                    if (value !== '') this.markStoreHours += value + ') | ';
                                    else this.markStoreHours += value + ' | ';
                                }
                            });
                        });
                    }
                });
            });

            let locatorAddress = `${license.address}, ${license.city}, ${license.state} ${license.postalCode}`;
            let businessName = this.currentUser.roleInfo.businessName;
            let marker = new UI_DEALER_LOCATOR_EXPORT(
                businessName,
                license.name,
                locatorAddress,
                license.category,
                this.markStoreHours,
                license.latitude,
                license.longitude,
            );
            this.exported_map_marker.push(marker);
        });

        const header = Object.keys(this.exported_map_marker[0]);
        const csv = this.exported_map_marker.map((row) =>
            header.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(','),
        );
        csv.unshift(header.join(','));
        const csvArray = csv.join('\r\n');
        const blob = new Blob([csvArray], { type: 'text/csv' });
        const fileName = this.businessName + '_MapLocator.csv';
        saveAs(blob, fileName);
    }

    filterDealerHosts(value: number): void {
        this.online_licenses = 0;
        this.offline_licenses = 0;
        this.isFiltered = true;
        this.filterStatus = value;
        this.filterLabelStatus = value == 1 ? 'Online' : 'Offline';
        this.selected_dealer_hosts = this.unfiltered_dealer_hosts;
        this.selected_licenses = this.unfiltered_licenses;

        this.selected_dealer_hosts.forEach((host) => this.getLicenseByHost(host.hostId));
        this.filtered_licenses = this.selected_licenses.filter(
            (license) => license.piStatus === value,
        );
        this.selected_licenses = this.filtered_licenses;

        if (value === 1) this.online_licenses = this.filtered_licenses.length;
        else this.offline_licenses = this.filtered_licenses.length;

        this.selected_host_ids = this.filtered_licenses.map((license) => license.hostId);
        this.selected_dealer_hosts = this.selected_dealer_hosts.filter((host) =>
            this.selected_host_ids.includes(host.hostId),
        );
        this.selected_dealer_hosts.forEach((host) => this.getLicenseByHost(host.hostId));
        this.map_markers = this.mapMarkersToUI(this.selected_dealer_hosts, this.filtered_licenses);
    }

    onExpandHost(hostId: string): void {
        if (hostId === this.current_host_id_selected) return;
        this.host_licenses = [];
        this.expansion_id = hostId;
        this.clicked_marker_id = hostId;
        this.current_host_id_selected = hostId;
        this.getLicenseByHost(hostId);
    }

    onMarkerClick(hostId: string, window: AgmInfoWindow): void {
        this.getLicenseByHost(hostId);
        this.clicked_marker_id = hostId;
        this.expansion_id = hostId;
        if (this.previous_marker) this.previous_marker.close();
        this.previous_marker = window;
    }

    onSelectLicense(id: string): void {
        this.search_keyword = true;
        this.online_licenses = 0;
        this.offline_licenses = 0;
        this.license_search_results = this.selected_licenses.filter(
            (license) => license.licenseId === id,
        );
        this.search_license_id = id;
        this.selected_licenses = this.license_search_results;
        this.selected_host_ids = this.license_search_results.map((license) => license.hostId);
        this.selected_dealer_hosts = this.selected_dealer_hosts.filter((host) =>
            this.selected_host_ids.includes(host.hostId),
        );
        this.selected_dealer_hosts.forEach((host) => this.getLicenseByHost(host.hostId));

        this.selected_licenses.forEach((license) => {
            if (license.piStatus == 1) this.online_licenses += 1;
        });

        this.offline_licenses = this.selected_licenses.length - this.online_licenses;

        this.selected_dealer_hosts.forEach((host) => {
            host.licenses = [];

            this.selected_licenses.forEach((license) => {
                if (license.hostId !== host.hostId) return;
                host.licenses.push(license);
            });
        });

        this.map_markers = this.mapMarkersToUI(this.selected_dealer_hosts, this.selected_licenses);

        this.selected_dealer_hosts.forEach((host) => {
            host.iconUrl = this.map_markers.filter(
                (marker) => marker.hostId === host.hostId,
            )[0].iconUrl;
        });

        if (this.isFiltered) this.filterDealerHosts(this.filterStatus);
    }

    searchBoxTrigger(event: { is_search: boolean; page: number; no_keyword: boolean }): void {
        if (event.no_keyword) {
            this.dealer_licenses_data = [];
            this.selected_licenses = [];
            this.selected_dealer_hosts = [];
            this.license_page_count = 1;
            this.clicked_marker_id = '';
            this.expansion_id = '';
            this.getDealerHosts(event.page);
            this.search_keyword = false;
            this.license_search_results = undefined;
        }

        this.getDealerLicenses(this.license_page_count++);
    }

    searchData(key: string): void {
        this.loading_search = true;
        const currentDealerId = this.currentUser.roleInfo.dealerId;

        this._license
            .search_license(key)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    const { licenses } = response;

                    if (licenses.length <= 0) {
                        this.dealer_licenses_data = [];
                        return;
                    }

                    const dealerLicenses: API_DEALER_LICENSE[] = licenses;
                    this.dealer_licenses_data = [];

                    dealerLicenses.map((license) => {
                        if (license.dealerId !== currentDealerId) return;

                        let dealerLicense = new API_DEALER_LICENSE(
                            license.dealerId,
                            license.hostId,
                            license.licenseAlias === null
                                ? license.licenseKey
                                : license.licenseAlias,
                            license.licenseId,
                            license.licenseKey,
                        );

                        this.dealer_licenses_data.push(dealerLicense);
                    });
                },
                (error) => {
                    console.error(error);
                },
            )
            .add(() => (this.loading_search = false));
    }

    setLink(licenseId: string) {
        let role = this.currentRole;
        if (role === 'dealeradmin') role = 'administrator';
        return [`/${role}/licenses/${licenseId}`];
    }

    private getDealerHosts(page: number): void {
        const currentDealerId = this.currentUser.roleInfo.dealerId;
        this.businessName = this.currentUser.roleInfo.businessName;
        this.selected_dealer_hosts = [];

        this._host
            .get_host_by_dealer_id_locator(currentDealerId, page, '', 1000, false)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if (response.message || response.paging.entities.length <= 0) return;

                    const { paging } = response;
                    const { entities } = paging;
                    const hosts: API_HOST[] = entities;
                    this.paging = paging;

                    this.selected_dealer_hosts = [...hosts];
                    this.map_markers = this.mapMarkersToUI(
                        this.selected_dealer_hosts,
                        this.selected_licenses,
                    );

                    this.selected_dealer_hosts.forEach((host) => {
                        host.storeHours
                            ? (host.parsedStoreHours = JSON.parse(host.storeHours))
                            : (host.parsedStoreHours = '-');
                        host.latitude
                            ? (host.latitude = parseFloat(host.latitude).toFixed(5))
                            : '-';
                        host.longitude
                            ? (host.longitude = parseFloat(host.longitude).toFixed(5))
                            : '-';
                        host.iconUrl = host.iconUrl = this.map_markers.filter(
                            (marker) => marker.hostId === host.hostId,
                        )[0].iconUrl;
                    });
                },
                (error) => {
                    console.error(error);
                },
            )
            .add(() => (this.loading_licenses = false));
    }

    private getDealerLicenses(page: number): void {
        if (page > 1) this.loading_data = true;
        else this.loading_search = true;

        this.online_licenses = 0;
        this.offline_licenses = 0;
        const currentDealerId = this.currentUser.roleInfo.dealerId;

        this._license
            .get_license_by_dealer_id(currentDealerId, page, '', '', 0, false)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if (response.message) {
                        this.loading_data = false;
                        return;
                    }

                    const dealerLicenses = response.paging.entities as API_LICENSE_PROPS[];
                    const pageCount = response.paging.pages;

                    dealerLicenses.forEach((license) => {
                        if (license.hostId !== null && license.hostId !== '') {
                            this.selected_licenses.push(license);
                        }
                    });

                    this.selected_licenses.forEach((license) => {
                        if (license.piStatus === 1) this.online_licenses += 1;
                    });

                    dealerLicenses.map((license) => {
                        let dealerLicense = new API_DEALER_LICENSE(
                            license.dealerId,
                            license.hostId,
                            license.alias === null ? license.licenseKey : license.alias,
                            license.licenseId,
                            license.licenseKey,
                        );
                        this.dealer_licenses_data.push(dealerLicense);
                    });

                    this.loading_data = false;
                    this.offline_licenses = this.selected_licenses.length - this.online_licenses;

                    this.selected_dealer_hosts.forEach((host) => {
                        host.licenses = [];

                        this.selected_licenses.forEach((license) => {
                            if (license.hostId !== host.hostId) return;
                            host.licenses.push(license);
                        });
                    });

                    this.unfiltered_dealer_hosts = this.selected_dealer_hosts;
                    this.unfiltered_licenses = this.selected_licenses;

                    if (this.selected_dealer_hosts.length > 0) {
                        this.map_markers = this.mapMarkersToUI(
                            this.selected_dealer_hosts,
                            this.selected_licenses,
                        );

                        this.selected_dealer_hosts.forEach((host) => {
                            host.iconUrl = this.map_markers.filter(
                                (marker) => marker.hostId === host.hostId,
                            )[0].iconUrl;
                        });
                    }

                    this.location_selected = true;
                    if (this.isFiltered) this.filterDealerHosts(this.filterStatus);
                    if (this.license_page_count <= pageCount)
                        this.getDealerLicenses(this.license_page_count++);
                },
                (error) => {
                    console.error(error);
                },
            )
            .add(() => {
                this.loading_search = false;
                this.loading_licenses = false;
            });
    }

    private getLicenseByHost(id: string): void {
        this.loading_license_count = true;

        this._license
            .get_licenses_by_host_id(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if (!Array.isArray(response)) {
                        this.host_licenses = [];
                        return;
                    }

                    const licenses = response as API_LICENSE_PROPS[];
                    this.host_licenses = [...licenses];

                    if (this.filterStatus !== undefined && !this.filterStatus) {
                        this.host_licenses = this.host_licenses.filter(
                            (license) => license.piStatus === this.filterStatus,
                        );
                    }

                    if (this.license_search_results !== undefined) {
                        this.host_licenses = this.host_licenses.filter(
                            (license) => license.licenseId === this.search_license_id,
                        );
                    }
                },
                (error) => {
                    console.error(error);
                },
            )
            .add(() => (this.loading_license_count = false));
    }

    private mapMarkersToUI(
        hosts: API_HOST[],
        licenses: API_LICENSE_PROPS[],
    ): UI_HOST_LOCATOR_MARKER_DEALER_MODE[] {
        if (!hosts || hosts.length <= 0) return;

        return hosts.map((host) => {
            let iconUrl: string;
            let online: any = 0;
            let license_online_percentage: number;
            const host_licenses: API_LICENSE_PROPS[] = licenses.filter(
                (license) => license.hostId === host.hostId,
            );

            if (host_licenses.length > 0) {
                online = host_licenses.filter((license) => license.piStatus === 1);
                license_online_percentage = (online.length / host_licenses.length) * 100;
            }

            if (license_online_percentage == 100)
                iconUrl = 'assets/media-files/markers/online_all.png';
            else if (license_online_percentage >= 51 && license_online_percentage < 100)
                iconUrl = 'assets/media-files/markers/online_many.png';
            else if (license_online_percentage < 51 && license_online_percentage > 0)
                iconUrl = 'assets/media-files/markers/online_few.png';
            else iconUrl = 'assets/media-files/markers/offline.png';

            return new UI_HOST_LOCATOR_MARKER_DEALER_MODE(
                host.hostId,
                host.name,
                host.latitude,
                host.longitude,
                license_online_percentage,
                iconUrl,
                host.address,
                host.category,
                host.parsedStoreHours,
                host.state,
                host.postalCode,
                host.city,
                host.dealerId,
            );
        });
    }

    protected get currentRole() {
        return this._auth.current_role;
    }

    protected get currentUser() {
        return this._auth.current_user_value;
    }

    toggleOverMap() {
        this.status = !this.status;
    }
}
