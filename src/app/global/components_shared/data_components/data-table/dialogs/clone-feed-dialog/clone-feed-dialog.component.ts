import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-clone-feed-dialog',
    templateUrl: './clone-feed-dialog.component.html',
    styleUrls: ['./clone-feed-dialog.component.scss'],
})
export class CloneFeedDialogComponent implements OnInit {
    feedName = new FormControl(null, [Validators.required, this.noWhitespaceValidator]);
    oldName: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: string) {
        this.oldName = data;
    }

    ngOnInit() {
        this.feedName.setValue(`${this.oldName} clone`);
    }

    private noWhitespaceValidator(control: FormControl): { [key: string]: boolean } | null {
        const isWhitespace = (control.value || '').trim().length === 0;
        const isValid = !isWhitespace;
        return isValid ? null : { whitespace: true };
    }
}
