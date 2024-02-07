import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-data-card',
    templateUrl: './data-card.component.html',
    styleUrls: ['./data-card.component.scss'],
})
export class DataCardComponent implements OnInit {
    @Input() data_is_comparison: boolean;
    @Input() data_is_count: boolean;

    constructor() {}

    ngOnInit() {}
}
