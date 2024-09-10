import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSlideToggleChange } from '@angular/material';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as uuid from 'uuid';

import {
    API_CONTENT,
    API_DEALER,
    API_PARENT_CATEGORY,
    API_UPDATE_HOST,
    City,
    UI_ROLE_DEFINITION,
    UI_OPERATION_DAYS,
    API_HOST,
    API_TIMEZONE,
    PAGING,
    UI_STORE_HOUR,
    UI_STORE_HOUR_PERIOD,
} from 'src/app/global/models';

import {
    AuthService,
    CategoryService,
    ConfirmationDialogService,
    DealerService,
    HostService,
    LocationService,
} from 'src/app/global/services';

import { BulkEditBusinessHoursComponent } from '../../components_shared/page_components/bulk-edit-business-hours/bulk-edit-business-hours.component';
import * as moment from 'moment';
import { HOST_ACTIVITY_LOGS } from '../../models/api_host_activity_logs.model';

@Component({
    selector: 'app-edit-single-host',
    templateUrl: './edit-single-host.component.html',
    styleUrls: ['./edit-single-host.component.scss'],
    providers: [TitleCasePipe],
})
export class EditSingleHostComponent implements OnInit, OnDestroy {
    business_hours: UI_STORE_HOUR[];
    canada_selected: boolean = false;
    city_state: City[] = [];
    cities_loaded = false;
    city_selected: string;
    categories_loaded = false;
    categories_data: API_PARENT_CATEGORY[];
    category_selected: string;
    closed_without_edit = false;
    canadaSelected: boolean = false;
    contactTouchAndInvalid = false;
    contactIsCleared = true;
    created_by = this.page_data.createdBy[0];
    currentContactValue: string;
    dealer = this.page_data.dealer;
    dealers_data: API_DEALER[] = [];
    dealers_loaded = false;
    is_dealer_change_disabled = true;
    edit_host_form: FormGroup;
    edit_host_form_controls = this._editHostFormControls;
    half_width_fields = this._halfWidthFields;
    has_invalid_schedule = false;
    host = this.page_data.host;
    host_timezone = this.page_data.host.timeZoneData;
    invalid_form_fields: string = null;
    invalid_schedules: UI_STORE_HOUR_PERIOD[] = [];
    is_active_host = this.host.status === 'A';
    is_current_user_admin = this._auth.current_role === 'administrator';
    is_current_user_dealer = this._auth.current_role === 'dealer' || this._auth.current_role === 'sub-dealer';
    is_host_data_ready = false;
    paging: PAGING;
    timezones: API_TIMEZONE[];
    timezones_loaded = false;

    private dealer_id = this.host.dealerId;
    private has_content = false;
    private initial_business_hours: UI_OPERATION_DAYS[] = JSON.parse(this.page_data.host.storeHours);
    protected _unsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public page_data: { host: API_HOST; dealer: API_DEALER; createdBy: any },
        private _auth: AuthService,
        private _categories: CategoryService,
        private _confirmationDialog: ConfirmationDialogService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _dialogRef: MatDialogRef<EditSingleHostComponent>,
        private _form: FormBuilder,
        private _host: HostService,
        private _router: Router,
        private _titlecase: TitleCasePipe,
        private _location: LocationService,
    ) {}

    ngOnInit() {
        this.setDialogData();
        this.fillForm();
        this.subscribeToFormValidation();
        this.checkFormValidity();
        this.getDealers();

        if (this.host.postalCode.length > 5) this.getCanadaAddress({ checked: true }, false);
        else this.getCities();

        this.setZipCodeValidation();
        this.subscribeToZipChanges();
        this.subscribeToRegionChanges();
        this.subscribeToStateChanges();
        this.subscribeToContactNumberChanges();
        this.getHostContents();
        this.getCategories();
        this.getTimezones();
        this.business_hours = this.parseBusinessHours(JSON.parse(this.page_data.host.storeHours));
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    addHours(data: { periods: any[]; id: string }): void {
        const defaultHours = { opening: '9:00 AM', closing: '5:00 PM' };
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

        data.periods.push(hours);

        this.checkBusinessHoursFields();
    }

    changeHostDealer(isEdit: boolean): void {
        if (isEdit) this.addCurrentDealerToList();
        this.closed_without_edit = isEdit;
        this.is_dealer_change_disabled = isEdit;
    }

    checkBusinessHoursFields(): void {
        this.invalid_schedules = [];
        const daysOpen = this.business_hours.filter((schedule) => schedule.status);

        daysOpen.forEach((schedule) => {
            const invalid = schedule.periods.filter(
                (schedule) => !schedule.openingHourData || !schedule.closingHourData,
            )[0];
            if (typeof invalid === 'undefined') return;
            invalid.day = schedule.day;
            this.invalid_schedules.push(invalid);
        });

        if (this.invalid_schedules.length > 0) {
            this.has_invalid_schedule = true;
            return;
        }

        this.has_invalid_schedule = false;
    }

    checkSchedule(day: string) {
        const result = this.invalid_schedules.find((schedule) => schedule.day === day);
        if (typeof result === 'undefined') return 'valid';
        return 'invalid';
    }

    clearAddressValue() {
        this._formControls.address.setValue('');
        this.city_selected = '';
        this._formControls.city.setValue('');
        this._formControls.state.setValue('');
        this._formControls.region.setValue('');
        this._formControls.zip.setValue('');
    }

    fillCityOfHost() {
        this._location
            .get_states_by_abbreviation(this.host.state)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data: any[]) => {
                    let city = '';
                    city = this.host.city.split(',')[0].trim();

                    this._formControls.city.setValue(city);
                    this.city_selected = city;
                    this.setCity(city);
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    getCanadaAddress(value: { checked: boolean }, clearAction = true) {
        this.canada_selected = value.checked;
        if (clearAction) this.clearAddressValue();
        if (value.checked) this.getCanadaCities();
        else this.getCities();
    }

    getCanadaCities() {
        this._location
            .get_canada_cities()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response: any) => {
                this.city_state = response.map((city) => {
                    return new City(
                        city.city,
                        `${city.city}, ${city.state_whole}`,
                        city.state,
                        city.region,
                        city.state_whole,
                    );
                });
            })
            .add(() => (this.cities_loaded = true));
    }

    getCities() {
        this._location
            .get_cities()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response: any) => {
                this.city_state = response.map((city) => {
                    return new City(city.city, `${city.city}, ${city.state}`, city.state);
                });
            })
            .add(() => (this.cities_loaded = true));
    }

    getDealers(event?: { page: number; is_search: boolean; no_keyword: boolean }): void {
        const page = event ? event.page : 1;

        this._dealer
            .get_dealers_with_page(page, '')
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                if (page > 1) this.dealers_data.concat(response.dealers);
                else this.dealers_data = response.dealers;
                this.paging = response.paging;
            })
            .add(() => (this.dealers_loaded = true));
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

    isOpenAllDay(data: UI_STORE_HOUR_PERIOD) {
        const originalCondition = data.open == '' && data.close == '';
        const isOpenAllDay = data.open === '12:00 AM' && data.close === '11:59 PM';
        return originalCondition || isOpenAllDay;
    }

    isOpenButNotAllDay(data: UI_STORE_HOUR_PERIOD) {
        return !this.isOpenAllDay(data);
    }

    onBulkEditHours(): void {
        const dialog = this._dialog.open(BulkEditBusinessHoursComponent, {
            width: '550px',
            height: '450px',
            panelClass: 'position-relative',
            data: {},
            autoFocus: false,
        });

        dialog.afterClosed().subscribe(
            (response) => {
                if (response) this.business_hours = response;
            },
            (error) => {
                console.error(error);
            },
        );
    }

    onDeleteHost(): void {
        let isForceDelete = false;
        const hostId = this.host.hostId;
        let data: any = { message: 'Delete Host', data: 'Are you sure about this?' };

        if (this.has_content) {
            data = {
                message: 'Delete Host & Contents?',
                data: 'Choosing either will proceed with deletion. To cancel press the x above.',
                is_selection: true,
            };
        }

        this._confirmationDialog.warning(data).subscribe(
            (response: boolean | string) => {
                if (typeof response === 'undefined' || !response) return;
                if (this.has_content && response !== 'no') isForceDelete = true;

                this._host
                    .delete_host([hostId], isForceDelete)
                    .pipe(takeUntil(this._unsubscribe))
                    .subscribe(
                        () => {
                            this._dialogRef.close('delete-host');
                            if (!this.is_current_user_admin)
                                this._router.navigate([`/${this.roleRoute}/dealers/${this.dealer_id}`]);
                            else this._router.navigate([`/${this.roleRoute}/hosts`]);
                        },
                        (error) => {
                            console.error(error);
                        },
                    );
            },
            (error) => {
                console.error(error);
            },
        );
    }

    onSelectDealer(id: string) {
        this.edit_host_form.get('dealerId').setValue(id);
    }

    onToggleStatus(event: MatSlideToggleChange) {
        this.is_active_host = event.checked;
    }

    removeHours(data: UI_STORE_HOUR, index: number): void {
        data.periods.splice(index, 1);
        this.checkBusinessHoursFields();
    }

    removeOpenAllDay(businessHourIndex: number, periodIndex: number) {
        this.business_hours[businessHourIndex].periods[periodIndex].openingHourData = {
            hour: 9,
            minute: 0,
            second: 0,
        };
        this.business_hours[businessHourIndex].periods[periodIndex].closingHourData = {
            hour: 17,
            minute: 0,
            second: 0,
        };
        this.business_hours[businessHourIndex].periods[periodIndex].open = '9:00 AM';
        this.business_hours[businessHourIndex].periods[periodIndex].close = '5:00 PM';
        this.has_invalid_schedule = false;
    }

    selectDay(data: { periods: any[]; status: boolean; id: string }): void {
        data.periods.length = 0;

        const defaultHours = { opening: '9:00 AM', closing: '5:00 PM' };
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
    }

    async saveHostData() {
        this.checkBusinessHoursFields();

        let message = 'Are you sure you want to proceed?';
        const status = this.is_active_host ? 'A' : 'I';
        const title = 'Update Host Details';
        const updatedBusinessHours = this.setBusinessHoursBeforeSubmitting(this.business_hours);

        const newHostPlace = new API_UPDATE_HOST({
            hostId: this.host.hostId,
            dealerId: this._formControls.dealerId.value,
            name: this._formControls.businessName.value,
            latitude: this._formControls.lat.value,
            longitude: this._formControls.long.value,
            city: this._formControls.city.value,
            state: this._formControls.state.value,
            postalCode: this._formControls.zip.value,
            region: this._formControls.region.value,
            address: this._formControls.address.value,
            category: this._formControls.category.value,
            storeHours: JSON.stringify(updatedBusinessHours),
            timezone: this._formControls.timezone.value,
            vistarVenueId: this._formControls.vistar_venue_id.value,
            contactNumber: this._formControls.contactNumber.value,
            contactPerson: this._formControls.contactPerson.value,
            status: status,
        });

        const newHostActivityLog = new HOST_ACTIVITY_LOGS(
            this.host.hostId,
            'modify_host',
            this._auth.current_user_value.user_id,
        );

        const { notes, others } = this._formControls;

        if (notes.value && notes.value.trim().length > 0) newHostPlace.notes = notes.value;

        if (others.value && others.value.trim().length > 0) newHostPlace.others = others.value;

        if (this.hasUpdatedBusinessHours) this._host.onUpdateBusinessHours.next(true);

        if (this.host.status !== status)
            message += ` This will ${status === 'A' ? 'activate' : 'deactivate'} the host.`;

        const confirmUpdate = await this._confirmationDialog.warning({ message: title, data: message }).toPromise();

        if (!confirmUpdate) return;

        this._host
            .update_single_host(newHostPlace)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                async () => {
                    const dialogData = {
                        message: 'Host Details Updated!',
                        data: 'Your changes have been saved',
                    };

                    await this._confirmationDialog.success(dialogData).toPromise();
                    this._dialogRef.close(true);
                    this._host.emitActivity();
                },
                (error) => {
                    this._confirmationDialog.error();
                },
            );

        this._host
            .create_host_activity_logs(newHostActivityLog)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    return data;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    searchDealer(keyword: string): void {
        this._dealer
            .get_search_dealer(keyword)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                let searchResults = [];

                if (response.paging.entities.length > 0) {
                    searchResults = response.paging.entities;
                    this.paging = response.paging;
                }

                this.dealers_data = [...searchResults];
            });
    }

    public setCity(data): void {
        const { city, state, region } = data || { city: '', state: '', region: '' };
        this.city_selected = data.city;

        if (this.canadaSelected) {
            this.canada_selected = data.country === 'CA';
            return;
        }

        this._formControls.city.setValue(city);
        this._formControls.state.setValue(state);
        this._formControls.region.setValue(region);
        this.city_selected = data.city;
    }

    public setInitialCity(): void {
        this.city_selected = this.page_data.host.city;

        //Set value to initial city
        this._formControls.city.setValue(this.city_selected);
        this._formControls.state.setValue(this.page_data.host.state);
        this._formControls.region.setValue(this.page_data.host.region);
    }

    setCategory(event: string): void {
        if (!event || event.length <= 0) return;
        event = event.replace(/_/g, ' ');
        this.category_selected = this._titlecase.transform(event);
        this._formControls.category.setValue(event);
    }

    setTimezone(data: string): void {
        this._formControls.timezone.setValue(data);
    }

    setToOpenAllDay(businessHourIndex: number, periodIndex: number) {
        this.business_hours[businessHourIndex].periods[periodIndex].openingHourData = {
            hour: 0,
            minute: 0,
            second: 0,
        };
        this.business_hours[businessHourIndex].periods[periodIndex].closingHourData = {
            hour: 23,
            minute: 59,
            second: 0,
        };
        this.business_hours[businessHourIndex].periods[periodIndex].open = '12:00 AM';
        this.business_hours[businessHourIndex].periods[periodIndex].close = '11:59 PM';
        this.has_invalid_schedule = false;
        this.removeOtherHoursIfSetToTwentyFourHours(this.business_hours[businessHourIndex], periodIndex);
    }

    private removeOtherHoursIfSetToTwentyFourHours(data: UI_STORE_HOUR, index: number) {
        let indexesToRemove = [];
        data.periods.forEach((hours, hoursIndex) => {
            if (hoursIndex !== index) indexesToRemove.push(hoursIndex);
        });
        indexesToRemove.reverse();
        indexesToRemove.forEach((indexToRemove) => {
            this.removeHours(data, indexToRemove);
        });
    }

    private get hasUpdatedBusinessHours(): boolean {
        return JSON.stringify(this.business_hours) !== JSON.stringify(this.initial_business_hours);
    }

    private addCurrentDealerToList(): void {
        const filtered = this.dealers_data.filter((dealer) => dealer.dealerId === this.dealer.dealerId);

        if (filtered.length > 0) return;

        this._dealer
            .get_dealer_by_id(this.dealer.dealerId)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                this.dealers_data.push(response);
            });
    }

    private checkFormValidity() {
        this.invalid_form_fields = null;
        const controls = this.edit_host_form.controls;
        let invalidFields = [];

        for (const name in controls) {
            if (controls[name].invalid) invalidFields.push(`${this._titlecase.transform(name)}`);
        }

        invalidFields = [...new Set(invalidFields)];
        this.invalid_form_fields = invalidFields.join(', ');
    }

    private fillForm(): void {
        const host = this.host;
        this._formControls.dealerId.setValue(host.dealerId, { emitEvent: false });
        this._formControls.businessName.setValue(host.name, { emitEvent: false });
        this._formControls.lat.setValue(host.latitude, { emitEvent: false });
        this._formControls.long.setValue(host.longitude, { emitEvent: false });
        this._formControls.address.setValue(host.address, { emitEvent: false });

        if (host.city.indexOf(',') > -1) {
            this._formControls.city.setValue(host.city, { emitEvent: false });
        } else {
            this.fillCityOfHost();
        }

        this._formControls.state.setValue(host.state, { emitEvent: false });
        this._formControls.zip.setValue(host.postalCode, { emitEvent: false });
        this._formControls.region.setValue(host.region, { emitEvent: false });
        this._formControls.timezone.setValue(this.host_timezone.id, { emitEvent: false });
        this._formControls.notes.setValue(host.notes, { emitEvent: false });
        this._formControls.others.setValue(host.others, { emitEvent: false });
        this._formControls.vistar_venue_id.setValue(host.vistarVenueId, { emitEvent: false });
        this._formControls.contactPerson.setValue(host.contactPerson ? host.contactPerson : '---', {
            emitEvent: false,
        });
        this._formControls.contactNumber.setValue(host.contactNumber ? host.contactNumber : '0000000000', {
            emitEvent: false,
        });
        this.currentContactValue = host.contactNumber;
    }

    private getCategories(): void {
        this._categories
            .get_parent_categories()
            .pipe(
                takeUntil(this._unsubscribe),
                map((response) =>
                    response.map((data) => {
                        data.categoryName = this._titlecase.transform(data.categoryName);
                        return data;
                    }),
                ),
            )
            .subscribe((response) => {
                this.categories_data = response;
            })
            .add(() => (this.categories_loaded = true));
    }

    private getHostContents(): void {
        this._host
            .get_content_by_host_id(this.host.hostId)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response: { contents: API_CONTENT[] }) => {
                    if (response && response.contents && response.contents.length > 0) return (this.has_content = true);
                    this.has_content = false;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private getTimezones(): void {
        this._host
            .get_time_zones()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => (this.timezones = response),
                (e) => {
                    console.error('Error retrieving timezones', e);
                },
            )
            .add(() => (this.timezones_loaded = true));
    }

    private initializeForm(): void {
        const upperCaseAlphabets = '^[A-Z]+$';
        const numbersOnly = '^[0-9]+$';

        this.edit_host_form = this._form.group({
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
                    Validators.max(2),
                    Validators.pattern(upperCaseAlphabets),
                ],
            ],
            zip: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(7)]],
            region: [
                { value: '', disabled: true },
                [
                    Validators.required,
                    Validators.minLength(2),
                    Validators.max(2),
                    Validators.pattern(upperCaseAlphabets),
                ],
            ],
            category: ['', Validators.required],
            long: ['', Validators.required],
            lat: ['', Validators.required],
            timezone: ['', Validators.required],
            vistar_venue_id: [''],
            notes: [''],
            contactPerson: [''],
            contactNumber: ['', [Validators.minLength(10), Validators.maxLength(10), Validators.pattern(numbersOnly)]],
            others: [''],
        });

        this.edit_host_form.markAllAsTouched();
    }

    private parseBusinessHours(data: UI_STORE_HOUR[]) {
        return data.map((operation) => {
            operation.periods = operation.periods.map((period) => {
                const openingHour = period.open.includes(':') ? period.open : '12:00 AM';
                const closingHour = period.close.includes(':') ? period.close : '11:59 PM';
                const openingHourSplit = moment(openingHour, 'hh:mm A').format('HH:mm').split(':');
                const closingHourSplit = moment(closingHour, 'hh:mm A').format('HH:mm').split(':');

                period.openingHourData = {
                    hour: parseInt(openingHourSplit[0]),
                    minute: parseInt(openingHourSplit[1]),
                    second: 0,
                };

                period.closingHourData = {
                    hour: parseInt(closingHourSplit[0]),
                    minute: parseInt(closingHourSplit[1]),
                    second: 0,
                };

                return period;
            });
            return operation;
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

    private setDialogData(): void {
        this.initializeForm();
        this.setCategory(this.host.category);
        this.fillCityOfHost();
    }

    private setZipCodeValidation() {
        const control = this._formControls.zip;
        const country = this.canada_selected ? 'CA' : 'US';
        const numbersOnly = '^[0-9]+$';
        const canadianZipCodePattern = `^[A-Za-z]\\d[A-Za-z] \\d[A-Za-z]\\d$`;
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
    }

    private subscribeToContactNumberChanges() {
        const control = this._formControls.contactNumber;

        control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(300)).subscribe((response: string) => {
            control.patchValue(response.substring(0, 10), { emitEvent: false });
        });
    }

    private subscribeToFormValidation() {
        const form = this.edit_host_form;

        form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            this.checkFormValidity();
        });
    }

    private subscribeToRegionChanges() {
        const control = this._formControls.region;

        control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(300)).subscribe((response: string) => {
            control.patchValue(response.substring(0, 2));
        });
    }

    private subscribeToStateChanges() {
        const control = this._formControls.region;

        control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(300)).subscribe((response: string) => {
            control.patchValue(response.substring(0, 2));
        });
    }

    private subscribeToZipChanges() {
        const control = this._formControls.zip;
        const country = this.canada_selected ? 'CA' : 'US';

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
        this._formControls.contactNumber.setValue(value);
    }

    public setContactNumberToInvalid(status: boolean): void {
        this.contactTouchAndInvalid = status;
    }

    public contactCleared(status: boolean): void {
        this.contactIsCleared = status;
    }

    public disableUpdateButton(): boolean {
        return (
            this.has_invalid_schedule ||
            this.edit_host_form.invalid ||
            this.contactTouchAndInvalid ||
            !this.contactIsCleared
        );
    }

    protected get _businessHours(): UI_OPERATION_DAYS[] {
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

    protected get _halfWidthFields() {
        const controls = Array.from(this._editHostFormControls);

        const FIELD_CONTROL_NAMES = ['lat', 'long', 'zip', 'region'];

        return controls
            .filter((formControl) => FIELD_CONTROL_NAMES.includes(formControl.control))
            .map((formControl) => formControl.control);
    }

    protected get _editHostFormControls() {
        return [
            {
                label: 'Host Business Name',
                control: 'businessName',
                placeholder: 'Ex. SM Center Pasig',
                type: 'text',
                col: 'col-lg-6',
            },
            {
                label: 'Category',
                control: 'category',
                placeholder: 'Ex. School',
                col: 'col-lg-6',
                type: 'autocomplete',
            },
            {
                label: 'Contact Person',
                control: 'contactPerson',
                placeholder: 'Ex. Bob Dylan',
                col: 'col-lg-6',
            },
            {
                label: 'Contact Number',
                control: 'contactNumber',
                placeholder: 'Ex. 555 555 1234',
                col: 'col-lg-6',
            },
            {
                label: 'Latitude',
                control: 'lat',
                placeholder: 'Ex. 58.933',
                type: 'number',
                col: 'col-lg-6',
            },
            {
                label: 'Longitude',
                control: 'long',
                placeholder: 'Ex. 58.933',
                type: 'number',
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
                type: 'text',
                col: 'col-lg-5',
            },
            {
                label: 'City',
                control: 'city',
                placeholder: 'Ex. Chicago',
                col: 'col-lg-4',
                type: 'autocomplete',
            },
            {
                label: 'State',
                control: 'state',
                placeholder: 'Ex. IL',
                col: 'col-lg-1',
                type: 'text',
                disabled: true,
            },
            {
                label: 'Region',
                control: 'region',
                placeholder: 'Ex. SW',
                type: 'text',
                col: 'col-lg-2',
            },
            {
                label: 'Zip Code',
                control: 'zip',
                placeholder: 'Ex. 54001',
                type: 'text',
                col: 'col-lg-3',
            },
            {
                label: 'Timezone',
                control: 'timezone',
                placeholder: 'Ex. US/Central',
                col: 'col-lg-3',
                type: 'autocomplete',
            },
            {
                label: 'Vistar Venue ID',
                control: 'vistar_venue_id',
                placeholder: 'Ex. Venue ID for Vistar',
                type: 'text',
                col: 'col-lg-6',
            },
            {
                label: 'Notes',
                control: 'notes',
                placeholder: 'Enter your notes here...',
                type: 'textarea',
                col: 'col-lg-6',
            },
            {
                label: 'Others',
                control: 'others',
                placeholder: 'Enter your others here...',
                type: 'textarea',
                col: 'col-lg-6',
            },
        ];
    }

    protected get _formControls() {
        return this.edit_host_form.controls;
    }

    protected get currentUser() {
        return this._auth.current_user_value;
    }

    protected get isCurrentUserDealer() {
        return this.currentUser.role_id === UI_ROLE_DEFINITION.dealer;
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
