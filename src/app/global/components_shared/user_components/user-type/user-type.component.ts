import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-user-type',
    templateUrl: './user-type.component.html',
    styleUrls: ['./user-type.component.scss'],
})
export class UserTypeComponent implements OnInit {
    @Input() image_icon: string;
    @Input() user_type: string;
    @Input() title: string;
    @Input() description: string;

    constructor() {}

    ngOnInit() {}

    formPerRole(e) {}
}
