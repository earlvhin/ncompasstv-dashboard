import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UI_ACTIVITY_LOGS, UI_CURRENT_USER } from '../../models';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-single-activity-tab',
    templateUrl: './single-activity-tab.component.html',
    styleUrls: ['./single-activity-tab.component.scss'],
})
export class SingleActivityTabComponent implements OnInit {
    @Input() activity_data: UI_ACTIVITY_LOGS[] = [];
    @Input() createdBy: string;
    @Input() currentRole: string;
    @Input() currentUser: UI_CURRENT_USER;
    @Input() dateCreated: string;
    @Input() initial_load: boolean;
    @Input() no_activity_data: boolean;
    @Input() owner_data: any;
    @Input() ownerId: string;
    @Input() paging_data: any;
    @Input() reload_data: boolean;
    @Input() sort_column: string;
    @Input() sort_order: string;
    @Output() pageChanged = new EventEmitter<number>();
    @Output() sortColumnEvent = new EventEmitter<{ column: string; order: string }>();

    dateFormatted: any;

    activity_table_column = [
        { name: '#', sortable: false },
        { name: 'Date Created', column: 'dateCreated', sortable: true },
        { name: 'Activity', column: 'activityCode', sortable: false },
    ];

    constructor() {}
    protected _unsubscribe: Subject<void> = new Subject<void>();

    ngOnInit() {}

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
