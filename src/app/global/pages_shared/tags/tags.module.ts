import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { GlobalModule } from '../../global.module';
import { TagsComponent } from './tags.component';
import { CreateTagComponent, EditTagComponent } from './dialogs';
import { TagsTableComponent } from './components/tags-table/tags-table.component';
import { TagsSectionComponent } from './components/tags-section/tags-section.component';
import { TagOwnersSectionComponent } from './components/tag-owners-section/tag-owners-section.component';
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
		TagOwnersSectionComponent, 
		TagsTableComponent, 
		TagsSectionComponent,
	],
	entryComponents: [ DIALOGS ],
	imports: [
		GlobalModule,
		CommonModule,
		RouterModule,
	],
})
export class TagsModule { }
