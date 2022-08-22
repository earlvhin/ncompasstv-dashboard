import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalModule } from 'src/app/global/global.module';
import { RouterModule } from '@angular/router';

import { ReleaseNotesComponent } from './release-notes.component';
import { CreateUpdateDialogComponent } from './components/create-update-dialog/create-update-dialog.component';


@NgModule({
	declarations: [ ReleaseNotesComponent, CreateUpdateDialogComponent ],
	entryComponents: [ CreateUpdateDialogComponent ],
	imports: [
		CommonModule, GlobalModule, RouterModule
	]
})
export class ReleaseNotesModule { }
