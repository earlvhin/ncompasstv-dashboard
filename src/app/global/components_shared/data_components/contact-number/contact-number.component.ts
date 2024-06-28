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
    @Output() contact_value = new EventEmitter<string>();
    @Output() touch_and_not_valid = new EventEmitter<boolean>();

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
            if (status === 'VALID') {
                this.contact_value.emit(this.contactFormControls.contactNumber.value);
                this.touch_and_not_valid.emit(false);
            } else this.touch_and_not_valid.emit(true);
        });
    }

    ngOnChanges() {
        if (this.disable) this.contactFormControls.contactNumber.disable();
        else this.contactFormControls.contactNumber.enable();
    }

    public numberValidator(event: any) {
        const pattern = /^[0-9]*$/;
        if (!pattern.test(event.target.value)) {
            //enter only numeric
            event.target.value = event.target.value.replace(/[^0-9]/g, '');
        }
    }

    protected get contactFormControls() {
        return this.contactForm.controls;
    }
}
