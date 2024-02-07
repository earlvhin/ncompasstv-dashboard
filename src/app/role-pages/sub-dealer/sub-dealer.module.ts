import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
} from '@angular/material';

import { RouterModule } from '@angular/router';

import { AdvertisersComponent } from './pages/advertisers/advertisers.component';
import { AuthGuard } from 'src/app/global/guards/auth/auth.guard';
import { BreadcrumbsModule } from 'ng6-breadcrumbs';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FeedsModule } from 'src/app/global/pages_shared/feeds/feeds.module';
import { GlobalModule } from 'src/app/global/global.module';
import { HostsComponent } from './pages/hosts/hosts.component';
import { SUB_DEALER_ROUTES } from './sub-dealer.routes';
import { SubDealerLayoutComponent } from './sub-dealer-layout/sub-dealer-layout.component';
import { LicensesComponent } from './pages/licenses/licenses.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { ScreensComponent } from './pages/screens/screens.component';
import { UsersComponent } from './pages/users/users.component';

@NgModule({
    declarations: [
        AdvertisersComponent,
        DashboardComponent,
        HostsComponent,
        LicensesComponent,
        ScreensComponent,
        UsersComponent,
        SubDealerLayoutComponent,
        PlaylistsComponent,
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
        FeedsModule,
        FormsModule,
        ReactiveFormsModule,
        BreadcrumbsModule,
    ],
    providers: [AuthGuard],
})
export class SubDealerModule {}
