import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-new-zone',
    templateUrl: './new-zone.component.html',
    styleUrls: ['./new-zone.component.scss'],
})
export class NewZoneComponent implements OnInit {
    @Input() zone_name: string;
    @Input() zone_description: string;
    @Input() zone_background: string;
    @Input() zone_height: string;
    @Input() zone_width: string;
    @Input() zone_pos_x: string;
    @Input() zone_pos_y: string;

    screen_width: number = 1920;
    screen_height: number = 1080;

    constructor() {}

    ngOnInit() {}
}
