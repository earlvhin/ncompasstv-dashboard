import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import {
    API_BLOCKLIST_CONTENT,
    API_CONTENT,
    API_HOST,
    API_LICENSE_PROPS,
    UI_PLAYLIST_BLOCKLIST_HOST_LICENSE,
} from 'src/app/global/models';

import { PlaylistService } from 'src/app/global/services';

@Component({
    selector: 'app-play-where',
    templateUrl: './play-where.component.html',
    styleUrls: ['./play-where.component.scss'],
})
export class PlayWhereComponent implements OnInit {
    @Input() content_data: UI_PLAYLIST_BLOCKLIST_HOST_LICENSE;
    @Input() toggleEvent: Observable<void>;
    @Input() is_child_frequency: boolean;
    @Output() blocklist_changes_saved = new EventEmitter();
    @Output() whitelisted = new EventEmitter();
    @Output() blacklist_data_ready = new EventEmitter();
    @Output() blacklist_count = new EventEmitter();

    toggleEvent_child: Subject<void> = new Subject<void>();
    add_in_blocklist = [];
    remove_in_blocklist = [];
    license_count: number = 0;
    licenses: any[] = [];
    blacklist_data: any[];
    content: API_CONTENT;
    host_licenses: [{ host: API_HOST; licenses: API_LICENSE_PROPS[] }];

    constructor(private _playlist: PlaylistService) {}

    ngOnInit() {
        if (this.content_data) {
            this.content = this.content_data.content;
            this.host_licenses =
                this.content_data.host_license.length > 0
                    ? this.content_data.host_license
                    : undefined;
        }

        this.toggleEvent.subscribe((data) => {
            this.toggleEvent_child.next(data);
        });

        if (this.host_licenses && this.host_licenses.length > 0) {
            this.host_licenses.forEach((host) => {
                if (host.licenses.length > 0) {
                    host.licenses.map((i) => this.licenses.push(i.licenseId));
                }
            });

            this.getBlacklistProperties();
        } else {
            this.blacklist_data = [];
            this.blacklist_data_ready.emit(this.blacklist_data);
        }

        this.toggleEvent.subscribe((data) => {
            this.toggleEvent_child.next(data);
        });
    }

    /**
     * Important
     * Put SCHEMA/MODEL of @param e
     */
    blacklistToggle(event: { blocklist_data: API_BLOCKLIST_CONTENT; status: boolean }) {
        // If Toggle is TRUE
        if (event.status == true) {
            // Add to blacklist array
            if (
                this.inBlacklistData(event.blocklist_data).length > 0 &&
                this.In_remove_in_blocklist(
                    this.inBlacklistData(event.blocklist_data)[0].blacklistedContentId,
                ) == 0
            ) {
                this.remove_in_blocklist.push({
                    blacklistedContentId: this.inBlacklistData(event.blocklist_data)[0]
                        .blacklistedContentId,
                });
            }

            if (this.In_add_in_blocklist(event.blocklist_data)) {
                this.RemoveIn_add_in_blocklist(event.blocklist_data);
            }
        }

        // If Toggle is FALSE
        if (event.status == false) {
            // Remove in remove_in_blocklist
            if (
                this.inBlacklistData(event.blocklist_data).length > 0 &&
                this.In_remove_in_blocklist(
                    this.inBlacklistData(event.blocklist_data)[0].blacklistedContentId,
                ) > 0
            ) {
                this.RemoveIn_remove_in_blocklist(
                    this.inBlacklistData(event.blocklist_data)[0].blacklistedContentId,
                );
            }

            // Add in add_in_blocklist
            if (this.inBlacklistData(event.blocklist_data).length == 0) {
                this.add_in_blocklist.push(event.blocklist_data);
            }
        }

        this.checkBlocklistData();
    }

    checkBlocklistData() {
        let blocklist_data = {
            incoming: this.add_in_blocklist,
            removing: this.remove_in_blocklist,
            status:
                this.add_in_blocklist.length > 0 || this.remove_in_blocklist.length > 0
                    ? true
                    : false,
        };

        this.blocklist_changes_saved.emit(blocklist_data);
    }

    getBlacklistProperties() {
        this._playlist
            .get_blacklisted_by_id(this.content_data.content.playlistContentId)
            .subscribe((data) => {
                this.blacklist_data = data.blacklistsContents || [];
                this.blacklist_data_ready.emit(this.blacklist_data);

                if (!data.message) {
                    const blacklisted = [];

                    this.blacklist_data.forEach((i) => {
                        if (this.licenses.includes(i.licenseId)) {
                            blacklisted.push(i);
                        }
                    });

                    this.blacklist_count.emit(blacklisted.length);
                } else {
                    this.blacklist_count.emit(0);
                }
            });
    }

    hasWhiteListed(e) {
        if (
            !e &&
            this.add_in_blocklist.length == this.license_count &&
            this.remove_in_blocklist.length == 0
        ) {
            this.whitelisted.emit(false);
        } else {
            this.whitelisted.emit(true);
        }
    }

    inBlacklistData(data: API_BLOCKLIST_CONTENT) {
        if (this.blacklist_data) {
            return this.blacklist_data.filter((i) => {
                if (i.licenseId == data.licenseId && i.contentId == data.contentId) {
                    return i;
                }
            });
        }

        return [];
    }

    In_add_in_blocklist(e) {
        return this.add_in_blocklist.filter((i) => {
            return i.playlistContentId == e.playlistContentId;
        }).length;
    }

    In_remove_in_blocklist(e) {
        return this.remove_in_blocklist.filter((i) => {
            return i.blacklistedContentId == e;
        }).length;
    }

    RemoveIn_remove_in_blocklist(e) {
        this.remove_in_blocklist = this.remove_in_blocklist.filter((i) => {
            return i.blacklistedContentId !== e;
        });
    }

    RemoveIn_add_in_blocklist(e) {
        this.add_in_blocklist = this.add_in_blocklist.filter((i) => {
            return i.licenseId !== e.licenseId && i.playlistContentId == e.playlistContentId;
        });
    }
}
