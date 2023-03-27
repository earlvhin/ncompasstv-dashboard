import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSnackBarModule } from '@angular/material';

import { AnalyticsTabComponent } from './components/analytics-tab/analytics-tab.component';
import { GlobalModule } from '../../global.module';
import { SingleLicenseComponent } from './single-license.component';
import { ResourceTabComponent } from './components/resource-tab/resource-tab.component';
import { InstallationTabComponent } from './components/installation-tab/installation-tab.component';
import { ContentTabComponent } from './components/content-tab/content-tab.component';
import { AddTagModalComponent } from './components/add-tag-modal/add-tag-modal.component';
import { UpdateTvBrandDialogComponent } from './components/update-tv-brand-dialog/update-tv-brand-dialog.component';

const MODALS = [AddTagModalComponent, UpdateTvBrandDialogComponent];
@NgModule({
	declarations: [SingleLicenseComponent, AnalyticsTabComponent, ResourceTabComponent, InstallationTabComponent, ContentTabComponent, MODALS],
	imports: [CommonModule, GlobalModule, MatSnackBarModule, RouterModule],
	entryComponents: [MODALS]
})
export class SingleLicenseModule {}
