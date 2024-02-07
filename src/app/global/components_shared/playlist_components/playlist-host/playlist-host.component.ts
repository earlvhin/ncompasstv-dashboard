import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { API_BLOCKLIST_CONTENT } from '../../../../global/models/api_blocklist-content.model';
@Component({
    selector: 'app-playlist-host',
    templateUrl: './playlist-host.component.html',
    styleUrls: ['./playlist-host.component.scss'],
})
export class PlaylistHostComponent implements OnInit {
    @Input() content_data: any;
    @Input() host_licenses: any;
    @Input() blocklist_data: any;
    @Input() toggleEvent: Observable<boolean>;
    @Input() is_child_frequency: boolean;
    @Output() blocklist_changes = new EventEmitter();
    @Output() whitelisted = new EventEmitter();

    incoming_blocklist = [];
    remove_in_blocklist = [];
    has_active_license: boolean;

    constructor() {}

    ngOnInit() {
        if (this.blocklist_data) {
            this.blocklist_data.forEach((i) => {
                this.incoming_blocklist.push(i.licenseId);
            });
        }

        this.host_licenses.licenses.forEach((i) => {
            if (!this.incoming_blocklist.includes(i.licenseId)) {
                this.remove_in_blocklist.push(i.licenseId);
            }
        });

        if (this.remove_in_blocklist.length > 0) {
            this.whitelisted.emit(true);
        }

        this.toggleEvent.subscribe((data) => {
            if (data == false) {
                this.remove_in_blocklist = [];

                this.host_licenses.licenses.forEach((i) => {
                    this.incoming_blocklist.push(i.licenseId);
                    this.blocklisting({ checked: data }, i.licenseId);
                });
            } else {
                this.incoming_blocklist = [];

                this.host_licenses.licenses.forEach((i) => {
                    this.blocklisting({ checked: data }, i.licenseId);
                });
            }
        });
    }

    blocklistingAllLicenses(e, id) {
        if (e.checked == false) {
            this.remove_in_blocklist = [];

            this.host_licenses.licenses.forEach((i) => {
                this.incoming_blocklist.push(i.licenseId);
                this.blocklisting(e, i.licenseId);
            });
        } else {
            this.incoming_blocklist = [];

            this.host_licenses.licenses.forEach((i) => {
                this.blocklisting(e, i.licenseId);
            });
        }
    }

    hasActiveLicenses() {
        return this.host_licenses.licenses.some((i) => {
            if (!this.incoming_blocklist.includes(i.licenseId)) return true;
        });
    }

    blocklistStatus(e) {
        if (this.blocklist_data) {
            const blocklist_initial = this.blocklist_data.filter((i) => {
                return i.licenseId == e;
            });

            if (blocklist_initial.length > 0) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }

    blocklisting(e, licenseId) {
        if (e.checked == true || e == true) {
            if (!this.remove_in_blocklist.includes(licenseId)) {
                this.remove_in_blocklist.push(licenseId);
            }
        } else {
            if (this.remove_in_blocklist.includes(licenseId)) {
                this.remove_in_blocklist = this.remove_in_blocklist.filter((i) => i !== licenseId);

                if (!this.incoming_blocklist.includes(licenseId)) {
                    this.incoming_blocklist.push(licenseId);
                }
            }
        }

        let incoming_blocklist_data = {
            blocklist_data: new API_BLOCKLIST_CONTENT(
                licenseId,
                this.content_data.contentId,
                this.content_data.playlistContentId,
            ),
            status: e.checked,
        };

        this.blocklist_changes.emit(incoming_blocklist_data);

        if (this.remove_in_blocklist.length > 0) {
            this.whitelisted.emit(true);
        } else {
            this.whitelisted.emit(false);
        }
    }

    cutString(e) {
        if (e.length > 30) {
            return e.substring(0, 30) + '...';
        } else {
            return e;
        }
    }
}
