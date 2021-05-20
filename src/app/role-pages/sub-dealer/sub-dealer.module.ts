import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubDealerLayoutComponent } from './sub-dealer-layout/sub-dealer-layout.component';
import { GlobalModule } from 'src/app/global/global.module';
import { RouterModule } from '@angular/router';
import { SUB_DEALER_ROUTES } from './sub-dealer.routes';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from 'src/app/global/guards/auth/auth.guard';


@NgModule({
	declarations: [ DashboardComponent, SubDealerLayoutComponent ],
	imports: [
		CommonModule,
		GlobalModule,
		RouterModule.forChild(SUB_DEALER_ROUTES)
	],
	providers: [ AuthGuard ]
})
export class SubDealerModule { }
