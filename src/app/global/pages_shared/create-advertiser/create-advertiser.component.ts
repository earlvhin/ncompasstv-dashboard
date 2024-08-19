import { Component, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormControl, ValidatorFn } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Router } from '@angular/router';
import { Subscription, Subject, forkJoin, ObservableInput } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ImageSelectionModalComponent } from '../../components_shared/page_components/image-selection-modal/image-selection-modal.component';
import {
    AdvertiserService,
    AuthService,
    CategoryService,
    DealerService,
    FastEdgeService,
    HelperService,
    LocationService,
    MapService,
} from 'src/app/global/services';

import { STATES_PROVINCES } from '../../constants/states';
import { AUTOCOMPLETE_ACTIONS } from '../../constants/autocomplete';
import { CityData } from '../../models/api_cities_state.model';

import {
    API_CREATE_ADVERTISER,
    City,
    UI_TABLE_DEALERS,
    UI_AUTOCOMPLETE_INITIAL_DATA,
    UI_ROLE_DEFINITION_TEXT,
} from 'src/app/global/models';

@Component({
    selector: 'app-create-advertiser',
    templateUrl: './create-advertiser.component.html',
    styleUrls: ['./create-advertiser.component.scss'],
    providers: [TitleCasePipe],
})
export class CreateAdvertiserComponent implements OnInit {
    canadaSelected: boolean = false;
    categories_data: any;
    canada_selected: boolean = false;
    dealerHasValue: boolean;
    gen_categories_data: any[];
    category_selected: string;
    child_category: string;
    current_host_image: string;
    dealers_data: Array<any> = [];
    filtered_data: UI_TABLE_DEALERS[] = [];
    form_invalid: boolean = true;
    google_place_form: FormGroup;
    google_result: any;
    is_creating_advertiser: boolean = false;
    is_dealer: boolean = false;
    is_page_ready = false;
    lat: number = 39.7395247;
    lng: number = -105.1524133;
    loading_data: boolean = true;
    loading_search: boolean = false;
    location_field: boolean = true;
    location_candidate_fetched: boolean = false;
    location_selected: boolean = false;
    new_advertiser_form: FormGroup;
    new_advertiser_form_fields = this._createFormFields;
    no_category: boolean = false;
    no_category2 = false;
    no_result: boolean = false;
    paging: any;
    place_id: string;
    search_keyword: string = '';
    selectedCity: string;
    selectedDealer: UI_AUTOCOMPLETE_INITIAL_DATA[] = [];
    searchDisabled = false;
    selected_location: any;
    stateAndProvinces: { state: string; abbreviation: string; region: string }[] = STATES_PROVINCES;
    subscription: Subscription = new Subscription();
    title: string = 'Create Advertiser Profile';
    triggerData: Subject<any> = new Subject<any>();
    isListVisible: boolean = true;

    protected default_host_image = 'assets/media-files/admin-icon.png';
    private logo_data: { images: string[]; logo: string };
    protected _unsubscribe = new Subject<void>();

    dealerControl = new FormControl();

    is_search: boolean = false;

    constructor(
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _categories: CategoryService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _fastedge: FastEdgeService,
        private _form: FormBuilder,
        private _helper: HelperService,
        private _location: LocationService,
        private _map: MapService,
        private _router: Router,
        private _titlecase: TitleCasePipe,
    ) {}

    ngOnInit() {
        this.current_host_image = this.default_host_image;
        this.initializeCreateAdvertiserForm();
        this.initializeGooglePlaceForm();
        this.loadInitialData();

        if (this.isDealer || this.isSubDealer) {
            this.searchDisabled = true;
            const dealerId = this._auth.current_user_value.roleInfo.dealerId;
            const businessName = this._auth.current_user_value.roleInfo.businessName;
            const dealer = { id: dealerId, value: businessName };

            this.selectedDealer.push(dealer);
            this.setToDealer(dealer);
        }

        this.watchCategoryField();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    onChoosePhotos() {
        const config: MatDialogConfig = {
            width: '700px',
            disableClose: true,
        };

        const dialog = this._dialog.open(ImageSelectionModalComponent, config);
        dialog.componentInstance.placeId = this.place_id;

        dialog.afterClosed().subscribe((response: { images: string[]; logo: string } | boolean) => {
            if (!response) return;
            const data = response as { images: string[]; logo: string };
            this.logo_data = data;
            this.current_host_image = data.logo;
        });
    }

    protected get _createFormFields() {
        return [
            {
                label: 'Advertiser Name',
                control: 'businessName',
                placeholder: 'Ex. SM Center Pasig',
                col: 'col-lg-12',
            },
            {
                label: 'Category',
                control: 'category',
                placeholder: 'Ex. Art School',
                col: 'col-lg-6',
                autocomplete: true,
                is_required: true,
            },
            {
                label: 'General Category',
                control: 'category2',
                placeholder: 'Ex. School',
                col: 'col-lg-6',
                autocomplete: true,
                is_required: false,
            },
            {
                label: 'Latitude',
                control: 'lat',
                placeholder: 'Ex. 58.933',
                col: 'col-lg-6',
                is_required: true,
            },
            {
                label: 'Longitude',
                control: 'long',
                placeholder: 'Ex. 58.933',
                col: 'col-lg-6',
                is_required: true,
            },
            {
                label: 'Address',
                control: 'address',
                placeholder: 'Ex. 21st Drive Fifth Avenue Place',
                col: 'col-lg-6',
                is_required: true,
            },
            {
                label: 'City',
                control: 'city',
                placeholder: 'Ex. Chicago',
                col: 'col-lg-6',
                is_required: true,
                autocomplete: true,
            },
            {
                label: 'State',
                control: 'state',
                placeholder: 'Ex. IL',
                col: 'col-lg-3',
                is_required: true,
            },
            {
                label: 'Region',
                control: 'region',
                placeholder: 'Ex. NW',
                col: 'col-lg-3',
                is_required: true,
            },
            {
                label: 'Zip Code',
                control: 'zip',
                placeholder: 'Ex. 54001',
                col: 'col-lg-6',
                is_required: true,
            },
        ];
    }

    private initializeCreateAdvertiserForm() {
        this.new_advertiser_form = this._form.group({
            dealerId: ['', Validators.required],
            businessName: ['', Validators.required],
            is_canada: [''],
            address: ['', Validators.required],
            city: ['', Validators.required],
            state: [{ value: '', disabled: true }, Validators.required],
            region: [{ value: '', disabled: true }, Validators.required],
            zip: ['', Validators.required],
            category: ['', Validators.required],
            category2: [{ value: '', disabled: true }],
            long: ['', Validators.required],
            lat: ['', Validators.required],
            createdBy: this._auth.current_user_value.user_id,
        });

        this.subscription.add(
            this.new_advertiser_form.valueChanges.subscribe((data) => {
                this.form_invalid = !(this.new_advertiser_form.valid && data.city !== '');
            }),
        );

        this.watchCategoryField();
    }

    private initializeGooglePlaceForm() {
        this.google_place_form = this._form.group({ location: ['', Validators.required] });

        this.google_place_form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            if (this.google_place_form.valid) {
                this.location_field = false;
            } else {
                this.location_field = true;
                this.location_candidate_fetched = false;
            }
        });
    }

    private loadInitialData() {
        const requests: ObservableInput<any> = [
            this._categories.get_parent_categories().pipe(takeUntil(this._unsubscribe)),
            this._categories.get_categories().pipe(takeUntil(this._unsubscribe)),
            this._dealer.get_dealers_with_page(1, '').pipe(takeUntil(this._unsubscribe)),
        ];

        forkJoin(requests)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                ([generalCategories, getCategories]) => {
                    const categories = generalCategories;
                    const genCategories = getCategories;

                    this.categories_data = categories.map((category) => {
                        category.categoryName = this._titlecase.transform(category.categoryName);
                        return category;
                    });

                    this.gen_categories_data = genCategories.map((category) => {
                        category.generalCategory = this._titlecase.transform(category.generalCategory);
                        return category;
                    });

                    this.loading_data = false;
                    this.is_page_ready = true;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    public getSelectedCity(data: CityData): void {
        if (data) this.canada_selected = data.country === 'CA';

        const { city, state, region } = data || { city: '', state: '', region: '' };
        this.newAdvertiserFormControls.city.setValue(city ? `${city}, ${state}` : `${state}`);
        this.newAdvertiserFormControls.state.setValue(`${state}`);
        this.newAdvertiserFormControls.region.setValue(`${region}`);
    }

    // Convenience getter for easy access to form fields
    get formControls() {
        return this.new_advertiser_form.controls;
    }

    get g() {
        return this.google_place_form.controls;
    }

    googleMap() {
        this.no_result = false;
        this.google_result = [];
        this.location_candidate_fetched = true;
        this.location_selected = false;
        let country = 'United States';
        if (this.canada_selected) {
            country = 'Canada';
        }

        this._fastedge
            .get_google_business_profile(this.googlePlaceFormControls.location.value + ', ' + country)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    if (data.google_search.length <= 0) {
                        this.no_result = true;
                        return;
                    }
                    this.google_result = data.google_search;
                },
                (error) => {
                    console.error(error);
                },
            );
        this.isListVisible = true;
    }

    plotToMap(data: any) {
        const sliced_address = data.address.split(', ');
        const isCanada = data.address.includes('Canada');
        const isUSA = data.address.includes('USA') || data.address.includes('United States');
        const country = isCanada || isUSA ? sliced_address.pop() : '';
        const [address, city, stateZip] = sliced_address;
        const zipState = stateZip.split(' ');
        const state = zipState[0];
        const zip = isCanada ? `${zipState[1]}${zipState[2]}` : zipState[1];

        this.getGeneralCategory(data.type);
        this.setToCategory(data.type);
        this.place_id = data.placeId;
        this.current_host_image = data.thumbnail;
        this.location_selected = true;
        this.location_candidate_fetched = false;
        this.selected_location = data;
        this.newAdvertiserFormControls.businessName.setValue(data.title);
        this.newAdvertiserFormControls.lat.setValue(data.latitude);
        this.newAdvertiserFormControls.long.setValue(data.longitude);

        // Set Zip validation
        this.setZipCodeValidation();

        const state_region: { state: string; abbreviation: string; region: string } = this.searchStateAndRegion(state);

        // Set Address Values
        this.newAdvertiserFormControls.address.setValue(
            `${address}${sliced_address.length > 1 ? `, ${sliced_address.reverse().join(', ')}` : ''}`,
        );
        this.triggerData.next({ data: city, action: AUTOCOMPLETE_ACTIONS.static });
        this.newAdvertiserFormControls.city.setValue(city);
        this.selectedCity = city;
        this.newAdvertiserFormControls.state.setValue(state_region.abbreviation);
        this.newAdvertiserFormControls.region.setValue(state_region.region);
        this.newAdvertiserFormControls.zip.setValue(zip);
        this.setCanadaZip();

        this._helper.onTouchPaginatedAutoCompleteField.next();
        this.new_advertiser_form.markAllAsTouched();
        this._helper.onTouchPaginatedAutoCompleteField.next();
    }

    private setCanadaZip(): void {
        if (!this.canadaSelected) return;
        const control = this.newAdvertiserFormControls.zip;
        const canadaZip = (control.value as string).trim();

        if (canadaZip.length === 6) {
            const left = canadaZip.substring(0, 3);
            const right = canadaZip.substring(3, 6);
            this.newAdvertiserFormControls.zip.patchValue(`${left} ${right}`, { emitEvent: false });
        }
    }

    private setZipCodeValidation(): void {
        const control = this.newAdvertiserFormControls.zip;
        const numbersOnly = '^[0-9]+$';
        const canadianZipCodePattern = `^[A-Za-z]\\d[A-Za-z] \\d[A-Za-z]\\d$`;
        const country = this.canadaSelected ? 'CA' : 'US';

        let validators: ValidatorFn[] = [Validators.required];
        const usZipValidators = [Validators.minLength(5), Validators.maxLength(5), Validators.pattern(numbersOnly)];
        const canadaZipValidators = [
            Validators.minLength(7),
            Validators.maxLength(7),
            Validators.pattern(canadianZipCodePattern),
        ];
        validators = country === 'CA' ? validators.concat(canadaZipValidators) : validators.concat(usZipValidators);

        control.clearValidators();
        control.setValidators(validators);
        control.setErrors(null);
        control.updateValueAndValidity({ emitEvent: false });
        this.subscribeToZipChanges();
    }

    private subscribeToZipChanges() {
        const control = this.newAdvertiserFormControls.zip;
        const country = this.canadaSelected ? 'CA' : 'US';

        const formatCanadaZip = (data: string) => {
            const zip = data.replace(/\s/g, '');

            if (zip && zip.length === 6) {
                const clean = data.substring(0, 6);
                const left = clean.substring(0, 3);
                const right = clean.substring(3, 6);
                return `${left} ${right}`;
            }

            return data;
        };

        control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(300)).subscribe((response: string) => {
            const result = country === 'US' ? response.substring(0, 5) : formatCanadaZip(response);
            control.patchValue(result, { emitEvent: false });
        });
    }

    public searchStateAndRegion(state: string): { state: string; abbreviation: string; region: string } {
        return this.stateAndProvinces.filter(
            (s) => state.toLowerCase() == s.state.toLowerCase() || state.toLowerCase() == s.abbreviation.toLowerCase(),
        )[0];
    }

    newAdvertiserProfile() {
        const newAdvertiserProfile = new API_CREATE_ADVERTISER(
            this.newAdvertiserFormControls.dealerId.value,
            this.newAdvertiserFormControls.businessName.value,
            this._auth.current_user_value.user_id,
            this.newAdvertiserFormControls.lat.value,
            this.newAdvertiserFormControls.long.value,
            this.newAdvertiserFormControls.address.value,
            this.newAdvertiserFormControls.city.value,
            this.newAdvertiserFormControls.state.value,
            this.newAdvertiserFormControls.region.value,
            this.newAdvertiserFormControls.zip.value,
            this.newAdvertiserFormControls.category.value,
            this.current_host_image,
        );

        if (this.logo_data) {
            newAdvertiserProfile.logo = this.logo_data.logo;
            newAdvertiserProfile.images = this.logo_data.images;
            this.current_host_image = this.logo_data.logo;
        }

        this.is_creating_advertiser = true;

        if ((this.is_creating_advertiser = true)) {
            this._advertiser
                .add_advertiser_profile(newAdvertiserProfile)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (data: any) => {
                        this.openConfirmationModal(
                            'success',
                            'Advertiser Profile Created!',
                            'Hurray! You successfully created an Advertiser Profile',
                            data.id,
                        );
                    },
                    (error) => {
                        this.is_creating_advertiser = false;
                        this.openConfirmationModal(
                            'error',
                            'Advertiser Profile Creation Failed',
                            "Sorry, There's an error with your submission",
                            null,
                        );
                    },
                );
        }
    }

    public setToDealer(dealersInfo: { id: string; value: string }): void {
        this.dealerHasValue = false;

        if (dealersInfo != null) {
            this.formControls.dealerId.setValue(dealersInfo.id);
            this.dealerHasValue = true;
        }
    }

    private openConfirmationModal(status: string, message: string, data: any, id: string): void {
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
                if (!id) return;
                const customRoute =
                    this.roleRoute == UI_ROLE_DEFINITION_TEXT.dealeradmin
                        ? UI_ROLE_DEFINITION_TEXT.administrator
                        : this.roleRoute;
                this._router.navigate([`/${customRoute}/advertisers/`, id]);
            });
    }

    setToGeneralCategory(event: string) {
        this.no_category2 = true;
        this.newAdvertiserFormControls.category2.setValue(this._titlecase.transform(event).replace(/_/g, ' '));
    }

    setToCategory(event: string) {
        this.no_category = true;
        this.newAdvertiserFormControls.category.setValue(this._titlecase.transform(event).replace(/_/g, ' '));
        this.getGeneralCategory(event);
    }

    getGeneralCategory(category) {
        this._categories
            .get_category_general(category)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                if (!data.message) this.setToGeneralCategory(data.category.generalCategory);
                else this.setToGeneralCategory('Others');
            });
    }

    watchCategoryField() {
        this.newAdvertiserFormControls.category.valueChanges.subscribe((data) => {
            if (data === '') this.no_category = false;
        });

        this.newAdvertiserFormControls.category2.valueChanges.subscribe((data) => {
            if (data === '') this.no_category2 = false;
        });

        this.newAdvertiserFormControls.city.valueChanges.subscribe((data) => {
            this.selectedCity = data;
        });

        this.new_advertiser_form.controls['zip'].setValidators([Validators.required, Validators.maxLength(7)]);

        this.new_advertiser_form.controls['zip'].valueChanges.subscribe((data) => {
            if (this.canada_selected) {
                this.new_advertiser_form.controls['zip'].setValue(data.substring(0, 6), {
                    emitEvent: false,
                });
            } else {
                this.new_advertiser_form.controls['zip'].setValue(data.substring(0, 5), {
                    emitEvent: false,
                });
            }
        });
    }

    closeGoogleDropdownList() {
        this.isListVisible = false;
    }

    protected get currentRole() {
        return this._auth.current_role;
    }

    protected get googlePlaceFormControls() {
        return this.google_place_form.controls;
    }

    protected get isAdmin() {
        return this.currentRole === 'administrator';
    }

    protected get isDealer() {
        return this.currentRole === 'dealer';
    }

    protected get isSubDealer() {
        return this.currentRole === 'sub-dealer';
    }

    protected get newAdvertiserFormControls() {
        return this.new_advertiser_form.controls;
    }

    protected get roleInfo() {
        return this._auth.current_user_value.roleInfo;
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
