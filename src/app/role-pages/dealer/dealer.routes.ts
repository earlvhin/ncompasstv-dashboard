import { Routes } from '@angular/router';
import { UI_ROLE_DEFINITION } from '../../global/models/ui_role-definition.model';
import { DealerLayoutComponent } from './dealer-layout/dealer-layout.component'
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { FeedsComponent } from './pages/feeds/feeds.component';
import { HostsComponent } from './pages/hosts/hosts.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { LocatorComponent } from 'src/app/global/pages_shared/locator/locator.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { BillingsComponent } from './pages/billings/billings.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { UsersComponent } from './pages/users/users.component';
import { CreateHostComponent } from 'src/app/global/pages_shared/create-host/create-host.component';
import { SingleHostComponent } from 'src/app/global/pages_shared/single-host/single-host.component';
import { SingleLicenseComponent } from 'src/app/global/pages_shared/single-license/single-license.component';
import { SingleAdvertiserComponent } from 'src/app/global/pages_shared/single-advertiser/single-advertiser.component';
import { CreateAdvertiserComponent } from 'src/app/global/pages_shared/create-advertiser/create-advertiser.component';
import { UserProfileComponent } from '../../global/pages_shared/user-profile/user-profile.component';
import { UserAccountSettingComponent } from '../../global/pages_shared/user-account-setting/user-account-setting.component';
import { MediaLibraryComponent } from '../../global/pages_shared/media-library/media-library.component';
import { SinglePlaylistComponent } from 'src/app/global/pages_shared/single-playlist/single-playlist.component';
import { SingleScreenComponent } from 'src/app/global/pages_shared/single-screen/single-screen.component';
import { SingleContentComponent } from 'src/app/global/pages_shared/single-content/single-content.component';
import { CreateScreenComponent } from 'src/app/global/pages_shared/create-screen/create-screen.component';
import { CreateUserComponent } from 'src/app/global/pages_shared/create-user/create-user.component';
import { CreateUserTypeComponent } from 'src/app/global/pages_shared/create-user-type/create-user-type.component';
import { CreatePlaylistComponent } from '../../global/pages_shared/create-playlist/create-playlist.component'; 
import { DealerProfileComponent } from './pages/dealer-profile/dealer-profile.component';
import { SingleUserComponent } from 'src/app/global/pages_shared/single-user/single-user.component';
import { GenerateFeedComponent } from 'src/app/global/pages_shared/generate-feed/generate-feed.component';

import { AuthGuard, OwnerGuard } from 'src/app/global/guards';

export const DEALER_ROUTES: Routes = [
	{
	path: 'dealer',
	component: DealerLayoutComponent,
	canActivate: [AuthGuard],
	data: { 
        role: [UI_ROLE_DEFINITION.dealer],
        breadcrumb: 'Dashboard'
    },
	children: [
			{ 
                path: '', 
                component: DashboardComponent 
            },
            { 
                path: 'dashboard', 
                component: DashboardComponent, 
            },
            { 
                path: 'hosts', 
                data: {
                    breadcrumb: 'Hosts'
                },
                children: [
                    {
                        path: '',
                        component: HostsComponent,
                    },
                    { 
                        path: 'create-host', 
                        component: CreateHostComponent,
                        data: {
                            breadcrumb: 'Create Host'
                        }
                    },
                    { 
                        path: ':data', 
                        component: SingleHostComponent,
						canActivate: [ OwnerGuard ],
                        data: {
                            breadcrumb: 'Single Host Page'
                        }
                    },
                ]
            },
            { 
                path: 'screens', 
                data: {
                    breadcrumb: 'Screens'
                },
                children: [
                    {
                        path: '',
                        component: ScreensComponent
                    },
                    { 
                        path: 'create-screen', 
                        component: CreateScreenComponent,
                        data: {
                            breadcrumb: 'Create Screen'
                        }
                    },
                    { 
                        path: ':data', 
                        component: SingleScreenComponent,
						canActivate: [ OwnerGuard ],
                        data: {
                            breadcrumb: 'Single Screen Page'
                        }
                    },
                ]
            },
			{ 
                path: 'advertisers',  
                data: {
                    breadcrumb: 'Advertisers'
                },
                children: [
                    {
                        path: '',
                        component: AdvertisersComponent,
                    },
                    { 
                        path: 'create-advertiser', 
                        component: CreateAdvertiserComponent, 
                        data: {
                            breadcrumb: 'Create Advertiser'
                        }
                    },
                    { 
                        path: ':data', 
                        component: SingleAdvertiserComponent,
                        data: {
                            breadcrumb: 'Single Advertiser Page'
                        }
                    },
                ]
            },
			{ 
                path: 'feeds', 
                data: {
                    breadcrumb: 'Feeds'
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
                            breadcrumb: 'Generate Feeds'
                        }
                    },
                    { 
                        path: 'edit-generated/:data', 
                        component: GenerateFeedComponent,
                        data: {
                            breadcrumb: 'Edit Generated Feeds'
                        }
                    }
                ]
            },
			{ 
                path: 'licenses', 
                data: {
                    breadcrumb: 'Licenses'
                },
                children: [
                    {
                        path: '',
                        component: LicensesComponent,
                    },
                    { 
                        path: ':data', 
                        component: SingleLicenseComponent,
						canActivate: [ OwnerGuard ],
                        data: {
                            breadcrumb: 'Single License Page'
                        }
                    },
                ]
            },
			{ 
                path: 'locator', 
                component: LocatorComponent, 
                data: {
                    breadcrumb: 'Locator'
                }
            },
			{ 
                path: 'playlists', 
                data: {
                    breadcrumb: 'Playlists'
                },
                children: [
                    {
                        path: '',
                        component: PlaylistsComponent, 
                    },
                    { 
                        path: 'create-playlist', 
                        component: CreatePlaylistComponent, 
                        data: {
                            breadcrumb: 'Create Playlist'
                        }
                    },
                    { 
                        path: ':data', 
                        component: SinglePlaylistComponent,
						canActivate: [ OwnerGuard ],
                        data: {
                            breadcrumb: 'Single Playlist Page'
                        }
                    },
                ]
            },
			{ 
                path: 'media-library', 
                data: {
                    breadcrumb: 'Media Library'
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
                            breadcrumb: 'Single Content Page'
                        }
                    },		
                ]
            },	
			{ 
                path: 'billings', 
                component: BillingsComponent,
                data: {
                    breadcrumb: 'Billings'
                }
            },
			{ 
                path: 'reports', 
                component: ReportsComponent, 
                data: {
                    breadcrumb: 'Reports'
                }
            },
			{ 
                path: 'users',
                data: {
                    breadcrumb: 'Users'
                },
                children: [
                    {
                        path: '',
                        component: UsersComponent, 
                    },
                    { 
                        path: 'create-user', 
                        data: {
                            breadcrumb: 'Create User'
                        },
                        children: [
                            {
                                path: '',
                                component: CreateUserComponent,
                            },
                            { 
                                path: ':data', 
                                component: CreateUserTypeComponent,
                                data: {
                                    breadcrumb: 'User Type'
                                }
                            },
                        ]
                    },
                    { 
                        path: ':data', 
                        component: SingleUserComponent,
						canActivate: [ OwnerGuard ],
                        data: {
                            breadcrumb: 'Single User Page'
                        }
                    },
                ]
            },
			{ 
                path: 'user-profile/:data', 
                component: UserProfileComponent,
                data: {
                    breadcrumb: 'User Profile'
                }
            },
			{ 
                path: 'dealer-profile/:data', 
                component: DealerProfileComponent, 
                data: {
                    breadcrumb: 'Dealer Profile'
                }
            },
			{ 
                path: 'user-account-setting/:data', 
                component: UserAccountSettingComponent, 
                data: {
                    breadcrumb: 'User Account Settings'
                }
            }
		]
	}
];
