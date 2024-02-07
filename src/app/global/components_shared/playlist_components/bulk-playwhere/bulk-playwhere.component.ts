import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-bulk-playwhere',
    templateUrl: './bulk-playwhere.component.html',
    styleUrls: ['./bulk-playwhere.component.scss'],
})
export class BulkPlaywhereComponent implements OnInit {
    @Input() host_licenses: any[] = [];
    @Output() disable_blocklisting = new EventEmitter();
    @Output() blacklist = new EventEmitter();
    @Output() whitelist = new EventEmitter();
    disable_animation = true;
    timeout: any;
    blocklist_licenses = [];
    whitelist_licenses = [];

    constructor() {}

    ngOnInit() {
        this.host_licenses.forEach((i) => {
            i.licenses.forEach((j) => {
                this.addToBlocklistLicense({ checked: true }, j.licenseId);
            });
        });
    }

    ngAfterViewInit(): void {
        this.timeout = setTimeout(() => (this.disable_animation = false));
    }

    allHostLicenseInBlacklist() {
        let host_license_count = 0;

        this.host_licenses.forEach((h) => {
            host_license_count += h.licenses.length;
        });

        if (this.blocklist_licenses.length == host_license_count) {
            return false;
        } else {
            return true;
        }
    }

    allLicenseInBlacklist(h) {
        const license_count = h.licenses.length;
        let counter = 0;

        h.licenses.forEach((l) => {
            if (this.blocklist_licenses.includes(l.licenseId)) {
                counter++;
            }
        });

        if (counter === license_count) {
            return false;
        } else {
            return true;
        }
    }

    addToBlocklistLicense(e, id) {
        setTimeout(() => {
            if (e.checked == false && this.inBlocklistArray(id).length == 0) {
                this.whitelist_licenses = this.whitelist_licenses.filter((i) => {
                    return i !== id;
                });

                this.blocklist_licenses.push(id);
            } else if (e.checked == true && this.inBlocklistArray(id).length > 0) {
                this.blocklist_licenses = this.blocklist_licenses.filter((i) => {
                    return i !== id;
                });

                this.whitelist_licenses.push(id);
            } else if (e.checked == true) {
                this.whitelist_licenses.push(id);
            }

            this.whitelist.emit(this.whitelist_licenses);
            this.blacklist.emit(this.blocklist_licenses);
        }, 0);
    }

    inWhitelistArray(id) {
        return this.whitelist_licenses.filter((i) => {
            return i == id;
        });
    }

    cancelBlacklisting() {
        this.blocklist_licenses = [];
        this.whitelist_licenses = [];
        this.disable_blocklisting.emit(true);
    }

    cutString(e) {
        if (e.length > 30) {
            return e.substring(0, 30) + '...';
        } else {
            return e;
        }
    }

    hostToggle(e, h) {
        h.licenses.forEach((l) => {
            this.addToBlocklistLicense(e, l.licenseId);
        });
    }

    inBlocklistArray(id) {
        return this.blocklist_licenses.filter((i) => {
            return i === id;
        });
    }

    toggleAll(e) {
        if (this.host_licenses) {
            this.host_licenses.forEach((h) => {
                h.licenses.forEach((l) => {
                    this.addToBlocklistLicense(e, l.licenseId);
                });
            });
        }
    }
}
