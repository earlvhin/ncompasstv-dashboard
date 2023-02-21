import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalModule } from 'src/app/global/global.module';
import { RouterModule } from '@angular/router';
import { LicensesComponent } from './licenses.component';
import { TagsTabComponent } from './components/tags-tab/tags-tab.component';
import { AdvertisersTabComponent } from './components/advertisers-tab/advertisers-tab.component';

@NgModule({
  declarations: [
    LicensesComponent,
    TagsTabComponent,
    AdvertisersTabComponent
  ],
  imports: [
    GlobalModule,
    CommonModule,
    RouterModule
  ]
})
export class LicensesModule { }
