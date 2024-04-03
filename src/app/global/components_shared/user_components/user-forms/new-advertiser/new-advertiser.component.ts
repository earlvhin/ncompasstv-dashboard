import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormGroupDirective } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
    API_ADVERTISER,
    API_ADVERTISER_MINIFY,
    API_DEALER,
    UI_AUTOCOMPLETE,
    UI_CITY_AUTOCOMPLETE,
    UI_ROLE_DEFINITION,
    UI_ROLE_DEFINITION_TEXT,
} from 'src/app/global/models';
import { AdvertiserService, AuthService, DealerService, UserService } from 'src/app/global/services';
import { ConfirmationModalComponent } from '../../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-new-advertiser',
    templateUrl: './new-advertiser.component.html',
    styleUrls: ['./new-advertiser.component.scss'],
})
export class NewAdvertiserComponent implements OnInit, OnDestroy {
    advertisers: { dealerId: string; id: string; value: string }[] = [];
    advertisersData: API_ADVERTISER_MINIFY[] = [];
    advertiser_name: string;
    advertiserField = false;
    back_btn: string;
    dealers: API_DEALER[] = [];
    dealers_data: any[] = [];
    dealer_id: string;
    dealer_name: string;
    form_fields_view: any;
    form_invalid = true;
    initial_load_advertiser = false;
    is_dealer = false;
    is_loading = true;
    is_loading_adv = true;
    is_password_field_type = true;
    is_retype_password_field_type = true;
    is_search = false;
    is_search_adv = false;
    is_submitted: boolean;
    loading_data = true;
    loadingAdvertiserData = true;
    loading_search = false;
    loading_search_adv = false;
    new_advertiser_form: FormGroup;
    noAdvertiser = false;
    paging: any;
    paging_adv: any;
    password_is_match;
    password_match_msg: string;
    password_is_valid;
    password_is_valid_msg: string;
    selectedAdvertisers: any;
    search_data = '';
    search_data_adv = '';
    selectedDealer: any;
    server_error: string;

    advertiserDataField: UI_AUTOCOMPLETE = {
        label: 'Advertiser',
        placeholder: 'Ex: Blue Iguana',
        data: [],
    };

    protected ngUnsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _advertiser: AdvertiserService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _user: UserService,
        private _router: Router,
    ) {}

    ngOnInit() {
        if (this._auth.current_user_value.roleInfo.dealerId) {
            this.is_dealer = true;
            this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
            this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
        }
        this.advertiserField = true;
        const roleId = this._auth.current_user_value.role_id;
        const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

        if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer)
            this.back_btn = '/dealer/users/create-user';
        else if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.administrator)
            this.back_btn = '/administrator/users/create-user';
        else if (roleId === subDealerRole) this.back_btn = '/sub-dealer/users/create-user';

        this.new_advertiser_form = this._form.group({
            roleid: [UI_ROLE_DEFINITION.advertiser],
            firstname: ['', Validators.required],
            lastname: ['', Validators.required],
            contactNumber: ['', Validators.required],
            dealerId: this._auth.current_user_value.roleInfo.dealerId || ['', Validators.required],
            dealer: [{ value: '', disabled: true }, Validators.required],
            advertiserId: [{ value: '' }, Validators.required],
            email: ['', Validators.required],
            password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
            re_password: [{ value: '', disabled: true }, Validators.required],
            createdby: [this._auth.current_user_value.user_id],
        });

        this.getDealers(1);

        this.initializeSubscriptions();

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
                label: 'Dealer',
                control: 'dealer_id',
                type: 'text',
                placeholder: 'Ex: Blue Iguana',
                width: 'col-lg-6',
                is_autocomplete: true,
                dealer_field: true,
                is_dealer: this.is_dealer,
            },
            {
                label: 'Advertiser Profile',
                control: 'advertiser_id',
                type: 'text',
                placeholder: 'Ex: Blue Iguana',
                width: 'col-lg-6',
                is_autocomplete: true,
                advertiserField: true,
                disabled: this.noAdvertiser,
            },
            {
                label: 'Contact Number',
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
                placeholder: 'Note: Must match entered password',
                width: 'col-lg-6',
                re_password_field: true,
            },
        ];
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    get formControls() {
        return this.new_advertiser_form.controls;
    }

    advertiserSelected(advertiserId: { id: string }): void {
        this.formControls.advertiserId.setValue(advertiserId.id);
    }

    dealerSelected(dealer: { id: string; value: string }) {
        this.advertiserDataField.data = [];
        this.noAdvertiser = false;

        //Check if dealer is available
        if (!dealer) {
            this.selectedDealer = null;
            return;
        }

        this.formControls.dealerId.setValue(dealer.id);
        this.selectedDealer = dealer.id;
        this.formControls.advertiserId.setValue(null);

        this.getAdvertisersMinified(dealer.id);
    }

    createNewAdvertiser(data: FormGroupDirective): void {
        this.is_submitted = true;
        this.form_invalid = true;

        if (!this._user.validate_email(this.formControls.email.value)) {
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
            .create_new_user(this.formControls.roleid.value, this.new_advertiser_form.value)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                () => {
                    this.openConfirmationModal(
                        'success',
                        'Account creation successful!',
                        'Advertiser account has been added to database.',
                        true,
                    );
                    data.resetForm();
                    this.is_submitted = false;
                    this.form_invalid = false;
                    this.new_advertiser_form.reset();
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
            );
    }

    searchBoxTrigger(event: { no_keyword: boolean; is_search: boolean; page: number }): void {
        if (event.no_keyword) this.search_data = '';

        this.is_search = event.is_search;
        this.getDealers(event.page);
    }

    searchBoxTriggerAdv(event: { no_keyword: boolean; is_search: boolean; page: number }): void {
        if (event.no_keyword) this.search_data_adv = '';

        this.is_search_adv = event.is_search;
        this.getAdvertisers(event.page);
    }

    searchData(keyword: string): void {
        this.loading_search = true;
        this.search_data = keyword;
        this.getDealers(1);
    }

    searchDataAdv(keyword: string): void {
        this.loading_search_adv = true;
        this.search_data_adv = keyword;
        this.getAdvertisers(1);
    }

    togglePasswordFieldType(): void {
        this.is_password_field_type = !this.is_password_field_type;
    }

    toggleRetypePasswordFieldType(): void {
        this.is_retype_password_field_type = !this.is_retype_password_field_type;
    }

    private getAdvertisers(page: number): void {
        this.loadingAdvertiserData = true;

        this._advertiser
            .get_advertisers_unassigned_to_user(this.selectedDealer, page, this.search_data_adv, '', '')
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((data) => {
                this.advertisers = data.advertisers;
                this.advertisersData = data.advertisers;
                this.paging_adv = data.paging;
                this.is_loading_adv = false;
                this.loadingAdvertiserData = false;
                this.loading_search_adv = false;
                this.initial_load_advertiser = false;
            });
    }

    private getAdvertisersMinified(dealerId?: string): void {
        this.advertisers = [];
        this.loadingAdvertiserData = false;

        this._advertiser
            .getAdvertisersUnassignedToUserMinified(dealerId)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response: { advertisers: { dealerId: string; id: string; name: string }[]; message: string }) => {
                    //if no advertiser found
                    if (!response.advertisers) {
                        this.noAdvertiser = true;
                        return;
                    }

                    this.advertisers = response.advertisers.map(
                        (a) => {
                            return {
                                dealerId: a.dealerId,
                                id: a.id,
                                value: a.name,
                            };
                        },
                        (error) => console.error('Error fetching data:', error),
                    );
                    this.advertiserDataField.data = this.advertisers;
                },
            );
    }

    private getDealers(page: number): void {
        this.loading_data = true;

        if (this.is_search) this.loading_search = true;

        this._dealer
            .get_dealers_with_advertiser(page, this.search_data)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((response) => {
                if ('message' in response) {
                    this.dealers = [];
                    this.dealers_data = [];
                    return;
                }

                this.dealers = response.dealers;
                this.dealers_data = response.dealers;
                this.paging = response.paging;
            })
            .add(() => {
                this.is_loading = false;
                this.loading_data = false;
                this.loading_search = false;
            });
    }

    private initializeSubscriptions(): void {
        this.new_advertiser_form.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
            if (
                this.new_advertiser_form.valid &&
                this.formControls.password.value === this.formControls.re_password.value
            )
                this.form_invalid = false;
            else this.form_invalid = true;
        });

        this.formControls.password.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
            if (this.formControls.password.invalid) {
                this.password_is_valid = false;
                this.password_is_valid_msg = 'Must be at least 8 characters';
            } else {
                this.password_is_valid = true;
                this.password_is_valid_msg = 'Password is valid';
            }

            if (!this.formControls.password.value || this.formControls.password.value.length === 0) {
                this.formControls.re_password.setValue(null);
                this.formControls.re_password.disable();
            } else {
                this.formControls.re_password.enable();
            }
        });

        this.formControls.re_password.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
            if (
                this.formControls.password.value == this.formControls.re_password.value &&
                this.formControls.password.value.length !== 0
            ) {
                this.password_is_match = true;
                this.password_match_msg = 'Passwords match';
            } else {
                this.password_is_match = false;
                this.password_match_msg = 'Passwords do not match';
            }
        });
    }

    private openConfirmationModal(status: string, message: string, data: any, redirect: boolean): void {
        const dialog = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status, message, data },
        });

        dialog.afterClosed().subscribe(() => {
            if (redirect) {
                this._router.navigate([`/${this.roleRoute}/users/`]);
            }
        });
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
