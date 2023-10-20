import { Routes } from '@angular/router';

import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { CreateAdvertiserComponent } from '../../global/pages_shared/create-advertiser/create-advertiser.component';
import { CreateHostComponent } from '../../global/pages_shared/create-host/create-host.component';
import { CreatePlaylistComponent } from '../../global/pages_shared/create-playlist/create-playlist.component';
import { CreateScreenComponent } from '../../global/pages_shared/create-screen/create-screen.component';
import { CreateUserComponent } from '../../global/pages_shared/create-user/create-user.component';
import { CreateUserTypeComponent } from '../../global/pages_shared/create-user-type/create-user-type.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DealerLayoutComponent } from './dealer-layout/dealer-layout.component';
import { ExpiredContentsComponent } from '../../global/pages_shared/expired-contents/expired-contents.component';
import { FeedsComponent } from '../../global/pages_shared/feeds/feeds.component';
import { FillersComponent } from '../../global/pages_shared/fillers/fillers.component';
import { GenerateFeedComponent } from '../../global/pages_shared/generate-feed/generate-feed.component';
import { HostsComponent } from './pages/hosts/hosts.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { LocatorComponent } from '../../global/pages_shared/locator/locator.component';
import { MediaLibraryComponent } from '../../global/pages_shared/media-library/media-library.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ProfileSettingComponent } from '../../global/pages_shared/profile-setting/profile-setting.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { SingleAdvertiserComponent } from '../../global/pages_shared/single-advertiser/single-advertiser.component';
import { SingleContentComponent } from '../../global/pages_shared/single-content/single-content.component';
import { SingleHostComponent } from '../../global/pages_shared/single-host/single-host.component';
import { SingleLicenseComponent } from '../../global/pages_shared/single-license/single-license.component';
import { SinglePlaylistComponent } from '../../global/pages_shared/single-playlist/single-playlist.component';
import { SingleScreenComponent } from '../../global/pages_shared/single-screen/single-screen.component';
import { SingleUserComponent } from '../../global/pages_shared/single-user/single-user.component';
import { TagsComponent } from 'src/app/global/pages_shared/tags/tags.component';
import { UnsavedChangesGuard } from '../../global/guards';
import { UsersComponent } from './pages/users/users.component';
import { ViewFillersGroupComponent } from '../../global/pages_shared/fillers/components/view-fillers-group/view-fillers-group.component';

import { AuthGuard, OwnerGuard } from '../../global/guards';
import { UI_ROLE_DEFINITION } from '../../global/models';
import { NotificationsComponent } from '../../global/pages_shared/notifications/notifications.component';

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
				component: DashboardComponent
			},
			{
				path: 'hosts',
				data: {
					breadcrumb: 'Hosts'
				},
				children: [
					{
						path: '',
						component: HostsComponent
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
						canActivate: [OwnerGuard],
						data: {
							breadcrumb: 'Single Host Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleHostComponent,
						canActivate: [OwnerGuard]
					}
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
						canActivate: [OwnerGuard],
						data: {
							breadcrumb: 'Single Screen Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleScreenComponent,
						canActivate: [OwnerGuard]
					}
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
						component: AdvertisersComponent
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
						canActivate: [OwnerGuard],
						data: {
							breadcrumb: 'Single Advertiser Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleAdvertiserComponent,
						canActivate: [OwnerGuard]
					}
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
						component: FeedsComponent
					},
					{
						path: 'generate',
						component: GenerateFeedComponent,
						canDeactivate: [UnsavedChangesGuard],
						data: {
							breadcrumb: 'Generate Feeds'
						}
					},
					{
						path: 'edit-generated/:data',
						component: GenerateFeedComponent,
						canDeactivate: [UnsavedChangesGuard],
						data: {
							breadcrumb: 'Edit Generated Feeds'
						}
					},
					{
						path: 'edit-generated/:data/:breadcrumb',
						component: GenerateFeedComponent
					}
				]
			},
			{
				path: 'fillers',
				data: {
					breadcrumb: 'Fillers Library'
				},
				children: [
					{
						path: '',
						component: FillersComponent
					},
					{
						path: 'view-fillers-group/:data',
						component: ViewFillersGroupComponent,
						data: {
							breadcrumb: 'View Filler Group Contents'
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
						component: LicensesComponent
					},
					{
						path: ':data',
						component: SingleLicenseComponent,
						canActivate: [OwnerGuard],
						data: {
							breadcrumb: 'Single License Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleLicenseComponent,
						canActivate: [OwnerGuard]
					}
				]
			},
			{
				path: 'tags',
				component: TagsComponent,
				data: {
					breadcrumb: 'Tags'
				}
			},
			{
				path: 'locator',
				component: LocatorComponent,
				data: {
					breadcrumb: 'Locator'
				}
			},
			{
				path: 'notifications',
				component: NotificationsComponent,
				data: {
					breadcrumb: 'Notifications'
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
						component: PlaylistsComponent
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
						canActivate: [OwnerGuard],
						data: {
							breadcrumb: 'Single Playlist Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SinglePlaylistComponent,
						canActivate: [OwnerGuard]
					}
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
						component: MediaLibraryComponent
					},
					{
						path: 'expired-contents',
						component: ExpiredContentsComponent,
						data: {
							breadcrumb: 'Unused Contents'
						}
					},
					{
						path: ':data',
						component: SingleContentComponent,
						data: {
							breadcrumb: 'Single Content Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleContentComponent
					}
				]
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
						component: UsersComponent
					},
					{
						path: 'create-user',
						data: {
							breadcrumb: 'Create User'
						},
						children: [
							{
								path: '',
								component: CreateUserComponent
							},
							{
								path: ':data',
								component: CreateUserTypeComponent,
								data: {
									breadcrumb: 'User Type'
								}
							},
							{
								path: ':data/:breadcrumb',
								component: CreateUserTypeComponent
							}
						]
					},
					{
						path: ':data',
						component: SingleUserComponent,
						canActivate: [OwnerGuard],
						data: {
							breadcrumb: 'Single User Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleUserComponent,
						canActivate: [OwnerGuard]
					}
				]
			},
			{
				path: 'profile-setting/:data',
				component: ProfileSettingComponent,
				data: {
					breadcrumb: 'Profile Settings'
				}
			}
		]
	}
];
