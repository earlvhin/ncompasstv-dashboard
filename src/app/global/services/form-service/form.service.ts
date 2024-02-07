import { Injectable } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

@Injectable()
export class FormService {
    private formArray: FormArray = new FormArray([]);

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
