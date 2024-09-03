import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as filestack from 'filestack-js';
import { environment } from 'src/environments/environment';

import { AuthService } from '../../../../services/auth-service/auth.service';
import { City, State } from '../../../../models/ui_city_state_region.model';
import { ConfirmationModalComponent } from '../../../page_components/confirmation-modal/confirmation-modal.component';
import { LocationService } from '../../../../services/data-service/location.service';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from '../../../../models/ui_role-definition.model';
import { UserService, DealerService } from 'src/app/global/services';
import { CityData } from 'src/app/global/models/api_cities_state.model';

@Component({
    selector: 'app-new-dealer',
    templateUrl: './new-dealer.component.html',
    styleUrls: ['./new-dealer.component.scss'],
})
export class NewDealerComponent implements OnInit, OnDestroy {
    @Output() dealer_created = new EventEmitter();
    city_state: City[] = [];
    contactTouchAndInvalid = false;
    current_dealer_id: string;
    form_description: string = 'Fill the form below to create a new Dealer.';
    form_fields_view: any[];
    form_invalid: boolean = true;
    form_title: string = 'New Dealer';
    is_password_field_type = true;
    is_retype_password_field_type = true;
    is_submitted: boolean;
    new_dealer_form: FormGroup;
    password_is_match: boolean;
    password_match_msg: string;
    password_is_valid: boolean;
    password_is_valid_msg: string;
    server_error: string;
    state_region: State[] = [];

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _location: LocationService,
        private _router: Router,
        private _user: UserService,
        private _dealer: DealerService,
    ) {}

    ngOnInit() {
        this.createForm();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    get f() {
        return this.new_dealer_form.controls;
    }

    createNewDealer(directive: FormGroupDirective): void {
        this.is_submitted = true;
        this.form_invalid = true;

        if (!this._user.validate_email(this.f.email.value)) {
            this.openConfirmationModal(
                'error',
                'Oops something went wrong, Sorry!',
                'The email you entered is not valid.',
                false,
            );
            this.is_submitted = false;
            this.form_invalid = false;
            return;
        }

        this._user
            .create_new_user(this.f.roleid.value, this.new_dealer_form.getRawValue())
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    this.current_dealer_id = response.dealerId;
                    this.openConfirmationModal(
                        'warning',
                        'Account creation successful!',
                        'Dealer account has been added to database. Do you want to use the default picture for this dealer or upload a new one?',
                        false,
                    );
                },
                (error) => {
                    this.is_submitted = false;
                    this.form_invalid = false;
                    this.openConfirmationModal(
                        'error',
                        'Oops something went wrong, Sorry!',
                        error.error.message,
                        false,
                    );
                },
            );
    }

    citySelected(data: CityData): void {
        const { city, state, region } = data || { city: '', state: '', region: '' };
        this.f.city.setValue(city ? city : '');
        this.f.state.setValue(state || '');
        this.f.region.setValue(region || '');
    }

    openConfirmationModal(status: string, message: string, data: string, redirect: boolean): void {
        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: {
                    status: status,
                    message: message,
                    data: data,
                    picture_upload: true,
                    rename: true,
                },
            })
            .afterClosed()
            .subscribe((response) => {
                if (redirect || !response || response == 'no_upload') {
                    this.is_submitted = false;
                    this.form_invalid = false;
                    this.new_dealer_form.reset();
                    this.ngOnInit();
                    this._router.navigate([`/${this.roleRoute}/users/`]);
                }
                if (response == 'upload') this.uploadDealerPhoto();
            });
    }

    uploadDealerPhoto() {
        const client = filestack.init(environment.third_party.filestack_api_key);
        client.picker(this.filestackOptions).open();
    }

    protected get filestackOptions(): filestack.PickerOptions {
        let folder = 'dev';
        let uploadCompleted = false;
        if (environment.production) folder = 'prod';
        else if (environment.base_uri.includes('stg')) folder = 'stg';
        return {
            storeTo: {
                location: 's3',
                container: 'nctv-images-' + folder + '/logo/dealers/' + this.current_dealer_id + '/',
                region: 'us-east-1',
            },
            accept: ['image/jpg', 'image/jpeg', 'image/png'],
            maxFiles: 1,
            imageMax: [720, 640],
            onUploadDone: (response) => {
                let sliced_imagekey = response.filesUploaded[0].key.split('/');
                sliced_imagekey = sliced_imagekey[sliced_imagekey.length - 1].split('_');
                let logo = sliced_imagekey[0] + '_' + response.filesUploaded[0].filename;

                let dealer_info = {
                    dealerid: this.current_dealer_id,
                    logo: logo,
                };
                this._dealer.update_dealer_logo(dealer_info).subscribe(() => {
                    this.openConfirmationModal('success', 'Success!', 'Profile picture successfully updated.', true);
                });
                uploadCompleted = true;
            },
            onClose: () => {
                setTimeout(() => {
                    if (!uploadCompleted)
                        this.openConfirmationModal('success', 'Cancelled!', 'Profile picture upload cancelled', true);
                    uploadCompleted = false; // Reset the flag after checking
                }, 500); // Delay to ensure upload status is finalized
            },
        };
    }

    togglePasswordFieldType(): void {
        this.is_password_field_type = !this.is_password_field_type;
    }

    toggleRetypePasswordFieldType(): void {
        this.is_retype_password_field_type = !this.is_retype_password_field_type;
    }

    public getContactValue(value: string): void {
        this.new_dealer_form.controls.contactNumber.setValue(value);
    }

    public setContactNumberToInvalid(status: boolean): void {
        this.contactTouchAndInvalid = status;
    }

    private createForm(): void {
        this.form_fields_view = [
            {
                label: 'Owner Firstname',
                control: 'firstname',
                placeholder: 'Ex: John',
                width: 'col-lg-6',
                type: 'text',
            },
            {
                label: 'Owner Lastname',
                control: 'lastname',
                placeholder: 'Ex: Doe',
                width: 'col-lg-6',
                type: 'text',
            },
            {
                label: 'Dealer ID',
                control: 'generatedid',
                placeholder: 'Ex: D.001',
                width: 'col-lg-3',
                type: 'text',
            },
            {
                label: 'Dealer Alias',
                control: 'dealerIdAlias',
                placeholder: 'Ex: NCMPS-BLUEIGUANA-9921',
                width: 'col-lg-3',
                type: 'text',
            },
            {
                label: 'Business Name',
                control: 'businessName',
                placeholder: 'Ex: Blue Iguana',
                width: 'col-lg-6',
                type: 'text',
            },
            {
                label: 'Contact Person',
                control: 'contactPerson',
                placeholder: 'Ex: Jane Doe',
                width: 'col-lg-6',
                type: 'text',
            },
            {
                label: 'Contact Number',
                control: 'contactNumber',
                placeholder: 'Ex: 1-222-456-7890',
                width: 'col-lg-6',
                type: 'text',
                isComponent: true,
            },
            {
                label: 'City',
                control: 'city',
                placeholder: 'Ex: Los Angeles',
                width: 'col-lg-6',
                type: 'text',
                is_autocomplete: true,
            },
            {
                label: 'State',
                control: 'state',
                placeholder: 'Ex: California',
                width: 'col-lg-3',
                type: 'text',
            },
            {
                label: 'Region',
                control: 'region',
                placeholder: 'Ex: NW',
                width: 'col-lg-3',
                type: 'text',
            },
            {
                label: 'Email Address',
                control: 'email',
                placeholder: 'Ex: admin@blueiguana.com',
                width: 'col-lg-12',
                type: 'email',
            },
            {
                label: 'Password',
                control: 'password',
                placeholder: 'Note: Minimum of 8 characters',
                width: 'col-lg-6',
                type: 'password',
                password_field: true,
            },
            {
                label: 'Re-type Password',
                control: 're_password',
                placeholder: 'Note: Must match entered password',
                width: 'col-lg-6',
                type: 'password',
                re_password_field: true,
            },
        ];

        this.new_dealer_form = this._form.group({
            roleid: [UI_ROLE_DEFINITION.dealer],
            firstname: ['', Validators.required],
            lastname: ['', Validators.required],
            email: ['', Validators.required],
            password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
            re_password: [{ value: '', disabled: true }, Validators.required],
            contactNumber: ['', Validators.required],
            generatedid: ['', Validators.required],
            dealerIdAlias: ['', Validators.required],
            businessName: ['', Validators.required],
            contactPerson: ['', Validators.required],
            city: ['', Validators.required],
            state: [{ value: '', disabled: true }, Validators.required],
            region: [{ value: '', disabled: true }, Validators.required],
            createdby: [this._auth.current_user_value.user_id],
        });

        this.subscribeToFormChanges();
        this.subscribeToPasswordValidation();
    }

    private subscribeToFormChanges(): void {
        this.new_dealer_form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            if (this.new_dealer_form.valid && this.f.password.value === this.f.re_password.value) {
                this.form_invalid = false;
            } else {
                this.form_invalid = true;
            }
        });
    }

    private subscribeToPasswordValidation(): void {
        this.f.password.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            if (this.f.password.invalid) {
                this.password_is_valid = false;
                this.password_is_valid_msg = 'Must be atleast 8 characters';
            } else {
                this.password_is_valid = true;
                this.password_is_valid_msg = 'Password is valid';
            }

            if (!this.f.password.value || this.f.password.value.length === 0) {
                this.f.re_password.setValue(null);
                this.f.re_password.disable();
            } else {
                this.f.re_password.enable();
            }
        });

        this.f.re_password.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            if (this.f.password.value == this.f.re_password.value && this.f.password.value.length !== 0) {
                this.password_is_match = true;
                this.password_match_msg = 'Password matches';
            } else {
                this.password_is_match = false;
                this.password_match_msg = 'Password does not match';
            }
        });
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
