import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SingleLicenseComponent } from './single-license.component';
import { GlobalModule } from '../../global.module';
import { RouterModule } from '@angular/router';
import { AnalyticsTabComponent } from './components/analytics-tab/analytics-tab.component';

@NgModule({
	declarations: [ SingleLicenseComponent, AnalyticsTabComponent ],
	imports: [
		CommonModule,
		GlobalModule,
		CommonModule,
		RouterModule
	]
})
export class SingleLicenseModule { }
