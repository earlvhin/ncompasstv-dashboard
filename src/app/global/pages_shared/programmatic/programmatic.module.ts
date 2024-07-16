import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { GlobalModule } from '../../global.module';
import { ProgrammaticComponent } from './programmatic.component';
import { ProgrammaticVendorComponent } from './components/programmatic-vendor/programmatic-vendor.component';
import { AddProgrammaticModalComponent } from './components/add-programmatic-modal/add-programmatic-modal.component';

const DIALOGS = [AddProgrammaticModalComponent];

@NgModule({
    declarations: [DIALOGS, ProgrammaticComponent, ProgrammaticVendorComponent],
    entryComponents: [DIALOGS],
    imports: [GlobalModule, CommonModule, RouterModule],
})
export class ProgrammaticModule {}
