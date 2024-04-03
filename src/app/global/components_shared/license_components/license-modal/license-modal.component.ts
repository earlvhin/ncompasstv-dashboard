import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LicenseService } from '../../../services/license-service/license.service';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-license-modal',
    templateUrl: './license-modal.component.html',
    styleUrls: ['./license-modal.component.scss'],
})
export class LicenseModalComponent implements OnInit {
    generate_license_form: FormGroup;
    dealer_id: string;
    is_submitted: boolean;
    license_generated: boolean;
    invalid_form: boolean = true;
    subscription = new Subscription();

    constructor(
        private _form: FormBuilder,
        private _license: LicenseService,
    ) {}

    ngOnInit() {
        // So ugly Optimize
        this.generate_license_form = this._form.group({
            dealer: ['', Validators.required],
            number_of_license: ['', Validators.required],
        });

        this.subscription.add(
            this.generate_license_form.valueChanges.subscribe((data) => {
                if (
                    this.generate_license_form.valid &&
                    this.formControls.number_of_license.value > 0 &&
                    this.formControls.number_of_license.value <= 50
                ) {
                    this.invalid_form = false;
                } else {
                    this.invalid_form = true;
                }
            }),
        );
    }

    // Convenience getter for easy access to form fields
    get formControls() {
        return this.generate_license_form.controls;
    }

    generateLicense() {
        this.is_submitted = true;
        this._license
            .generate_license(this.formControls.dealer.value, this.formControls.number_of_license.value)
            .subscribe(
                (data) => {
                    this.license_generated = true;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    public setAssignedTo(dealer: any): void {
        this.formControls.dealer.setValue(dealer.id);
    }
}
