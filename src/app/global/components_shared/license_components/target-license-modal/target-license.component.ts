import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { LicenseService } from '../../../services/license-service/license.service';
import { API_CONTENT, API_BLOCKLIST_CONTENT, CREDITS, PLAYLIST_CHANGES, API_LICENSE } from 'src/app/global/models';
import { Subject } from 'rxjs';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-license-modal',
    templateUrl: './target-license.component.html',
    styleUrls: ['./target-license.component.scss'],
})
export class TargetLicenseModal implements OnInit {
    generate_license_form: FormGroup;
    dealer_id: string;
    is_submitted: boolean;
    license_generated: boolean;
    dealerHasValue: boolean;
    invalid_form: boolean = true;
    subscription = new Subscription();
    host_license: any;
    toggle_event: Subject<void> = new Subject<void>();
    total_licenses = 0;
    total_whitelist = 0;
    is_child_frequency = false;
    selected_data: any;

    constructor(
        public _dialog_data: {
            index: number;
            content: API_CONTENT;
            host_license: any;
            total_contents?: number;
            contents_list: any;
        },
        private _form: FormBuilder,
        // private _license: LicenseService,
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
        // this.is_submitted = true;
        // this._license
        //     .generate_license(this.formControls.dealer.value, this.formControls.number_of_license.value)
        //     .subscribe(
        //         (data) => {
        //             this.license_generated = true;
        //         },
        //         (error) => {
        //             console.error(error);
        //         },
        //     );
    }

    

    public setAssignedTo(dealer: any): void {
        this.dealerHasValue = false;
        if (dealer != null) {
            this.formControls.dealer.setValue(dealer.id);
            this.dealerHasValue = true;
        }
    }
}
