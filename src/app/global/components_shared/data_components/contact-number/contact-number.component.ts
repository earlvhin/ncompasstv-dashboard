import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-contact-number',
    templateUrl: './contact-number.component.html',
    styleUrls: ['./contact-number.component.scss'],
})
export class ContactNumberComponent implements OnInit {
    contactForm: FormGroup;

    @Input() disable: boolean;
    @Input() initial_value: string;
    @Input() required = true;
    @Output() contact_value = new EventEmitter<string>();
    @Output() touch_and_not_valid = new EventEmitter<boolean>();
    @Output() value_empty = new EventEmitter<boolean>();

    constructor() {
        this.contactForm = new FormGroup({
            contactNumber: new FormControl('', [
                Validators.pattern('^[0-9]*$'), // Only numbers
                Validators.minLength(10), // Minimum length of 10 characters
                Validators.maxLength(10), // Minimum length of 10 characters
            ]),
        });
    }

    ngOnInit(): void {
        if (this.initial_value) this.contactFormControls.contactNumber.setValue(this.initial_value);
        this.contactForm.statusChanges.pipe(distinctUntilChanged()).subscribe((status) => {
            if (status !== 'VALID') {
                this.touch_and_not_valid.emit(true);
                return;
            }

            this.contact_value.emit(this.contactFormControls.contactNumber.value);
            this.touch_and_not_valid.emit(false);
        });
    }

    ngOnChanges() {
        if (this.disable) this.contactFormControls.contactNumber.disable();
        else this.contactFormControls.contactNumber.enable();
    }

    public numberValidator(event: any): void {
        const value = event.target.value;
        if (value) event.target.value = value.replace(/[^0-9]/g, '');
        else this[this.required ? 'touch_and_not_valid' : 'value_empty'].emit(true);
    }

    protected get contactFormControls() {
        return this.contactForm.controls;
    }
}
