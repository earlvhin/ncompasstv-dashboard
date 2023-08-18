import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FeedsComponent } from './feeds.component';
import { GlobalModule } from 'src/app/global/global.module';
import { FillerFeedsTableComponent } from './components/filler-feeds-table/filler-feeds-table.component';

@NgModule({
	declarations: [ FeedsComponent, FillerFeedsTableComponent ],
	imports: [
		GlobalModule,
		CommonModule,
		RouterModule
	],
	providers: [ DatePipe ]
})
export class FeedsModule { }
