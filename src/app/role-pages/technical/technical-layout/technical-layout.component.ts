import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-technical-layout',
    templateUrl: './technical-layout.component.html',
    styleUrls: ['./technical-layout.component.scss'],
})
export class TechnicalLayoutComponent implements OnInit {
    public toggle: boolean;
    receiveToggle($event) {
        this.toggle = $event;
    }

    constructor() {}

    ngOnInit() {}
}
