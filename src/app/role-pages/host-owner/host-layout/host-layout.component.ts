import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-host-layout',
    templateUrl: './host-layout.component.html',
    styleUrls: ['./host-layout.component.scss'],
})
export class HostLayoutComponent implements OnInit {
    public toggle: boolean;

    receiveToggle($event) {
        this.toggle = $event;
    }

    constructor() {}

    ngOnInit() {}
}
