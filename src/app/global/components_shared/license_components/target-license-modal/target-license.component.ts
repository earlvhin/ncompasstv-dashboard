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
    form = this._form.group({
        selectedOwners: [[], Validators.required],
        selectedTags: [[], Validators.required],
    });
    selected_data: any;
    selectedDealersControl = this.form.get('selectedOwners');

    constructor(
        private _form: FormBuilder,
    ) {}

    ngOnInit() {
        this.generate_license_form = this._form.group({
            dealer: ['', Validators.required],
            number_of_license: ['', Validators.required],
        });
    }

    // Convenience getter for easy access to form fields
    get formControls() {
        return this.generate_license_form.controls;
    }
    

    public setAssignedTo(dealer: any): void {
        this.dealerHasValue = false;
        if (dealer != null) {
            this.formControls.dealer.setValue(dealer.id);
            this.dealerHasValue = true;
        }
    }
}
