import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-migrate-overlay',
    templateUrl: './migrate-overlay.component.html',
    styleUrls: ['./migrate-overlay.component.scss'],
})
export class MigrateOverlayComponent implements OnInit {
    @Input() title: string;
    @Input() subtitle: string = '';

    constructor() {}

    ngOnInit() {}
}
