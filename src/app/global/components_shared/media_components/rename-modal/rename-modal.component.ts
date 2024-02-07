import { Component, OnInit, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-rename-modal',
    templateUrl: './rename-modal.component.html',
    styleUrls: ['./rename-modal.component.scss'],
})
export class RenameModalComponent implements OnInit {
    update_file: FormGroup;

    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialog_data: any,
        public dialogRef: MatDialogRef<RenameModalComponent>,
        private _form: FormBuilder,
    ) {}

    ngOnInit() {
        this.update_file = this._form.group({
            filename: [null, [Validators.required]],
        });
    }

    get f() {
        return this.update_file.controls;
    }

    mapChanges() {
        return this.f.filename.value;
    }

    updateFile() {
        this.dialogRef.close(this.mapChanges());
    }
}
