import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-filter-labels',
    templateUrl: './filter-labels.component.html',
    styleUrls: ['./filter-labels.component.scss'],
})
export class FilterLabelsComponent implements OnInit {
    @Input() filters: any;
    @Output() clear_filter = new EventEmitter();

    constructor() {}

    ngOnInit() {}

    clearFilter() {
        this.clear_filter.emit(true);
    }
}
