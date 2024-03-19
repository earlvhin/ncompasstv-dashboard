import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-clone-filler-dialog',
    templateUrl: './clone-filler-dialog.component.html',
    styleUrls: ['./clone-filler-dialog.component.scss'],
})
export class CloneFillerDialogComponent implements OnInit {
    fillerName = new FormControl(null, Validators.required);
    oldName: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: string) {
        this.oldName = data;
    }

    ngOnInit() {
        this.fillerName.setValue(`${this.oldName} clone`);
    }
}
