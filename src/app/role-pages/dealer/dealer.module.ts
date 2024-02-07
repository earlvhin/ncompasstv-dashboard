import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    MatButtonModule,
    MatAutocompleteModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
} from '@angular/material';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';

import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { BreadcrumbsModule } from 'ng6-breadcrumbs';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DealerLayoutComponent } from './dealer-layout/dealer-layout.component';
import { DEALER_ROUTES } from './dealer.routes';
import { FeedsModule } from 'src/app/global/pages_shared/feeds/feeds.module';
import { GlobalModule } from '../../global/global.module';
import { HostsComponent } from './pages/hosts/hosts.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { LocatorComponent } from './pages/locator/locator.component';
import { MatCardModule } from '@angular/material/card';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { UsersComponent } from './pages/users/users.component';

import { AuthGuard } from 'src/app/global/guards';

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
        ReportsComponent,
        UsersComponent,
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
        FeedsModule,
        FormsModule,
        ReactiveFormsModule,
        BreadcrumbsModule,
        RouterModule.forChild(DEALER_ROUTES),
    ],
    providers: [AuthGuard],
})
export class DealerModule {}
