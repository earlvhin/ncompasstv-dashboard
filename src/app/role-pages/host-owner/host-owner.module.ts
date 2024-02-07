import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GlobalModule } from '../../global/global.module';
import { HostLayoutComponent } from './host-layout/host-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HOST_ROUTES } from './host-owner.routes';
import { AuthGuard } from '../../global/guards/auth/auth.guard';

@NgModule({
    declarations: [HostLayoutComponent, DashboardComponent],
    imports: [CommonModule, GlobalModule, RouterModule.forChild(HOST_ROUTES)],
    providers: [AuthGuard],
})
export class HostOwnerModule {}
