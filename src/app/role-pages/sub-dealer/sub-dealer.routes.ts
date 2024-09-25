import { Routes } from '@angular/router';

import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { CreateHostComponent } from 'src/app/global/pages_shared/create-host/create-host.component';
import { CreateScreenComponent } from 'src/app/global/pages_shared/create-screen/create-screen.component';
import { CreatePlaylistComponent } from 'src/app/global/pages_shared/create-playlist/create-playlist.component';
import { CreateAdvertiserComponent } from 'src/app/global/pages_shared/create-advertiser/create-advertiser.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FeedsComponent } from 'src/app/global/pages_shared/feeds/feeds.component';
import { GenerateFeedComponent } from 'src/app/global/pages_shared/generate-feed/generate-feed.component';
import { HostsComponent } from '../dealer/pages/hosts/hosts.component';
import { LicensesComponent } from '../dealer/pages/licenses/licenses.component';
import { LocatorComponent } from 'src/app/global/pages_shared/locator/locator.component';
import { MediaLibraryComponent } from 'src/app/global/pages_shared/media-library/media-library.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ProfileSettingComponent } from 'src/app/global/pages_shared/profile-setting/profile-setting.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { SingleAdvertiserComponent } from 'src/app/global/pages_shared/single-advertiser/single-advertiser.component';
import { SingleContentComponent } from 'src/app/global/pages_shared/single-content/single-content.component';
import { SingleHostComponent } from 'src/app/global/pages_shared/single-host/single-host.component';
import { SingleLicenseComponent } from 'src/app/global/pages_shared/single-license/single-license.component';
import { SinglePlaylistComponent } from 'src/app/global/pages_shared/single-playlist/single-playlist.component';
import { SinglePlaylistV2Component } from 'src/app/global/pages_shared/single-playlist-v2/single-playlist-v2.component';
import { SingleScreenComponent } from 'src/app/global/pages_shared/single-screen/single-screen.component';
import { SubDealerLayoutComponent } from './sub-dealer-layout/sub-dealer-layout.component';

import { AuthGuard, OwnerGuard, PermissionGuard } from 'src/app/global/guards';
import { UI_ROLE_DEFINITION } from 'src/app/global/models';

export const SUB_DEALER_ROUTES: Routes = [
    {
        path: 'sub-dealer',
        component: SubDealerLayoutComponent,
        canActivate: [AuthGuard],
        data: {
            role: [UI_ROLE_DEFINITION['sub-dealer']],
            breadcrumb: 'Dashboard',
        },
        children: [
            {
                path: '',
                component: DashboardComponent,
            },
            {
                path: 'dashboard',
                component: DashboardComponent,
            },
            {
                path: 'hosts',
                data: {
                    breadcrumb: 'Hosts',
                },
                children: [
                    {
                        path: '',
                        component: HostsComponent,
                    },
                    {
                        path: 'create-host',
                        component: CreateHostComponent,
                        canActivate: [PermissionGuard],
                        data: {
                            breadcrumb: 'Create Host',
                        },
                    },
                    {
                        path: ':data',
                        component: SingleHostComponent,
                        canActivate: [OwnerGuard],
                        data: {
                            breadcrumb: 'Single Host Page',
                        },
                    },
                    {
                        path: ':data/:breadcrumb',
                        component: SingleHostComponent,
                        canActivate: [OwnerGuard],
                    },
                ],
            },
            {
                path: 'licenses',
                data: {
                    breadcrumb: 'Licenses',
                },
                children: [
                    {
                        path: '',
                        component: LicensesComponent,
                    },
                    {
                        path: ':data',
                        component: SingleLicenseComponent,
                        canActivate: [OwnerGuard],
                        data: {
                            breadcrumb: 'Single License Page',
                        },
                    },
                    {
                        path: ':data/:breadcrumb',
                        component: SingleLicenseComponent,
                        canActivate: [OwnerGuard],
                    },
                ],
            },
            {
                path: 'advertisers',
                data: {
                    breadcrumb: 'Advertisers',
                },
                children: [
                    {
                        path: '',
                        component: AdvertisersComponent,
                    },
                    {
                        path: 'create-advertiser',
                        component: CreateAdvertiserComponent,
                        canActivate: [PermissionGuard],
                        data: {
                            breadcrumb: 'Create Advertiser',
                        },
                    },
                    {
                        path: ':data',
                        component: SingleAdvertiserComponent,
                        canActivate: [OwnerGuard],
                        data: {
                            breadcrumb: 'Single Advertiser Page',
                        },
                    },
                    {
                        path: ':data/:breadcrumb',
                        component: SingleAdvertiserComponent,
                        canActivate: [OwnerGuard],
                    },
                ],
            },
            {
                path: 'locator',
                component: LocatorComponent,
                data: {
                    breadcrumb: 'Locator',
                },
            },
            {
                path: 'media-library',
                data: {
                    breadcrumb: 'Media Library',
                },
                children: [
                    {
                        path: '',
                        component: MediaLibraryComponent,
                    },
                    {
                        path: ':data',
                        component: SingleContentComponent,
                        data: {
                            breadcrumb: 'Single Content Page',
                        },
                    },
                    {
                        path: ':data/:breadcrumb',
                        component: SingleContentComponent,
                        data: {
                            breadcrumb: 'Single Content Page',
                        },
                    },
                ],
            },
            {
                path: 'feeds',
                data: {
                    breadcrumb: 'Feeds',
                },
                children: [
                    {
                        path: '',
                        component: FeedsComponent,
                    },
                    {
                        path: 'generate',
                        component: GenerateFeedComponent,
                        data: {
                            breadcrumb: 'Generate Feeds',
                        },
                    },
                    {
                        path: 'edit-generated/:data',
                        component: GenerateFeedComponent,
                        data: {
                            breadcrumb: 'Edit Generated Feeds',
                        },
                    },
                ],
            },
            {
                path: 'playlists',
                data: {
                    breadcrumb: 'Playlists',
                },
                children: [
                    {
                        path: '',
                        component: PlaylistsComponent,
                    },
                    {
                        path: 'v2/:data',
                        component: SinglePlaylistV2Component,
                        data: {
                            breadcrumb: 'Single Playlist',
                        },
                    },
                    {
                        path: 'v2/:data/:breadcrumb',
                        component: SinglePlaylistV2Component,
                    },
                    {
                        path: 'create-playlist',
                        component: CreatePlaylistComponent,
                        canActivate: [PermissionGuard],
                        data: {
                            breadcrumb: 'Create Playlist',
                        },
                    },
                    {
                        path: ':data',
                        component: SinglePlaylistComponent,
                        canActivate: [OwnerGuard],
                        data: {
                            breadcrumb: 'Single Playlist Page',
                        },
                    },
                    {
                        path: ':data/:breadcrumb',
                        component: SinglePlaylistComponent,
                        canActivate: [OwnerGuard],
                    },
                ],
            },
            {
                path: 'screens',
                data: {
                    breadcrumb: 'Screens',
                },
                children: [
                    {
                        path: '',
                        component: ScreensComponent,
                    },
                    {
                        path: 'create-screen',
                        component: CreateScreenComponent,
                        canActivate: [PermissionGuard],
                        data: {
                            breadcrumb: 'Create Screen',
                        },
                    },
                    {
                        path: ':data',
                        component: SingleScreenComponent,
                        canActivate: [OwnerGuard],
                        data: {
                            breadcrumb: 'Single Screen Component',
                        },
                    },
                    {
                        path: ':data/:breadcrumb',
                        component: SingleScreenComponent,
                        canActivate: [OwnerGuard],
                    },
                ],
            },
            {
                path: 'profile-setting/:data',
                component: ProfileSettingComponent,
                data: {
                    breadcrumb: 'Profile Settings',
                },
            },
        ],
    },
];
