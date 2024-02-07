import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

import { API_CONTENT } from 'src/app/global/models/api_content.model';

@Component({
    selector: 'app-view-schedules',
    templateUrl: './view-schedules.component.html',
    styleUrls: ['./view-schedules.component.scss'],
})
export class ViewSchedulesComponent implements OnInit {
    title = 'Playlist Content Schedule';

    constructor(@Inject(MAT_DIALOG_DATA) public _dialog: { contents: API_CONTENT[] }) {}

    ngOnInit() {}
}
