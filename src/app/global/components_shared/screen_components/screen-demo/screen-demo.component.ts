import { Component, OnInit, Input } from '@angular/core';
import { UI_SINGLE_SCREEN } from '../../../models/ui_single-screen.model';

@Component({
    selector: 'app-screen-demo',
    templateUrl: './screen-demo.component.html',
    styleUrls: ['./screen-demo.component.scss'],
})
export class ScreenDemoComponent implements OnInit {
    @Input() screen_data: UI_SINGLE_SCREEN[];
    is_fullscreen: boolean = false;

    constructor() {}

    ngOnInit() {}
}
