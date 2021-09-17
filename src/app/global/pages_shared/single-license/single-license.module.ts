import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AnalyticsTabComponent } from './components/analytics-tab/analytics-tab.component';
import { GlobalModule } from '../../global.module';
import { SingleLicenseComponent } from './single-license.component';
import { ResourceTabComponent } from './components/resource-tab/resource-tab.component';

@NgModule({
	declarations: [ SingleLicenseComponent, AnalyticsTabComponent, ResourceTabComponent ],
	imports: [
		CommonModule,
		GlobalModule,
		RouterModule
	]
})
export class SingleLicenseModule { }