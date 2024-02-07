import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { moveItemInArray, copyArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { PlaylistCreatedModalComponent } from '../../../global/components_shared/playlist_components/playlist-created-modal/playlist-created-modal.component';
import { MediaViewerComponent } from '../../components_shared/media_components/media-viewer/media-viewer.component';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { ContentService, DealerService, PlaylistService } from 'src/app/global/services';
import {
    API_CONTENT,
    API_CREATE_PLAYLIST,
    API_CREATE_PLAYLIST_CONTENT,
    API_DEALER,
    UI_CONTENT,
    UI_PLAYLIST_CONTENT,
    UI_ROLE_DEFINITION,
} from 'src/app/global/models';

@Component({
    selector: 'app-create-playlist',
    templateUrl: './create-playlist.component.html',
    styleUrls: ['./create-playlist.component.scss'],
})
export class CreatePlaylistComponent implements OnInit {
    title = 'Create Playlist';
    creating_playlist = false;
    dealer_no_content = false;
    dealers: API_DEALER[] = [];
    dealerid = '';
    dealer_name: string;
    disable_user_filter = true;
    floating_content = false;
    is_dealer = false;
    is_admin: boolean;
    invalid_form = true;
    media_library_api: any = [];
    media_library: any = [];
    playlist_info: FormGroup;
    playlist_content: UI_PLAYLIST_CONTENT[] = [];
    playlist: API_CREATE_PLAYLIST;
    playlist_assets: API_CREATE_PLAYLIST_CONTENT[];
    role_id: string;
    subscription = new Subscription();
    loading_data = true;
    dealers_data: API_DEALER[] = [];
    loading_search = false;
    is_search = false;

    filter_data: any;
    filtered_content_data: any;
    sort_order: boolean;
    type_filter_data: any;
    user_filtered_data: any;
    paging: any;
    search_data = '';
    media_key = '';
    current_page = '1';
    sort_key = 'desc';

    filters: any = {
        filetype: undefined,
        order: undefined,
        user: {
            dealer: undefined,
            host: undefined,
            advertiser: undefined,
        },
    };

    searching = false;
    no_search_result = false;
    no_dealer_not_floating = true;
    no_content: boolean;

    constructor(
        private _content: ContentService,
        private _dialog: MatDialog,
        private _playlist: PlaylistService,
        private _dealer: DealerService,
        private _form: FormBuilder,
        private _router: Router,
        private _auth: AuthService,
    ) {}

    ngOnInit() {
        const roleId = this._auth.current_user_value.role_id;
        const dealerRole = UI_ROLE_DEFINITION.dealer;
        const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

        // check if dealer user
        if (this._auth.current_user_value.role_id == UI_ROLE_DEFINITION.administrator) {
            this.is_admin = true;
        } else if (roleId === dealerRole || roleId === subDealerRole) {
            this.is_dealer = true;
            this.dealerid = this._auth.current_user_value.roleInfo.dealerId;
            this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
        }

        this.getDealers(1);
        this.getAllContents();

        this.playlist_info = this._form.group({
            dealer: ['', Validators.required],
            playlistName: ['', [Validators.required, Validators.maxLength(50)]],
            playlistDescription: ['', [Validators.required, Validators.maxLength(100)]],
        });

        this.subscription.add(
            this.playlist_info.valueChanges.subscribe((data) => {
                if (this.playlist_info.valid && this.playlist_content.length > 0) {
                    this.invalid_form = false;
                } else {
                    this.invalid_form = true;
                }
            }),
        );

        //Autofill for dealer
        if (this.is_dealer) {
            this.setToDealer(this.dealerid);
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    // Convenience getter for easy access to form fields
    get f() {
        return this.playlist_info.controls;
    }

    // Is draggable
    isDraggable(e, i) {
        if (e) {
            this.media_library[i].content_data.is_converted = 1;
        }
    }

    // Optimize
    createPlaylist() {
        let sequence = 0;
        this.creating_playlist = true;

        this.playlist_assets = this.playlist_content.map((c: UI_PLAYLIST_CONTENT) => {
            return new API_CREATE_PLAYLIST_CONTENT(
                c.content_data.content_id,
                c.content_data.handler_id,
                sequence++,
                c.content_data.is_fullscreen,
                c.content_data.file_type === 'webm' ? c.content_data.duration : 20,
            );
        });

        this.playlist = new API_CREATE_PLAYLIST(
            this.f.dealer.value,
            this.f.playlistName.value,
            'unset',
            this.f.playlistDescription.value,
            this.playlist_assets,
        );

        if (this.creating_playlist) {
            this.subscription.add(
                this._playlist.create_playlist(this.playlist).subscribe(
                    (data) => {
                        this.creating_playlist = false;
                        this.openConfirmationModal(data.playlist.playlistId);
                    },
                    (error) => {
                        console.error(error);
                    },
                ),
            );
        }
    }

    displayFloatingContent(e) {
        this.floating_content = e.checked;
        this.current_page = '1';
        this.getAllContents();
    }

    // Sort By Order Ascending
    sortAscendingOrder(e) {
        this.sort_key = 'asc';
        this.filters.order = 'Ascending';
        this.getAllContents();
    }

    // Sort By Order Descending
    sortDescendingOrder(e) {
        this.sort_key = 'desc';
        this.filters.order = 'Descending';
        this.getAllContents();
    }

    // Sort By Filetype Dropdown
    sortByFiletype(e) {
        this.media_key = e;
        this.filters.filetype = this.media_key;
        this.getAllContents();
    }

    // Search Content Field
    searchContent(e) {
        this.search_data = e;
        this.getAllContents();
    }

    drop(event: any) {
        if (this.playlist_info.valid) {
            this.invalid_form = false;
        }

        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            copyArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex,
            );
        }
    }

    pageRequested(page) {
        this.current_page = page;
        this.getAllContents();
    }

    getAllContents() {
        this.no_search_result = false;
        this.searching = true;

        //to display no dealer selected ui
        if (this.dealerid == '' && !this.floating_content) {
            this.no_dealer_not_floating = true;
        } else {
            this.no_dealer_not_floating = false;
        }

        this._content
            .get_contents_temp(
                this.current_page,
                this.media_key,
                this.sort_key,
                this.dealerid,
                this.search_data,
                this.floating_content,
            )
            .subscribe((data) => {
                this.searching = false;
                this.media_library_api = data;
                this.media_library = [];
                this.filtered_content_data = [];
                if (!data.message) {
                    this.no_search_result = false;
                    this.media_library = this.mediaFiles_mapToUI(data);
                    this.filtered_content_data = this.mediaFiles_mapToUI(data);
                } else {
                    if (this.search_data == '') {
                        this.no_content = true;
                    } else {
                        this.no_search_result = true;
                    }
                    if (this.media_key != '') {
                        this.no_content = true;
                        this.no_search_result = true;
                    }
                }
            });
    }

    mediaFiles_mapToUI(data) {
        this.dealer_no_content = false;
        if (!data.message) {
            let media_content = data.iContents.map((c: API_CONTENT) => {
                let fileThumbnailUrl = '';

                if (c.fileType === 'webm' || c.fileType === 'mp4') {
                    fileThumbnailUrl = this.renameWebmThumb(c.fileName, c.url);
                } else {
                    fileThumbnailUrl = c.previewThumbnail || c.thumbnail;
                }

                return new UI_PLAYLIST_CONTENT(
                    new UI_CONTENT(
                        c.playlistContentId,
                        c.createdBy,
                        c.contentId,
                        c.createdByName,
                        c.dealerId,
                        c.duration,
                        c.hostId,
                        c.advertiserId,
                        c.fileName,
                        c.url,
                        c.fileType,
                        c.handlerId,
                        c.dateCreated,
                        c.isFullScreen,
                        c.filesize,
                        fileThumbnailUrl,
                        c.isActive,
                        c.isConverted,
                        c.isProtected,
                        c.uuid,
                        c.title,
                    ),
                    [],
                );
            });
            return media_content;
        }
    }

    private renameWebmThumb(filename: string, source: string) {
        return `${source}${filename.substr(0, filename.lastIndexOf('.') + 1)}jpg`;
    }

    searchData(e) {
        this.loading_search = true;
        this.subscription.add(
            this._dealer.get_search_dealer(e).subscribe((data) => {
                if (data.paging.entities.length > 0) {
                    this.dealers = data.paging.entities;
                    this.dealers_data = data.paging.entities;
                    this.loading_search = false;
                } else {
                    this.dealers_data = [];
                    this.loading_search = false;
                }
                this.paging = data.paging;
            }),
        );
    }

    getDealers(e) {
        if (e > 1) {
            this.loading_data = true;
            this.subscription.add(
                this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
                    data.dealers.map((i) => {
                        this.dealers.push(i);
                    });
                    this.paging = data.paging;
                    this.loading_data = false;
                }),
            );
        } else {
            if (this.is_search) {
                this.loading_search = true;
            }
            this.subscription.add(
                this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
                    this.dealers = data.dealers;
                    this.dealers_data = data.dealers;
                    this.paging = data.paging;
                    this.loading_data = false;
                    this.loading_search = false;
                }),
            );
        }
    }

    searchBoxTrigger(event) {
        this.is_search = event.is_search;
        this.getDealers(event.page);
    }

    openConfirmationModal(id?) {
        let dialog = this._dialog.open(PlaylistCreatedModalComponent, {
            disableClose: true,
            width: '600px',
        });

        dialog.afterClosed().subscribe(() => {
            this._router.navigate([`/${this.roleRoute}/playlists/${id}`]);
        });
    }

    mediaViewer_open(a, content, i) {
        let dialog = this._dialog.open(MediaViewerComponent, {
            panelClass: 'app-media-viewer-dialog',
            data: {
                index: i,
                content_array: content,
                selected: a.content_data,
            },
        });
    }

    setContentDuration(e) {
        this.playlist_content.map((i) => {
            if (i.content_data.playlist_content_id == e.playlist_content_id) {
                i.content_data.duration = e.duration;
            }
        });
    }

    removeContent(i) {
        this.playlist_content.splice(i, 1);
        if (this.playlist_content.length == 0) {
            this.invalid_form = true;
        }
    }

    setToDealer(dealer) {
        this.f.dealer.setValue(dealer);
        this.dealerid = dealer;
        this.getAllContents();
    }

    setFullscreen(e, i) {
        this.playlist_content[i].content_data.is_fullscreen = e ? 1 : 0;
    }

    clearFilter(e) {
        if (e) {
            this.filters = {
                filetype: undefined,
                order: undefined,
                user: {
                    dealer: undefined,
                    host: undefined,
                    advertiser: undefined,
                },
            };

            this.sort_key = '';
            this.media_key = '';
            this.getAllContents();
        }
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
