import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { GlobalModule } from '../../global.module';
import { SingleHostComponent } from './single-host.component';
import { ContentsTabComponent } from './components/contents-tab/contents-tab.component';
import { LicensesTabComponent } from './components/licenses-tab/licenses-tab.component';
import { MapTabComponent } from './components/map-tab/map-tab.component';
import { ImagesTabComponent } from './components/images-tab/images-tab.component';
import { DocumentsTabComponent } from './components/documents-tab/documents-tab.component';


@NgModule({
	declarations: [
		SingleHostComponent,
		ContentsTabComponent,
		LicensesTabComponent,
		MapTabComponent,
		ImagesTabComponent,
		DocumentsTabComponent,
	],
	imports: [
		CommonModule,
		GlobalModule,
		RouterModule
	]
})
export class SingleHostModule { }
