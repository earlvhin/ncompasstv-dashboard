import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdministratorModule } from 'src/app/role-pages/administrator/administrator.module';
import { GlobalModule } from 'src/app/global/global.module';
import { RouterModule } from '@angular/router';
import { ViewContentListComponent } from './view-content-list.component';
import { DataTableComponent } from './data-table/data-table.component';

@NgModule({
    declarations: [ViewContentListComponent, DataTableComponent],
    entryComponents: [ViewContentListComponent],
    imports: [AdministratorModule, GlobalModule, CommonModule, RouterModule],
})
export class ViewContentListModule {}
