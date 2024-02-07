import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatDialog, MatSelect } from '@angular/material';
import { UI_ROLE_DEFINITION } from '../../../../models/ui_role-definition.model';
import { AuthService, DealerService } from 'src/app/global/services';
import { UserService } from '../../../../services/user-service/user.service';
import { ConfirmationModalComponent } from '../../../page_components/confirmation-modal/confirmation-modal.component';
import { Router } from '@angular/router';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';
import { API_DEALER } from 'src/app/global/models';

@Component({
    selector: 'app-new-dealer-admin',
    templateUrl: './new-dealer-admin.component.html',
    styleUrls: ['./new-dealer-admin.component.scss'],
})
export class NewDealerAdminComponent implements OnInit {
    @ViewChild('dealerMultiSelect', { static: false }) dealerMultiSelect: MatSelect;
    dealers_list: any = [];
    original_dealers: any = [];
    form_invalid: boolean = true;
    form_title: string = 'New Administrator User';
    new_admin_form: FormGroup;
    subscription: Subscription = new Subscription();
    password_is_match: boolean;
    password_match_msg: string;
    password_is_valid: boolean;
    password_is_valid_msg: string;
    selected_dealer: any;
    server_error: string;
    is_submitted: boolean;
    is_password_field_type = true;
    is_retype_password_field_type = true;
    dealerFilterControl = new FormControl(null);

    protected _unsubscribe: Subject<void> = new Subject<void>();

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
            width: 'col-lg-6',
            password_field: true,
        },
        {
            label: 'Re-type Password',
            control: 're_password',
            type: 'password',
            placeholder: 'Note: This should match the password above.',
            width: 'col-lg-6',
            re_password_field: true,
        },
    ];

    selectedDealersControl: any;

    constructor(
        private _auth: AuthService,
        private _form: FormBuilder,
        private _user: UserService,
        private _dialog: MatDialog,
        private _router: Router,
        private _dealer: DealerService,
    ) {}

    ngOnInit() {
        this.new_admin_form = this._form.group({
            roleid: [UI_ROLE_DEFINITION.dealeradmin],
            firstname: ['', Validators.required],
            lastname: ['', Validators.required],
            contactnumber: ['', Validators.required],
            email: ['', Validators.required],
            password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
            re_password: [{ value: '', disabled: true }, Validators.required],
            createdby: [this._auth.current_user_value.user_id],
            dealers: [[], Validators.required],
        });

        this.selectedDealersControl = this.new_admin_form.get('dealers');

        this.subscription.add(
            this.new_admin_form.valueChanges.subscribe((data) => {
                if (
                    this.new_admin_form.valid &&
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

        this.getDealers();
        this.subscribeToDealerSearch();
    }

    onSelectDealer(dealers): void {
        this.selected_dealer = this.dealers_list.filter((dealer) =>
            dealers.includes(dealer.dealerId),
        );
        // this.unfiltered_selected_dealer = this.dealers_list.filter((dealer) => dealers.includes(dealer.dealerId));
    }

    onSubmit() {
        const dealers = this.selectedDealersControl.value as API_DEALER[];
        const selectedDealers = dealers.map((dealer) => {
            const { dealerId } = dealer;
            return dealerId;
        });

        this.onSelectDealer(selectedDealers);
    }

    onRemoveDealer(index: number) {
        this.selectedDealersControl.value.splice(index, 1);
        this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
        this.onSubmit();
    }

    onClearDealer() {
        this.selectedDealersControl.value.length = 0;
        this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
        this.onSubmit();
    }

    private subscribeToDealerSearch(): void {
        const control = this.dealerFilterControl;

        control.valueChanges
            .pipe(
                takeUntil(this._unsubscribe),
                debounceTime(1000),
                map((keyword) => {
                    if (control.invalid) return;

                    if (keyword && keyword.trim().length > 0) {
                        // this.searchData(keyword);
                        let filtered = [];
                        this.dealers_list.map((dealer) => {
                            if (
                                dealer.businessName.toLowerCase().indexOf(keyword.toLowerCase()) >
                                -1
                            ) {
                                filtered.push(dealer);
                            }
                        });
                        this.dealers_list = filtered;
                    } else {
                        this.dealers_list = this.original_dealers;
                    }
                }),
            )
            .subscribe(
                () =>
                    (this.dealerMultiSelect.compareWith = (a, b) =>
                        a && b && a.dealerId === b.dealerId),
            );
    }

    getDealers() {
        this.subscription.add(
            this._dealer.get_dealers_with_page(1, '', 0).subscribe((data) => {
                this.dealers_list = data.dealers;
                this.original_dealers = data.dealers;
            }),
        );
    }

    get f() {
        return this.new_admin_form.controls;
    }

    createNewAdmin(formDirective) {
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

        this.new_admin_form.value.dealers = this.new_admin_form.value.dealers.map((dealer) => {
            return dealer.dealerId;
        });

        this.subscription.add(
            this._user.create_new_user(this.f.roleid.value, this.new_admin_form.value).subscribe(
                (data) => {
                    this.is_submitted = false;
                    this.form_invalid = false;
                    this.openConfirmationModal(
                        'success',
                        'Account creation successful!',
                        'Dealer Admin account has been added to database.',
                        true,
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
            ),
        );
    }

    openConfirmationModal(status, message, data, redirect): void {
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
