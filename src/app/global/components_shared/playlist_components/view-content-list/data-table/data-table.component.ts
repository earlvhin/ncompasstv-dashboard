import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-view-content-list-table',
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent implements OnInit {
    @Input() table_data: {
        columns: { name: string }[];
        rows: {
            title: string;
            type: string;
            duration: number;
            isFullScreen: number;
            url: string;
        }[];
    };

    constructor() {}

    ngOnInit() {}
}
