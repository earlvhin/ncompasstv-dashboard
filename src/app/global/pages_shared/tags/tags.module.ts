import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AdministratorModule } from 'src/app/role-pages/administrator/administrator.module';
import { GlobalModule } from '../../global.module';
import { TagsComponent } from './tags.component';
import { CreateTagComponent, EditTagComponent } from './dialogs';
import { TagsTableComponent } from './components/tags-table/tags-table.component';

const DIALOGS = [
	CreateTagComponent,
	EditTagComponent,
];

@NgModule({
	declarations: [ TagsComponent, DIALOGS, TagsTableComponent ],
	entryComponents: [ DIALOGS ],
	imports: [
		AdministratorModule,
		GlobalModule,
		CommonModule,
		RouterModule	
	],
	providers: [ TitleCasePipe ]
})
export class TagsModule { }
