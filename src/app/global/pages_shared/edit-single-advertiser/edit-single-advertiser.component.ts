import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatSlideToggleChange, MatDialogRef } from '@angular/material';
import { TitleCasePipe } from '@angular/common';
import { takeUntil, map } from 'rxjs/operators';
import { Subject } from 'rxjs';

import {
    AdvertiserService,
    AuthService,
    CategoryService,
    ConfirmationDialogService,
    DealerService,
    LocationService,
} from 'src/app/global/services';

import {
    ACTIVITY_LOGS,
    API_ADVERTISER,
    API_DEALER,
    API_PARENT_CATEGORY,
    API_UPDATE_ADVERTISER,
    City,
    PAGING,
    UI_AUTOCOMPLETE_DATA,
    UI_CONFIRMATION_MODAL,
    UI_ROLE_DEFINITION,
} from 'src/app/global/models';

import { CityData } from '../../models/api_cities_state.model';

@Component({
    selector: 'app-edit-single-advertiser',
    templateUrl: './edit-single-advertiser.component.html',
    styleUrls: ['./edit-single-advertiser.component.scss'],
    providers: [TitleCasePipe],
})
export class EditSingleAdvertiserComponent implements OnInit, OnDestroy {
    advertiser: API_ADVERTISER = this.dialog_data.advertiser;
    canada_selected: boolean = false;
    category_selected: string;
    categories_data: API_PARENT_CATEGORY[] = [];
    categories_loaded = false;
    cities_loaded = false;
    city_selected: string;
    city_state: City[] = [];
    closed_without_edit: boolean = false;
    current_dealer: API_DEALER;
    dealer_name: string;
    dealers_data: any;
    dealers_loaded = false;
    disable_business_name: boolean = true;
    edit_advertiser_form: FormGroup;
    edit_advertiser_form_fields = this._editAdvertiserFormFields;
    initial_dealer_id: string;
    is_active_advertiser = this.advertiser.status === 'A';
    is_current_user_admin = this._auth.current_role === 'administrator';
    is_dealer_change_disabled = true;
    is_form_ready = false;
    is_dealer = this._auth.current_role === 'dealer';
    paging: PAGING;
    selectedDealer: UI_AUTOCOMPLETE_DATA[] = [];
    selectedCity: string;

    protected _unsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public dialog_data: { advertiser: API_ADVERTISER; dealer: API_DEALER },
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _categories: CategoryService,
        private _confirmationDialog: ConfirmationDialogService,
        private _dealer: DealerService,
        private _dialogReference: MatDialogRef<EditSingleAdvertiserComponent>,
        private _form: FormBuilder,
        private _location: LocationService,
        private _titlecase: TitleCasePipe,
    ) {}

    ngOnInit() {
        this.getCategories();
        this.initializeForm();
        this.zipCodeValidation();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    setCategory(event: string): void {
        if (!event || event.length <= 0) return;
        event = event.replace(/_/g, ' ');
        this.category_selected = this._titlecase.transform(event);
        this._formControls.category.setValue(event);
    }

    clearAddressValue() {
        this._formControls.address.setValue('');
        this.selectedCity = '';
        this._formControls.city.setValue('');
        this._formControls.state.setValue('');
        this._formControls.region.setValue('');
        this._formControls.zip.setValue('');
    }

    private addCurrentDealerToList(): void {
        const filtered = this.dealers_data.filter((dealer) => dealer.dealerId === this.dealers_data.dealerId);

        if (filtered.length > 0) return;

        this._dealer
            .get_dealer_by_id(this.current_dealer.dealerId)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                this.dealers_data.push(response);
            });
    }

    onSelectCategory(name: string) {
        if (!name) return;
        name = name.replace(/_/g, ' ');
        this.category_selected = this._titlecase.transform(name);
        this._formControls.category.setValue(name);
    }

    onToggleStatus(event: MatSlideToggleChange) {
        this.is_active_advertiser = event.checked;
    }

    async saveAdvertiserData() {
        const title = 'Update Advertiser Details';
        let message = 'Are you sure you want to proceed?';
        const modifyAdvertiser = new ACTIVITY_LOGS(
            this.advertiser.id,
            'modify_advertiser',
            this._auth.current_user_value.user_id,
        );

        const newStatus = this.is_active_advertiser ? 'A' : 'I';

        const newAdvertiserProfile = new API_UPDATE_ADVERTISER(
            this.advertiser.id,
            this._formControls.dealerId.value,
            this._formControls.businessName.value,
            this._formControls.lat.value,
            this._formControls.long.value,
            this._formControls.city.value,
            this._formControls.state.value,
            this._formControls.zip.value,
            this._formControls.region.value,
            this._formControls.address.value,
            this._formControls.category.value,
            newStatus,
        );

        if (this.advertiser.status !== newStatus)
            message += ` This will ${newStatus === 'A' ? 'activate' : 'deactivate'} the advertiser.`;

        const confirmChange = await this._confirmationDialog.warning({ message: title, data: message }).toPromise();

        if (!confirmChange) return;

        this._advertiser
            .update_advertiser(newAdvertiserProfile)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                async () => {
                    const dialogData = {
                        message: 'Advertiser Details Updated!',
                        data: 'Your changes have been saved',
                    };

                    await this._confirmationDialog.success(dialogData).toPromise();
                    await this.createActivity(modifyAdvertiser).toPromise();
                    this._dialogReference.close(true);
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    createActivity(activity) {
        return this._advertiser.create_advertiser_activity_logs(activity).pipe(takeUntil(this._unsubscribe));
    }

    public dealerSelected(data: { id: string; value: string }): void {
        this._formControls.dealerId.setValue(data.id);
    }

    private getCategories(): void {
        this._categories
            .get_parent_categories()
            .pipe(
                takeUntil(this._unsubscribe),
                map((response) => {
                    response = response.map((parentCategory) => {
                        parentCategory.categoryName = this._titlecase.transform(parentCategory.categoryName);
                        return parentCategory;
                    });

                    return response;
                }),
            )
            .subscribe((response) => {
                this.categories_data = response;
            })
            .add(() => (this.categories_loaded = true));
    }

    private zipCodeValidation() {
        this.edit_advertiser_form.controls['zip'].setValidators([Validators.required, Validators.maxLength(7)]);

        this.edit_advertiser_form.controls['zip'].valueChanges.subscribe((data) => {
            if (this.canada_selected) {
                this.edit_advertiser_form.controls['zip'].setValue(data.substring(0, 6), {
                    emitEvent: false,
                });
            } else {
                this.edit_advertiser_form.controls['zip'].setValue(data.substring(0, 5), {
                    emitEvent: false,
                });
            }
        });
    }

    private initializeForm() {
        this.edit_advertiser_form = this._form.group({
            dealerId: ['', Validators.required],
            businessName: ['', Validators.required],
            address: ['', Validators.required],
            city: ['', Validators.required],
            state: [{ value: '', disabled: true }, Validators.required],
            zip: ['', Validators.required],
            region: [{ value: '', disabled: true }, Validators.required],
            category: ['', Validators.required],
            long: ['', Validators.required],
            lat: ['', Validators.required],
        });

        this.edit_advertiser_form.markAllAsTouched();

        this.setFormData();
    }

    private setFormData(): void {
        const { advertiser, dealer } = this.dialog_data;
        this._formControls.businessName.setValue(advertiser.name);
        this._formControls.lat.setValue(advertiser.latitude);
        this._formControls.long.setValue(advertiser.longitude);
        this._formControls.address.setValue(advertiser.address);
        this._formControls.dealerId.setValue(this.dialog_data.dealer.dealerId);
        this.dealer_name = dealer.businessName;
        this.onSelectCategory(advertiser.category);

        this.selectedDealer.push({
            id: dealer.dealerId,
            value: dealer.businessName,
        });

        this.initial_dealer_id = advertiser.dealerId;
        this.is_form_ready = true;
    }

    public citySelected(data: CityData): void {
        const { city, state, region } = data || { city: '', state: '', region: '' };
        this._formControls.city.setValue(city ? city : '');
        this._formControls.state.setValue(state || '');
        this._formControls.region.setValue(region || '');
    }

    public setInitialCity(isLoaded: boolean): void {
        this.selectedCity = this.dialog_data.advertiser.city;

        //Set value to initial city
        this._formControls.city.setValue(this.selectedCity);
        this._formControls.state.setValue(this.dialog_data.advertiser.state);
        this._formControls.region.setValue(this.dialog_data.advertiser.region);
        this._formControls.zip.setValue(this.dialog_data.advertiser.postalCode);
    }

    protected get _editAdvertiserFormFields() {
        return [
            {
                label: 'Advertiser Business Name',
                control: 'businessName',
                placeholder: 'Ex. SM Center Pasig',
                col: 'col-lg-6',
            },
            {
                label: 'Category',
                control: 'category',
                placeholder: 'Ex. School',
                col: 'col-lg-6',
                autocomplete: true,
            },
            {
                label: 'Latitude',
                control: 'lat',
                placeholder: 'Ex. 58.933',
                col: 'col-lg-6',
            },
            {
                label: 'Longitude',
                control: 'long',
                placeholder: 'Ex. 58.933',
                col: 'col-lg-6',
            },
            {
                label: 'Canada',
                control: 'is_canada',
                placeholder: 'Input for Canada Address',
                col: 'col-lg-12',
                is_required: false,
                checkbox: true,
            },
            {
                label: 'Address',
                control: 'address',
                placeholder: 'Ex. 21st Drive Fifth Avenue Place',
                col: 'col-lg-5',
            },
            {
                label: 'City',
                control: 'city',
                placeholder: 'Ex. Chicago',
                col: 'col-lg-4',
            },
            {
                label: 'State',
                control: 'state',
                placeholder: 'Ex. IL',
                col: 'col-lg-2',
            },
            {
                label: 'Region',
                control: 'region',
                placeholder: 'Ex. SW',
                col: 'col-lg-2',
            },
            {
                label: 'Zip Code',
                control: 'zip',
                placeholder: 'Ex. 54001',
                col: 'col-lg-4',
            },
        ];
    }

    protected get _formControls() {
        return this.edit_advertiser_form.controls;
    }
}
