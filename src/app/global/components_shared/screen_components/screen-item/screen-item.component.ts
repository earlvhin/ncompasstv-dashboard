import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-screen-item',
    templateUrl: './screen-item.component.html',
    styleUrls: ['./screen-item.component.scss'],
})
export class ScreenItemComponent implements OnInit {
    @Input() screen_title: String;
    @Input() screen_thumbnail: String;
    @Input() screen_published_date: String;

    constructor() {}

    ngOnInit() {}
}
