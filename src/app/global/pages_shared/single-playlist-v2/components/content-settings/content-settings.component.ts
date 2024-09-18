import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatTabChangeEvent } from '@angular/material';
import { takeUntil } from 'rxjs/internal/operators';
import { Subject } from 'rxjs';

import { API_CONTENT_V2, API_HOST, API_LICENSE_PROPS } from 'src/app/global/models';
import { SavePlaylistContentUpdate } from '../../models';
import { CONTENT_SCHEDULE_FORM_ERRORS } from '../../constants';
import { BlacklistUpdates } from '../../type/PlaylistContentUpdate';
import { SinglePlaylistService } from '../../services/single-playlist.service';
import { IsvideoPipe } from 'src/app/global/pipes';

@Component({
    selector: 'app-content-settings',
    templateUrl: './content-settings.component.html',
    styleUrls: ['./content-settings.component.scss'],
    providers: [IsvideoPipe],
})
export class ContentSettingsComponent implements OnInit, OnDestroy {
    allowBulkScheduleSet = false;
    contentSchedulerTabSelected = false;
    content: API_CONTENT_V2 = this.contentData.playlistContents[0];
    currentIndex = 0;
    errorCodes: string[] | null = [];
    errorMessage: string = '';
    hasImageAndFeed: boolean;
    hasWhitelistedAllHostLicenses = false;
    isFormInvalid = false;
    isChildFrequency = this.content.frequency === 0 || this.content.frequency === 22 || this.content.frequency === 33;
    toggleAll = new Subject<void>();
    loadingWhitelistedLicenses = true;
    noData = false;
    nextDisabled = false;
    prevDisabled = false;
    updatingView = false;
    whitelistedLicenses: string[] = [];
    whitelistedHosts: string[] = [];
    blacklist: BlacklistUpdates = {
        playlistContentId: '',
        licenses: [],
    };

    private hasSchedulerFormChanges = false;
    private hasPlayLocationChanges = false;

    private playlistContent: SavePlaylistContentUpdate = {
        hasSchedulerFormChanges: this.hasSchedulerFormChanges,
        hasPlayLocationChanges: this.hasPlayLocationChanges,
        isBulkUpdate: this.contentData.bulkSet,
        contentUpdates: [],
        blacklistUpdates: [
            {
                playlistContentId: '',
                licenses: [],
            },
        ],
    };

    protected ngUnsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public contentData: {
            playlistContents: API_CONTENT_V2[];
            playlistContentLength: number;
            hostLicenses: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[];
            noHostLicenses: boolean;
            bulkSet: boolean;
            hasExistingSchedule: boolean;
            scheduleType?: number;
            allContents?: API_CONTENT_V2[];
            index?: number;
        },
        public _dialogRef: MatDialogRef<ContentSettingsComponent>,
        private _playlist: SinglePlaylistService,
        private _video: IsvideoPipe,
    ) {}

    ngOnInit() {
        this.currentIndex = this.contentData.index || 0;
        this.playlistContent.blacklistUpdates[0].playlistContentId =
            this.contentData.playlistContents[0].playlistContentId;
        this.hasImageAndFeed = this.contentData.playlistContents.filter((p) => p.fileType !== 'webm').length > 0;
        this.subscribeToContentSchedulerFormChanges();
        this.subscribeToContentSchedulerFormValidity();
        /** Set initial state of prev and next buttons */
        if (this.contentData.index === 0) this.prevDisabled = true;
        if (this.contentData.index > this.contentData.allContents.length - 1) this.nextDisabled = true;
        if (this.contentData.bulkSet) {
            const mappedLicenses = this.mappedHostLicenses(this.contentData.hostLicenses);
            this.licensesToBlacklist(mappedLicenses);
        }

        if (this.contentData.hostLicenses.length && !this.contentData.noHostLicenses) {
            this.getPlaylistContentWhitelistData();
        } else {
            if (this.contentData.noHostLicenses) {
                this.noData = true;
                return;
            }

            this._playlist.hostLoaded$.subscribe({
                next: (res: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[]) => {
                    this.contentData.hostLicenses = res;
                    this.getPlaylistContentWhitelistData();
                },
            });
        }
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public resetChangeIndicators(): void {
        this.hasPlayLocationChanges = false;
        this.hasSchedulerFormChanges = false;
    }

    public savePlaylistChanges(): void {
        this.resetChangeIndicators();
        this._dialogRef.close(this.playlistContent);
    }

    public bulkScheduleSetAllow() {
        this.allowBulkScheduleSet = true;
    }

    public checkIfAllHostLicensesWhitelisted(licenseIds: string[]) {
        const whitelisted = licenseIds;
        const allHostLicenses = this.mappedHostLicenses(this.contentData.hostLicenses);
        this.hasWhitelistedAllHostLicenses = whitelisted.length === allHostLicenses.length;
        this.loadingWhitelistedLicenses = false;
        this.updatingView = false;
    }

    public convertDayFormat(days: any) {
        const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
        const convertedDays = [];

        for (const n of days) {
            if (n >= 0 && n <= 6) convertedDays.push(daysOfWeek[n]);
        }

        if (convertedDays[0] == 'S') convertedDays.push(convertedDays.shift());

        return convertedDays.join(', ');
    }

    private getPlaylistContentWhitelistData() {
        this.whitelistedLicenses = [];
        this.whitelistedHosts = [];

        if (this.contentData.bulkSet || (this.contentData && !this.contentData.hostLicenses)) {
            setTimeout(() => {
                this.loadingWhitelistedLicenses = false;
                this.updatingView = false;
            }, 350);

            return;
        }

        this._playlist.getWhitelistData(this.contentData.playlistContents[0].playlistContentId).subscribe({
            next: (res: { licensePlaylistContents?: any[]; message?: string }) => {
                if (!res.licensePlaylistContents || res.message) {
                    this.loadingWhitelistedLicenses = false;
                    this.updatingView = false;
                    return;
                }

                const whitelistedLicenses = res.licensePlaylistContents.map((i) => i.licenseId);
                const whitelistedHosts = res.licensePlaylistContents.map((i) => i.hostId);

                this.whitelistedLicenses = [...whitelistedLicenses];
                this.whitelistedHosts = [...whitelistedHosts];
                this.checkIfAllHostLicensesWhitelisted([...whitelistedLicenses]);
            },
        });
    }

    public getPlayTimesText(start: string, end: string) {
        return start && end ? `${start} - ${end}` : '--';
    }

    public licensesToBlacklist(licenseIds: string[]) {
        this.hasPlayLocationChanges = true;
        this.hasWhitelistedAllHostLicenses = false;

        /** Bulk Modify */
        if (this.contentData.bulkSet) {
            this.playlistContent.blacklistUpdates = this.contentData.playlistContents.map((c) => {
                return {
                    playlistContentId: c.playlistContentId,
                    licenses: licenseIds,
                };
            });

            return;
        }

        /** Single Modify */
        this.playlistContent.blacklistUpdates = [
            {
                playlistContentId: this.contentData.playlistContents[0].playlistContentId,
                licenses: [...licenseIds],
            },
        ];
    }

    public licensesToWhiteList(licenseIds: string[]) {
        this.hasPlayLocationChanges = true;
        /** Single Playlist Content Edit */
        if (!this.contentData.bulkSet) {
            this.playlistContent.blacklistUpdates = [];
            this.playlistContent.contentUpdates = [
                {
                    ...(this.playlistContent.contentUpdates && this.playlistContent.contentUpdates[0]),
                    licenseIds,
                    playlistContentId: this.contentData.playlistContents[0].playlistContentId,
                },
            ];

            return;
        }

        /** Multiple Playlist Content Edit, Duration applies to non video filetype only */
        const contentData: any = this.playlistContent.contentUpdates.length
            ? this.playlistContent.contentUpdates
            : this.contentData.playlistContents;
        this.playlistContent.blacklistUpdates = [];
        this.playlistContent.contentUpdates = contentData.map((p) => {
            return {
                ...p,
                playlistContentId: p.playlistContentId,
                licenseIds,
            };
        });
    }

    private mappedHostLicenses(data: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[]) {
        return data.reduce((result, i) => {
            i.licenses.forEach((l) => result.push(l.licenseId));
            return result;
        }, []);
    }

    public prev() {
        this.noData = false;

        if (this.currentIndex !== 0) {
            this.updatingView = true;
            this.currentIndex--;
            this.updateDialogData();
        }

        if (this.currentIndex === 0) this.prevDisabled = true;
        if (this.currentIndex < this.contentData.allContents.length - 1) this.nextDisabled = false;
    }

    public next() {
        this.noData = false;

        if (this.currentIndex < this.contentData.allContents.length - 1) {
            this.updatingView = true;
            this.currentIndex++;
            this.updateDialogData();
        }

        if (this.currentIndex >= this.contentData.allContents.length - 1) this.nextDisabled = true;
        if (this.currentIndex > 0) this.prevDisabled = false;
    }

    /**
     * @param basicSettings - Playlist content setting changes
     */
    public playlistContentModified(basicSettings: { duration?: number; frequency?: number; isFullScreen?: number }) {
        // simply parse frequency if it is of type string
        if (typeof basicSettings.frequency === 'string') basicSettings.frequency = parseInt(basicSettings.frequency);

        /** Single Playlist Content Edit */
        if (!this.contentData.bulkSet) {
            this.playlistContent.contentUpdates = [
                {
                    ...(this.playlistContent.contentUpdates && this.playlistContent.contentUpdates[0]),
                    ...basicSettings,
                    playlistContentId: this.contentData.playlistContents[0].playlistContentId,
                    duration: this._video.transform(this.contentData.playlistContents[0].fileType)
                        ? this.contentData.playlistContents[0].duration
                        : basicSettings.duration ||
                          (this.playlistContent.contentUpdates[0] && this.playlistContent.contentUpdates[0].duration),
                },
            ];
            return;
        }

        /** Multiple Playlist Content Edit, Duration applies to non video filetype only */
        const contentData: any = this.playlistContent.contentUpdates.length
            ? this.playlistContent.contentUpdates
            : this.contentData.playlistContents;
        this.playlistContent.contentUpdates = contentData.map((p) => {
            return {
                playlistContentId: p.playlistContentId,
                ...basicSettings,
                duration: this._video.transform(p.fileType) ? p.duration : basicSettings.duration || p.duration,
            };
        });
    }

    public tabChanged(e: MatTabChangeEvent): void {
        this.contentSchedulerTabSelected = e.tab.textLabel.toLowerCase().includes('content schedule');
    }

    private setErrorMessages(): void {
        if (!this.errorCodes) return;

        const errorMessagesMap = {
            [CONTENT_SCHEDULE_FORM_ERRORS.invalid_dates]: 'Invalid dates!',
            [CONTENT_SCHEDULE_FORM_ERRORS.invalid_play_times]: 'Invalid hours!',
            [CONTENT_SCHEDULE_FORM_ERRORS.no_days_selected]: 'No days selected!',
        };

        const messages = this.errorCodes.map((code) => errorMessagesMap[code] || 'Form data is invalid!');

        this.errorMessage = messages.join(', ');
    }

    private subscribeToContentSchedulerFormChanges() {
        this._playlist.schedulerFormUpdated.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
            next: (response) => {
                this.hasSchedulerFormChanges = true;
                this.playlistContent.contentUpdates = this.playlistContent.contentUpdates.map((contentUpdate) => {
                    contentUpdate.schedule = this._playlist.mapScheduleFromUiContent(
                        response,
                        contentUpdate.playlistContentId,
                        this.contentData.playlistContents,
                    );
                    return contentUpdate;
                });
            },
        });
    }

    private subscribeToContentSchedulerFormValidity(): void {
        this._playlist.contentSchedulerFormValidity.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
            next: (response) => {
                setTimeout(() => {
                    this.isFormInvalid = response.isInvalid;
                    this.errorCodes = response.errors;
                    this.setErrorMessages();
                }, 0);
            },
        });
    }

    public setFrequencyIcon(data: number) {
        return data > 0 && data > 10 ? 'fa-chess-queen' : 'fa-chess-pawn';
    }

    private updateDialogData(): void {
        const playlistContent = this.contentData.allContents[this.currentIndex];
        this.content = playlistContent;
        this.isChildFrequency =
            this.content.frequency === 0 || this.content.frequency === 22 || this.content.frequency === 33;
        this.contentData.playlistContents = [playlistContent];
        this.contentData.hasExistingSchedule = playlistContent && playlistContent.type === 3;
        this.contentData.scheduleType = playlistContent.type;
        this.getPlaylistContentWhitelistData();
    }

    public isFillerContent(content: API_CONTENT_V2): boolean {
        if (!content) return;
        return content.classification === 'filler-v2';
    }
}
