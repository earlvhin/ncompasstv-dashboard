import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GlobalModule } from '../../global/global.module';
import { AdvertiserLayoutComponent } from './advertiser-layout/advertiser-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ADVERTISER_ROUTES } from './advertiser.routes';
import { AuthGuard } from '../../global/guards/auth/auth.guard';

@NgModule({
    declarations: [AdvertiserLayoutComponent, DashboardComponent],
    imports: [CommonModule, GlobalModule, RouterModule.forChild(ADVERTISER_ROUTES)],
    providers: [AuthGuard],
})
export class AdvertiserModule {}
