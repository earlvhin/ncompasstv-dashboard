import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { UI_ACTIVITY_LOGS, UI_CURRENT_USER } from '../../models';
import { DealerService } from '../../services';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DatePipe } from '@angular/common';

@Component({
	selector: 'app-single-activity-tab',
	templateUrl: './single-activity-tab.component.html',
	styleUrls: ['./single-activity-tab.component.scss']
})
export class SingleActivityTabComponent implements OnInit {
	@Input() currentRole: string;
	@Input() currentUser: UI_CURRENT_USER;
	@Input() ownerId: string;
	@Input() owner_data: any;
	@Input() activity_data: UI_ACTIVITY_LOGS[] = [];
	@Input() paging_data: any;
	@Input() sort_column: string;
	@Input() sort_order: string;
	@Input() initial_load: boolean;
	@Input() no_activity_data: boolean;
	@Input() reload_data: boolean;
	@Output() pageChanged = new EventEmitter<number>();
	@Output() sortColumnEvent = new EventEmitter<{ column: string; order: string }>();

	dateFormatted: any;

	activity_table_column = [
		{ name: '#', sortable: false },
		{ name: 'Date Created', column: 'dateCreated', sortable: true },
		{ name: 'Activity', column: 'activityCode', sortable: false }
	];

	constructor(private _date: DatePipe) {}
	protected _unsubscribe: Subject<void> = new Subject<void>();

	ngOnInit() {
		this.getDate();
	}

	getDate() {
		this.dateFormatted = this._date.transform(this.owner_data.dateCreated, 'MMMM d, y');
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	sortOrder(data: { column: string; order: string }): void {
		this.sortColumnEvent.emit(data);
	}

	onPageChange(newPage: number): void {
		this.pageChanged.emit(newPage);
	}

	reload_page(e: boolean): void {
		if (e) this.ngOnInit();
		this.reload_data;
	}
}
