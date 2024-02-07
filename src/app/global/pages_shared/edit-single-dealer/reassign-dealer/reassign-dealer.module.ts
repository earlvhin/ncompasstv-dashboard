import { NgModule } from '@angular/core';
import { AdministratorModule } from 'src/app/role-pages/administrator/administrator.module';
import { CommonModule } from '@angular/common';
import { GlobalModule } from 'src/app/global/global.module';
import { RouterModule } from '@angular/router';

import { ReassignDealerComponent } from './reassign-dealer.component';

@NgModule({
    declarations: [ReassignDealerComponent],
    entryComponents: [ReassignDealerComponent],
    imports: [AdministratorModule, GlobalModule, CommonModule, RouterModule],
})
export class ReassignDealerModule {}
