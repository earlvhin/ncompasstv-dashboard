import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { UpdateService } from 'src/app/global/services';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { API_APP_FORM } from 'src/app/global/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-create-app',
    templateUrl: './create-app.component.html',
    styleUrls: ['./create-app.component.scss'],
})
export class CreateAppComponent implements OnInit, OnDestroy {
    @Output() add_app_success: EventEmitter<any>;

    addAppForm: API_APP_FORM[] = [];
    disabledSubmit = true;
    isSubmiting = false;
    newAppForm: FormGroup;
    protected unSubscribe = new Subject<void>();

    constructor(
        private _form: FormBuilder,
        private _updates: UpdateService,
        private _dialog: MatDialog,
        private _dialog_ref: MatDialogRef<CreateAppComponent>,
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
        this.newAppForm = this._form.group({
            appName: [''],
            appDescription: [''],
            githubUrl: [''],
        });
    }

    private subscribeToFormChanges() {
        this.newAppForm.valueChanges.pipe(takeUntil(this.unSubscribe)).subscribe(() => {
            this.disabledSubmit =
                this.newAppForm.value.appName === '' ||
                this.newAppForm.value.appDescription === '' ||
                this.newAppForm.value.githubUrl === '';
        });
    }

    public addApp() {
        this.isSubmiting = true;
        this.addAppForm.push({
            appName: this.newAppForm.value.appName,
            appDescription: this.newAppForm.value.appDescription,
            githubUrl: this.newAppForm.value.githubUrl,
        });

        this._updates
            .add_app(this.addAppForm[0])
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((data) => {
                this.newAppForm.reset();
                this._dialog_ref.close(data);
                this.showConfirmationDialog('success', 'Player App successfully created', '');
                this.isSubmiting = false;
            });
    }

    private showConfirmationDialog(status: string, message: string, data: string) {
        const dialogData = { status, message, data };
        const dialogConfig = { width: '500px', height: '350px', data: dialogData };
        this._dialog.open(ConfirmationModalComponent, dialogConfig);
    }
}
