import { Component, Inject, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_CREATE_SUPPORT } from 'src/app/global/models';
import { HostService } from 'src/app/global/services';
import { AuthService } from 'src/app/global/services';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-create-entry',
    templateUrl: './create-entry.component.html',
    styleUrls: ['./create-entry.component.scss'],
})
export class CreateEntryComponent implements OnInit {
    @Output() reload_page = new EventEmitter();
    disabled_submit = true;
    form_invalid: boolean;
    is_creating_support = false;
    new_support_form: FormGroup;

    protected _unsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { hostId: string },
        private _form: FormBuilder,
        private _host: HostService,
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _dialog_ref: MatDialogRef<CreateEntryComponent>,
    ) {}

    ngOnInit() {
        this.initializeForm();
    }

    saveSupport() {
        this.is_creating_support = true;
        this.form_invalid = true;
        const createdBy = this._auth.current_user_value.user_id;

        const new_entry = new API_CREATE_SUPPORT(
            this.data.hostId,
            this.form_controls.Notes.value,
            this.form_controls.Url.value,
            createdBy,
        );

        this._host
            .create_support_entry(new_entry)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    this.form_invalid = false;
                    this._dialog_ref.close(data);
                    this.reload_page.emit(true);
                    this.showConfirmationDialog(
                        'success',
                        'Entry Saved Successfully',
                        'Click OK to continue',
                    );
                },
                (error) => {
                    this.form_invalid = false;
                    this.showConfirmationDialog(
                        'error',
                        'Error while saving Entry',
                        error.error.message,
                    );
                },
            );
    }

    private initializeForm() {
        this.new_support_form = this._form.group({
            Url: [''],
            Notes: [''],
        });

        this.new_support_form.valueChanges.subscribe((v) => {
            this.disabled_submit = !((v.Url || v.Notes !== null) && (v.Url || v.Notes !== ''));
        });
    }

    private get form_controls() {
        return this.new_support_form.controls;
    }

    private showConfirmationDialog(status: string, message: string, data: string) {
        const dialogData = { status, message, data };
        const dialogConfig = { width: '500px', height: '350px', data: dialogData };
        this._dialog.open(ConfirmationModalComponent, dialogConfig);
    }
}
