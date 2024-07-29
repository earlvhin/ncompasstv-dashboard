import { EventEmitter, Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

@Injectable()
export class FormService {
    formArray = new FormArray([]);
    onClearFormArray = new EventEmitter<void>();

    addForm(formGroup: FormGroup) {
        this.formArray.push(formGroup);
    }

    allValid(): boolean {
        return this.formArray.valid;
    }

    anyDirty(): boolean {
        return this.formArray.dirty;
    }

    formValue() {
        return this.formArray.value;
    }
}
