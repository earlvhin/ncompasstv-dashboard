import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubDealerLayoutComponent } from './sub-dealer-layout/sub-dealer-layout.component';
import { GlobalModule } from 'src/app/global/global.module';
import { RouterModule } from '@angular/router';
import { SUB_DEALER_ROUTES } from './sub-dealer.routes';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from 'src/app/global/guards/auth/auth.guard';
import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { BillingsComponent } from './pages/billings/billings.component';
import { DealerProfileComponent } from './pages/dealer-profile/dealer-profile.component';
import { FeedsComponent } from './pages/feeds/feeds.component';
import { HostsComponent } from './pages/hosts/hosts.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { UsersComponent } from './pages/users/users.component';
import { MatAutocompleteModule, MatButtonModule, MatCardModule, MatExpansionModule, MatInputModule, MatMenuModule, MatSelectModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PlaylistsComponent } from './pages/playlists/playlists.component';


@NgModule({
	declarations: [ 
		AdvertisersComponent,
		BillingsComponent,
		DashboardComponent,
		DealerProfileComponent,
		FeedsComponent,
		HostsComponent,
		LicensesComponent,
		ReportsComponent,
		ScreensComponent,
		UsersComponent,
		SubDealerLayoutComponent,
		PlaylistsComponent
	],
	imports: [
		CommonModule,
		GlobalModule,
		RouterModule.forChild(SUB_DEALER_ROUTES),
		MatCardModule,
		MatButtonModule,
		MatAutocompleteModule,
		MatInputModule,
		MatMenuModule,
		MatSelectModule,
		MatExpansionModule,
		FormsModule,
		ReactiveFormsModule,
	],
	providers: [ AuthGuard ]
})
export class SubDealerModule { }
