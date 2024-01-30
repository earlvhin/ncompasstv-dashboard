import { Routes } from '@angular/router';
import { AdministratorLayoutComponent } from './administrator-layout/administrator-layout.component';

// Pages
import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { AuthGuard } from '../../global/guards/auth/auth.guard';
import { CategoriesComponent } from './pages/categories/categories.component';
import { CreateAdvertiserComponent } from '../../global/pages_shared/create-advertiser/create-advertiser.component';
import { CreateHostComponent } from '../../global/pages_shared/create-host/create-host.component';
import { CreatePlaylistComponent } from '../../global/pages_shared/create-playlist/create-playlist.component';
import { CreateScreenComponent } from '../../global/pages_shared/create-screen/create-screen.component';
import { CreateTemplateComponent } from './pages/create-template/create-template.component';
import { CreateUserComponent } from '../../global/pages_shared/create-user/create-user.component';
import { CreateUserTypeComponent } from '../../global/pages_shared/create-user-type/create-user-type.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DealersComponent } from './pages/dealers/dealers.component';
import { DirectoryComponent } from './pages/directory/directory.component';
import { FeedsComponent } from '../../global/pages_shared/feeds/feeds.component';
import { FillersComponent } from '../../global/pages_shared/fillers/fillers.component';
import { GenerateFeedComponent } from '../../global/pages_shared/generate-feed/generate-feed.component';
import { HostCustomFieldsComponent } from '../../global/pages_shared/host-custom-fields/host-custom-fields.component';
import { HostsComponent } from './pages/hosts/hosts.component';
import { InstallationsComponent } from './pages/installations/installations.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { LocatorComponent } from '../../global/pages_shared/locator/locator.component';
import { MediaLibraryComponent } from '../../global/pages_shared/media-library/media-library.component';
import { NotificationsComponent } from '../../global/pages_shared/notifications/notifications.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ProfileSettingComponent } from '../../global/pages_shared/profile-setting/profile-setting.component';
import { ReleaseNotesComponent } from './pages/release-notes/release-notes.component';
import { ReleaseNotesViewComponent } from './pages/release-notes/components/release-notes-view/release-notes-view.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { RolesComponent } from './pages/roles/roles.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { SingleAdvertiserComponent } from '../../global/pages_shared/single-advertiser/single-advertiser.component';
import { SingleContentComponent } from '../../global/pages_shared/single-content/single-content.component';
import { SingleDealerComponent } from '../../global/pages_shared/single-dealer/single-dealer.component';
import { SingleHostComponent } from '../../global/pages_shared/single-host/single-host.component';
import { SingleLicenseComponent } from '../../global/pages_shared/single-license/single-license.component';
import { SinglePlaylistComponent } from '../../global/pages_shared/single-playlist/single-playlist.component';
import { SingleScreenComponent } from '../../global/pages_shared/single-screen/single-screen.component';
import { SingleTemplateComponent } from '../../global/pages_shared/single-template/single-template.component';
import { SingleUserComponent } from '../../global/pages_shared/single-user/single-user.component';
import { TagsComponent } from '../../global/pages_shared/tags/tags.component';
import { TemplatesComponent } from './pages/templates/templates.component';
import { ToolsComponent } from '../../global/pages_shared/tools/tools.component';
import { UI_ROLE_DEFINITION } from '../../global/models/ui_role-definition.model';
import { UnsavedChangesGuard } from 'src/app/global/guards';
import { UpdateComponent } from './pages/update/update.component';
import { UsersComponent } from './pages/users/users.component';
import { ViewFillersGroupComponent } from '../../global/pages_shared/fillers/components/view-fillers-group/view-fillers-group.component';

export const ADMINISTRATOR_ROUTES: Routes = [
	{
		path: 'administrator',
		component: AdministratorLayoutComponent,
		canActivate: [AuthGuard],
		data: {
			role: [UI_ROLE_DEFINITION.administrator],
			breadcrumb: 'Dashboard'
		},
		children: [
			{
				path: '',
				component: DashboardComponent
			},
			{
				path: 'advertisers',
				component: AdvertisersComponent,
				data: {
					breadcrumb: 'Advertisers'
				}
			},
			{
				path: 'advertisers/:data',
				component: SingleAdvertiserComponent
			},
			{
				path: 'advertisers/:data/:breadcrumb',
				component: SingleAdvertiserComponent
			},
			{
				path: 'create-advertiser',
				component: CreateAdvertiserComponent,
				data: {
					breadcrumb: 'Create Advertiser'
				}
			},
			{
				path: 'categories',
				component: CategoriesComponent,
				data: {
					breadcrumb: 'Categories'
				}
			},
			{
				path: 'dashboard',
				component: DashboardComponent
			},
			{
				path: 'dealers',
				data: {
					breadcrumb: 'Dealers'
				},
				children: [
					{
						path: '',
						component: DealersComponent
					},
					{
						path: ':data',
						component: SingleDealerComponent,
						data: {
							breadcrumb: 'Single Dealers Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleDealerComponent
					}
				]
			},
			{
				path: 'directory',
				component: DirectoryComponent,
				data: {
					breadcrumb: 'Directory'
				}
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
						path: ':data/:breadcrumb',
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
						data: {
							breadcrumb: 'Single Hosts Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleHostComponent
					}
				]
			},
			{
				path: 'hosts-fields',
				component: HostCustomFieldsComponent
			},
			{
				path: 'installations',
				component: InstallationsComponent,
				data: {
					breadcrumb: 'Installations'
				}
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
						data: {
							breadcrumb: 'Single License Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleLicenseComponent
					}
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
						data: {
							breadcrumb: 'Single Playlist'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SinglePlaylistComponent
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
				path: 'roles',
				component: RolesComponent,
				data: {
					breadcrumb: 'Roles'
				}
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
						data: {
							breadcrumb: 'Single Screen Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleScreenComponent
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
				path: 'templates',
				data: {
					breadcrumb: 'Templates'
				},
				children: [
					{
						path: '',
						component: TemplatesComponent
					},
					{
						path: 'create-template',
						component: CreateTemplateComponent,
						data: {
							breadcrumb: 'Create Template'
						}
					},
					{
						path: ':data',
						component: SingleTemplateComponent,
						data: { breadcrumb: 'Single Template' }
					},
					{
						path: ':data/:breadcrumb',
						component: SingleTemplateComponent
					}
				]
			},
			{
				path: 'tools',
				component: ToolsComponent,
				data: {
					breadcrumb: 'Tools'
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
						data: {
							breadcrumb: 'Single User Page'
						}
					},
					{
						path: ':data/:breadcrumb',
						component: SingleUserComponent
					}
				]
			},
			{
				path: 'profile-setting/:data',
				component: ProfileSettingComponent,
				data: {
					breadcrumb: 'Profile Settings'
				}
			},
			{
				path: 'version-control',
				component: UpdateComponent,
				data: {
					breadcrumb: 'Version Control'
				}
			},
			{
				path: 'release-notes',
				component: ReleaseNotesComponent,
				data: {
					breadcrumb: 'Release Notes'
				}
			},
			{
				path: 'releases',
				component: ReleaseNotesViewComponent,
				data: {
					breadcrumb: 'Dashboard Releases'
				}
			}
		]
	}
];
