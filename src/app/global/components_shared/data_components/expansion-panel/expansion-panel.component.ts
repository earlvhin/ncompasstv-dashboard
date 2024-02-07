import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-expansion-panel',
    templateUrl: './expansion-panel.component.html',
    styleUrls: ['./expansion-panel.component.scss'],
})
export class ExpansionPanelComponent implements OnInit {
    @Input() expand: boolean;
    @Input() title: string;
    @Input() description: string;
    @Input() data_is_list: boolean;
    @Input() data_is_table: boolean;
    @Input() table_columns: any;
    @Input() table_data: any;
    @Input() list_data: any;
    @Input() chart_id: string;
    @Input() chart_label: any;
    @Input() chart_data: any;

    constructor() {}

    ngOnInit() {}
}
