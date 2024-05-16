import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { map, takeUntil } from 'rxjs/operators';
import { forkJoin, Observable, Subject, Subscription } from 'rxjs';
import * as io from 'socket.io-client';

import { ClonePlaylistComponent } from '../../components_shared/playlist_components/clone-playlist/clone-playlist.component';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { PlaylistDemoComponent } from '../../components_shared/playlist_components/playlist-demo/playlist-demo.component';
import { PlaylistEditModalComponent } from '../../components_shared/playlist_components/playlist-edit-modal/playlist-edit-modal.component';
import {
    API_CONTENT,
    API_HOST,
    API_LICENSE_PROPS,
    API_SCREEN,
    API_SCREEN_OF_PLAYLIST,
    API_SINGLE_PLAYLIST,
    UI_PLAYLIST_SCREENS_NEW,
    UI_ROLE_DEFINITION_TEXT,
} from 'src/app/global/models';
import { AuthService, HelperService, PlaylistService } from 'src/app/global/services';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-single-playlist',
    templateUrl: './single-playlist.component.html',
    styleUrls: ['./single-playlist.component.scss'],
})
export class SinglePlaylistComponent implements OnInit {
    @Input() reload: Observable<void>;

    description: string;
    host_url: string;
    is_admin = this.isAdmin;
    is_dealer = this.isDealer;
    is_initial_load = true;
    isViewOnly = false;
    isPlaylistEmpty = true;
    license_to_update = [];
    license_url: string;
    playlist: {
        licenses: API_LICENSE_PROPS[];
        playlist: API_SINGLE_PLAYLIST;
        playlistContents: API_CONTENT[];
        hostLicenses: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[];
    };
    playlist_content_and_blacklist: any[];
    playlist_host_and_license: any;
    playlist_licenses: API_LICENSE_PROPS[] = [];
    playlistScreens: API_SCREEN_OF_PLAYLIST[] = [];
    playlist_screen_table: any;
    isPlaylistUpdating: boolean = true;
    title: string;
    screenTableColumn = ['#', 'Screen Title', 'Dealer', 'Host', 'Type', 'Template', 'Created By'];

    // Cannot set type as it needs the @types/socket-io.client package
    private socket: any;
    protected ngUnsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _helper: HelperService,
        private _params: ActivatedRoute,
        private _playlist: PlaylistService,
    ) {}

    ngOnInit() {
        this.isViewOnly = this.currentUser.roleInfo.permission === 'V';
        localStorage.removeItem('playlist_data');
        this.playlistRouteInit();

        // If changes made
        if (this.reload) this.reload.subscribe({ next: () => this.playlistRouteInit() });

        let role = this.currentRole;
        if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            role = UI_ROLE_DEFINITION_TEXT.administrator;
        }

        this.host_url = `/${role}/hosts/`;
        this.license_url = `/${role}/licenses/`;

        this.socket = io(environment.socket_server, {
            transports: ['websocket'],
            query: 'client=Dashboard__SinglePlaylistComponent',
        });

        this.subscribeToPushPlaylistUpdateToAllLicenses();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.socket.disconnect();
    }

    public addToLicenseToPush(e: { checked: boolean }, licenseId: string): void {
        if (e.checked && !this.license_to_update.includes(licenseId)) {
            this.license_to_update.push({ licenseId: licenseId });
            return;
        }

        this.license_to_update = this.license_to_update.filter((i) => {
            return i.licenseId !== licenseId;
        });
    }

    clonePlaylist() {
        this._dialog.open(ClonePlaylistComponent, {
            width: '600px',
            data: this.playlist,
        });
    }

    getPlaylistData(id: string) {
        this.isPlaylistUpdating = true;

        if (this.is_initial_load && (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer')) {
            this.setpageData(this._helper.singlePlaylistData);
            this.getPlaylistScreens(id).add(() => (this.isPlaylistUpdating = false));
            this.is_initial_load = false;
            return;
        }

        this.getPlaylistDataAndScreens(id).add(() => (this.isPlaylistUpdating = false));
    }

    openUpdatePlaylistInfoModal() {
        const config: MatDialogConfig = {
            width: '600px',
            data: this.playlist,
        };

        this._dialog
            .open(PlaylistEditModalComponent, config)
            .afterClosed()
            .subscribe({
                next: () => {
                    this.ngOnInit();
                },
            });
    }

    playlistRouteInit() {
        this._params.paramMap.subscribe({
            next: () => {
                this.getPlaylistData(this._params.snapshot.params.data);
            },
        });
    }

    pushUpdateToAllLicenses() {
        this.warningModal(
            'warning',
            'Push Playlist Updates',
            `You are about to push playlist updates to ${this.playlist.licenses.length} licenses?`,
            `Playlist Update will be pushed on ${this.playlist.licenses.length} licenses. Click OK to Continue.`,
            'update',
            this.playlist.licenses,
        );
    }

    public openPlaylistDemo(): void {
        this._dialog.open(PlaylistDemoComponent, {
            data: this.playlist.playlist.playlistId,
            width: '768px',
            height: '432px',
            panelClass: 'no-padding',
        });
    }

    pushUpdateToSelectedLicenses() {
        this.warningModal(
            'warning',
            'Push Playlist Updates',
            `You are about to push playlist updates to ${this.license_to_update.length} licenses?`,
            `Playlist Update will be pushed on ${this.license_to_update.length} licenses. Click OK to Continue.`,
            'update',
            this.license_to_update,
        );
    }

    screensMapToTable(screens) {
        let counter = 1;
        // const route = Object.keys(UI_ROLE_DEFINITION).find((key) => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
        let role = this.currentRole;
        if (role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            role = UI_ROLE_DEFINITION_TEXT.administrator;
        }
        if (screens) {
            this.playlist_screen_table = screens.map((i) => {
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
            this.playlist_screen_table = {
                message: 'No Screens Available',
            };
        }
    }

    reloadPlaylist(dataOnly: boolean = false) {
        // if set to true, then it will only call the swapped content
        if (dataOnly) return this.getPlaylistDataAndScreens(this._params.snapshot.params.data);

        this.ngOnInit();
    }

    public reloadDemo(): void {
        this.isPlaylistUpdating = true;
        setTimeout(() => {
            this.isPlaylistUpdating = false;
        }, 2000);
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

        const dialogRef = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            disableClose: true,
            data: dialogData,
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (result === 'update') {
                    licenses.forEach((p) => {
                        this.socket.emit('D_update_player', p.licenseId);
                    });

                    this.ngOnInit();
                }
            },
        });
    }

    private getPlaylistDataAndScreens(playlistId: string): Subscription {
        const requests = [
            this._playlist.get_playlist_by_id(playlistId),
            this._playlist.getScreensOfPlaylist(playlistId),
        ];

        return forkJoin(requests)
            .pipe(
                takeUntil(this.ngUnsubscribe),
                map(([getPlaylistRes, getScreenRes]) => {
                    const playlistData = getPlaylistRes as {
                        licenses: API_LICENSE_PROPS[];
                        playlist: API_SINGLE_PLAYLIST;
                        playlistContents: API_CONTENT[];
                        hostLicenses: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[];
                        screens: API_SCREEN[];
                    };

                    const screenData = getScreenRes as { screens: API_SCREEN[] };

                    return { playlistData, screenData };
                }),
            )
            .subscribe({
                next: ({ playlistData, screenData }) => {
                    this.setpageData(playlistData);
                    this.playlistScreens = screenData.screens;
                    this.screensMapToTable(this.playlistScreens);
                },
                error: (e) => {
                    console.error('Error retrieving playlist data and screen data', e);
                },
            });
    }

    private getPlaylistScreens(playlistId: string): Subscription {
        return this._playlist
            .getScreensOfPlaylist(playlistId)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
                next: (response) => {
                    this.playlistScreens = response.screens;
                    this.screensMapToTable(this.playlistScreens);
                },
                error: (e) => {
                    console.error('Error retrieving playlist screen data', e);
                },
            });
    }

    private setpageData(data: {
        licenses: API_LICENSE_PROPS[];
        playlist: API_SINGLE_PLAYLIST;
        playlistContents: API_CONTENT[];
        hostLicenses: { host: API_HOST; licenses: API_LICENSE_PROPS[] }[];
    }): void {
        const { playlist, playlistContents, hostLicenses } = data;
        const { playlistName, playlistDescription } = playlist;
        this.isPlaylistEmpty = !playlistContents.length;
        this.playlist = data;
        this.title = playlistName;
        this.description = playlistDescription;
        this.playlist_content_and_blacklist = [...playlistContents];
        this.playlist_host_and_license = [...hostLicenses];
    }

    private subscribeToPushPlaylistUpdateToAllLicenses(): Subscription {
        return this._playlist.onPushPlaylistUpdateToAllLicenses.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
            next: () => {
                this.playlist.licenses.forEach((license) => this.socket.emit('D_update_player', license.licenseId));
            },
        });
    }

    protected get currentUser() {
        return this._auth.current_user_value;
    }

    protected get currentRole() {
        return this._auth.current_role;
    }

    protected get isAdmin() {
        return this._auth.current_role === 'administrator';
    }

    protected get isDealer() {
        return this._auth.current_role === 'dealer';
    }
}
