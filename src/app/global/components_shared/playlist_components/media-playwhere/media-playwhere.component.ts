import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-media-playwhere',
    templateUrl: './media-playwhere.component.html',
    styleUrls: ['./media-playwhere.component.scss'],
})
export class MediaPlaywhereComponent implements OnInit {
    host_licenses: any;
    disable_animation: boolean = true;
    blocklist_licenses = [];

    constructor(@Inject(MAT_DIALOG_DATA) public _dialog_data: any) {}

    ngOnInit() {
        this.host_licenses = this._dialog_data;

        if (localStorage.getItem('to_blocklist')) {
            const blocklist = localStorage.getItem('to_blocklist').split(',');
            this.blocklist_licenses = blocklist;
        }

        if (this.host_licenses) {
            this.host_licenses = this.host_licenses.sort((a, b) => {
                return a.host.name.localeCompare(b.host.name);
            });
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.disable_animation = false;
        }, 0);
    }

    cutString(e) {
        if (e.length > 30) {
            return e.substring(0, 30) + '...';
        } else {
            return e;
        }
    }

    addToBlocklistLicense(e, id) {
        setTimeout(() => {
            if (e.checked == false && this.inBlocklistArray(id).length == 0) {
                this.blocklist_licenses.push(id);
            } else if (e.checked == true && this.inBlocklistArray(id).length > 0) {
                this.blocklist_licenses = this.blocklist_licenses.filter((i) => {
                    return i !== id;
                });
            }
        }, 0);
    }

    inBlocklistArray(id) {
        return this.blocklist_licenses.filter((i) => {
            return i === id;
        });
    }

    hostToggle(e, h) {
        h.licenses.forEach((l) => {
            this.addToBlocklistLicense(e, l.licenseId);
        });
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
