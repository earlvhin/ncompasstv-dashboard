import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FeedsComponent } from './feeds.component';
import { GlobalModule } from 'src/app/global/global.module';

@NgModule({
	declarations: [ FeedsComponent ],
	imports: [
		GlobalModule,
		CommonModule,
		RouterModule
	],
	providers: [ DatePipe ]
})
export class FeedsModule { }
