import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-advertiser-layout',
    templateUrl: './advertiser-layout.component.html',
    styleUrls: ['./advertiser-layout.component.scss'],
})
export class AdvertiserLayoutComponent implements OnInit {
    public toggle: boolean;
    receiveToggle($event) {
        this.toggle = $event;
    }

    constructor() {}

    ngOnInit() {}
}
