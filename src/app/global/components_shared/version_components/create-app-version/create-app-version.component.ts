import { Component, EventEmitter, Inject, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { UpdateService } from 'src/app/global/services';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { API_VERSION_FORM } from 'src/app/global/models';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-create-app-version',
    templateUrl: './create-app-version.component.html',
    styleUrls: ['./create-app-version.component.scss'],
})
export class CreateAppVersionComponent implements OnInit, OnDestroy {
    @Output() refresh_page = new EventEmitter();

    addVersionForm: API_VERSION_FORM[] = [];
    disabledSubmit = true;
    isSubmiting = false;
    newVersionForm: FormGroup;

    protected unSubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { appId: string },
        private _form: FormBuilder,
        private _updates: UpdateService,
        private _dialog: MatDialog,
        private _dialog_ref: MatDialogRef<CreateAppVersionComponent>,
    ) {}

    ngOnInit() {
        this.initializeForm();
        this.subscribeToFormChanges();
    }

    ngOnDestroy(): void {
        this.unSubscribe.next();
        this.unSubscribe.complete();
    }

    private initializeForm() {
        this.newVersionForm = this._form.group({
            version: [''],
            releaseNotes: [''],
            zipUrl: [''],
        });
    }

    private subscribeToFormChanges() {
        this.newVersionForm.valueChanges.pipe(takeUntil(this.unSubscribe)).subscribe(() => {
            this.disabledSubmit =
                this.newVersionForm.value.version === '' ||
                this.newVersionForm.value.releaseNotes === '' ||
                this.newVersionForm.value.zipUrl === '';
        });
    }

    public addVersion() {
        this.isSubmiting = true;

        this.addVersionForm.push({
            version: this.newVersionForm.value.version,
            releaseNotes: this.newVersionForm.value.releaseNotes,
            zipUrl: this.newVersionForm.value.zipUrl,
            appId: this.data.appId,
        });

        this._updates
            .add_app_version(this.addVersionForm[0])
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((data) => {
                this.newVersionForm.reset();
                this._dialog_ref.close(data);
                this.showConfirmationDialog('success', 'Player App Version successfully created', '');
                this.isSubmiting = false;
            });
    }

    private showConfirmationDialog(status: string, message: string, data: string) {
        const dialogData = { status, message, data };
        const dialogConfig = { width: '500px', height: '350px', data: dialogData };
        this._dialog.open(ConfirmationModalComponent, dialogConfig);
    }
}
