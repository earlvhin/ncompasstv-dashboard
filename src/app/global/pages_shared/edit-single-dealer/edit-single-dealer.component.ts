import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogConfig, MatSlideToggleChange } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment';

import { AuthService, ConfirmationDialogService, DealerService, UserService } from 'src/app/global/services';
import {
    ACTIVITY_LOGS,
    API_DEALER,
    API_UPDATE_DEALER_PROFILE_BY_ADMIN,
    API_USER_DATA,
    USER,
} from 'src/app/global/models';
import { ReassignDealerComponent } from './reassign-dealer/reassign-dealer.component';
import { DeleteDealerDialogComponent } from './delete-dealer-dialog/delete-dealer-dialog.component';
import { CityData } from '../../models/api_cities_state.model';

@Component({
    selector: 'app-edit-single-dealer',
    templateUrl: './edit-single-dealer.component.html',
    styleUrls: ['./edit-single-dealer.component.scss'],
})
export class EditSingleDealerComponent implements OnInit, OnDestroy {
    currentEmail: string;
    dealer = this.page_data.dealer;
    disabledForm = false;
    editDealerForm: FormGroup;
    editDealerFormFields = this._editDealerFormFields;
    emailNotValid = false;
    hasDuplicateEmail = false;
    is_active_dealer = this.dealer.status === 'A';
    is_admin = this._auth.current_role === 'administrator';
    is_form_loaded = false;
    is_password_field_type = true;
    otherUsers = [];
    selectedCity: string;
    start_date: any;
    today: Date;
    user = this.page_data.user;

    protected _unsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public page_data: { dealer: API_DEALER; user: API_USER_DATA },
        public _dialogReference: MatDialogRef<EditSingleDealerComponent>,
        private _auth: AuthService,
        private _confirmationDialog: ConfirmationDialogService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _router: Router,
        private _user: UserService,
    ) {}

    ngOnInit() {
        this.initializeForm();
        this.fillForm();
        this.is_form_loaded = true;
        this.subscribeToFormChanges();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    fillForm() {
        const { dealer, user } = this.page_data;
        this._editFormControls.business_name.setValue(dealer.businessName);
        this._editFormControls.dealer_id.setValue(dealer.dealerId);
        this._editFormControls.dealer_alias.setValue(dealer.dealerIdAlias);
        this._editFormControls.owner_f_name.setValue(user.firstName);
        this._editFormControls.owner_l_name.setValue(user.lastName);
        this._editFormControls.email.setValue(dealer.email);
        this._editFormControls.password.setValue(user.password);
        this._editFormControls.c_number.setValue(dealer.contactNumber);
        this._editFormControls.c_person.setValue(dealer.contactPerson);
        this._editFormControls.c_count.setValue(dealer.playerCount);
        this._editFormControls.region.setValue(dealer.region);
        this._editFormControls.state.setValue(dealer.state);
        this._editFormControls.status.setValue(dealer.status);

        this.currentEmail = dealer.email;
        if (dealer.startDate != null) this.onSelectStartDate(dealer.startDate, true);
    }

    setInitialCity(isLoaded: boolean): void {
        this.selectedCity = this.page_data.dealer.city;

        //Set value to initial city
        this._editFormControls.city.setValue(this.selectedCity);
        this._editFormControls.state.setValue(this.page_data.dealer.state);
        this._editFormControls.region.setValue(this.page_data.dealer.region);
    }

    citySelected(data: CityData): void {
        const { city, state, region } = data || { city: '', state: '', region: '' };
        this._editFormControls.city.setValue(city ? city : '');
        this._editFormControls.state.setValue(state || '');
        this._editFormControls.region.setValue(region || '');
    }

    onDeleteDealer(): void {
        const config: MatDialogConfig = {
            width: '520px',
            height: '380px',
            disableClose: true,
        };

        const dialog = this._dialog.open(DeleteDealerDialogComponent, config);
        dialog.componentInstance.businessName = this._editFormControls.business_name.value;
        dialog.componentInstance.dealerId = this._editFormControls.dealer_id.value;
        dialog.componentInstance.userId = this._auth.current_user_value.user_id;

        dialog.afterClosed().subscribe((response) => {
            if (!response) return;
            this._dialogReference.close();
            this._router.navigate([`${this.roleRoute}/dealers`]);
        });
    }

    onReassignDealer(): void {
        const editDialog = this._dialogReference;
        const width = '350px';
        const height = '400px';

        editDialog.close('reassign-dealer');

        editDialog.afterClosed().subscribe(() =>
            this._dialog.open(ReassignDealerComponent, {
                width,
                height,
                panelClass: 'position-relative',
                autoFocus: false,
                data: { dealer_id: this.editDealerForm.get('dealer_id').value },
            }),
        );
    }

    onSelectStartDate(e, hasValue?) {
        if (hasValue) {
            let value: any = moment(e).format('YYYY-MM-DD');
            if (!e || e.trim().length <= 0 || e.includes('--')) value = moment();
            this.start_date = value;
            this.editDealerForm.get('start_date').setValidators(null);
            this.editDealerForm.get('start_date').updateValueAndValidity();
        } else {
            this.start_date = moment(e).format('YYYY-MM-DD');
        }
    }

    onToggleStatus(event: MatSlideToggleChange): void {
        this.is_active_dealer = event.checked;
    }

    async saveDealerData() {
        let message = 'Are you sure you want to proceed?';
        const title = 'Update Dealer Details';
        const currentStatus = this.dealer.status;
        const newStatus = this.is_active_dealer ? 'A' : 'I';
        const observables = [this.updateDealerData(), this.updateUserData()];
        const newDealerActivityLog = new ACTIVITY_LOGS(
            this.dealer.dealerId,
            'modify_dealer',
            this._auth.current_user_value.user_id,
        );

        if (currentStatus !== newStatus) {
            message += `This will ${newStatus === 'A' ? 'activate' : 'deactivate'} the dealer`;
            observables.push(this.updateDealerStatus(newStatus));
        }

        const confirmUpdate = await this._confirmationDialog.warning({ message: title, data: message }).toPromise();

        if (!confirmUpdate) return;

        forkJoin(observables)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                async () => {
                    const dialogData = {
                        message: 'Dealer Details Updated!',
                        data: 'Your changes have been saved',
                    };

                    await this._confirmationDialog.success(dialogData).toPromise();
                    await this.createActivity(newDealerActivityLog).toPromise();
                    this._dialogReference.close(true);
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    createActivity(activity) {
        return this._dealer.create_dealer_activity_logs(activity).pipe(takeUntil(this._unsubscribe));
    }

    togglePasswordFieldType(): void {
        this.is_password_field_type = !this.is_password_field_type;
    }

    private checkEmailDuplicate(current_value: string): void {
        this._user
            .checkIfDuplicateEmail(current_value)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => (this.hasDuplicateEmail = !!response.message))
            .add(
                () => (this.disabledForm = this.editDealerForm.invalid || this.hasDuplicateEmail || this.emailNotValid),
            );
    }

    private initializeForm(): void {
        this.editDealerForm = this._form.group({
            dealer_id: [{ value: '', disabled: true }, Validators.required],
            business_name: ['', Validators.required],
            dealer_alias: [''],
            owner_f_name: ['', Validators.required],
            owner_l_name: ['', Validators.required],
            email: ['', Validators.required],
            password: [{ value: '', disabled: true }, Validators.required],
            c_number: ['', Validators.required],
            c_person: ['', Validators.required],
            c_count: [''],
            city: ['', Validators.required],
            state: [{ value: '', disabled: true }, Validators.required],
            region: [{ value: '', disabled: true }, Validators.required],
            status: ['', Validators.required],
            start_date: [''],
        });
    }

    private mapDealerInfoChanges(): API_UPDATE_DEALER_PROFILE_BY_ADMIN {
        return new API_UPDATE_DEALER_PROFILE_BY_ADMIN(
            this.dealer.userId,
            this._editFormControls.dealer_id.value,
            this._editFormControls.c_person.value,
            this._editFormControls.c_count.value,
            this._editFormControls.business_name.value,
            this._editFormControls.dealer_alias.value,
            this._editFormControls.email.value,
            this._editFormControls.c_number.value,
            this._editFormControls.region.value,
            this._editFormControls.city.value,
            this._editFormControls.state.value,
            this.start_date,
            this.dealer.userId,
        );
    }

    private mapUserInfoChanges() {
        const { dealer_id, owner_f_name, owner_l_name, email } = this.editDealerForm.value;
        const updatedBy = this._auth.current_user_value.user_id;

        return {
            userId: this.dealer.userId,
            updatedBy,
            dealerId: dealer_id,
            firstName: owner_f_name,
            lastName: owner_l_name,
            email,
        };
    }

    private subscribeToFormChanges(): void {
        this.editDealerForm.controls['email'].valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(
            (data) => {
                if (data !== this.currentEmail) {
                    this.emailNotValid = !this._user.validate_email(data);
                    if (!this.emailNotValid) this.checkEmailDuplicate(data);
                }
            },
            (error) => {
                console.error(error);
            },
        );
        this.editDealerForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(
            (data) => {
                this.disabledForm = this.editDealerForm.invalid || this.hasDuplicateEmail || this.emailNotValid;
            },
            (error) => {
                console.error(error);
            },
        );
    }

    private updateDealerData(): Observable<any> {
        return this._dealer.update_dealer(this.mapDealerInfoChanges()).pipe(takeUntil(this._unsubscribe));
    }

    private updateDealerStatus(status: string): Observable<any> {
        return this._dealer.update_status(this.dealer.dealerId, status).pipe(takeUntil(this._unsubscribe));
    }

    private updateUserData(): Observable<any> {
        return this._user.update_user(this.mapUserInfoChanges()).pipe(takeUntil(this._unsubscribe));
    }

    protected get _editDealerFormFields() {
        return [
            {
                label: 'Business Name',
                control: 'business_name',
                placeholder: 'Ex. SM Center Pasig',
                col: 'col-lg-6',
            },
            {
                label: 'Dealer Id',
                control: 'dealer_id',
                col: 'col-lg-6 p-0',
            },
            {
                label: 'Dealer Alias',
                control: 'dealer_alias',
                col: 'col-lg-4',
            },
            {
                label: 'Owner Firstname',
                control: 'owner_f_name',
                placeholder: 'Ex. John',
                col: 'col-lg-4 p-0',
            },
            {
                label: 'Owner Lastname',
                control: 'owner_l_name',
                placeholder: 'Ex. Doe',
                col: 'col-lg-4',
            },
            {
                label: 'Email Address',
                control: 'email',
                placeholder: 'Ex. dealer@mail.com',
                col: 'col-lg-6',
                type: 'email',
            },
            {
                label: 'Password',
                control: 'password',
                placeholder: '',
                col: 'col-lg-6 p-0',
                type: 'password',
            },
            {
                label: 'Contact Number',
                control: 'c_number',
                placeholder: 'Ex. 0123456789',
                col: 'col-lg-6',
            },
            {
                label: 'Contact Person',
                control: 'c_person',
                placeholder: 'Ex. John Doe',
                col: 'col-lg-6',
            },
            {
                label: 'City',
                control: 'city',
                placeholder: 'Ex. St. Peter',
                col: 'col-lg-6',
                isAutocomplete: true,
            },
            {
                label: 'State',
                control: 'state',
                placeholder: 'Ex. MO',
                col: 'col-lg-3',
            },
            {
                label: 'Region',
                control: 'region',
                placeholder: 'Ex. MW',
                col: 'col-lg-3',
            },
            {
                label: 'Player Count',
                control: 'c_count',
                placeholder: 'Ex. 23',
                col: 'col-lg-6',
            },
        ];
    }

    protected get _editFormControls() {
        return this.editDealerForm.controls;
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
