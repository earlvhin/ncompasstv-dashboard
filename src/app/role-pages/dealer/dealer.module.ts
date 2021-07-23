import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GlobalModule } from '../../global/global.module';
import { DealerLayoutComponent } from './dealer-layout/dealer-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DEALER_ROUTES } from './dealer.routes';
import { AuthGuard } from '../../global/guards/auth/auth.guard';
import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { HostsComponent } from './pages/hosts/hosts.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { LocatorComponent } from './pages/locator/locator.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { BillingsComponent } from './pages/billings/billings.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { UsersComponent } from './pages/users/users.component';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule, MatAutocompleteModule, MatInputModule, MatSelectModule, MatExpansionModule } from '@angular/material';
import { DealerProfileComponent } from './pages/dealer-profile/dealer-profile.component';
import { FeedsComponent } from './pages/feeds/feeds.component';
import {BreadcrumbsModule} from "ng6-breadcrumbs";

@NgModule({
	declarations: [
		DealerLayoutComponent, 
		DashboardComponent, 
		AdvertisersComponent, 
		HostsComponent, 
		LicensesComponent, 
		LocatorComponent, 
		PlaylistsComponent, 
		ScreensComponent, 
		BillingsComponent, 
		ReportsComponent, 
		UsersComponent, 
		DealerProfileComponent,
		FeedsComponent
	],
	imports: [
		CommonModule,
		GlobalModule,
		MatCardModule,
		MatButtonModule,
		MatAutocompleteModule,
		MatInputModule,
		MatInputModule,
		MatMenuModule,
		MatSelectModule,
		MatExpansionModule,
		FormsModule,
		ReactiveFormsModule,
        BreadcrumbsModule,
		RouterModule.forChild(DEALER_ROUTES)
	],
	providers: [
		AuthGuard
	]
})

export class DealerModule { }
