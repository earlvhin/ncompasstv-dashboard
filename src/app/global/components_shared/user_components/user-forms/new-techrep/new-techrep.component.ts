import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { UserService } from 'src/app/global/services/user-service/user.service';
import { MatDialog } from '@angular/material';
import { ConfirmationModalComponent } from '../../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-new-techrep',
    templateUrl: './new-techrep.component.html',
    styleUrls: ['./new-techrep.component.scss'],
})
export class NewTechrepComponent implements OnInit {
    form_description: string = 'Fill the form below to create a new Technical Officer.';
    form_invalid: boolean = true;
    form_title: string = 'New Technical Officer';
    is_submitted: boolean;
    is_password_field_type = true;
    is_retype_password_field_type = true;
    new_tech_form: FormGroup;
    password_is_match: boolean;
    password_match_msg: string;
    password_is_valid: boolean;
    password_is_valid_msg: string;
    server_error: string;
    subscription: Subscription = new Subscription();

    form_fields_view = [
        {
            label: 'Firstname',
            control: 'firstname',
            placeholder: 'Ex: John',
            type: 'text',
            width: 'col-lg-6',
        },
        {
            label: 'Lastname',
            control: 'lastname',
            placeholder: 'Ex: Doe',
            type: 'text',
            width: 'col-lg-6',
        },
        {
            label: 'Contact Number',
            control: 'contactnumber',
            placeholder: 'Ex: 1-222-456-7890',
            type: 'text',
            width: 'col-lg-6',
        },
        {
            label: 'Email Address',
            control: 'email',
            placeholder: 'Ex: admin@blueiguana.com',
            type: 'email',
            width: 'col-lg-6',
        },
        {
            label: 'Password',
            control: 'password',
            type: 'password',
            placeholder: 'Note: Minimum of 8 characters',
            width: 'col-lg-12',
            password_field: true,
        },
        {
            label: 'Re-type Password',
            control: 're_password',
            type: 'password',
            placeholder: 'Note: This should match the password above.',
            width: 'col-lg-12',
            re_password_field: true,
        },
    ];

    constructor(
        private _auth: AuthService,
        private _form: FormBuilder,
        private _user: UserService,
        private _dialog: MatDialog,
        private _router: Router,
    ) {}

    ngOnInit() {
        this.new_tech_form = this._form.group({
            roleid: [UI_ROLE_DEFINITION.tech],
            firstname: ['', Validators.required],
            lastname: ['', Validators.required],
            contactnumber: ['', Validators.required],
            email: ['', Validators.required],
            password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
            re_password: [{ value: '', disabled: true }, Validators.required],
            createdby: [this._auth.current_user_value.user_id],
        });

        this.subscription.add(
            this.new_tech_form.valueChanges.subscribe((data) => {
                if (
                    this.new_tech_form.valid &&
                    this.f.password.value === this.f.re_password.value
                ) {
                    this.form_invalid = false;
                } else {
                    this.form_invalid = true;
                }
            }),
        );

        this.subscription.add(
            this.f.password.valueChanges.subscribe((data) => {
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
            }),
        );

        this.subscription.add(
            this.f.re_password.valueChanges.subscribe((data) => {
                if (
                    this.f.password.value == this.f.re_password.value &&
                    this.f.password.value.length !== 0
                ) {
                    this.password_is_match = true;
                    this.password_match_msg = 'Password matches';
                } else {
                    this.password_is_match = false;
                    this.password_match_msg = 'Password does not match';
                }
            }),
        );
    }

    get f() {
        return this.new_tech_form.controls;
    }

    createNewTech(formDirective) {
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
            return false;
        }

        this.subscription.add(
            this._user.create_new_user(this.f.roleid.value, this.new_tech_form.value).subscribe(
                (data) => {
                    this.is_submitted = false;
                    this.form_invalid = false;
                    this.openConfirmationModal(
                        'success',
                        'Account creation successful!',
                        'Tech account has been added to database.',
                        true,
                    );
                    formDirective.resetForm();
                    this.new_tech_form.reset();
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
            ),
        );
    }

    openConfirmationModal(status, message, data, redirect): void {
        var dialog = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: {
                status: status,
                message: message,
                data: data,
            },
        });

        dialog.afterClosed().subscribe(() => {
            if (redirect) {
                this._router.navigate([`/${this.roleRoute}/users/`]);
            }
        });
    }

    togglePasswordFieldType(): void {
        this.is_password_field_type = !this.is_password_field_type;
    }

    toggleRetypePasswordFieldType(): void {
        this.is_retype_password_field_type = !this.is_retype_password_field_type;
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
