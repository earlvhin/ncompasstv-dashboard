import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { GlobalModule } from '../../global.module';
import { TagsComponent } from './tags.component';
import { CreateTagComponent, EditTagComponent } from './dialogs';
import { TagsTableComponent } from './components/tags-table/tags-table.component';
import { TagsTabComponent } from './components/tags-tab/tags-tab.component';
import { TagOwnersTabComponent } from './components/tag-owners-tab/tag-owners-tab.component';
import { AssignTagsComponent } from './dialogs/assign-tags/assign-tags.component';

const DIALOGS = [
	CreateTagComponent,
	EditTagComponent,
	AssignTagsComponent
];

@NgModule({
	declarations: [ 
		DIALOGS, 
		TagsComponent, 
		TagOwnersTabComponent, 
		TagsTableComponent, 
		TagsTabComponent, AssignTagsComponent, 
	],
	entryComponents: [ DIALOGS ],
	imports: [
		GlobalModule,
		CommonModule,
		RouterModule	
	],
})
export class TagsModule { }
