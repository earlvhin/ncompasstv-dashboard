import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
		GlobalModule,
		CommonModule,
		RouterModule	
	],
})
export class TagsModule { }
