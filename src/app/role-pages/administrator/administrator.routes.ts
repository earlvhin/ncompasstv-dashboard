import { Routes } from '@angular/router';
import { AdministratorLayoutComponent } from './administrator-layout/administrator-layout.component';

// Pages
import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { AuthGuard } from '../../global/guards/auth/auth.guard';
import { BillingsComponent } from './pages/billings/billings.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { CreateHostComponent } from 'src/app/global/pages_shared/create-host/create-host.component';
import { CreatePlaylistComponent } from '../../global/pages_shared/create-playlist/create-playlist.component'; 
import { CreateScreenComponent } from 'src/app/global/pages_shared/create-screen/create-screen.component';
import { CreateTemplateComponent } from './pages/create-template/create-template.component';
import { CreateUserComponent } from '../../global/pages_shared/create-user/create-user.component';
import { CreateUserTypeComponent } from 'src/app/global/pages_shared/create-user-type/create-user-type.component';
import { DashboardComponent } from  './pages/dashboard/dashboard.component';
import { DealersComponent } from './pages/dealers/dealers.component';
import { DirectoryComponent } from './pages/directory/directory.component';
import { HostsComponent } from './pages/hosts/hosts.component';
import { InstallationsComponent } from './pages/installations/installations.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { MediaLibraryComponent } from '../../global/pages_shared/media-library/media-library.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { RolesComponent } from './pages/roles/roles.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { SingleContentComponent } from '../../global/pages_shared/single-content/single-content.component';
import { SingleDealerComponent } from '../../global/pages_shared/single-dealer/single-dealer.component';
import { SingleHostComponent } from 'src/app/global/pages_shared/single-host/single-host.component';
import { SingleLicenseComponent } from 'src/app/global/pages_shared/single-license/single-license.component';
import { SinglePlaylistComponent } from '../../global/pages_shared/single-playlist/single-playlist.component';
import { SingleScreenComponent } from '../../global/pages_shared/single-screen/single-screen.component';
import { TemplatesComponent } from './pages/templates/templates.component';
import { UI_ROLE_DEFINITION } from '../../global/models/ui_role-definition.model';
import { UsersComponent } from './pages/users/users.component';
import { SingleUserComponent } from 'src/app/global/pages_shared/single-user/single-user.component';
import { UserProfileComponent } from '../../global/pages_shared/user-profile/user-profile.component';
import { UserAccountSettingComponent } from '../../global/pages_shared/user-account-setting/user-account-setting.component';
import { SingleAdvertiserComponent } from 'src/app/global/pages_shared/single-advertiser/single-advertiser.component';
import { LocatorComponent } from 'src/app/global/pages_shared/locator/locator.component';
import { CreateAdvertiserComponent } from 'src/app/global/pages_shared/create-advertiser/create-advertiser.component';
import { TagsComponent } from 'src/app/global/pages_shared/tags/tags.component';
import { ToolsComponent } from 'src/app/global/pages_shared/tools/tools.component';
import { FeedsComponent } from './pages/feeds/feeds.component';
import { UpdateComponent } from './pages/update/update.component';
import { HostCustomFieldsComponent } from 'src/app/global/pages_shared/host-custom-fields/host-custom-fields.component';
import { GenerateFeedComponent } from 'src/app/global/pages_shared/generate-feed/generate-feed.component';

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
                },
            },
            { 
                path: 'advertisers/:data', 
                component: SingleAdvertiserComponent,
            },
            { 
                path: 'create-advertiser', 
                component: CreateAdvertiserComponent,
                data: {
                    breadcrumb: 'Create Advertiser'
                }
            },
            { 
                path: 'billings', 
                component: BillingsComponent,
                data: {
                    breadcrumb: 'Billings'
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
                        component: DealersComponent,
                        
                    },
                    { 
                        path: ':data', 
                        component: SingleDealerComponent,
                        data: {
                            breadcrumb: 'Single Dealers Page'
                        }
                    },
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
                        component: FeedsComponent,
                        
                    },
                    { 
                        path: 'generate', 
                        component: GenerateFeedComponent,
                        data: {
                            breadcrumb: 'Generate Feeds'
                        }
                    },
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
                        data: {
                            breadcrumb: 'Single Hosts Page'
                        }
                    },
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
                        component: LicensesComponent,
                    },
                    { 
                        path: ':data', 
                        component: SingleLicenseComponent,
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
                        },
                    },
                    { 
                        path: ':data', 
                        component: SinglePlaylistComponent,
                        data: {
                            breadcrumb: 'Single Playlist'
                        },
                    },
                ]
            },
            { 
                path: 'reports', 
                component: ReportsComponent,
                data: {
                    breadcrumb: 'Reports'
                },
            },
            { 
                path: 'roles', 
                component: RolesComponent,
                data: {
                    breadcrumb: 'Roles'
                },
            },
            { 
                path: 'screens', 
                data: {
                    breadcrumb: 'Screens'
                },
                children: [
                    {
                        path: '',
                        component: ScreensComponent,
                    },
                    { 
                        path: 'create-screen', 
                        component: CreateScreenComponent,
                        data: {
                            breadcrumb: 'Create Screen'
                        },
                    },
                    { 
                        path: ':data', 
                        component: SingleScreenComponent,
                        data: {
                            breadcrumb: 'Single Screen Page'
                        },
                    },
                ]
            },
            { 
                path: 'tags', 
                component: TagsComponent,
                data: {
                    breadcrumb: 'Tags'
                },
            },
            { 
                path: 'templates', 
                data: {
                    breadcrumb: 'Templates'
                },
                children: [
                    {
                        path: '',
                        component: TemplatesComponent,
                    },
                    { 
                        path: 'create-template', 
                        component: CreateTemplateComponent,
                        data: {
                            breadcrumb: 'Create Template'
                        },
                    },
                ]
            },
			{ 
                path: 'tools', 
                component: ToolsComponent,
                data: {
                    breadcrumb: 'Tools'
                },
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
                                },
                            },
                        ]
                    },
                    { 
                        path: ':data', 
                        component: SingleUserComponent,
                        data: {
                            breadcrumb: 'Single User Page'
                        },
                    },
                ]
            },
            { 
                path: 'user-profile/:data', 
                component: UserProfileComponent,
                data: {
                    breadcrumb: 'User Profile'
                }, 
            },
            { 
                path: 'user-account-setting/:data', 
                component: UserAccountSettingComponent,
                data: {
                    breadcrumb: 'User Account Settings'
                },  
            },
            { 
                path: 'version-control', 
                component: UpdateComponent,
                data: {
                    breadcrumb: 'Version Control'
                },
            }
        ]
    }
]