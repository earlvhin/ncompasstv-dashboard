import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GlobalModule } from '../../global/global.module';
import { TechnicalLayoutComponent } from './technical-layout/technical-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TECHNICAL_ROUTES } from './technical.routes';
import { AuthGuard } from '../../global/guards/auth/auth.guard';

@NgModule({
    declarations: [TechnicalLayoutComponent, DashboardComponent],
    imports: [CommonModule, GlobalModule, RouterModule.forChild(TECHNICAL_ROUTES)],
    providers: [AuthGuard],
})
export class TechnicalModule {}
