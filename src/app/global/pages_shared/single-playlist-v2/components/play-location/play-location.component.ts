import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material';
import { Observable } from 'rxjs/internal/Observable';
import { API_HOST, API_LICENSE_PROPS } from 'src/app/global/models';

interface HostLicenses {
    host: API_HOST;
    licenses: API_LICENSE_PROPS[];
}

@Component({
    selector: 'app-play-location',
    templateUrl: './play-location.component.html',
    styleUrls: ['./play-location.component.scss'],
})
export class PlayLocationComponent implements OnInit {
    @Input() bulk_modify: boolean = false;
    @Input() host_licenses: HostLicenses[];
    @Input() toggle_all: Observable<MatSlideToggleChange>;
    @Input() toggle_all_add_content: Observable<MatSlideToggleChange>;
    @Input() toggle_all_spacer: Observable<MatSlideToggleChange>;
    @Input() whitelisted_hosts: string[] = [];
    @Input() whitelisted_licenses: string[] = [];
    @Output() to_whitelist = new EventEmitter<string[]>();
    @Output() to_blacklist = new EventEmitter<string[]>();
    @Output() license_toggled = new EventEmitter<string[]>();
    selectedHostIds: string[] = [];
    selectedLicenseIds: string[] = [];
    private blacklistedLicenseIds = []; // Licenses that will be removed in the whitelist records

    constructor() {}

    ngOnInit() {
        this.host_licenses.sort((a, b) => a.host.name.localeCompare(b.host.name));
        this.setInitiallyWhitelisted();

        /** Initial value for bulk blacklist/whitelist */
        if (this.bulk_modify) this.toggleAllHostAndLicenses(false);

        /** Yes I had them separated instead of just one observable instance */
        if (this.toggle_all) this.toggle_all.subscribe((e) => this.toggleAllHostAndLicenses(e.checked));
        if (this.toggle_all_add_content)
            this.toggle_all_add_content.subscribe((e) => this.toggleAllHostAndLicenses(e.checked));
        if (this.toggle_all_spacer) this.toggle_all_spacer.subscribe((e) => this.toggleAllHostAndLicenses(e.checked));
    }

    /**
     * Checks if the host ID is included in the selection
     * @param hostId
     * @returns
     */
    public isHostSelected(hostId: string): boolean {
        if (!hostId) return;
        return this.selectedHostIds.includes(hostId);
    }

    /**
     * Checks if the host ID is whitelisted
     * @param hostId
     * @returns
     */
    public isHostWhiteListed(hostId: string): boolean {
        return this.whitelisted_hosts.includes(hostId);
    }

    /**
     * Sets the hosts and licenses currently whitelisted on page load
     * @returns {void}
     */
    private setInitiallyWhitelisted(): void {
        const hosts = this.whitelisted_hosts;
        const licenses = this.whitelisted_licenses;

        this.selectedLicenseIds = this.host_licenses
            .filter((h) => hosts.includes(h.host.hostId))
            .map((hl) => hl.licenses.map((l) => l.licenseId))
            .reduce((a, b) => a.concat(b), [])
            .filter((id) => licenses.includes(id));
    }

    /**
     * Toggles the selection of all hosts and their licenses based on the slide toggle change event.
     *
     * @param {boolean} checked - The change event from the slide toggle component.
     *
     * @fires to_whitelist - Emitted when all licenses are added to the whitelist.
     * @fires to_blacklist - Emitted when all licenses are added to the blacklist.
     * @fires license_toggled - Emitted to inform that licenses have been toggled.
     */
    private toggleAllHostAndLicenses(checked: boolean): void {
        const allHostIds = this.host_licenses.map((h) => h.host.hostId);
        const allLicenseIds = this.host_licenses
            .map((hl) => hl.licenses.map((l) => l.licenseId))
            .reduce((a, b) => a.concat(b), []);

        if (checked) {
            this.blacklistedLicenseIds = [];
            this.selectedHostIds = [...allHostIds];
            this.whitelisted_hosts = [...allHostIds];
            this.selectedLicenseIds = [...allLicenseIds];
            this.whitelisted_licenses = [...allLicenseIds];
            this.to_whitelist.emit(this.allWhiteListedIds);
        } else {
            this.addtoBlacklist([...allLicenseIds]);
            this.selectedHostIds = [];
            this.whitelisted_hosts = [];
            this.selectedLicenseIds = [];
            this.whitelisted_licenses = [];
            this.to_blacklist.emit(this.blacklistedLicenseIds);
        }

        this.license_toggled.emit(this.whitelisted_licenses);
    }

    /**
     * Toggles the selection of all licenses for a given host.
     *
     * @param {MatSlideToggleChange} e - The change event from the slide toggle component.
     * @param {HostLicenses} hostLicenses - The host licenses object containing the host and its associated licenses.
     *
     * @fires to_whitelist - Emitted when licenses are added to the whitelist.
     * @fires to_blacklist - Emitted when licenses are removed from the whitelist.
     * @fires license_toggled - Emitted to inform that a license has been toggled.
     */
    public toggleHost(e: MatSlideToggleChange, hostLicenses: HostLicenses): void {
        const licenseIdsOfToggled = hostLicenses.licenses.map((license) => license.licenseId);

        if (e.checked) {
            this.removeFromBlacklist(licenseIdsOfToggled);
            this.selectedHostIds.push(hostLicenses.host.hostId);
            this.selectedLicenseIds = this.selectedLicenseIds.concat(licenseIdsOfToggled);
            this.whitelisted_licenses = [...licenseIdsOfToggled];
            this.whitelisted_hosts.push(hostLicenses.host.hostId);
            this.to_whitelist.emit(this.allWhiteListedIds);
        } else {
            this.addtoBlacklist(licenseIdsOfToggled);
            this.selectedHostIds = this.selectedHostIds.filter((hostId) => hostId !== hostLicenses.host.hostId);
            this.selectedLicenseIds = this.selectedLicenseIds.filter((id) => !this.blacklistedLicenseIds.includes(id));
            this.whitelisted_licenses = [...this.selectedLicenseIds];
            this.whitelisted_hosts = this.whitelisted_hosts.filter((id) => id !== hostLicenses.host.hostId);
            this.to_blacklist.emit(this.blacklistedLicenseIds);
        }

        // informs the content-settings component that a license was toggled
        // this is used to check if all licenses are toggled
        this.license_toggled.emit(this.whitelisted_licenses);
    }

    /**
     * Toggles the selection of a specific license for a given host.
     *
     * @param {MatSlideToggleChange} e - The change event from the slide toggle component.
     * @param {HostLicenses} h - The host licenses object containing the host and its associated licenses.
     * @param {string} licenseId - The ID of the license to be toggled.
     *
     * @fires to_whitelist - Emitted when a license is added to the whitelist.
     * @fires to_blacklist - Emitted when a license is added to the blacklist.
     * @fires license_toggled - Emitted to inform that a license has been toggled.
     */
    public toggleLicense(e: MatSlideToggleChange, h: HostLicenses, licenseId: string): void {
        if (e.checked) {
            this.selectedLicenseIds.push(licenseId);
            this.removeFromBlacklist([licenseId]);
            this.to_whitelist.emit(this.allWhiteListedIds);
            this.whitelisted_hosts.push(h.host.hostId);
        } else {
            this.selectedLicenseIds = this.selectedLicenseIds.filter((id) => id !== licenseId);
            this.addtoBlacklist([licenseId]);
            this.to_blacklist.emit(this.blacklistedLicenseIds);
        }

        this.whitelisted_licenses = [...this.selectedLicenseIds];
        this.license_toggled.emit(this.allWhiteListedIds);
        this.checkIfHostHasLicensesSelected(h);
    }

    /**
     * Checks if the given host has any licenses selected and updates the selected host IDs accordingly.
     *
     * @param {HostLicenses} h - The host licenses object containing the host and its associated licenses.
     */
    private checkIfHostHasLicensesSelected(h: HostLicenses): void {
        const hosts = [...new Set(this.selectedHostIds.concat(this.whitelisted_hosts))];
        const licenseIdsOfHost = h.licenses.map((l) => l.licenseId);
        const hasNoLicenseSelected = !this.selectedLicenseIds.some((id) => licenseIdsOfHost.includes(id));
        const hasNoLicenseWhitelisted = !this.whitelisted_licenses.some((id) => licenseIdsOfHost.includes(id));

        if (hasNoLicenseSelected || hasNoLicenseWhitelisted) {
            const filtered = hosts.filter((id) => id !== h.host.hostId);
            this.selectedHostIds = [...filtered];
            this.whitelisted_hosts = [...filtered];
        }
    }

    /**
     * Checks if all licenses for a given host are selected.
     *
     * @param {HostLicenses} data - The host licenses object containing the host and its associated licenses.
     * @returns {boolean} - Returns true if all licenses of the host are selected, otherwise false.
     */
    public hasSelectedAllHostLicenses(data: HostLicenses): boolean {
        const licenseIdsOfHost = data.licenses.map((license) => license.licenseId);
        const totalLicensesOfHost = licenseIdsOfHost.length;
        const selectedLicenseIdsOfHost = this.selectedLicenseIds.filter((id) => licenseIdsOfHost.includes(id));
        return totalLicensesOfHost === selectedLicenseIdsOfHost.length;
    }

    private removeFromBlacklist(licenseIds: string[]): void {
        this.blacklistedLicenseIds = this.blacklistedLicenseIds.filter((i) => !licenseIds.includes(i));
    }

    private addtoBlacklist(licenseIds: string[]): void {
        this.blacklistedLicenseIds = this.blacklistedLicenseIds.concat(licenseIds);
    }

    /**
     * Returns all the license that are considered whitelisted
     * That includes all newly selected licenses for whitelisting
     */
    private get allWhiteListedIds(): string[] {
        const whitelisted = Array.from(this.whitelisted_licenses);
        const forWhitelisting = Array.from(this.selectedLicenseIds);
        return [...new Set(whitelisted.concat(forWhitelisting))];
    }
}
