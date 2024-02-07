import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GlobalModule } from 'src/app/global/global.module';

import { InstallationsComponent } from './installations.component';
import { TabContentComponent } from './components/tab-content/tab-content.component';

@NgModule({
    declarations: [InstallationsComponent, TabContentComponent],
    imports: [CommonModule, GlobalModule, RouterModule],
    providers: [InstallationsComponent],
})
export class InstallationsModule {}
