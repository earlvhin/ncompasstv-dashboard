import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { FormArray, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ProgrammaticVendor, ProgrammaticKeyValues } from 'src/app/global/models';
import { ProgrammaticService } from 'src/app/global/services/programmatic-service/programmatic.service';
import { VALID_URL_PATTERN } from 'src/app/global/constants/common';

@Component({
    selector: 'app-add-edit-programmatic-modal',
    templateUrl: './add-edit-programmatic-modal.component.html',
    styleUrls: ['./add-edit-programmatic-modal.component.scss'],
})
export class AddEditProgrammaticModalComponent implements OnInit {
    hasClickedSubmit: boolean = false;
    invalidForm: boolean = true;
    isEdit: boolean = false;
    licenseGenerated: boolean;
    programmaticForm: FormGroup;
    protected ngUnsubscribe = new Subject<void>();

    constructor(
        private _dialog: MatDialog,
        private _dialog_ref: MatDialogRef<AddEditProgrammaticModalComponent>,
        private _form: FormBuilder,
        private _programmatic: ProgrammaticService,
        @Inject(MAT_DIALOG_DATA) public vendor: ProgrammaticVendor = null,
    ) {}

    ngOnInit(): void {
        if (this.vendor && this.vendor.id) this.isEdit = true;

        this.programmaticForm = this._form.group({
            name: ['', Validators.required],
            description: ['', [Validators.required, Validators.maxLength(250)]],
            apiUrl: ['', [Validators.required, Validators.pattern(VALID_URL_PATTERN)]],
            vendorKeyValues: this._form.array([], uniqueValuesValidator('key')),
        });

        this.programmaticForm.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
            next: () => {
                this.invalidForm = this.programmaticForm.invalid;
            },
            error: (e) => {
                console.error(e);
            },
        });

        // Populate Key Value form
        if (this.isEdit) {
            this.vendor.vendorKeyValues.length
                ? this.vendor.vendorKeyValues.forEach((keyValue) => this.addKeyValue(keyValue))
                : this.addKeyValue();
            this.programmaticForm.patchValue(this.vendor);
        } else this.addKeyValue();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    get vendorKeyValues(): FormArray {
        return this.programmaticForm.get('vendorKeyValues') as FormArray;
    }

    public addKeyValue(data?: ProgrammaticKeyValues): void {
        let keyValue = this._form.group(
            {
                key: [this.isEdit && data && data.key ? data.key : ''],
                value: [this.isEdit && data && data.value ? data.value : ''],
            },
            {
                validators: keyValueValidator(),
            },
        );

        // Subscribe to value changes to trigger revalidation
        keyValue.valueChanges.subscribe(() => {
            keyValue.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        });

        this.vendorKeyValues.push(keyValue);
    }

    public removeKeyValue(index: number): void {
        this.vendorKeyValues.removeAt(index);
    }

    public saveProgrammatic(): void {
        this.hasClickedSubmit = true;

        if (this.isEdit) {
            let updateData = this.programmaticForm.value;
            updateData.id = this.vendor.id;

            this._programmatic
                .editVendor(updateData)
                .pipe(takeUntil(this.ngUnsubscribe))
                .subscribe({
                    next: () => this.showSuccessModal(),
                    error: (err) => {
                        console.error('Failed to edit a programmatic vendor!', err);
                    },
                });
        } else {
            this._programmatic
                .addVendor(this.programmaticForm.value)
                .pipe(takeUntil(this.ngUnsubscribe))
                .subscribe({
                    next: () => this.showSuccessModal(),
                    error: (err) => {
                        console.error('Failed to add a programmatic vendor!', err);
                    },
                });
        }
    }

    private showSuccessModal(): void {
        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: { status: 'success', message: 'Programmatic saved!' },
                disableClose: true,
            })
            .afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(() => this._dialog_ref.close(true));
    }

    public markAsTouched(dataSet: FormArray, fieldIndex: number, controlName: string): void {
        const control = dataSet.at(fieldIndex).get(controlName);
        if (control) control.markAsTouched();

        this.validateAllFormFields(this.programmaticForm);
    }

    private validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);

            if (control instanceof FormArray)
                control.controls.forEach((group) => this.validateAllFormFields(group as FormGroup));
            else ['markAsTouched', 'updateValueAndValidity'].forEach((method) => control[method]({ onlySelf: true }));
        });
    }
}

export function uniqueValuesValidator(controlName: string): ValidatorFn {
    return (formArray: AbstractControl): { [key: string]: any } | null => {
        if (!(formArray instanceof FormArray))
            throw new Error('uniqueValuesValidator should be used on FormArray controls only');

        const values = formArray.controls.map((control) => control.get(controlName).value);
        const duplicates = values.filter((value, index, self) => self.indexOf(value) !== index);

        return duplicates.length ? { nonUniqueValues: true } : null;
    };
}

export function keyValueValidator(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
        const keyControl = group.get('key');
        const valueControl = group.get('value');
        if (!keyControl || !valueControl) return null;

        const key = keyControl.value;
        const value = valueControl.value;

        return !key && value ? { keyRequired: true } : key && !value ? { valueRequired: true } : null;
    };
}
