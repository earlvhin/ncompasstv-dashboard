import { FormControl } from '@angular/forms';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatTabChangeEvent } from '@angular/material';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_CONTENT_V2, API_HOST, API_LICENSE_PROPS, UI_ROLE_DEFINITION } from 'src/app/global/models';
import { CONTENT_SCHEDULE_FORM_ERRORS } from '../../constants';
import { CONTENT_TYPE } from '../../constants/ContentType';
import { SinglePlaylistService } from '../../services/single-playlist.service';
import { AddPlaylistContent } from '../../class/AddPlaylistContent';
import { ButtonGroup } from '../../type/ButtonGroup';
import { AuthService, FillerService } from 'src/app/global/services';

@Component({
    selector: 'app-add-content',
    templateUrl: './add-content.component.html',
    styleUrls: ['./add-content.component.scss'],
})
export class AddContentComponent implements OnInit, OnDestroy {
    activeEdits: boolean;
    activeFiller = this._dialog_data.role;
    assets: API_CONTENT_V2[] = [];
    contentSchedulerTabSelected = false;
    contentTypesBtnGroup: ButtonGroup[] = CONTENT_TYPE;
    currentPage = 1;
    currentContentSettings = {};
    currentLicenseIdsToggled: string[] = [];
    errorCodes: string[] | null = [];
    errorMessage = '';
    excludedFillers = [];
    fillerGroups: API_CONTENT_V2[] = [];
    fillerTabActive = false;
    floating_assets: API_CONTENT_V2[] = [];
    gettingHostData = true;
    gridCount = 8;
    hasImageAndFeed: boolean;
    hasSelectedAllHostLicenses = false;
    isAllFillers = false;
    isFormInvalid = false;
    markedContent: API_CONTENT_V2;
    mode = 'add';
    newContent = new AddPlaylistContent();
    noFillerGroups = false;
    noData = this._dialog_data.assets.length === 0;
    noHostData = false;
    pageLimit = 0;
    paginating = false;
    playlistHostLicenses: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[] = [];
    searchInput = new FormControl('');
    searching = false;
    selectedContentType: ButtonGroup = this.contentTypesBtnGroup[0];
    selectedContents: API_CONTENT_V2[] = [];
    selectedFillerPlaylistId = [];
    toggleAll = new Subject<void>();
    validatingFillers = false;

    protected ngUnsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public _dialog_data: {
            assets: API_CONTENT_V2[];
            floatingAssets: API_CONTENT_V2[];
            fillerGroups: { admin: API_CONTENT_V2[]; dealer: API_CONTENT_V2[]; dealerAdmin: API_CONTENT_V2[] };
            dealerId: string;
            isDealer: boolean;
            isDealerAdmin: boolean;
            hostLicenses: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[];
            noHostLicenses: boolean;
            playlistContentId: string;
            playlistId: string;
            role: number;
            mode: 'add' | 'swap';
        },
        private _auth: AuthService,
        private _playlist: SinglePlaylistService,
        private _filler: FillerService,
    ) {}

    ngOnInit() {
        this.assets = [...this._dialog_data.assets];
        this.floating_assets = [...this._dialog_data.floatingAssets];
        this.fillerGroups = this._dialog_data.isDealerAdmin
            ? [...this._dialog_data.fillerGroups.dealerAdmin]
            : this._dialog_data.isDealer
              ? [...this._dialog_data.fillerGroups.dealer]
              : [...this._dialog_data.fillerGroups.admin];
        this.playlistHostLicenses = this._dialog_data.hostLicenses ? [...this._dialog_data.hostLicenses] : [];
        this.newContent.playlistId = this._dialog_data.playlistId;

        this.contentTypesBtnGroup = [
            ...this.contentTypesBtnGroup.map((b) => {
                if (b.slug === 'floating-content' && !this._isAdmin) {
                    return {
                        ...b,
                        show: false,
                    };
                }

                return b;
            }),
        ];

        /** Watch Contents Readiness */
        this._playlist.contentLoaded$.subscribe({
            next: (res: API_CONTENT_V2[]) => {
                if (!this.assets.length) this.assets = res;
            },
        });

        /** Watch Hosts Data Readiness */
        if (this._dialog_data.hostLicenses.length) {
            this.playlistHostLicenses = this._dialog_data.hostLicenses;
        } else {
            if (this._dialog_data.noHostLicenses) {
                this.noHostData = true;
                return;
            }

            this._playlist.hostLoaded$.subscribe({
                next: (res: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[]) => {
                    this.gettingHostData = false;
                    if (!res.length) {
                        this.noHostData = true;
                        return;
                    }

                    this.playlistHostLicenses = res;
                    this.noHostData = false;

                    console.log(this.playlistHostLicenses, this.noHostData);
                },
            });
        }

        this.subscribeToContentScheduleFormChanges();
        this.subscribeToContentSchedulerFormValidity();
        this.searchInit();
        this.mode = this._dialog_data.mode;
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public applyContentSettings(settingsData: any): void {
        if (!settingsData) return;

        this.currentContentSettings = settingsData;
        this.newContent.playlistContentsLicenses = [
            ...this.newContent.playlistContentsLicenses.map((c, index) => ({
                ...c,
                ...settingsData,
                seq: index,
                duration:
                    c.classification == 'filler-v2'
                        ? typeof c.duration === 'string'
                            ? parseInt(c.duration)
                            : c.duration
                        : c.fileType !== 'webm'
                          ? settingsData.duration
                          : c.duration,
            })),
        ];

        this.licenseIdToggled(this.currentLicenseIdsToggled);
    }

    public contentControlClicked(data: { action: string; playlistContent: API_CONTENT_V2 }) {
        switch (data.action) {
            case 'remove':
                this.selectedContents = [
                    ...this.selectedContents.filter((c) => c.contentId !== data.playlistContent.contentId),
                ];

                break;
            default:
                break;
        }

        this.prepareDataToAddInPlaylist();
    }

    public get noContentToAdd(): boolean {
        return this.noContentsSelected && this.noNewContent;
    }

    private get noContentsSelected(): boolean {
        return !this.selectedContents.length;
    }

    private get noNewContent(): boolean {
        return !this.newContent;
    }

    public onStepChange(e: StepperSelectionEvent): void {
        // If not the step we want then ignore
        if (!e.selectedIndex) return;

        // If no fillers added then ignore
        if (!this.newContent.playlistContentsLicenses.filter((i) => i.fillerPlaylistId).length) return;

        // If fillers are added, check validity of fillers
        this.validatingFillers = true;
        this._playlist.addContent(this.newContent, true).subscribe(
            (data: { excludedFillers: string[] }) => {
                this.excludedFillers = data.excludedFillers;
                this.validatingFillers = false;
            },
            (error) => console.error(`Something went wrong validating incoming playlist contents: ${error}`),
        );
    }

    public tabChanged(e: MatTabChangeEvent): void {
        this.contentSchedulerTabSelected = e.tab.textLabel.toLowerCase().includes('content schedule');
        this.licenseDeselected([]);
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

    private checkIfAllHostLicensesWhitelisted(licenseIds: string[]) {
        const whitelisted = licenseIds;
        const allHostLicenses = this.mappedHostLicenses(this.playlistHostLicenses);
        this.hasSelectedAllHostLicenses = whitelisted.length === allHostLicenses.length;
    }

    public contentSelected(content: API_CONTENT_V2, e: { target: { checked: boolean } }): void {
        if (!e.target.checked) {
            this.selectedContents = this.selectedContents.filter((i) =>
                content.fillerPlaylistId
                    ? i.fillerPlaylistId !== content.fillerPlaylistId
                    : i.contentId !== content.contentId,
            );

            if (content.fillerPlaylistId) {
                this.selectedFillerPlaylistId = this.selectedFillerPlaylistId.filter(
                    (i) => i !== content.fillerPlaylistId,
                );
            }

            if (this.selectedContents.length === 0) {
                this.currentLicenseIdsToggled = [];
                this.hasSelectedAllHostLicenses = false;
                this.newContent.playlistContentsLicenses = [];
                this.selectedFillerPlaylistId = [];
            }

            return;
        }

        if (content.fillerPlaylistId) {
            this.getFillerDetails(content.fillerPlaylistId, true);
        } else {
            this.selectedContents.push(content);
        }

        this.prepareDataToAddInPlaylist(true);
    }

    public checkIfSelectedFiller(content: API_CONTENT_V2): boolean {
        if (!content || !content.hasOwnProperty('fillerPlaylistId')) return;
        const isSelected = this.selectedFillerPlaylistId.includes(content.fillerPlaylistId);
        if (isSelected) return true;
    }

    private prepareDataToAddInPlaylist(added: boolean = false): void {
        const schedule = { type: 1 };

        this.newContent.playlistContentsLicenses = [
            ...this.selectedContents.map((c, index) => {
                return {
                    fillerPlaylistId: c.fillerPlaylistId,
                    classification: c.fillerPlaylistContentId ? 'filler-v2' : null,
                    contentId: c.contentId,
                    duration: c.fileType !== 'webm' ? c.duration || 20 : c.duration,
                    fileType: c.fileType,
                    isFullScreen: 0,
                    licenseIds: [],
                    seq: index,
                    ...schedule,
                };
            }),
        ];

        if (added) {
            this.applyContentSettings(this.currentContentSettings);
        }

        const fillers = this.selectedContents.find((p) => p.fillerPlaylistContentId);
        const nonFillers = this.selectedContents.find((p) => !p.fillerPlaylistContentId);
        this.isAllFillers = !!fillers && !nonFillers;
        this.hasImageAndFeed = this.selectedContents.filter((p) => p.fileType !== 'webm').length > 0;
    }

    private getFillerDetails(id: string, checked: boolean): void {
        if (!checked) {
            this.selectedContents = this.selectedContents.filter((content) => content.fillerPlaylistId !== id);
            let index = this.selectedFillerPlaylistId.indexOf(id);
            if (index !== -1) this.selectedFillerPlaylistId.splice(index, 1);
            return;
        }

        this._filler
            .get_single_filler_feeds_placeholder(id)
            .subscribe(
                (fillers: any) => {
                    if ('message' in fillers) return;

                    fillers.data.map((filler) => {
                        this.selectedContents.push(filler);
                    });
                },
                (error) => {
                    console.error(error);
                },
            )
            .add(() => {
                this.prepareDataToAddInPlaylist();
                this.selectedFillerPlaylistId.push(id);
            });
    }

    private getContents(floating: boolean = false, page: number = 1, pageSize: number = 60, searchKey?: string) {
        if ((this.pageLimit > 0 && this.currentPage > this.pageLimit) || this.noData) {
            this.paginating = false;
            return;
        }

        this.noData = false;
        const dealerId = floating ? null : this._dialog_data.dealerId;

        this._playlist
            .contentFetch({
                dealerId,
                floating,
                page,
                pageSize,
                searchKey,
            })
            .subscribe({
                next: (response: {
                    iContents?: API_CONTENT_V2[];
                    contents?: API_CONTENT_V2[];
                    paging?: any;
                    message?: string;
                }) => {
                    // if no data from the server
                    if ('message' in response) {
                        this.noData = true;
                        this.searching = false;
                        this.paginating = false;
                        return;
                    }

                    const getContentsResponse = floating ? response.iContents : response.contents;

                    // if no results after searching
                    if (getContentsResponse.length <= 0) {
                        this.noData = true;
                        this.searching = false;
                        this.paginating = false;
                        return;
                    }

                    // if switched tabs after scrolling
                    if (
                        (floating && this.selectedContentType.slug !== 'floating-content') ||
                        (!floating && this.selectedContentType.slug === 'floating-content')
                    ) {
                        this.getContents(false);
                        return;
                    }

                    // set paging limit
                    if (response.paging) {
                        this.pageLimit = response.paging.pages;
                    }

                    /** Paginating */
                    if (page > 1 && page <= this.pageLimit) {
                        /** Regular Contents */
                        if (response.contents && response.contents.length) {
                            this.assets = [...this.assets, ...response.contents];
                        }

                        /** Floating Contents */
                        if (response.iContents && response.iContents.length) {
                            this.assets = [...this.floating_assets, ...response.iContents];
                        }
                        this.paginating = false;
                        this.searching = false;
                        return true;
                    }

                    this.assets = [...getContentsResponse];
                    this.searching = false;
                },
            });
    }

    public getAllFillerGroups(role: number, searchKey: string): void {
        this.activeFiller = role;
        this.searching = true;
        this.noData = false;
        this.fillerGroups =
            role === 1
                ? this._dialog_data.fillerGroups.admin
                : role === 2
                  ? this._dialog_data.fillerGroups.dealer
                  : this._dialog_data.fillerGroups.dealerAdmin;

        setTimeout(() => {
            if (!this.fillerGroups.length) {
                this.noFillerGroups = true;
                this.assets = [];
                this.noData = true;
            }

            this.assets = this.fillerGroups;
            this.searching = false;
            this.paginating = false;
        }, 350);
    }

    public licenseIdToggled(licenseIds: string[]) {
        if (!licenseIds.length) return;

        this.currentLicenseIdsToggled = [...licenseIds];

        this.checkIfAllHostLicensesWhitelisted(licenseIds);

        this.newContent.playlistContentsLicenses = this.newContent.playlistContentsLicenses.map((c) => {
            if (!c.licenseIds) c.licenseIds = [];
            return { ...c, licenseIds };
        });
    }

    public licenseDeselected(licenseIds: string[]) {
        if (licenseIds) {
            this.currentLicenseIdsToggled = [
                ...this.currentLicenseIdsToggled.filter((license: string) => !licenseIds.includes(license)),
            ];
        }

        this.hasSelectedAllHostLicenses = false;

        /** Set deselected */
        this.licenseIdToggled(this.currentLicenseIdsToggled);
    }

    public markContent(content: API_CONTENT_V2) {
        if (!this._dialog_data.playlistContentId) return;
        this.markedContent = content;
    }

    private mappedHostLicenses(data: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[]) {
        return data.reduce((result, i) => {
            i.licenses.forEach((l) => result.push(l.licenseId));
            return result;
        }, []);
    }

    public onScroll(e: any): void {
        if (this.paginating) return;

        if (e.target.scrollTop + e.target.clientHeight + 1 >= e.target.scrollHeight) {
            this.paginating = true;
            this.currentPage += 1;
            const floating = this.selectedContentType.slug == 'floating-content';
            this.getContents(floating, this.currentPage, 60);
        }
    }

    public onSelectContentType(data: ButtonGroup) {
        if (data === this.selectedContentType) return;

        this.assets = [];
        this.fillerTabActive = false;
        this.selectedContentType = data;
        this.paginating = false;
        this.searching = true;
        this.currentPage = 1;
        const currentSearchKey = this.searchInput.value as string;
        const hasSearchKey = currentSearchKey.length && currentSearchKey.length > 0;

        switch (this.selectedContentType.slug) {
            case 'dealer-content':
                if (hasSearchKey) this.getContents(false, 1, 60, currentSearchKey);
                else this.assets = [...this._dialog_data.assets];
                break;
            case 'floating-content':
                if (hasSearchKey) this.getContents(true, 1, 60, currentSearchKey);
                else this.assets = [...this.floating_assets];
                break;
            case 'filler-contents':
                this.fillerTabActive = true;
                this.assets = hasSearchKey
                    ? [
                          ...this.fillerGroups.filter((obj) =>
                              obj.name.toLowerCase().includes(currentSearchKey.toLowerCase()),
                          ),
                      ]
                    : [...this.fillerGroups];
                break;
            default:
                break;
        }

        this.noData = !this.assets.length;

        setTimeout(() => {
            if (hasSearchKey && !this.fillerTabActive) return;
            this.searching = false;
        }, 350);
    }

    private searchInit() {
        this.searchInput.valueChanges.pipe(takeUntil(this.ngUnsubscribe), debounceTime(1000)).subscribe({
            next: (searchKey) => {
                const floating = this.selectedContentType.slug == 'floating-content';
                const filler = this.selectedContentType.slug == 'filler-contents';

                if (!filler) {
                    if (searchKey.length) {
                        this.searching = true;
                        this.getContents(floating, null, null, searchKey);
                        return;
                    }

                    this.assets = floating ? [...this.floating_assets] : [...this._dialog_data.assets];
                    this.searching = false;
                } else {
                    this.assets = searchKey
                        ? this.fillerGroups.filter((obj) => obj.name.toLowerCase().includes(searchKey.toLowerCase()))
                        : [...this.fillerGroups];
                    this.searching = false;
                }
            },
        });
    }

    private subscribeToContentScheduleFormChanges() {
        this._playlist.schedulerFormUpdated.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
            next: (response) => {
                const contents = Array.from(this.newContent.playlistContentsLicenses);
                const mappedSchedule = this._playlist.mapScheduleFromUiContent(response);

                this.newContent.playlistContentsLicenses = contents.map((c) => {
                    return {
                        ...c,
                        ...(c.classification !== 'filler-v2' && mappedSchedule),
                    };
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

    protected get _isAdmin() {
        return this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.administrator;
    }
}
