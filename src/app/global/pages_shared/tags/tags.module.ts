import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagsComponent } from './tags.component';
import { AdministratorModule } from 'src/app/role-pages/administrator/administrator.module';
import { GlobalModule } from '../../global.module';
import { RouterModule } from '@angular/router';
import { CreateTagComponent } from './dialogs/create-tag/create-tag.component';
import { ViewTagComponent } from './dialogs/view-tag/view-tag.component';

const DIALOGS = [
	CreateTagComponent,
	ViewTagComponent,
];

@NgModule({
	declarations: [ TagsComponent, DIALOGS ],
	entryComponents: [ DIALOGS ],
	imports: [
		AdministratorModule,
		GlobalModule,
		CommonModule,
		RouterModule	
	]
})
export class TagsModule { }
