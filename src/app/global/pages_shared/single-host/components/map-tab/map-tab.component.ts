import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-map-tab',
    templateUrl: './map-tab.component.html',
    styleUrls: ['./map-tab.component.scss'],
})
export class MapTabComponent implements OnInit {
    @Input() latitude: number;
    @Input() longitude: number;

    constructor() {}

    ngOnInit() {}
}
