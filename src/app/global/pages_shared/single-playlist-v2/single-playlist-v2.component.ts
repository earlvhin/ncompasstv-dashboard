import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Observable, Subject, forkJoin } from 'rxjs';
import { Sortable } from 'sortablejs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import * as io from 'socket.io-client';

import {
    API_CONTENT,
    API_HOST,
    API_LICENSE_PROPS,
    API_SCREEN_OF_PLAYLIST,
    API_UPDATED_PLAYLIST_CONTENT,
    API_CONTENT_V2,
    API_PLAYLIST_V2,
    UI_ROLE_DEFINITION_TEXT,
    UI_PLAYLIST_SCREENS_NEW,
    PlaylistContentSchedule,
} from 'src/app/global/models';

import {
    PlaylistPrimaryControlActions as pActions,
    PlaylistPrimaryControls,
    PlaylistContentControlActions as pcActions,
    PlaylistFiltersDropdown,
    PlaylistViewOptions,
    PlaylistViewOptionActions,
    PlaylistFilterActions,
    PlaylistPrimaryControlActions,
    PLAYLIST_SETTING_ACTIONS as pSettingAction,
    PLAYLIST_SETTING_BUTTONS,
    PlaylistFilterLabels,
} from './constants';

import { FEED_TYPES, IMAGE_TYPES, VIDEO_TYPES } from '../../constants/file-types';
import { SinglePlaylistService } from './services/single-playlist.service';
import { AuthService, FillerService } from '../../services';
import { ContentSettingsComponent } from './components/content-settings/content-settings.component';
import { AddContentComponent } from './components/add-content/add-content.component';
import { PlaylistContent, PlaylistContentUpdate } from './type/PlaylistContentUpdate';
import { QuickMoveComponent } from './components/quick-move/quick-move.component';
import { IsvideoPipe } from '../../pipes';
import { SpacerSetupComponent } from './components/spacer-setup/spacer-setup.component';
import { SavePlaylistContentUpdate } from './models';
import { AddPlaylistContent } from './class/AddPlaylistContent';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { environment } from 'src/environments/environment';
import {
    ClonePlaylistComponent,
    PlaylistDemoComponent,
    PlaylistEditModalComponent,
} from '../../components_shared/playlist_components';

@Component({
    selector: 'app-single-playlist-v2',
    templateUrl: './single-playlist-v2.component.html',
    styleUrls: ['./single-playlist-v2.component.scss'],
    providers: [IsvideoPipe],
})
export class SinglePlaylistV2Component implements OnInit, OnDestroy {
    @ViewChild('draggables', { static: false }) draggables: ElementRef<HTMLCanvasElement>;

    assets: API_CONTENT_V2[] = [];
    assetsFetched = false;
    contentStatusBreakdown = [];
    currentFilters: { type: string; status: string; keyword: string } = {
        type: null,
        status: null,
        keyword: null,
    };
    isInMarkedAllState = false;
    detailedViewMode = false;
    enabledPlaylistContentControls = [];
    feedCount = 0;
    fillerCount = 0;
    floatingAssets: API_CONTENT_V2[] = [];
    fillersFetched = false;
    fillerGroups: { admin: API_CONTENT_V2[]; dealer: API_CONTENT_V2[]; dealerAdmin: API_CONTENT_V2[] } = {
        admin: [],
        dealer: [],
        dealerAdmin: [],
    };
    hostLicenses: any;
    hostURL = '';
    hosts: API_HOST[];
    imageCount = 0;
    isFiltered: { type: boolean; status: boolean; keyword: boolean } = {
        type: false,
        status: false,
        keyword: false,
    };
    licenseURL = '';
    licenses: API_LICENSE_PROPS[];
    licensesToUpdate: any[] = [];
    playlist: API_PLAYLIST_V2['playlist'];
    playlistContentBreakdown = [];
    playlistContentControls = ['fullscreen', 'quick-move', 'swap-content', 'edit', 'remove'];
    playlistContents: API_CONTENT_V2[] = [];
    playlistContentsToSave = [];
    playlistControls = PlaylistPrimaryControls;
    playlistDataNotFound = false;
    playlistDescription = 'Getting playlist data';
    playlistFilters = PlaylistFiltersDropdown;
    playlistFilterLabels = PlaylistFilterLabels;
    playlistHostLicenses: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[] = [];
    playlistHostLicensesLoaded = false;
    playlistLicenseIds: string[] = [];
    playlistName = 'Please wait';
    playlistScreenTable: any;
    playlistScreens: API_SCREEN_OF_PLAYLIST[] = [];
    playlistSequenceUpdates: PlaylistContent[] = [];
    playlistSettings = PLAYLIST_SETTING_BUTTONS;
    playlistSortableOrder: string[] = [];
    playlistViews = PlaylistViewOptions;
    role = '';
    savingPlaylist = false;
    screenTableColumns = ['#', 'Screen Title', 'Dealer', 'Host', 'Type', 'Template', 'Created By'];
    screens: API_SCREEN_OF_PLAYLIST[];
    searchForm = new FormControl();
    selectedPlaylistContents = [];
    sortablejs: any;
    sortablejsTriggered: Subject<boolean> = new Subject<boolean>();
    videoCount = 0;

    private _socket: any;
    private playlistContentsBackup: API_CONTENT_V2[] = [];
    private playlistId: string;
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _filler: FillerService,
        private _isVideo: IsvideoPipe,
        private _playlist: SinglePlaylistService,
        private _router: Router,
    ) {}

    ngOnInit() {
        this._socket = io(environment.socket_server, {
            transports: ['websocket'],
            query: 'client=Dashboard__SinglePlaylistComponent',
        });

        this._socket.on('connect', () => {});
        this._socket.on('disconnect', () => {});
        this.playlistRouteInit();

        this.role = this.currentRole;
        if (this.role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            this.role = UI_ROLE_DEFINITION_TEXT.administrator;
        }

        this.enabledPlaylistContentControls = [...this.playlistContentControls];
        this.hostURL = `/${this.role}/hosts/`;
        this.licenseURL = `/${this.role}/licenses/`;
        this.setDefaultViewButton();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    private addContents(data: AddPlaylistContent) {
        this.playlist = null;

        this._playlist
            .addContent(data)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe({
                next: (res) => {
                    this.playlistRouteInit();
                },
                error: (err) => console.error('Error adding contents to playlist', err),
            });
    }

    public addToLicenseToPush(e: { checked: boolean }, licenseId: string) {
        if (e.checked && !this.licensesToUpdate.includes(licenseId))
            this.licensesToUpdate.push({ licenseId: licenseId });
        else this.licensesToUpdate = this.licensesToUpdate.filter((i) => i.licenseId !== licenseId);
    }

    public contentControlClicked(e: { playlistContent: any; action: string }, index: number) {
        switch (e.action) {
            case pcActions.remove:
                this.showRemoveContentDialog(e.playlistContent);
                break;
            case pcActions.edit:
                this.playlistContentSettings([e.playlistContent], false, index);
                break;
            case pcActions.fullscreen:
                this.setFullscreenProperty(e.playlistContent);
                break;
            case pcActions.quickMove:
                this.playlistContentQuickMove(e.playlistContent);
                break;
            case pcActions.swapContent:
                this.showAddContentDialog(e.playlistContent);
                break;
            default:
                break;
        }
    }

    public filterContent(filterType: string, filterValue: string) {
        switch (filterType) {
            case PlaylistFilterActions.contentType:
                this.currentFilters.type = filterValue;
                break;

            case PlaylistFilterActions.contentStatus:
                this.currentFilters.status = filterValue;
                break;

            default:
                this.currentFilters.keyword = filterValue;
        }

        const filterByKeyword = (c: API_CONTENT_V2) => {
            if (!this.currentFilters.keyword || this.currentFilters.keyword.trim().length <= 0)
                return Array.from(this.playlistContentsBackup);
            return c.fileName && c.fileName.toLowerCase().includes(this.currentFilters.keyword.toLowerCase());
        };

        const filterByContentType = (c: API_CONTENT_V2) => {
            const filter = this.currentFilters.type;

            switch (filter) {
                case 'image':
                    return IMAGE_TYPES.includes(c.fileType) && !this.isFillerChecker(c);
                case 'video':
                    return VIDEO_TYPES.includes(c.fileType) && !this.isFillerChecker(c);
                case 'feed':
                    return FEED_TYPES.includes(c.fileType) && !this.isFillerChecker(c);
                case 'filler':
                    return this.isFillerChecker(c);
                default:
                    return Array.from(this.playlistContentsBackup);
            }
        };

        const filterByStatus = (c: API_CONTENT_V2) => {
            const filter = this.currentFilters.status;

            switch (filter) {
                case 'active':
                    return c.scheduleStatus === 'active' || c.scheduleStatus === 'scheduled';
                case 'inactive':
                    return c.scheduleStatus === 'inactive';
                case 'in-queue':
                    return c.scheduleStatus === 'future';
                case 'scheduled':
                    return c.scheduleStatus === 'scheduled';
                default:
                    return Array.from(this.playlistContentsBackup);
            }
        };

        let result = Array.from(this.playlistContentsBackup);

        if (this.currentFilters.status === 'scheduled') {
            result = result
                .filter(filterByKeyword)
                .filter(filterByContentType)
                .filter((c) => c.scheduleStatus !== 'active');
        } else {
            result = result.filter(filterByKeyword).filter(filterByContentType).filter(filterByStatus);
        }

        this.playlistContents = [...result];
    }

    private getAssets() {
        const requests = [];

        const dealerContentConfig = {
            page: 1,
            pageSize: 60,
            dealerId: this.playlist.dealerId,
        };

        const floatingContentConfig = {
            page: 1,
            pageSize: 60,
            floating: true,
        };

        requests.push(this._playlist.contentFetch(dealerContentConfig));
        if (this.isAdmin) requests.push(this._playlist.contentFetch(floatingContentConfig));

        forkJoin(requests).subscribe({
            next: ([dealerContents, floatingContents]: [
                { contents?: API_CONTENT_V2[]; page?: any; message?: string },
                { iContents: API_CONTENT_V2[]; page: any },
            ]) => {
                this.assetsFetched = true;
                dealerContents.contents = 'message' in dealerContents ? [] : dealerContents.contents;
                this.assets = dealerContents.contents;
                if (floatingContents && floatingContents.iContents.length)
                    this.floatingAssets = floatingContents.iContents;

                if (this.assetsFetched && this.fillersFetched) {
                    this.playlistControls = this.playlistControls.map((p) => {
                        /** Add Bulk Button Actions Here */
                        if (p.action == pActions.addContent)
                            return {
                                ...p,
                                icon: this.assetsFetched && this.fillersFetched ? 'fas fa-plus' : 'fas fa-ban',
                                disabled: !this.assetsFetched || !this.fillersFetched,
                            };
                        return p;
                    });
                }

                /** Send signal */
                this._playlist.contentReady(dealerContents.contents);
            },
            error: (error) => {
                throw Error(error);
            },
        });
    }

    private getAssetCount(): void {
        const fileTypes = (type: string) => this.getFileTypesByTypeName(type);
        this.videoCount = this.playlistContents.filter(
            (i) => fileTypes('video').includes(i.fileType.toLowerCase()) && !this.isFillerChecker(i),
        ).length;
        this.imageCount = this.playlistContents.filter(
            (i) => fileTypes('image').includes(i.fileType.toLowerCase()) && !this.isFillerChecker(i),
        ).length;
        this.feedCount = this.playlistContents.filter(
            (i) => fileTypes('feed').includes(i.fileType.toLowerCase()) && !this.isFillerChecker(i),
        ).length;
        this.fillerCount = this.playlistContents.filter((i) => this.isFillerChecker(i)).length;
        this.playlistContentBreakdown = [
            { label: 'Content Count', total: this.playlistContents.length },
            { label: 'All Videos', total: this.videoCount },
            { label: 'All Images', total: this.imageCount },
            { label: 'All Feeds', total: this.feedCount },
            { label: 'All Fillers', total: this.fillerCount },
        ];
    }

    public isFillerChecker(content): boolean {
        return content.classification === 'filler-v2';
    }

    private getFileTypesByTypeName(data: string) {
        switch (data) {
            case 'image':
                return IMAGE_TYPES;

            case 'video':
                return VIDEO_TYPES;

            default:
                return FEED_TYPES;
        }
    }

    private getPlaylistData(playlistId: string) {
        this._playlist.getPlaylistData(playlistId).subscribe({
            next: (response: API_PLAYLIST_V2) => {
                if ('message' in response) {
                    this.playlist = null;
                    this.playlistDataNotFound = true;
                    return;
                }

                // if (!response.playlist.isMigrated) { DISABLE V2 REDIRECT FOR NOW
                if (response.playlist.isMigrated) {
                    // Redirect playlist to v1 page if not migrated yet
                    this._router.navigate([`${this.role}/playlists/${response.playlist.playlistId}`]);
                    return;
                }

                const data = response as API_PLAYLIST_V2;
                const { playlist, playlistContents } = data;
                const { playlistName, playlistDescription } = playlist;

                /** This call should only return playlist related data like the ones below */
                this.playlist = playlist;

                // Fix video thumbnail of filler video
                playlistContents.map((contents) => {
                    if (this.isFillerChecker(contents) && contents.fileType === 'webm') {
                        let thumbnailUrl = contents.thumbnail.split('/https')[0];
                        contents.url = `${thumbnailUrl}${'/' + contents.url}`;
                    }
                });

                /** Making sure playlist contents are ordered properly */
                this.playlistContents = this.preparePlaylistContents(playlistContents);
                this.playlistContentsBackup = Array.from(this.playlistContents);
                this.playlistName = playlistName;
                this.playlistDescription = playlistDescription;

                /** These data should be coming from another API call but since they're included ... */
                // this.screens = data.screens;
                // this.hostLicenses = data.hostLicenses;
                // this.licenses = data.licenses;

                /** Get Filler Data */
                this.getAllFillerGroups();

                /** Get Assets */
                this.getAssets();

                /** Get Asset Count By Type */
                this.getAssetCount();

                /** Initialize search form watch */
                this.searchFormInit();

                /** Set Bulk Controls State */
                this.setBulkControlsState();

                /** Initialize SortableJS */
                setTimeout(() => this.sortableJSInit(), 0);
            },
            error: (error) => {
                throw Error(error);
            },
        });
    }

    private getPlaylistHostLicenses(playlistId: string) {
        this._playlist.getPlaylistHosts(playlistId).subscribe({
            next: (res) => {
                this.playlistHostLicenses = res;
                this.playlistHostLicensesLoaded = true;
                const result = res
                    .filter(({ licenses }) => licenses.length > 0)
                    .map(({ licenses }) => licenses.map((license) => license.licenseId));
                this.playlistLicenseIds = [].concat(...result);

                /** Send signal */
                this._playlist.hostsReady(res);
            },
            error: (error) => {
                throw Error(error);
            },
        });
    }

    private getPlaylistScreens(playlistId: string) {
        return this._playlist
            .getPlaylistScreens(playlistId)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    this.playlistScreens = response.screens;
                    this.mapToTable(this.playlistScreens);
                },
                (error) => {
                    throw new Error(error);
                },
            );
    }

    private mapToTable(screens) {
        let counter = 1;
        let role = this.currentRole;
        if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            role = UI_ROLE_DEFINITION_TEXT.administrator;
        }
        if (screens) {
            this.playlistScreenTable = [];
            this.playlistScreenTable = screens.map((i) => {
                return new UI_PLAYLIST_SCREENS_NEW(
                    { value: i.screenId, link: null, editable: false, hidden: true },
                    { value: counter++, link: null, editable: false, hidden: false },
                    {
                        value: i.screenName,
                        link: `/` + role + `/screens/` + i.screenId,
                        editable: false,
                        hidden: false,
                        new_tab_link: true,
                    },
                    { value: i.businessName, link: null, editable: false, hidden: false },
                    { value: i.hostName, link: null, editable: false, hidden: false },
                    { value: i.screenTypeName || '--', link: null, editable: false, hidden: false },
                    { value: i.templateName, link: null, editable: false, hidden: false },
                    { value: i.createdBy, link: null, editable: false, hidden: false },
                );
            });
        } else {
            this.playlistScreenTable = {
                message: 'No Screens Available',
            };
        }
    }

    private movePlaylistContent(playlistContentId: string, seq: number) {
        // Get source index and the playlist content to move
        const playlistContentSrcIndex = this.playlistContents.findIndex(
            (i: PlaylistContent) => playlistContentId == i.playlistContentId,
        );
        const playlistContentToMove = this.playlistContents[playlistContentSrcIndex];

        // Remove the object from the source index
        this.playlistContents.splice(playlistContentSrcIndex, 1);

        // Insert the object at the target index
        this.playlistContents.splice(seq - 1, 0, { ...playlistContentToMove });
        this.playlistSortableOrder = this.playlistContents.map((i) => i.playlistContentId);

        // Save Playlist
        this.rearrangePlaylist(this.playlistSortableOrder, true);
    }

    private showPlaylistDemo() {
        this._dialog.open(PlaylistDemoComponent, {
            data: {
                playlistId: this.playlist.playlistId,
                playlistContents: this.playlistContents,
            },
            width: '768px',
            height: '432px',
            panelClass: 'no-padding',
        });
    }

    private onChangeViewOptions(action: string) {
        this.detailedViewMode = action === PlaylistViewOptionActions.detailedView;
        const detailedViewIndex = this.playlistViews.findIndex((v) => v.label === 'Detailed View');
        const gridViewIndex = this.playlistViews.findIndex((v) => v.label === 'Grid View');

        if (this.detailedViewMode) {
            this.playlistViews[detailedViewIndex].is_selected = true;
            this.playlistViews[gridViewIndex].is_selected = false;
            return;
        }

        this.playlistViews[detailedViewIndex].is_selected = false;
        this.playlistViews[gridViewIndex].is_selected = true;
    }

    public playlistContentSelected(playlistContentId: string) {
        if (this.selectedPlaylistContents.includes(playlistContentId))
            this.selectedPlaylistContents = this.selectedPlaylistContents.filter((p) => p !== playlistContentId);
        else this.selectedPlaylistContents.push(playlistContentId);

        this.setBulkControlsState();

        if (this.selectedPlaylistContents.length) this.enabledPlaylistContentControls = [];
        else this.enabledPlaylistContentControls = [...this.playlistContentControls];
    }

    private playlistContentSettings(playlistContents: API_CONTENT_V2[], bulkSet = false, index?: number) {
        const hasExistingSchedule = playlistContents.length === 1 && playlistContents[0].type === 3;
        const scheduleType = bulkSet ? 1 : playlistContents[0].type;
        const data = {
            playlistContents,
            playlistContentLength: this.playlistContents.length,
            hostLicenses: this.playlistHostLicenses,
            noHostLicenses: this.playlistHostLicensesLoaded && !this.playlistHostLicenses.length,
            bulkSet,
            hasExistingSchedule,
            scheduleType,
            allContents: this.playlistContents,
            index,
        };
        const configs: MatDialogConfig = { width: '1300px', disableClose: true, data };

        this._dialog
            .open(ContentSettingsComponent, configs)
            .afterClosed()
            .subscribe({
                next: (res: SavePlaylistContentUpdate) => {
                    if (!res) return;

                    // ensure that the mark all button is set to false after saving data
                    if (bulkSet && this.isInMarkedAllState) this.toggleMarkAllButton(false);

                    /** Store updates for saving */
                    res.contentUpdates.forEach((p) => this.playlistContentsToSave.push(p.playlistContentId));

                    /** Save Playlist Data */
                    this.savePlaylistContentUpdates(res, false);
                },
            });
    }

    public playlistContentQuickMove(playlistContent: API_CONTENT_V2) {
        this._dialog
            .open(QuickMoveComponent, {
                width: '678px',
                data: {
                    playlistContent,
                    playlistContentCount: this.playlistContents.length,
                },
            })
            .afterClosed()
            .subscribe({
                next: (res: { seq: number }) => {
                    if (res && res.seq) this.movePlaylistContent(playlistContent.playlistContentId, res.seq);
                },
            });
    }

    public playlistControlClicked(e: { action: string }) {
        switch (e.action) {
            case pActions.markAll:
                this.toggleMarkAllButton();
                break;
            case pActions.addContent:
                this.showAddContentDialog();
                break;
            case pActions.newSpacer:
                this.showNewSpacerDialog();
                break;
            case pActions.bulkModify:
                /** Find playlist contents from selected playlist content ids */
                const selected = this.playlistContents.filter((obj) =>
                    this.selectedPlaylistContents.includes(obj.playlistContentId),
                );
                this.playlistContentSettings(selected, true);
                break;
            case pActions.savePlaylist:
                const updates: SavePlaylistContentUpdate = {
                    contentUpdates: this.playlistSequenceUpdates,
                    hasPlayLocationChanges: false,
                    hasSchedulerFormChanges: false,
                    isBulkUpdate: false,
                };

                this.savePlaylistContentUpdates(updates);
                break;
            case pActions.bulkDelete:
                this.showRemoveContentDialog();
                break;
            default:
                break;
        }
    }

    private playlistRouteInit() {
        this._activatedRoute.paramMap.subscribe((data: any) => {
            this.playlistId = data.params.data;
            this.getPlaylistData(this.playlistId);
            this.getPlaylistHostLicenses(this.playlistId);
            this.getPlaylistScreens(this.playlistId);
        });
    }

    public playlistSettingClicked(action: string) {
        switch (action) {
            case pSettingAction.edit:
                this.showEditPlaylistDialog();
                break;
            case pSettingAction.clone:
                this.showClonePlaylistDialog();
                break;
            case pSettingAction.pushUpdates:
                this.pushUpdateToAllLicenses();
                break;
            default:
        }
    }

    /**
     * Use this function to modify the playlist contents, e.g. set the sequence or set the schedule status
     * @param data: API_CONTENT_V2[]
     * @returns API_CONTENT_V2[]
     */
    private preparePlaylistContents(data: API_CONTENT_V2[]) {
        return data.map((content, index) => {
            return {
                ...content,
                seq: index + 1,
                scheduleStatus: this._playlist.getScheduleStatus(content),
            };
        });
    }

    private pushUpdateToAllLicenses() {
        const title = 'Push Playlist Updates';
        const message = 'You are about to update all the licenses using this playlist. Proceed?';
        const returnMsg = 'Updates sent';

        this.showConfirmationDialog('warning', 'update', title, message, returnMsg).subscribe({
            next: (response: string | boolean) => {
                if (typeof response === 'boolean' && !response) return;

                if (response === 'update') {
                    this.playlistLicenseIds.forEach((id) => {
                        this._socket.emit('D_update_player', id);
                    });
                    this.playlistRouteInit();
                }
            },
        });
    }

    public pushUpdateToSelectedLicenses() {
        this.warningModal(
            'warning',
            'Push Playlist Updates',
            `You are about to push playlist updates to ${this.licensesToUpdate.length} licenses?`,
            `Playlist Update will be pushed on ${this.licensesToUpdate.length} licenses. Click OK to Continue.`,
            'update',
            this.licensesToUpdate,
        );
    }

    private realignAfterUpdate(
        toUpdate: PlaylistContentUpdate,
        schedulesToUpdate: PlaylistContentSchedule[],
        updateFrequencyCount: number,
        updateParentFrequencyCount: number,
        savingPlaylist: boolean,
    ) {
        this.savingPlaylist = false;
        this.selectedPlaylistContents = [];
        this.playlistContentsToSave = [];
        this.enabledPlaylistContentControls = [...this.playlistContentControls];

        this.setBulkControlsState();

        this.playlistContents = this.playlistContents
            .map((p) => {
                const updateObj = toUpdate.playlistContentsLicenses.find(
                    (u) => u.playlistContentId === p.playlistContentId,
                );
                const mapped = updateObj ? { ...p, ...updateObj } : p;
                return mapped;
            })
            .map((c) => {
                // map to update the content array schedules after submitting to the server
                // this is assuming that all requests will be successful
                // maybe refactor this in the near future to use zip instead of forkJoin

                schedulesToUpdate.forEach((toUpdate) => {
                    if (c.playlistContentsScheduleId === toUpdate.playlistContentsScheduleId) {
                        Object.keys(toUpdate).forEach((key) => {
                            c[key] = toUpdate[key];
                            c.scheduleStatus = this._playlist.getScheduleStatus(toUpdate);
                        });
                    }
                });

                return c;
            })
            .sort((a, b) => {
                const order = this.playlistSortableOrder;
                return order.indexOf(a.playlistContentId) - order.indexOf(b.playlistContentId);
            });

        this.playlistContentsBackup = Array.from(this.playlistContents);

        setTimeout(() => {
            this.sortableJSInit();
        }, 0);

        if (updateFrequencyCount > 0 || updateParentFrequencyCount > 0) this.playlistRouteInit();

        if (savingPlaylist) {
            this.playlistSequenceUpdates = [];
            this.sortablejsTriggered.next(false);
            this.playlistRouteInit();
        }
    }

    private rearrangePlaylist(updates: any[], moveAndSave: boolean = false) {
        updates.forEach((p, index) => {
            if (this.playlistSequenceUpdates.filter((i: PlaylistContent) => i.playlistContentId == p).length) {
                /** Get index of the re-updated playlist content (in this.playlistSequenceUpdates) */
                const pcIndex = this.playlistSequenceUpdates.findIndex(
                    (i: PlaylistContent) => i.playlistContentId == p,
                );

                /** Apply new sequence value of the re-updated playlist content */
                this.playlistSequenceUpdates[pcIndex] = {
                    ...this.playlistSequenceUpdates[pcIndex],
                    seq: index + 1,
                };
            } else {
                /** First time update, not in the stored playlist updates (this.playlistSequenceUpdates) array */
                const sequenceUpdate = { playlistContentId: p, seq: index + 1 };

                /** Store new */
                this.playlistSequenceUpdates.push(sequenceUpdate);
            }
        });

        if (moveAndSave) {
            const updates: SavePlaylistContentUpdate = {
                contentUpdates: this.playlistSequenceUpdates,
                hasPlayLocationChanges: false,
                hasSchedulerFormChanges: false,
                isBulkUpdate: false,
            };

            this.savePlaylistContentUpdates(updates, true);
            return;
        }

        this.setBulkControlsState();
    }

    private removePlaylistContents(playlistContentIds: string[]) {
        if (playlistContentIds.length <= 0) return;

        let requests = [];

        playlistContentIds.forEach((id) => {
            requests.push(this._playlist.removePlaylistContent(this.playlistId, id));
        });

        forkJoin(requests)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe({
                next: () => {
                    // remove the deleted content(s) from the array
                    // and update the index
                    this.playlistContents = this.playlistContents
                        .filter((c) => playlistContentIds.indexOf(c.playlistContentId) === -1)
                        .map((c, index) => {
                            c.seq = index + 1;
                            return c;
                        });

                    // Update the playlistContentsBackup array
                    this.playlistContentsBackup = [...this.playlistContents];

                    // update the total number of contents on the breakdown
                    const indexForTotalCount = this.playlistContentBreakdown.findIndex(
                        (c) => c.label === 'Content Count',
                    );
                    this.playlistContentBreakdown[indexForTotalCount].total = this.playlistContents.length;

                    // Reset
                    this.selectedPlaylistContents = [];
                    this.enabledPlaylistContentControls = [...this.playlistContentControls];

                    // Reset Mark All Button
                    this.toggleMarkAllButton(false);

                    //refresh count and list
                    this.playlistRouteInit();
                },
                error: (e) => console.error('Error removing playlist contentes', e),
            });
    }

    private searchFormInit() {
        this.searchForm.valueChanges.pipe(debounceTime(1000)).subscribe({
            next: (keyword: string) => {
                this.filterContent('search', keyword);
            },
        });
    }

    private setBulkControlsState() {
        this.playlistControls = this.playlistControls.map((p) => {
            /** Add Bulk Button Actions Here */
            if (p.action == pActions.bulkModify || p.action == pActions.bulkDelete)
                return { ...p, disabled: this.selectedPlaylistContents.length < 1 };
            else if (p.action == pActions.savePlaylist)
                return { ...p, disabled: this.playlistSequenceUpdates.length == 0 };
            else if (p.action == pActions.markAll) return { ...p, disabled: this.playlistContents.length == 0 };
            return p;
        });
    }

    private setDefaultViewButton() {
        const index = this.playlistViews.findIndex((v) => v.label === 'Grid View');
        this.playlistViews[index].is_selected = true;
    }

    private setFullscreenProperty(p: API_CONTENT_V2) {
        this.playlistContentsToSave.push(p.playlistContentId);

        this.savePlaylistContentUpdates(
            {
                contentUpdates: [
                    {
                        playlistContentId: p.playlistContentId,
                        isFullScreen: !p.isFullScreen ? 1 : 0,
                    },
                ],
                hasPlayLocationChanges: false,
                hasSchedulerFormChanges: false,
                isBulkUpdate: false,
            },
            false,
        );
    }

    private showAddContentDialog(contentToSwap?: API_CONTENT_V2) {
        const mode = typeof contentToSwap === 'undefined' ? 'add' : 'swap';

        const configs = {
            disableClose: true,
            data: {
                assets: this.assets,
                dealerId: this.playlist.dealerId,
                floatingAssets: this.floatingAssets,
                fillerGroups: this.fillerGroups,
                hostLicenses: this.playlistHostLicenses,
                noHostLicenses: this.playlistHostLicensesLoaded && !this.playlistHostLicenses.length,
                isDealer: this.isDealer,
                isDealerAdmin: this.isDealerAdmin,
                playlistContentId: mode === 'swap' ? contentToSwap.playlistContentId : null,
                playlistId: this.playlist.playlistId,
                role: this.isDealer ? 2 : this.isDealerAdmin ? 3 : 1,
                mode,
            },
        };

        this._dialog
            .open(AddContentComponent, configs)
            .afterClosed()
            .subscribe({
                next: (response: AddPlaylistContent | API_CONTENT | undefined) => {
                    if (typeof response === 'undefined') return;

                    if (mode === 'add') {
                        this.addContents(response as AddPlaylistContent);
                        return;
                    }

                    this.swapContent(response as API_CONTENT, contentToSwap);
                },
            });
    }

    public getAllFillerGroups(): void {
        const roles = [
            { id: 1, role: 'admin' },
            { id: 2, role: 'dealer' },
            { id: 3, role: 'dealerAdmin' },
        ];

        const observables = roles.map((role) => this._filler.get_filler_feeds_by_role(role.id, this.playlist.dealerId));

        forkJoin(observables).subscribe((responses: any[]) => {
            this.fillersFetched = true;

            responses.forEach((data, index) => {
                if ('message' in data) {
                    this.fillerGroups[roles[index].role] = [];
                } else {
                    data.paging.entities.forEach((group) => {
                        group.totalFillers = group.fillerGroups.reduce(
                            (sum, inside_group) => sum + inside_group.quantity * (inside_group.isPair ? 2 : 1),
                            0,
                        );
                    });

                    this.fillerGroups[roles[index].role] = data.paging.entities.map((filler) => ({
                        ...filler,
                        url: 'assets/media-files/fillers-placeholder.jpg',
                        fileName: filler.name,
                    }));
                }

                if (this.assetsFetched && this.fillersFetched) {
                    this.playlistControls = this.playlistControls.map((p) => {
                        /** Add Bulk Button Actions Here */
                        if (p.action == pActions.addContent)
                            return {
                                ...p,
                                icon: this.assetsFetched && this.fillersFetched && 'fas fa-plus',
                                disabled: !this.assetsFetched || !this.fillersFetched,
                            };
                        return p;
                    });
                }
            });
        });
    }

    private showClonePlaylistDialog() {
        const config = { disableClose: true, data: { playlist: this.playlist }, width: '600px' };
        const dialog: MatDialogRef<ClonePlaylistComponent> = this._dialog.open(ClonePlaylistComponent, config);
        dialog.componentInstance.playlistVersion = 2;
    }

    private showConfirmationDialog(
        confirmationType: 'success' | 'warning' | 'error',
        actionType: string,
        title: string,
        message: string,
        returnMsg: string,
    ) {
        const data = {
            status: confirmationType,
            action: actionType,
            data: message,
            message: title,
            return_msg: returnMsg,
        };

        const configs: MatDialogConfig = {
            minWidth: '350px',
            height: 'fit-content',
            disableClose: true,
            data,
        };

        return this._dialog.open(ConfirmationModalComponent, configs).afterClosed();
    }

    private showEditPlaylistDialog() {
        const config = {
            disableClose: true,
            data: { playlist: this.playlist },
            width: 'fit-content',
            height: 'fit-content',
        };
        const dialog = this._dialog.open(PlaylistEditModalComponent, config);

        dialog.afterClosed().subscribe({
            next: (response: boolean) => {
                this.getPlaylistData(this.playlistId);
                if (!response) return;
                this.playlistRouteInit();
            },
        });
    }

    private showRemoveContentDialog(content?: API_CONTENT_V2) {
        const dataMsg =
            typeof content === 'undefined' ? 'Proceed removing these contents?' : `Filename: ${content.fileName}`;
        let returnMsg = 'Success!';

        if (typeof content === 'undefined')
            returnMsg += ` ${this.selectedPlaylistContents.length} contents have been removed`;
        else returnMsg += ' Content has been removed';

        const data = {
            status: 'warning',
            action: 'delete',
            data: dataMsg,
            message: 'Remove Content(s)',
            return_msg: returnMsg,
        };

        const configs: MatDialogConfig = {
            height: 'fit-content',
            width: '450px',
            disableClose: true,
            data,
        };
        let idsToDelete = typeof content === 'undefined' ? this.selectedPlaylistContents : [content.playlistContentId];

        this._dialog
            .open(ConfirmationModalComponent, configs)
            .afterClosed()
            .subscribe((response: string | boolean) => {
                if (!response) return;

                const childContentsToDelete = this.playlistContents
                    .filter((c) => c.parentId && idsToDelete.includes(c.parentId))
                    .map((c) => c.playlistContentId);

                idsToDelete = idsToDelete.concat(childContentsToDelete);

                this.removePlaylistContents(idsToDelete);
            });
    }

    private showNewSpacerDialog() {
        this._dialog
            .open(SpacerSetupComponent, {
                width: '860px',
                data: {
                    hostLicenses: this.playlistHostLicenses,
                },
            })
            .afterClosed();
    }

    private sortableJSInit(): void {
        const set = (sortable) => {
            this.sortablejsTriggered.next(true);
            this.playlistSortableOrder = [...sortable.toArray()];
            this.rearrangePlaylist(this.playlistSortableOrder);
        };

        const list = document.getElementById('draggables');
        this.sortablejs = new Sortable(list, {
            swapThreshold: 1,
            sort: true,
            animation: 500,
            ghostClass: 'dragging',
            scrollSensitivity: 200,
            multiDrag: true,
            selectedClass: 'selected',
            fallbackOnBody: true,
            forceFallback: true,
            group: 'playlist_content',
            fallbackTolerance: 10,
            store: { set },
            filter: '.undraggable',
        });
    }

    private swapContent(newContent: API_CONTENT, playlistContent: API_CONTENT_V2) {
        const isParentFrequency = (data: number) => {
            if (typeof data === 'undefined' || !data) return false;
            return data === 33 || data === 22;
        };

        const isFrequencySwap = isParentFrequency(playlistContent.frequency);

        const playlistContentToSwap = {
            contentId: newContent.contentId,
            playlistContentId: playlistContent.playlistContentId,
            duration: this._isVideo.transform(newContent.fileType) ? newContent.duration : playlistContent.duration,
        };

        /** Store updates for saving */
        this.playlistContentsToSave.push(playlistContent.playlistContentId);

        /** Save and Update View */
        this._playlist.swapPlaylistContent(playlistContentToSwap, isFrequencySwap).subscribe({
            next: (res: { content: API_CONTENT_V2; plContent: API_UPDATED_PLAYLIST_CONTENT }) => {
                this.playlistContents = this.playlistContents
                    .map((content) => {
                        const swapped = { ...playlistContent, ...res.content, ...res.plContent };
                        return playlistContent.playlistContentId === content.playlistContentId ? swapped : content;
                    })
                    .sort(
                        (a, b) =>
                            this.playlistSortableOrder.indexOf(a.playlistContentId) -
                            this.playlistSortableOrder.indexOf(b.playlistContentId),
                    );

                this.playlistContentsToSave = [];

                setTimeout(() => {
                    this.playlistRouteInit();
                    this.sortableJSInit();
                }, 0);
            },
            error: (err) => {
                console.error(err);
            },
        });
    }

    private savePlaylistContentUpdates(data: SavePlaylistContentUpdate, savingPlaylist = true): void {
        let combinedRequests: Observable<any[]> = null;
        let updateFrequencyCount = 0;
        let updateParentFrequencyCount = 0;
        const requests = [];
        const { hasPlayLocationChanges, hasSchedulerFormChanges, isBulkUpdate } = data;

        const toUpdate: PlaylistContentUpdate = {
            playlistId: this.playlist.playlistId,
            playlistContentsLicenses: savingPlaylist ? this.playlistSequenceUpdates : data.contentUpdates,
        };

        const schedulesToUpdate = data.contentUpdates
            .filter((c) => typeof c.schedule !== 'undefined')
            .map((c) => c.schedule);

        const apiRequests = {
            removeWhiteList: this._playlist.removeWhitelist(data.blacklistUpdates),
            updateContentSchedule: this._playlist.updateContentSchedule(schedulesToUpdate),
        };

        toUpdate.playlistContentsLicenses = data.contentUpdates.map((c) => {
            // remove the schedule object after using it to filter
            delete c.schedule;

            // set the API calls for contents that have updated frequencies
            if (c && typeof c.frequency !== 'undefined' && c.frequency > 0) {
                // if frequency is 1 then revert
                if (c.frequency === 1) requests.push(this._playlist.revert_frequency(c.playlistContentId));
                // else update the frequency
                else requests.push(this._playlist.set_frequency(c.frequency, c.playlistContentId, this.playlistId));

                updateFrequencyCount++;
            }

            const originalContent = this.playlistContents.find(
                (original) => original.playlistContentId === c.playlistContentId,
            );
            const isParentFrequency = originalContent.frequency === 33 || originalContent.frequency === 22;
            if (isParentFrequency) updateParentFrequencyCount++;

            return c;
        });

        // Ensures that only the form updated (play location / content schedule) gets submitted when bulk updating
        if (isBulkUpdate) {
            if (hasPlayLocationChanges) requests.push(apiRequests.removeWhiteList);
            if (hasSchedulerFormChanges) requests.push(apiRequests.updateContentSchedule);
        } else {
            if (data.blacklistUpdates && data.blacklistUpdates.length) requests.push(apiRequests.removeWhiteList);
            if (schedulesToUpdate.length > 0) requests.push(apiRequests.updateContentSchedule);
        }

        this.savingPlaylist = savingPlaylist;
        combinedRequests = forkJoin(requests).pipe(takeUntil(this._unsubscribe));

        this._playlist
            .updatePlaylistContent(toUpdate)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe({
                next: () => {
                    if (requests.length <= 0) {
                        this.realignAfterUpdate(
                            toUpdate,
                            schedulesToUpdate,
                            updateFrequencyCount,
                            updateParentFrequencyCount,
                            savingPlaylist,
                        );
                        return;
                    }

                    combinedRequests.subscribe({
                        next: () => {
                            this.realignAfterUpdate(
                                toUpdate,
                                schedulesToUpdate,
                                updateFrequencyCount,
                                updateParentFrequencyCount,
                                savingPlaylist,
                            );
                        },
                        error: (e) => console.error('Error executing combined playlist update requests', e),
                    });
                },
                error: (e) => {
                    console.error('Error updating playlist content', e);
                },
            });
    }

    private toggleMarkAllButton(value = null) {
        // if value is set for the mark button then use it, else just negate the value
        this.isInMarkedAllState = value ? value : !this.isInMarkedAllState;
        const filteredContent = this.playlistContents.filter((content) => {
            return content.classification !== 'filler-v2';
        });

        const allContentIds = filteredContent.map((i) => i.playlistContentId);
        const index = this.playlistControls.findIndex(
            (c) => c.label.toLowerCase() === (this.isInMarkedAllState ? 'mark all' : 'unmark all'),
        );
        const currentLabel = this.isInMarkedAllState ? 'Unmark All' : 'Mark All';
        const currentIcon = this.isInMarkedAllState ? 'fas fa-times text-danger' : 'fas fa-check';
        this.playlistControls[index].label = currentLabel;
        this.playlistControls[index].icon = currentIcon;
        this.selectedPlaylistContents = this.isInMarkedAllState ? allContentIds : [];

        this.enabledPlaylistContentControls = this.isInMarkedAllState ? [] : [...this.playlistContentControls];
        this.setBulkControlsState();
    }

    public viewButtonClicked(action: string) {
        switch (action) {
            case PlaylistViewOptionActions.detailedView:
                this.onChangeViewOptions(action);
                break;
            case PlaylistViewOptionActions.gridView:
                this.onChangeViewOptions(action);
                break;
            case PlaylistPrimaryControlActions.playlistDemo:
                this.showPlaylistDemo();
                break;
            default:
                break;
        }
    }

    private warningModal(
        status: string,
        message: string,
        data: string,
        return_msg: string,
        action: string,
        licenses: API_LICENSE_PROPS[],
    ): void {
        this._dialog.closeAll();

        const dialogData = {
            status: status,
            message: message,
            data: data,
            return_msg: return_msg,
            action: action,
        };

        const configs: MatDialogConfig = {
            width: '500px',
            height: '350px',
            disableClose: true,
            data: dialogData,
        };

        const dialogRef = this._dialog.open(ConfirmationModalComponent, configs);

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'update') {
                licenses.forEach((p) => {
                    this._socket.emit('D_update_player', p.licenseId);
                });

                this.playlistRouteInit();
            }
        });
    }

    protected get currentUser() {
        return this._auth.current_user_value;
    }

    protected get currentRole() {
        return this._auth.current_role;
    }

    protected get isAdmin() {
        return this._auth.current_role === UI_ROLE_DEFINITION_TEXT.administrator;
    }

    protected get isDealer() {
        return (
            this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealer ||
            this._auth.current_role === UI_ROLE_DEFINITION_TEXT['sub-dealer']
        );
    }

    protected get isDealerAdmin(): boolean {
        return this._auth.current_role === 'dealeradmin';
    }
}
