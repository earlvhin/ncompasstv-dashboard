import { Routes } from '@angular/router';
import { AuthGuard } from '../../global/guards/auth/auth.guard';
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

export const DEALER_ROUTES: Routes = [
	{
	path: 'dealer',
	component: DealerLayoutComponent,
	canActivate: [AuthGuard],
	data: { role: [UI_ROLE_DEFINITION.dealer] },
		children: [
			{ path: '', component: DashboardComponent },
			{ path: 'dashboard', component: DashboardComponent },
			{ path: 'create-host', component: CreateHostComponent},
			{ path: 'screens/create-screen', component: CreateScreenComponent},
			{ path: 'advertisers', component: AdvertisersComponent },
			{ path: 'advertisers/:data', component: SingleAdvertiserComponent },
			{ path: 'create-advertiser', component: CreateAdvertiserComponent },
			{ path: 'feeds', component: FeedsComponent },
			{ path: 'hosts', component: HostsComponent },
			{ path: 'hosts/:data', component: SingleHostComponent},
			{ path: 'licenses', component: LicensesComponent },
			{ path: 'licenses/:data', component: SingleLicenseComponent},
			{ path: 'locator', component: LocatorComponent },
			{ path: 'playlists', component: PlaylistsComponent },
			{ path: 'playlists/create-playlist', component: CreatePlaylistComponent },
			{ path: 'playlists/:data', component: SinglePlaylistComponent },
			{ path: 'media-library', component: MediaLibraryComponent },
			{ path: 'media-library/:data', component: SingleContentComponent },
			{ path: 'screens', component: ScreensComponent },
			{ path: 'screens/:data', component: SingleScreenComponent },
			{ path: 'billings', component: BillingsComponent },
			{ path: 'reports', component: ReportsComponent },
			{ path: 'users', component: UsersComponent },
			{ path: 'users/create-user', component: CreateUserComponent},
			{ path: 'users/:data', component: SingleUserComponent },
			{ path: 'user-profile/:data', component: UserProfileComponent },
			{ path: 'dealer-profile/:data', component: DealerProfileComponent },
			{ path: 'users/create-user/:data', component: CreateUserTypeComponent },
			{ path: 'user-account-setting/:data', component: UserAccountSettingComponent }
		]
	}
];
