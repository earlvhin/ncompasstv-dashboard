import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import * as moment from 'moment';

import { API_FILTERS, INSTALLATION, PAGING } from 'src/app/global/models';
import { FormControl } from '@angular/forms';
import { MatDatepicker } from '@angular/material';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-tab-content',
    templateUrl: './tab-content.component.html',
    styleUrls: ['./tab-content.component.scss'],
})
export class TabContentComponent implements OnInit, OnDestroy {
    @ViewChild('datePicker', { static: false }) datePicker: MatDatepicker<Date>;

    @Output() onExport = new EventEmitter<void>();
    @Output() onSearch = new EventEmitter<string>();
    @Output() onSelectDate = new EventEmitter<moment.Moment>();
    @Output() onSelectDateView = new EventEmitter<number>();
    @Output() onSelectPage = new EventEmitter<number>();
    @Output() onSortByColumnAndOrder = new EventEmitter<{ column: string; order: string }>();
    @Output() onTableRefresh = new EventEmitter<void>();

    @Input() currentFilters: API_FILTERS;
    @Input() filteredData: any[];
    @Input() isDatePickerEnabled = true;
    @Input() isDatePickerViewEnabled = true;
    @Input() initialLoad: boolean;
    @Input() installation_count: any;
    @Input() installations: INSTALLATION[];
    @Input() isExporting: boolean;
    @Input() pagingData: PAGING;
    @Input() resetDatePicker: Observable<void>;
    @Input() searching: boolean;
    @Input() tableColumns: any[];
    @Input() tab: string;

    dateViews = this._dateViews;
    date = new FormControl(moment());

    protected _unsubscribe = new Subject<void>();

    constructor() {}

    ngOnInit() {
        this.subscribeToResetDatePicker();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    dateSelected(value: moment.Moment): void {
        this.onSelectDate.emit(value);
        this.datePicker.close();
    }

    searchInstallations(keyword: string): void {
        this.onSearch.emit(keyword);
    }

    private subscribeToResetDatePicker(): void {
        this.resetDatePicker.pipe(takeUntil(this._unsubscribe)).subscribe(() => this.date.setValue(new Date()));
    }

    protected get _dateViews() {
        return [
            { name: '', value: '', index: 0 },
            { name: 'Day', value: 'day', index: 1 },
            { name: 'Month', value: 'month', index: 2 },
            { name: 'Year', value: 'year', index: 3 },
        ];
    }
}
