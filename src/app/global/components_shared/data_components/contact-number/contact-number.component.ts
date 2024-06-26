import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
    selector: 'app-contact-number',
    templateUrl: './contact-number.component.html',
    styleUrls: ['./contact-number.component.scss'],
})
export class ContactNumberComponent implements OnInit {
    contactForm: FormGroup;

    constructor() {
        this.contactForm = new FormGroup({
            contactNumber: new FormControl('', [
                Validators.pattern('^[0-9]*$'), // Only numbers
                Validators.minLength(10), // Minimum length of 10 characters
            ]),
        });
    }

    ngOnInit(): void {
    }
}
