import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ConfirmationModalComponent } from '../../../page_components/confirmation-modal/confirmation-modal.component';
import { AuthService, HostService, UserService } from 'src/app/global/services';
import { API_HOST, UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT, UI_AUTOCOMPLETE } from 'src/app/global/models';

@Component({
    selector: 'app-new-host-user',
    templateUrl: './new-host-user.component.html',
    styleUrls: ['./new-host-user.component.scss'],
})
export class NewHostUserComponent implements OnInit {
    @Input() initial_value: any;
    @Output() host_created = new EventEmitter();
    @Output() host_selected = new EventEmitter<{ hostId: string; hostName: string }>();

    back_btn: string;
    create_host_link = '';
    dealerId = this._auth.current_user_value.roleInfo.dealerId || '';
    form_fields_view: {};
    form_title: string = 'New Host User';
    form_invalid: boolean = true;
    hosts = [];
    is_password_field_type = true;
    is_retype_password_field_type = true;
    is_search: boolean = false;
    is_submitted: boolean;
    keywords = { search: 'hostName', primary: 'hostName' };
    new_host_form: FormGroup;
    no_host_place: boolean = false;
    paging: any;
    password_is_match: boolean;
    password_is_valid: boolean;
    password_is_valid_msg: string;
    password_match_msg: string;
    search_key: string = '';
    selectedHost = [];
    server_error: string;
    subscription: Subscription = new Subscription();

    protected ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _host: HostService,
        private _user: UserService,
        private _router: Router,
    ) {}

    ngOnInit() {
        let role = this.currentRole;
        if (this.currentRole === UI_ROLE_DEFINITION_TEXT.dealeradmin) role = UI_ROLE_DEFINITION_TEXT.administrator;
        this.create_host_link = `/${role}/hosts/create-host`;
        this.back_btn = `/${role}/users/create-user`;

        this.new_host_form = this._form.group({
            roleid: [UI_ROLE_DEFINITION.host],
            firstname: ['', Validators.required],
            lastname: ['', Validators.required],
            address: '',
            host_place: [{ value: '' }, Validators.required],
            contactNumber: ['', Validators.required],
            dealerId: ['', Validators.required],
            hostid: ['', Validators.required],
            email: ['', Validators.required],
            password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
            re_password: [{ value: '', disabled: true }, Validators.required],
            createdBy: [this._auth.current_user_value.user_id],
        });

        this.form_fields_view = [
            {
                label: 'Firstname',
                control: 'firstname',
                type: 'text',
                placeholder: 'Ex: John',
                width: 'col-lg-6',
            },
            {
                label: 'Lastname',
                control: 'lastname',
                type: 'text',
                placeholder: 'Ex: Doe',
                width: 'col-lg-6',
            },
            {
                label: 'Full Address (Optional)',
                control: 'address',
                type: 'text',
                placeholder: 'Ex: 51st Drive, Fifth Avenue Place, Global City, UK',
                width: 'col-lg-12',
            },
            {
                label: 'Host Place',
                control: 'host_place',
                type: 'text',
                placeholder: 'Ex: Blue Iguana',
                width: 'col-lg-6',
                is_autocomplete: true,
            },
            {
                label: 'Contact Person Phone',
                control: 'contactNumber',
                type: 'text',
                placeholder: 'Ex: 1-222-456-7890',
                width: 'col-lg-6',
            },
            {
                label: 'Email Address',
                control: 'email',
                type: 'email',
                placeholder: 'Ex: admin@blueiguana.com',
                width: 'col-lg-12',
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
                width: 'col-lg-6',
                placeholder: 'Note: Must match entered password',
                re_password_field: true,
            },
        ];

        this.subscription.add(
            this.new_host_form.valueChanges.subscribe((data) => {
                if (
                    this.new_host_form.valid &&
                    this.f.password.value === this.f.re_password.value &&
                    this.f.host_place.value
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
                if (this.f.password.value == this.f.re_password.value && this.f.password.value.length !== 0) {
                    this.password_is_match = true;
                    this.password_match_msg = 'Password matches';
                } else {
                    this.password_is_match = false;
                    this.password_match_msg = 'Password does not match';
                }
            }),
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this._auth.current_user_value.roleInfo.dealerId;
    }

    get f() {
        return this.new_host_form.controls;
    }

    public setHost(data: { id: string; value: string; dealerId: string }) {
        this.f.dealerId.setValue(data.dealerId);
        this.f.hostid.setValue(data.id);
    }

    togglePasswordFieldType(): void {
        this.is_password_field_type = !this.is_password_field_type;
    }

    toggleRetypePasswordFieldType(): void {
        this.is_retype_password_field_type = !this.is_retype_password_field_type;
    }

    createNewHost(formDirective) {
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

        this._user.create_new_user(this.f.roleid.value, this.new_host_form.value).subscribe(
            (data) => {
                this.openConfirmationModal(
                    'success',
                    'Account creation successful!',
                    'Host Owner account has been added to database.',
                    true,
                );
                formDirective.resetForm();
                this.is_submitted = false;
                this.form_invalid = false;
                this.new_host_form.reset();
                this.ngOnInit();
            },
            (error) => {
                this.is_submitted = false;
                this.form_invalid = false;
                this.openConfirmationModal('error', 'Oops something went wrong, Sorry!', error.error.message, false);
            },
        );
    }

    openConfirmationModal(status, message, data, redirect): void {
        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: {
                    status: status,
                    message: message,
                    data: data,
                },
            })
            .afterClosed()
            .subscribe(() => {
                if (redirect) this._router.navigate([`/${this.roleRoute}/users/`]);
            });
    }

    protected get currentRole() {
        return this._auth.current_role;
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
