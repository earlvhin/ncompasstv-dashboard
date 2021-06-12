import { Routes } from '@angular/router';

import { AuthGuard } from '../../global/guards/auth/auth.guard';
import { UI_ROLE_DEFINITION } from '../../global/models/ui_role-definition.model';
import { UserProfileComponent } from '../../global/pages_shared/user-profile/user-profile.component';
import { UserAccountSettingComponent } from '../../global/pages_shared/user-account-setting/user-account-setting.component';
import { SubDealerLayoutComponent } from './sub-dealer-layout/sub-dealer-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CreateHostComponent } from 'src/app/global/pages_shared/create-host/create-host.component';
import { CreateScreenComponent } from 'src/app/global/pages_shared/create-screen/create-screen.component';
import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { SingleAdvertiserComponent } from 'src/app/global/pages_shared/single-advertiser/single-advertiser.component';
import { CreateAdvertiserComponent } from 'src/app/global/pages_shared/create-advertiser/create-advertiser.component';
import { FeedsComponent } from './pages/feeds/feeds.component';
import { HostsComponent } from './pages/hosts/hosts.component';
import { SingleHostComponent } from 'src/app/global/pages_shared/single-host/single-host.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { SingleLicenseComponent } from 'src/app/global/pages_shared/single-license/single-license.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { CreatePlaylistComponent } from 'src/app/global/pages_shared/create-playlist/create-playlist.component';
import { SinglePlaylistComponent } from 'src/app/global/pages_shared/single-playlist/single-playlist.component';
import { MediaLibraryComponent } from 'src/app/global/pages_shared/media-library/media-library.component';
import { SingleContentComponent } from 'src/app/global/pages_shared/single-content/single-content.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { SingleScreenComponent } from 'src/app/global/pages_shared/single-screen/single-screen.component';
import { DealerProfileComponent } from './pages/dealer-profile/dealer-profile.component';
import { LocatorComponent } from 'src/app/global/pages_shared/locator/locator.component';
import { PermissionGuard } from 'src/app/global/guards/sub-dealer/permission.guard';

export const SUB_DEALER_ROUTES: Routes = [
    {
        path: 'sub-dealer',
        component: SubDealerLayoutComponent,
        canActivate: [ AuthGuard ],
        data: { role: [ UI_ROLE_DEFINITION['sub-dealer']]  },
        children: [
            { path: '', component: DashboardComponent },
			{ path: 'dashboard', component: DashboardComponent },
			{ path: 'hosts', component: HostsComponent },
			{ path: 'licenses', component: LicensesComponent },
			{ path: 'advertisers', component: AdvertisersComponent },
			{ path: 'locator', component: LocatorComponent },
			{ path: 'media-library', component: MediaLibraryComponent },
			{ path: 'feeds', component: FeedsComponent },
			{ path: 'playlists', component: PlaylistsComponent },
			{ path: 'screens', component: ScreensComponent },
			{ path: 'user-profile/:data', component: UserProfileComponent },
			{ path: 'user-account-setting/:data', component: UserAccountSettingComponent },
			{ path: 'create-host', component: CreateHostComponent, canActivate: [ PermissionGuard ] },
			{ path: 'screens/create-screen', component: CreateScreenComponent, canActivate: [ PermissionGuard ] },
			{ path: 'create-advertiser', component: CreateAdvertiserComponent, canActivate: [ PermissionGuard ] },
			{ path: 'playlists/create-playlist', component: CreatePlaylistComponent, canActivate: [ PermissionGuard ] },
			{ path: 'advertisers/:data', component: SingleAdvertiserComponent },
			{ path: 'hosts/:data', component: SingleHostComponent },
			{ path: 'licenses/:data', component: SingleLicenseComponent },
			{ path: 'playlists/:data', component: SinglePlaylistComponent },
			{ path: 'media-library/:data', component: SingleContentComponent },
			{ path: 'screens/:data', component: SingleScreenComponent },
			{ path: 'dealer-profile/:data', component: DealerProfileComponent },
        ],
    }
];
