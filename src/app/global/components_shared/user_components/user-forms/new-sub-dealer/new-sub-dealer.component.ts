import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormGroupDirective } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { ConfirmationModalComponent } from '../../../page_components/confirmation-modal/confirmation-modal.component';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { UI_ROLE_DEFINITION } from '../../../../models/ui_role-definition.model';
import { UserService } from 'src/app/global/services/user-service/user.service';
import { PAGING } from 'src/app/global/models';

@Component({
    selector: 'app-new-sub-dealer',
    templateUrl: './new-sub-dealer.component.html',
    styleUrls: ['./new-sub-dealer.component.scss'],
})
export class NewSubDealerComponent implements OnInit, OnDestroy {
    back_btn: string;
    dealers: API_DEALER[] = [];
    form_fields_view: any;
    form_invalid: boolean = true;
    is_dealer: boolean = false;
    is_loading_dealers = false;
    is_password_field_type = true;
    is_search = false;
    is_searching_dealers = false;
    is_retype_password_field_type = true;
    is_submitted: boolean;
    form: FormGroup;
    paging: PAGING;
    password_is_match: boolean;
    password_match_msg: string;
    password_is_valid: boolean;
    password_is_valid_msg: string;
    server_error: string;
    subscription: Subscription = new Subscription();

    constructor(
        private _auth: AuthService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _user: UserService,
        private _router: Router,
    ) {}

    ngOnInit() {
        const roleId = this._auth.current_user_value.role_id;
        const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

        if (this._auth.current_user_value.roleInfo.dealerId) this.is_dealer = true;

        if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
            this.back_btn = '/dealer/users/create-user';
        } else if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.administrator) {
            this.back_btn = '/administrator/users/create-user';
        } else if (roleId === subDealerRole) {
            this.back_btn = '/sub-dealer/users/create-user';
        }

        this.form = this._form.group({
            roleId: [UI_ROLE_DEFINITION['sub-dealer']],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            contactNo: ['', Validators.required],
            parentId: this._auth.current_user_value.roleInfo.dealerId || ['', Validators.required],
            dealer: [{ value: '', disabled: true }, Validators.required],
            email: ['', Validators.required],
            password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
            re_password: [{ value: '', disabled: true }, Validators.required],
            createdBy: [this._auth.current_user_value.user_id],
        });

        this.subscription.add(
            this._dealer.get_dealers().subscribe(
                (data) => (this.dealers = data),
                (error) => {
                    console.error(error);
                },
            ),
        );

        this.subscription.add(
            this.form.valueChanges.subscribe(() => {
                if (this.form.valid && this.f.password.value === this.f.re_password.value) {
                    this.form_invalid = false;
                } else {
                    this.form_invalid = true;
                }
            }),
        );

        this.form_fields_view = [
            {
                label: 'Firstname',
                control: 'firstName',
                type: 'text',
                placeholder: 'Ex: John',
                width: 'col-lg-6',
            },
            {
                label: 'Lastname',
                control: 'lastName',
                type: 'text',
                placeholder: 'Ex: Doe',
                width: 'col-lg-6',
            },
            {
                label: 'Dealer',
                control: 'parentId',
                type: 'text',
                placeholder: 'Ex: Blue Iguana',
                width: 'col-lg-6',
                is_autocomplete: true,
                is_dealer: this.is_dealer,
            },
            {
                label: 'Contact Number',
                control: 'contactNo',
                type: 'text',
                placeholder: 'Ex: 1-222-456-7890',
                width: 'col-lg-6',
            },
            {
                label: 'Email Address',
                control: 'email',
                type: 'email',
                placeholder: 'Ex: admin@blueiguana.com',
                width: this.is_dealer ? 'col-lg-6' : 'col-lg-12',
            },
            {
                label: 'Password',
                control: 'password',
                type: 'password',
                placeholder: 'Note: Minimum of 8 characters',
                width: 'col-lg-6',
                password_field: true,
            },
            {
                label: 'Re-type Password',
                control: 're_password',
                type: 'password',
                placeholder: 'Note: Must match entered password',
                width: 'col-lg-6',
                re_password_field: true,
            },
        ];

        this.subscription.add(
            this.f.password.valueChanges.subscribe(() => {
                if (this.f.password.invalid) {
                    this.password_is_valid = false;
                    this.password_is_valid_msg = 'Must be at least 8 characters';
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
            this.f.re_password.valueChanges.subscribe(() => {
                if (
                    this.f.password.value == this.f.re_password.value &&
                    this.f.password.value.length !== 0
                ) {
                    this.password_is_match = true;
                    this.password_match_msg = 'Passwords match';
                } else {
                    this.password_is_match = false;
                    this.password_match_msg = 'Passwords do not match';
                }
            }),
        );

        this.getDealers(1);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    get f() {
        return this.form.controls;
    }

    dealerSelected(e): void {
        this.f.parentId.setValue(e);
    }

    openConfirmationModal(status: string, message: string, data: any, redirect: boolean): void {
        const dialog = this._dialog.open(ConfirmationModalComponent, {
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

    onSubmit(form: FormGroupDirective): boolean | void {
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

        const { firstName, lastName, contactNo, parentId, roleId, email, password, createdBy } =
            form.value;
        const data = {
            firstName,
            lastName,
            contactNo,
            parentId,
            roleId,
            email,
            password,
            createdBy,
        };

        this.subscription.add(
            this._user.create_new_user(this.f.roleId.value, data).subscribe(
                () => {
                    this.openConfirmationModal(
                        'success',
                        'Account creation successful!',
                        'Sub-Dealer account has been saved',
                        true,
                    );
                    form.resetForm();
                    this.is_submitted = false;
                    this.form_invalid = false;
                    this.form.reset();
                    this.ngOnInit();
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

    searchBoxTrigger(event: { page: number; is_search: boolean }): void {
        this.is_search = event.is_search;
        this.getDealers(event.page);
    }

    searchDealer(key: string): void {
        this.is_searching_dealers = true;

        this.subscription.add(
            this._dealer.get_search_dealer(key).subscribe((data) => {
                if (data.paging.entities.length > 0) {
                    this.dealers = data.paging.entities;
                    this.dealers = data.paging.entities;
                    this.is_searching_dealers = false;
                } else {
                    this.dealers = [];
                    this.is_searching_dealers = false;
                }

                this.paging = data.paging;
            }),
        );
    }

    togglePasswordFieldType(): void {
        this.is_password_field_type = !this.is_password_field_type;
    }

    toggleRetypePasswordFieldType(): void {
        this.is_retype_password_field_type = !this.is_retype_password_field_type;
    }

    private getDealers(page: number): void {
        this.is_loading_dealers = true;

        if (page > 1) {
            this.subscription.add(
                this._dealer.get_dealers_with_page(page, '').subscribe(
                    (data) => {
                        data.dealers.map((dealer) => this.dealers.push(dealer));
                        this.paging = data.paging;
                        this.is_loading_dealers = false;
                    },
                    (error) => {
                        this.is_loading_dealers = false;
                    },
                ),
            );
        } else {
            if (this.is_search) this.is_searching_dealers = true;

            this.subscription.add(
                this._dealer.get_dealers_with_page(page, '').subscribe(
                    (data) => {
                        this.dealers = data.dealers;
                        this.paging = data.paging;
                        this.is_loading_dealers = false;
                        this.is_searching_dealers = false;
                    },
                    (error) => {
                        this.is_loading_dealers = false;
                        this.is_searching_dealers = false;
                    },
                ),
            );
        }
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
