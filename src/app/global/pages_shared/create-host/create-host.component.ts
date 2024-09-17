import { Component, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Router } from '@angular/router';
import { forkJoin, ObservableInput, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import * as uuid from 'uuid';
import * as moment from 'moment';

import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { BulkEditBusinessHoursComponent } from '../../components_shared/page_components/bulk-edit-business-hours/bulk-edit-business-hours.component';
import { ImageSelectionModalComponent } from '../../components_shared/page_components/image-selection-modal/image-selection-modal.component';

import {
    API_CREATE_HOST,
    API_DEALER,
    API_PARENT_CATEGORY,
    API_TIMEZONE,
    CITIES_STATE_DATA,
    City,
    GOOGLE_MAP_SEARCH_RESULT_V2,
    PAGING,
    UI_AUTOCOMPLETE,
    UI_AUTOCOMPLETE_DATA,
    UI_OPERATION_DAYS,
    UI_STORE_HOUR,
    UI_STORE_HOUR_PERIOD,
    UI_ROLE_DEFINITION_TEXT,
    UI_CITY_AUTOCOMPLETE_DATA,
    UI_CITY_AUTOCOMPLETE,
    UI_HOUR,
    UI_STORE_HOURS_OPENING,
} from 'src/app/global/models';

import {
    AuthService,
    DealerService,
    FastEdgeService,
    CategoryService,
    HelperService,
    HostService,
    MapService,
    LocationService,
} from 'src/app/global/services';
import { CITIES_STATE } from '../../models/api_cities_state.model';
import { AUTOCOMPLETE_ACTIONS } from '../../constants/autocomplete';
import { STATES_PROVINCES } from '../../constants/states';
import { TimezoneService } from '../../services/timezone-service/timezone.service';
import { CityData } from '../../models/api_cities_state.model';

@Component({
    selector: 'app-create-host',
    templateUrl: './create-host.component.html',
    styleUrls: ['./create-host.component.scss'],
    providers: [TitleCasePipe],
})
export class CreateHostComponent implements OnInit {
    canadaSelected: boolean = false;
    categoriesData: API_PARENT_CATEGORY[];
    category_selected: string;
    child_category: string;
    citiesStateData: CITIES_STATE;
    city_loaded = false;
    city_selected: string;
    city_state: City[] = [];
    contactTouchAndInvalid = false;
    contactIsCleared = true;
    create_host_data: UI_AUTOCOMPLETE = { label: 'City', placeholder: 'Type anything', data: [] };
    current_host_image: string;
    dealer_name: string;
    dealerHasValue: boolean;
    dealersData: API_DEALER[] = [];
    genCategoriesData: any[];
    google_operation_days = this._googleOperationDays;
    google_place_form: FormGroup;
    google_result: any;
    hasInvalidTime = false;
    is_admin = this.isAdmin;
    isAlwaysOpen = false;
    is_creating_host = false;
    is_dealer = this.isDealer;
    isDealerAdmin = false;
    is_loading_categories = true;
    is_page_ready = false;
    isListVisible: boolean = false;
    lat = 39.7395247;
    lng = -105.1524133;
    loading_data = true;
    loading_search = false;
    location_candidate_fetched = false;
    locationField = true;
    location_selected = false;
    new_host_form_fields = this._createFormFields;
    newHostForm: FormGroup;
    no_category = false;
    no_category2 = false;
    no_result = false;
    notFromGoogle = true;
    operation_days: UI_STORE_HOUR[];
    paging: PAGING;
    place_id: string;
    searchDisabled = false;
    selected_location: any;
    selectedCity: string;
    selectedDealer: UI_AUTOCOMPLETE_DATA[] = [];
    state_provinces: { state: string; abbreviation: string; region: string }[] = STATES_PROVINCES;
    modifiedStorePeriod: UI_STORE_HOURS_OPENING[] = [];
    storeHoursPeriod: UI_STORE_HOUR_PERIOD[];
    timezone_autocomplete: UI_AUTOCOMPLETE;
    timezones: API_TIMEZONE[];
    title = 'Create Host Place';
    trigger_data: Subject<any> = new Subject<any>();
    update_timezone_value = new Subject<UI_AUTOCOMPLETE_DATA | string>();

    private is_search = false;
    private dealer_id: string;
    private form_invalid = true;
    private logo_data: { images: string[]; logo: string };
    private operation_hours: UI_STORE_HOUR_PERIOD[];
    protected default_host_image = 'assets/media-files/admin-icon.png';
    protected _unsubscribe = new Subject<void>();

    // New Autocomplete Dependencies
    city_field_data: UI_CITY_AUTOCOMPLETE = {
        label: 'City',
        placeholder: 'Type a city',
        data: [],
        allowSearchTrigger: true,
        trigger: this.trigger_data.asObservable(),
    };

    constructor(
        private _auth: AuthService,
        private _categories: CategoryService,
        private _fastedge: FastEdgeService,
        private _form: FormBuilder,
        private _helper: HelperService,
        private _host: HostService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _map: MapService,
        private _router: Router,
        private _titlecase: TitleCasePipe,
        private _location: LocationService,
        private _timezone: TimezoneService,
    ) {}

    ngOnInit() {
        if (this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin) this.isDealerAdmin = true;
        this.current_host_image = this.default_host_image;
        this.initializeCreateHostForm();
        this.initializeGooglePlaceForm();
        this.loadInitialData();
        this.setOperationDays();

        if (this.isDealer || this.isSubDealer) {
            this.searchDisabled = true;
            const dealerId = this._auth.current_user_value.roleInfo.dealerId;
            const businessName = this._auth.current_user_value.roleInfo.businessName;
            const dealer = { id: dealerId, value: businessName };
            this.selectedDealer.push(dealer);

            this.setToDealer(dealer);
        }

        this.getCitiesAndStates();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    addHours(data: UI_OPERATION_DAYS) {
        this.hasInvalidTime = true;
        this.notFromGoogle = true;

        const hours = {
            id: uuid.v4(),
            day_id: data.id,
            open: '',
            close: '',
        };

        data.periods.push(hours);
    }

    public onOpenTimeChange(time: { hour: number; minute: number; second?: number }): void {
        this.onTimeChange(time);
    }

    public onCloseTimeChange(time: { hour: number; minute: number; second?: number }): void {
        this.onTimeChange(time);
    }

    private onTimeChange(time: { hour: number; minute: number; second?: number }): void {
        if (time === null) {
            this.hasInvalidTime = true;
            return;
        }

        this.timeValidator();
    }

    private timeValidator(): void {
        this.hasInvalidTime = false;
        this.storeHoursPeriod = [];

        this.operation_days.forEach((data) => {
            if (data.status && data.periods.length > 0) {
                data.periods.forEach((period) => {
                    this.storeHoursPeriod.push(period);
                });
            }
        });

        this.hasInvalidTime = this.storeHoursPeriod.some(
            (period) => !period.openingHourData || !period.closingHourData,
        );
    }

    addNewHostPlace() {
        const customRoute =
            this.roleRoute == UI_ROLE_DEFINITION_TEXT.dealeradmin
                ? UI_ROLE_DEFINITION_TEXT.administrator
                : this.roleRoute;
        const url = this._router.serializeUrl(
            this._router.createUrlTree([`/${customRoute}/users/create-user/host`], {}),
        );
        window.open(url, '_blank');
    }

    clearAddressValue() {
        this.newHostFormControls.address.setValue('');
        this.city_selected = '';
        this.newHostFormControls.city.setValue('');
        this.newHostFormControls.state.setValue('');
        this.newHostFormControls.region.setValue('');
        this.newHostFormControls.zip.setValue('');
    }

    closeGoogleDropdownList() {
        this.isListVisible = false;
    }

    getCitiesAndStates() {
        this._location
            .get_cities_data()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                this.citiesStateData = response;

                this.city_field_data.data = [
                    ...this.citiesStateData.data
                        .map((data) => {
                            return {
                                id: data.id,
                                value: `${data.city}, ${data.state}`,
                                display: data.city,
                                country: data.country,
                            };
                        })
                        .filter((data) => data),
                ];
            });
    }

    getFullDayName(abbreviatedDay: string): string {
        switch (abbreviatedDay.toLowerCase()) {
            case 'm':
                return 'Monday';

            case 't':
                return 'Tuesday';

            case 'w':
                return 'Wednesday';

            case 'th':
                return 'Thursday';

            case 'f':
                return 'Friday';

            case 'st':
                return 'Saturday';

            default: // sn
                return 'Sunday';
        }
    }

    getGeneralCategory(category) {
        this._categories
            .get_category_general(category)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                // if no result then set category as 'Others'
                // else assign the response found
                const result: string = data.message ? 'Others' : data.category.generalCategory;
                this.setToGeneralCategory(result);
            });
    }

    getMoreBusinessPlaceDetails(location) {
        let location_selected = location;
        this._map
            .get_google_store_info(location.placeId)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                if (!data.result.opening_hours) return;
                location_selected.opening_hours = data.result.opening_hours;
                this.notFromGoogle = false;
                this.mapOperationHours(location_selected.opening_hours.periods);
            });
    }

    onBulkAddHours(): void {
        const dialogConfig: MatDialogConfig = {
            width: '550px',
            height: '450px',
            panelClass: 'position-relative',
            data: {},
            autoFocus: false,
        };

        this._dialog
            .open(BulkEditBusinessHoursComponent, dialogConfig)
            .afterClosed()
            .subscribe((response: UI_STORE_HOUR[]) => {
                if (!response) return;
                this.operation_days = response;
            });
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

    private onConvertOperatingHours(period: UI_STORE_HOUR_PERIOD): void {
        const openingHour = period.openingHourData;
        const closingHour = period.closingHourData;

        const formatTime = (time: UI_HOUR): string => {
            const hourString = time.hour.toString().padStart(2, '0');
            const minuteString = time.minute.toString().padStart(2, '0');
            return `${hourString}${minuteString}`;
        };

        const openingHourFormatted = formatTime(openingHour);
        const closingHourFormatted = formatTime(closingHour);

        const modifiedPeriod = {
            close: {
                day: period.day_id,
                time: closingHourFormatted,
            },
            open: {
                day: period.day_id,
                time: openingHourFormatted,
            },
        };

        this.modifiedStorePeriod.push(modifiedPeriod);
    }

    public onClickInvalid(): void {
        this.openWarningModal(
            'error',
            'Failed to create host',
            'Please ensure that all business hours are accurately provided for each input field',
            null,
            null,
        );
        return;
    }

    onCreateHostPlace() {
        this.modifiedStorePeriod = [];

        this.operation_days.forEach((data) => {
            if (data.status && data.periods.length > 0) {
                data.periods.forEach((period) => {
                    this.onConvertOperatingHours(period);
                });
            }
        });

        this.mapOperationHours(this.modifiedStorePeriod);

        const newHostPlace = new API_CREATE_HOST({
            dealerId: this.newHostFormControls.dealerId.value,
            businessName: this.newHostFormControls.businessName.value,
            createdBy: this._auth.current_user_value.user_id,
            latitude: this.newHostFormControls.lat.value,
            longitude: this.newHostFormControls.long.value,
            address: this.newHostFormControls.address.value,
            city: this.newHostFormControls.city.value,
            state: this.newHostFormControls.state.value,
            postalCode: this.newHostFormControls.zip.value,
            region: this.newHostFormControls.region.value,
            storeHours: JSON.stringify(this.operation_days),
            category: this.newHostFormControls.category.value,
            timezone: this.newHostFormControls.timezone.value,
            logo: this.current_host_image,
            contactNumber: this.newHostFormControls.contactNumber.value,
            contactPerson: this.newHostFormControls.contactPerson.value,
        });

        if (this.logo_data) {
            newHostPlace.logo = this.logo_data.logo;
            newHostPlace.images = this.logo_data.images;
            this.current_host_image = this.logo_data.logo;
        }

        this.is_creating_host = true;

        if ((this.is_creating_host = true)) {
            this._host
                .add_host_place(newHostPlace)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    (data: any) => {
                        this.openConfirmationModal(
                            'success',
                            'Host Place Created!',
                            'Hurray! You successfully created a Host Place',
                            data.hostId,
                        );
                    },
                    (error) => {
                        this.is_creating_host = false;
                        this.openConfirmationModal(
                            'error',
                            'Host Place Creation Failed',
                            'An error occured while saving your data',
                            null,
                        );
                    },
                );
        }
    }

    onSearchBusiness() {
        this.no_result = false;
        this.google_result = [];
        this.location_candidate_fetched = true;
        this.location_selected = false;
        let country = 'United States';

        if (this.canadaSelected) country = 'Canada';

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

    onSelectDay(data: UI_STORE_HOUR) {
        data.periods.length = 0;

        const defaultHours = { opening: '12:00 AM', closing: '11:59 PM' };
        const openingHour = moment(defaultHours.opening, 'hh:mm A').format('HH:mm').split(':');
        const closingHour = moment(defaultHours.closing, 'hh:mm A').format('HH:mm').split(':');
        const openingHourData = {
            hour: parseInt(openingHour[0]),
            minute: parseInt(openingHour[1]),
            second: 0,
        };
        const closingHourData = {
            hour: parseInt(closingHour[0]),
            minute: parseInt(closingHour[1]),
            second: 0,
        };

        const hours = {
            id: uuid.v4(),
            day_id: data.id,
            open: defaultHours.opening,
            close: defaultHours.closing,
            openingHourData,
            closingHourData,
        };

        data.status = !data.status;
        data.periods.push(hours);
        this.notFromGoogle = true;
    }

    openWarningModal(status: string, message: string, data: string, return_msg: string, action: string): void {
        this._dialog.closeAll();

        const dialogRef = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status, message, data, return_msg, action },
        });

        dialogRef.afterClosed().subscribe(() => (this.form_invalid = false));
    }

    plotToMap(data: GOOGLE_MAP_SEARCH_RESULT_V2) {
        let sliced_address = data.address.split(', ');
        this.getGeneralCategory(data.type);
        this.setToCategory(data.type);
        this.place_id = data.placeId;
        this.current_host_image = data.thumbnail;
        this.location_selected = true;
        this.location_candidate_fetched = false;
        this.selected_location = data;
        this.newHostFormControls.businessName.setValue(data.title);
        this.newHostFormControls.lat.setValue(data.latitude);
        this.newHostFormControls.long.setValue(data.longitude);

        let address: string;
        let zipState: string[];
        let zip: string;
        let state: string;
        let city: string;
        let country: string;
        const pacific = 'Pacific';
        const eastern = 'Eastern';
        const central = 'Central';
        const mountain = 'Mountain';

        if (data.address.includes('USA') || data.address.includes('Canada') || data.address.includes('United States')) {
            country = sliced_address[sliced_address.length - 1];
        }

        // Address Mapping
        if (sliced_address.length == 5) {
            // We are sure that this here includes a country, and it is the last index (4)
            zipState = sliced_address[3].split(' ');
            state = zipState[0];
            zip = country && country == 'Canada' ? `${zipState[1]}${zipState[2]}` : zipState[1];
            city = sliced_address[2];
            address = `${sliced_address[0]}, ${sliced_address[1]}`;
        } else if (sliced_address.length == 4) {
            zipState = country ? sliced_address[2].split(' ') : sliced_address[3].split(' ');
            state = zipState[0];
            zip = country && country == 'Canada' ? `${zipState[1]}${zipState[2]}` : zipState[1];
            city = sliced_address[1];
            address = sliced_address[0];
        } else if (sliced_address.length == 3) {
            zipState = sliced_address[2].split(' ');
            state = zipState[0];
            zip = country && country == 'Canada' ? `${zipState[1]}${zipState[2]}` : zipState[1];
            city = sliced_address[1];
            address = sliced_address[0];
        }

        this.canadaSelected = country && country.includes('Canada');

        // Set Zip validation
        this.setZipCodeValidation();

        let state_region: { state: string; abbreviation: string; region: string } = this.searchStateAndRegion(state);

        // Set Address Value
        this.newHostFormControls.address.setValue(address);

        // Set City Value
        this.trigger_data.next({ data: sliced_address[1], action: AUTOCOMPLETE_ACTIONS.static });
        this.newHostFormControls.city.setValue(city);
        this.selectedCity = city;

        // Set State Value
        this.newHostFormControls.state.setValue(state_region.abbreviation);

        // Set Region Value
        this.newHostFormControls.region.setValue(state_region.region);

        // Set Zip Value
        this.newHostFormControls.zip.setValue(zip);

        // Checks if Zip is Canadian then parses it
        this.setCanadaZip();

        // Get Business Place Details
        this.getMoreBusinessPlaceDetails(this.selected_location);
        this.newHostForm.markAllAsTouched();
        this._helper.onTouchPaginatedAutoCompleteField.next();

        this._timezone.getTimezoneByCoordinates(data.latitude, data.longitude).subscribe(
            (timezone: string) => {
                const timezoneControl = this.newHostFormControls.timezone;
                let timezoneData: API_TIMEZONE[];

                // Set the value based on the detected timezone
                switch (timezone) {
                    case pacific:
                        timezoneData = this.timezones.filter((data) => data.name === 'US/Pacific');
                        break;
                    case eastern:
                        timezoneData = this.timezones.filter((data) => data.name === 'US/Eastern');
                        break;
                    case central:
                        timezoneData = this.timezones.filter((data) => data.name === 'US/Central');
                        break;
                    case mountain:
                        timezoneData = this.timezones.filter((data) => data.name === 'US/Mountain');
                        break;
                    default:
                        timezoneControl.setValue('Unknown Timezone');
                        break;
                }

                const { id, name } = timezoneData[0];
                this.timezoneChanged(id, name);
            },
            (e) => {
                console.error('Error getting timezone:', e);
            },
        );
    }

    removeHours(data: UI_OPERATION_DAYS, index: number) {
        data.periods.splice(index, 1);
        this.timeValidator();
    }

    searchStateAndRegion(state: string) {
        return this.state_provinces.filter(
            (s) => state.toLowerCase() == s.state.toLowerCase() || state.toLowerCase() == s.abbreviation.toLowerCase(),
        )[0];
    }

    setToCategory(event: string) {
        this.no_category = true;
        this.newHostFormControls.category.setValue(this._titlecase.transform(event).replace(/_/g, ' '));
        this.getGeneralCategory(event);
    }

    setToDealer(dealersInfo: { id: string; value: string }): void {
        this.dealerHasValue = false;
        if (dealersInfo != null) {
            this.newHostFormControls.dealerId.setValue(dealersInfo.id);
            this.dealerHasValue = true;
        }
    }

    setToGeneralCategory(event: string) {
        this.no_category2 = true;
        this.newHostFormControls.category2.setValue(this._titlecase.transform(event).replace(/_/g, ' '));
    }

    timezoneChanged(timezoneId: string, name: string) {
        this.newHostFormControls.timezone.setValue(timezoneId);
        this.newHostFormControls.zone.setValue(name);
    }

    getSelectedCity(data: CityData) {
        if (data) this.canadaSelected = data.country === 'CA';

        const { city, state, region } = data || { city: '', state: '', region: '' };
        this.newHostFormControls.city.setValue(city + ', ' + state);
        this.newHostFormControls.state.setValue(state);
        this.newHostFormControls.region.setValue(region);
    }

    private formatTime(data: number): string {
        const parsed = `${data}`;
        let time = new Date(`January 1, 1990 ${parsed.slice(0, 2)}:${parsed.slice(2, 4)}`);
        let options = {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        } as Intl.DateTimeFormatOptions;
        return time.toLocaleString('en-US', options);
    }

    private initializeCreateHostForm() {
        const upperCaseAlphabets = '^[A-Z]+$';
        const numbersOnly = '^[0-9]+$';

        this.newHostForm = this._form.group({
            dealerId: ['', Validators.required],
            businessName: ['', Validators.required],
            is_canada: [''],
            address: ['', Validators.required],
            city: ['', Validators.required],
            state: [
                { value: '', disabled: true },
                [
                    Validators.required,
                    Validators.minLength(2),
                    Validators.maxLength(2),
                    Validators.pattern(upperCaseAlphabets),
                ],
            ],
            region: [
                { value: '', disabled: true },
                [
                    Validators.required,
                    Validators.minLength(2),
                    Validators.maxLength(2),
                    Validators.pattern(upperCaseAlphabets),
                ],
            ],
            zip: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(7)]],
            category: ['', Validators.required],
            category2: [{ value: '', disabled: true }],
            long: ['', Validators.required],
            lat: ['', Validators.required],
            timezone: ['', Validators.required],
            zone: [''],
            contactPerson: [''],
            contactNumber: [''],
            createdBy: this._auth.current_user_value.user_id,
        });

        this.newHostForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            this.form_invalid = this.newHostForm.invalid;
        });

        this.subscribeToContactNumberChanges();
        this.subscribeToRegionChanges();
        this.subscribeToStateChanges();
    }

    private initializeGooglePlaceForm() {
        this.google_place_form = this._form.group({ location: ['', Validators.required] });

        this.google_place_form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            if (this.google_place_form.valid) {
                this.locationField = false;
            } else {
                this.locationField = true;
                this.location_candidate_fetched = false;
            }
        });
    }

    private loadInitialData() {
        const requests: ObservableInput<any> = [
            this._categories.get_parent_categories().pipe(takeUntil(this._unsubscribe)),
            this._categories.get_categories().pipe(takeUntil(this._unsubscribe)),
            this._dealer.get_dealers_with_page(1, '').pipe(takeUntil(this._unsubscribe)),
            this._host.get_time_zones().pipe(takeUntil(this._unsubscribe)),
        ];

        forkJoin(requests)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                ([generalCategories, getCategories, getDealers, getTimeZones]) => {
                    const categories = generalCategories;
                    const genCategories = getCategories;
                    const dealersData = getDealers as { dealers: API_DEALER[]; paging: PAGING };
                    const timezones = getTimeZones as API_TIMEZONE[];

                    this.categoriesData = categories.map((category) => {
                        category.categoryName = this._titlecase.transform(category.categoryName);
                        return category;
                    });

                    this.genCategoriesData = genCategories.map((category) => {
                        category.generalCategory = this._titlecase.transform(category.generalCategory);
                        return category;
                    });

                    this.city_loaded = true;
                    this.timezones = timezones;
                    this.timezone_autocomplete = this._timezoneAutoComplete;

                    this.timezone_autocomplete.data = [
                        ...this.timezones.map((t) => {
                            return {
                                id: t.id,
                                value: t.name,
                                display: t.name,
                            };
                        }),
                    ];

                    this.dealersData = dealersData.dealers;
                    this.paging = dealersData.paging;
                    this.loading_data = false;
                    this.is_page_ready = true;
                },
                (err) => {
                    console.error('Error loading initial data', err);
                },
            );
    }

    private mapOperationHours(
        data: { close: { day: number; time: number }; open: { day: number; time: number } }[],
    ): void {
        this.operation_hours = data.map((hours) => {
            const hour = {
                id: uuid.v4(),
                day_id: hours.open.day,
                open: hours.open ? this.formatTime(hours.open.time) : '',
                close: hours.close ? this.formatTime(hours.close.time) : '',
                openingHourData: null,
                closingHourData: null,
            };

            const setHourData = (hour: string) => {
                if (hour.length === 0 || !hour.includes(':')) {
                    return {
                        hour: 0,
                        minute: 0,
                        second: 0,
                    };
                }

                const hourData = moment(hour, 'hh:mm A').format('HH:mm').split(':');
                return { hour: parseInt(hourData[0]), minute: parseInt(hourData[1]), second: 0 };
            };

            if (hour.open == '12:00 AM' && (hour.close == '' || null)) {
                const close = '11:59 PM';
                const open = '12:00 AM';

                hour.close = close;
                hour.open = open;
                hour.openingHourData = setHourData(open);
                hour.closingHourData = setHourData(close);
            } else {
                hour.openingHourData = setHourData(hour.open);
                hour.closingHourData = setHourData(hour.close);
            }

            return hour;
        });

        this.operation_days = this.google_operation_days.map((h) => {
            return {
                id: h.id,
                label: h.label,
                day: h.day,
                periods: this.operation_hours.filter((t) => t.day_id == h.id),
                status: this.operation_hours.filter((t) => t.day_id == h.id).length !== 0,
            };
        });

        //map to set status of days to open if all days are open
        if (data.length == 1 && data[0].open.day == 0) {
            this.operation_days.forEach((days) => {
                if (days.id != 0) days.status = !this.notFromGoogle;
            });
        }

        //map to have unique id and day id per periods if all week is 24hrs open
        //Fix for NSP-496
        this.operation_days.map((days) => {
            if (days.status && days.periods.length == 0) {
                days.periods.push({
                    id: uuid.v4(),
                    day_id: days.id,
                    open: '12:00 AM',
                    close: '11:59 PM',
                    openingHourData: {
                        hour: 0,
                        minute: 0,
                        second: 0,
                    },
                    closingHourData: {
                        hour: 23,
                        minute: 59,
                        second: 0,
                    },
                });
            }
        });
    }

    private openConfirmationModal(status: string, message: string, data: string, hostId: string): void {
        const dialogRef = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status, message, data },
        });

        dialogRef.afterClosed().subscribe(() => {
            if (!hostId) return;
            const customRoute =
                this.roleRoute == UI_ROLE_DEFINITION_TEXT.dealeradmin
                    ? UI_ROLE_DEFINITION_TEXT.administrator
                    : this.roleRoute;
            this._router.navigate([`/${customRoute}/hosts`, hostId]);
        });
    }

    private setBusinessHoursBeforeSubmitting(data: UI_STORE_HOUR[]) {
        return data.map((operation) => {
            operation.periods = operation.periods.map((period) => {
                const opening = period.openingHourData;
                const closing = period.closingHourData;
                period.open = moment(`${opening.hour} ${opening.minute}`, 'HH:mm').format('hh:mm A');
                period.close = moment(`${closing.hour} ${closing.minute}`, 'HH:mm').format('hh:mm A');

                return period;
            });
            return operation;
        });
    }

    private setOperationDays(): void {
        this.operation_days = this.google_operation_days.map((data) => {
            return {
                id: data.id,
                label: data.label,
                day: data.day,
                periods: [],
                status: data.status,
            };
        });
    }

    private setCanadaZip() {
        if (!this.canadaSelected) return;
        const control = this.newHostFormControls.zip;
        const canadaZip = (control.value as string).trim();

        if (canadaZip.length === 6) {
            const left = canadaZip.substring(0, 3);
            const right = canadaZip.substring(3, 6);
            this.newHostFormControls.zip.patchValue(`${left} ${right}`, { emitEvent: false });
        }
    }

    private setZipCodeValidation() {
        const control = this.newHostFormControls.zip;
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

    private subscribeToContactNumberChanges() {
        const control = this.newHostFormControls.contactNumber;

        control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(300)).subscribe((response: string) => {
            control.patchValue(response.substring(0, 10), { emitEvent: false });
        });
    }

    private subscribeToRegionChanges() {
        const control = this.newHostFormControls.region;

        control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(300)).subscribe((response: string) => {
            control.patchValue(response.substring(0, 2), { emitEvent: false });
        });
    }

    private subscribeToStateChanges() {
        const control = this.newHostFormControls.state;

        control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(300)).subscribe((response: string) => {
            control.patchValue(response.substring(0, 2), { emitEvent: false });
        });
    }

    private subscribeToZipChanges() {
        const control = this.newHostFormControls.zip;
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

    public getContactValue(value: string): void {
        this.newHostFormControls.contactNumber.setValue(value);
    }

    public setContactNumberToInvalid(status: boolean): void {
        this.contactTouchAndInvalid = status;
    }

    public contactCleared(status: boolean): void {
        this.contactIsCleared = status;
    }

    public disableSaveButton(): boolean {
        return (
            this.newHostForm.invalid ||
            this.is_creating_host ||
            !this.dealerHasValue ||
            this.contactTouchAndInvalid ||
            !this.contactIsCleared
        );
    }

    protected get _createFormFields() {
        return [
            {
                label: 'Host Business Name',
                control: 'businessName',
                placeholder: 'Ex. SM Center Pasig',
                col: 'col-lg-12',
                is_required: true,
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
                label: 'Contact Person',
                control: 'contactPerson',
                placeholder: 'Ex. Bob Dylan',
                type: 'string',
                col: 'col-lg-6',
                is_required: false,
            },
            {
                label: 'Contact Number',
                control: 'contactNumber',
                placeholder: 'Ex. 555 555 1234',
                col: 'col-lg-6',
                type: 'tel',
                min: '0',
                is_required: false,
                isComponent: true,
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
                col: 'col-lg-2',
                is_required: true,
            },
            {
                label: 'Region',
                control: 'region',
                placeholder: 'Ex. NW',
                col: 'col-lg-2',
                is_required: true,
            },
            {
                label: 'Zip Code',
                control: 'zip',
                placeholder: 'Ex. 54001',
                col: 'col-lg-4',
                is_required: true,
            },
            {
                label: 'Timezone',
                control: 'timezone',
                placeholder: 'Ex. US/Central',
                col: 'col-lg-4',
                autocomplete: true,
                is_required: true,
            },
        ];
    }

    protected get _googleOperationDays() {
        return [
            {
                id: 1,
                label: 'M',
                day: 'Monday',
                periods: [],
                status: false,
            },
            {
                id: 2,
                label: 'T',
                day: 'Tuesday',
                periods: [],
                status: false,
            },
            {
                id: 3,
                label: 'W',
                day: 'Wednesday',
                periods: [],
                status: false,
            },
            {
                id: 4,
                label: 'Th',
                day: 'Thursday',
                periods: [],
                status: false,
            },
            {
                id: 5,
                label: 'F',
                day: 'Friday',
                periods: [],
                status: false,
            },
            {
                id: 6,
                label: 'St',
                day: 'Saturday',
                periods: [],
                status: false,
            },
            {
                id: 0,
                label: 'Sn',
                day: 'Sunday',
                periods: [],
                status: false,
            },
        ];
    }

    protected get _timezoneAutoComplete(): UI_AUTOCOMPLETE {
        return {
            label: 'Timezone',
            placeholder: 'Select or search for a timezone',
            data: [],
            allowSearchTrigger: false,
        };
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

    public get newHostFormControls() {
        return this.newHostForm.controls;
    }

    protected get roleInfo() {
        return this._auth.current_user_value.roleInfo;
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
