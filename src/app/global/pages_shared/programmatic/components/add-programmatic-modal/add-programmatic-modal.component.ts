import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import {
    FormArray,
    FormBuilder,
    FormGroup,
    Validators,
    AbstractControl,
    ValidatorFn,
    ValidationErrors,
} from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ProgrammaticService } from 'src/app/global/services/programmatic-service/programmatic.service';
import { VALID_URL_PATTERN } from 'src/app/global/constants/common';

@Component({
    selector: 'app-add-programmatic-modal',
    templateUrl: './add-programmatic-modal.component.html',
    styleUrls: ['./add-programmatic-modal.component.scss'],
})
export class AddProgrammaticModalComponent implements OnInit {
    hasClickedSubmit = false;
    invalidForm = true;
    licenseGenerated: boolean;
    programmaticForm: FormGroup;
    protected ngUnsubscribe = new Subject<void>();

    constructor(
        private _dialog: MatDialog,
        private _dialog_ref: MatDialogRef<AddProgrammaticModalComponent>,
        private _form: FormBuilder,
        private _programmatic: ProgrammaticService,
    ) {}

    ngOnInit(): void {
        this.programmaticForm = this._form.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
            apiUrl: ['', [Validators.required, Validators.pattern(VALID_URL_PATTERN)]],
            programmaticKeyValues: this._form.array([], uniqueValuesValidator('key')),
        });

        this.programmaticForm.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
            next: () => {
                this.invalidForm = this.programmaticForm.invalid;
            },
            error: (e) => {
                console.error(e);
            },
        });

        this.addKeyValue();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    get programmaticKeyValues(): FormArray {
        return this.programmaticForm.get('programmaticKeyValues') as FormArray;
    }

    public addKeyValue(): void {
        let keyValue = this._form.group({
            key: ['', requiredIfOtherHasContentValidator('value')],
            value: ['', requiredIfOtherHasContentValidator('key')],
        });

        this.programmaticKeyValues.push(keyValue);
    }

    public removeKeyValue(index: number): void {
        this.programmaticKeyValues.removeAt(index);
    }

    public addProgrammatic(): void {
        this.hasClickedSubmit = true;

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

    private showSuccessModal(): void {
        const dialog = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status: 'success', message: 'Programmatic created!' },
            disableClose: true,
        });

        dialog
            .afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(() => this._dialog_ref.close(true));
    }

    public markAsTouched(dataSet: FormArray, fieldIndex: number, controlName: string): void {
        const control = dataSet.at(fieldIndex).get(controlName);
        if (control) {
            control.markAsTouched();
        }
        this.validateAllFormFields(this.programmaticForm);
    }

    private validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control instanceof FormArray) {
                control.controls.forEach((group) => this.validateAllFormFields(group as FormGroup));
            } else {
                control.markAsTouched({ onlySelf: true });
                control.updateValueAndValidity({ onlySelf: true });
            }
        });
    }
}

export function uniqueValuesValidator(controlName: string): ValidatorFn {
    return (formArray: AbstractControl): { [key: string]: any } | null => {
        if (!(formArray instanceof FormArray)) {
            throw new Error('uniqueValuesValidator should be used on FormArray controls only');
        }

        const values = formArray.controls.map((control) => control.get(controlName).value);
        const duplicates = values.filter((value, index, self) => self.indexOf(value) !== index);

        return duplicates.length ? { nonUniqueValues: true } : null;
    };
}

export function requiredIfOtherHasContentValidator(otherControlName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (control && control.parent) {
            const otherControl = control.parent.get(otherControlName);
            if (otherControl && otherControl.value && !control.value) {
                return { requiredIfOtherHasContent: true };
            }
        }
        return null;
    };
}
