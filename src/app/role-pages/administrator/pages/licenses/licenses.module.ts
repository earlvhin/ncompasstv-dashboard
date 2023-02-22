import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalModule } from 'src/app/global/global.module';
import { RouterModule } from '@angular/router';

import { AdvertisersTabComponent } from './components/advertisers-tab/advertisers-tab.component';
import { DealersTabComponent } from './components/dealers-tab/dealers-tab.component';
import { LicensesComponent } from './licenses.component';
import { TagsTabComponent } from './components/tags-tab/tags-tab.component';
import { OutdatedLicensesComponent } from './components/outdated-licenses/outdated-licenses.component';

@NgModule({
	declarations: [LicensesComponent, TagsTabComponent, AdvertisersTabComponent, DealersTabComponent, OutdatedLicensesComponent],
	imports: [GlobalModule, CommonModule, RouterModule]
})
export class LicensesModule {}
