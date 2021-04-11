import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstallationsComponent } from './installations.component';
import { DataTableComponent } from './data-table/data-table.component';
import { AdministratorModule } from '../../administrator.module';
import { GlobalModule } from 'src/app/global/global.module';
import { RouterModule } from '@angular/router';

@NgModule({
	declarations: [ DataTableComponent, InstallationsComponent ],
	entryComponents: [ InstallationsComponent ],
	imports: [
		AdministratorModule,
		GlobalModule,
		CommonModule,
		RouterModule
	],
})
export class InstallationsModule { }
