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

export const ADMINISTRATOR_ROUTES: Routes = [
    {
        path: 'administrator',
        component: AdministratorLayoutComponent,
        canActivate: [AuthGuard],
        data: { role: [UI_ROLE_DEFINITION.administrator] },
        children: [
            { path: '', component: DashboardComponent },
            { path: 'advertisers', component: AdvertisersComponent},
            { path: 'advertisers/:data', component: SingleAdvertiserComponent},
            { path: 'create-advertiser', component: CreateAdvertiserComponent},
            { path: 'billings', component: BillingsComponent},
            { path: 'categories', component: CategoriesComponent},
            { path: 'create-host', component: CreateHostComponent},
            { path: 'dashboard', component: DashboardComponent},
            { path: 'dealers', component: DealersComponent, },
			{ path: 'dealers/:data', component: SingleDealerComponent},
			{ path: 'directory', component: DirectoryComponent},
			{ path: 'feeds', component: FeedsComponent},
            { path: 'hosts', component: HostsComponent},
            { path: 'hosts/:data', component: SingleHostComponent},
            { path: 'hosts-fields', component: HostCustomFieldsComponent},
            { path: 'installations', component: InstallationsComponent },
            { path: 'licenses', component: LicensesComponent},
            { path: 'licenses/:data', component: SingleLicenseComponent},
            { path: 'locator', component: LocatorComponent },
            { path: 'media-library', component: MediaLibraryComponent },
            { path: 'media-library/:data', component: SingleContentComponent },
            { path: 'playlists', component: PlaylistsComponent },
            { path: 'playlists/create-playlist', component: CreatePlaylistComponent },
            { path: 'playlists/:data', component: SinglePlaylistComponent },
            { path: 'reports', component: ReportsComponent },
            { path: 'roles', component: RolesComponent },
            { path: 'screens', component: ScreensComponent },
            { path: 'screens/create-screen', component: CreateScreenComponent },
            { path: 'screens/:data', component: SingleScreenComponent },
            { path: 'tags', component: TagsComponent },
            { path: 'templates', component: TemplatesComponent },
			{ path: 'templates/create-template', component: CreateTemplateComponent },
			{ path: 'tools', component: ToolsComponent},
            { path: 'users', component: UsersComponent },
            { path: 'users/create-user', component: CreateUserComponent },
            { path: 'users/:data', component: SingleUserComponent },
            { path: 'users/create-user/:data', component: CreateUserTypeComponent },
            { path: 'user-profile/:data', component: UserProfileComponent },
            { path: 'user-account-setting/:data', component: UserAccountSettingComponent },
            { path: 'version-control', component: UpdateComponent}
        ]
    }
]