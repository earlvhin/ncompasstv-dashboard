import { Component, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Router } from '@angular/router';
import { forkJoin, ObservableInput, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as uuid from 'uuid';
import * as moment from 'moment';

import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { BulkEditBusinessHoursComponent } from '../../components_shared/page_components/bulk-edit-business-hours/bulk-edit-business-hours.component';
import { ImageSelectionModalComponent } from '../../components_shared/page_components/image-selection-modal/image-selection-modal.component';

import {
	API_CREATE_HOST,
	API_DEALER,
	API_GOOGLE_MAP,
	API_PARENT_CATEGORY,
	GOOGLE_MAP_SEARCH_RESULT,
	PAGING,
	UI_OPERATION_DAYS,
	API_TIMEZONE,
	UI_STORE_HOUR,
	UI_STORE_HOUR_PERIOD,
    City, State
} from 'src/app/global/models';

import { AuthService, DealerService, FastEdgeService, CategoryService, HelperService, HostService, MapService, LocationService } from 'src/app/global/services';

@Component({
	selector: 'app-create-host',
	templateUrl: './create-host.component.html',
	styleUrls: ['./create-host.component.scss'],
	providers: [TitleCasePipe]
})
export class CreateHostComponent implements OnInit {
	categories_data: API_PARENT_CATEGORY[];
    city_loaded = false;
    city_state: City[] = [];
    canada_selected: boolean = false;
    city_selected: string;
	gen_categories_data: any[];
	category_selected: string;
	child_category: string;
	current_host_image: string;
	dealers_data: API_DEALER[] = [];
	dealer_name: string;
	form_invalid = true;
	google_operation_days = this._googleOperationDays;
	google_place_form: FormGroup;
	google_result: any;
	is_always_open = false;
	is_admin = this.isAdmin;
	is_creating_host = false;
	is_dealer = this.isDealer;
	is_loading_categories = true;
	is_page_ready = false;
	lat = 39.7395247;
	lng = -105.1524133;
	loading_data = true;
	loading_search = false;
	location_field = true;
	location_candidate_fetched = false;
	location_selected = false;
	new_host_form: FormGroup;
	new_host_form_fields = this._createFormFields;
	no_category = false;
	no_category2 = false;
	no_result = false;
	operation_days: UI_STORE_HOUR[];
	paging: PAGING;
	place_id: string;
	selected_location: any;
	timezone: API_TIMEZONE[];
	title = 'Create Host Place';

	private dealer_id: string;
	private logo_data: { images: string[]; logo: string };
	private is_search = false;
	private operation_hours: UI_STORE_HOUR_PERIOD[];
	protected default_host_image = 'assets/media-files/admin-icon.png';
	protected _unsubscribe = new Subject<void>();

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
        private _location: LocationService
	) {}

	ngOnInit() {
		this.current_host_image = this.default_host_image;
		this.initializeCreateHostForm();
		this.initializeGooglePlaceForm();
		this.loadInitialData();
        this.getCities();
		this.setOperationDays();

		if (this.isDealer || this.isSubDealer) {
			this.dealer_id = this.roleInfo.dealerId;
			this.dealer_name = this.roleInfo.businessName;
			this.setToDealer(this.dealer_id);
		}

		this.watchCategoryField();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	addHours(data: UI_OPERATION_DAYS) {
		const hours = {
			id: uuid.v4(),
			day_id: data.id,
			open: '',
			close: ''
		};

		data.periods.push(hours);
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

	onBulkAddHours(): void {
		const dialog = this._dialog.open(BulkEditBusinessHoursComponent, {
			width: '550px',
			height: '450px',
			panelClass: 'position-relative',
			data: {},
			autoFocus: false
		});

		dialog.afterClosed()
			.subscribe(
				(response: UI_STORE_HOUR[]) => {
					if (!response) return;
					this.operation_days = response;

				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	onChoosePhotos() {
		const config: MatDialogConfig = {
			width: '700px',
			disableClose: true
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

	onCreateHostPlace() {
		this.operation_days.map((data) => {
			if (data.status && data.periods.length > 0) {
				data.periods.map((period) => {
					if (period.open != '' && period.close == '') {
						this.form_invalid = true;
					} else if (period.close != '' && period.open == '') {
						this.form_invalid = true;
					} else {
						this.form_invalid = false;
					}
				});
			}
		});

		if (this.form_invalid) {
			this.openWarningModal(
				'error',
				'Failed to create host',
				'Kindly verify that all business hours opening should have closing time.',
				null,
				null
			);
			return;
		}

		const businessHours = this.setBusinessHoursBeforeSubmitting(this.operation_days);

		const newHostPlace = new API_CREATE_HOST(
			this.newHostFormControls.dealerId.value,
			this.newHostFormControls.businessName.value,
			this._auth.current_user_value.user_id,
			this.newHostFormControls.lat.value,
			this.newHostFormControls.long.value,
			this.newHostFormControls.address.value,
			this.newHostFormControls.city.value,
			this.newHostFormControls.state.value,
			this.newHostFormControls.region.value,
			this.newHostFormControls.zip.value,
			JSON.stringify(this.operation_days),
			this.newHostFormControls.category.value,
			this.newHostFormControls.timezone.value,
			this.current_host_image
		);

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
						this.openConfirmationModal('success', 'Host Place Created!', 'Hurray! You successfully created a Host Place', data.hostId);
					},
					(error) => {
						this.is_creating_host = false;
						this.openConfirmationModal('error', 'Host Place Creation Failed', 'An error occured while saving your data', null);
					}
				);
		}
	}

	onSearchBusiness() {
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
					throw new Error(error);
				}
			);
	}

	onSelectDay(data: UI_STORE_HOUR) {
		data.periods.length = 0;

		const defaultHours = { opening: '12:00 AM', closing: '11:59 PM' };
		const openingHour = moment(defaultHours.opening, 'hh:mm A').format('HH:mm').split(':');
		const closingHour = moment(defaultHours.closing, 'hh:mm A').format('HH:mm').split(':');
		const openingHourData = { hour: parseInt(openingHour[0]), minute: parseInt(openingHour[1]), second: 0 };
		const closingHourData = { hour: parseInt(closingHour[0]), minute: parseInt(closingHour[1]), second: 0 };

		const hours = {
			id: uuid.v4(),
			day_id: data.id,
			open: defaultHours.opening,
			close: defaultHours.closing,
			openingHourData,
			closingHourData
		};

		data.status = !data.status;
		data.periods.push(hours);
	}

	openWarningModal(status: string, message: string, data: string, return_msg: string, action: string): void {
		this._dialog.closeAll();

		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data, return_msg, action }
		});

		dialogRef.afterClosed().subscribe(() => (this.form_invalid = false));
	}

	getGeneralCategory(category) {
		this._categories
			.get_category_general(category)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data) => {
				if (!data.message) {
					this.setToGeneralCategory(data.category.generalCategory);
				} else {
					this.setToGeneralCategory('Others');
				}
			});
	}

	getMoreDetailsofBusinessPlace(location) {
		let location_selected = location;
		this._map
			.get_google_store_info(location_selected.placeId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data) => {
				location_selected.opening_hours = data.data.result.opening_hours;
			})
			.add(() => this.plotToMap(location_selected));
	}

	plotToMap(data: any) {
		let sliced_address = data.address.split(', ');
		let state = data.address.substring(data.address.lastIndexOf(','));
		this.getGeneralCategory(data.type);
		this.setToCategory(data.type);
		this.place_id = data.placeId;
		this.current_host_image = data.thumbnail;
		this.location_selected = true;
		this.location_candidate_fetched = false;
		this.selected_location = data.result;
		this.newHostFormControls.businessName.setValue(data.result.name);
		this.newHostFormControls.lat.setValue(data.result.geometry.location.lat);
		this.newHostFormControls.long.setValue(data.result.geometry.location.lng);
        
		// ADDRESS MAPPING

		if (state.includes('Canada')) {
			let state_zip = sliced_address[2].split(' ');
			this.newHostFormControls.address.setValue(sliced_address[0]);
			this.fillCityOfHost(state_zip[0], sliced_address[1]);
			this.newHostFormControls.zip.setValue(`${state_zip[1]}` + ' ' + `${state_zip[2]}`);
		} else {
			if (sliced_address.length == 3) {
				let state_zip = sliced_address[2].split(' ');
				this.newHostFormControls.address.setValue(`${sliced_address[0]}`);
				this.fillCityOfHost(state_zip[0], sliced_address[1]);
				this.newHostFormControls.zip.setValue(`${state_zip[1]}`);
			}
			if (sliced_address.length == 4) {
				let state_zip = sliced_address[2].split(' ');
				this.newHostFormControls.address.setValue(sliced_address[0]);
                this.setCity(sliced_address[1])
				this.newHostFormControls.zip.setValue(`${state_zip[1]} ${state_zip[2]}`);
			}
			if (sliced_address.length == 5) {
				let state_zip = sliced_address[3].split(' ');
				this.newHostFormControls.address.setValue(`${sliced_address[0]} ${sliced_address[1]}`);
				this.setCity(sliced_address[1])
                this.newHostFormControls.zip.setValue(`${state_zip[1]} ${state_zip[2]}`);
			}
		}

        

		if (data.result.opening_hours) {
			this.mapOperationHours(data.result.opening_hours.periods);
		}

		this.new_host_form.markAllAsTouched();
		this._helper.onTouchPaginatedAutoCompleteField.next();
	}

	removeHours(data: UI_OPERATION_DAYS, index: number) {
		data.periods.splice(index, 1);
	}

	setToGeneralCategory(event: string) {
		this.no_category2 = true;
		this.newHostFormControls.category2.setValue(this._titlecase.transform(event).replace(/_/g, ' '));
	}

	setToCategory(event: string) {
		this.no_category = true;
		this.newHostFormControls.category.setValue(this._titlecase.transform(event).replace(/_/g, ' '));
		this.getGeneralCategory(event);
	}

	searchBoxTrigger(event: { is_search: boolean; page: number }) {
		this.is_search = event.is_search;
		this.getDealers(event.page);
	}

	searchDealer(keyword: string) {
		this.loading_search = true;

		this._dealer
			.get_search_dealer(keyword)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					if (data.paging.entities && data.paging.entities.length > 0) this.dealers_data = data.paging.entities;
					else this.dealers_data = [];
					this.paging = data.paging;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => {
				this.loading_search = false;
			});
	}

	setTimezone(data) {
		this.newHostFormControls.timezone.setValue(data);
	}

	setToDealer(id: string) {
		this.newHostFormControls.dealerId.setValue(id);
	}

	private formatTime(data: number): string {
		const parsed = `${data}`;
		let time = new Date(`January 1, 1990 ${parsed.slice(0, 2)}:${parsed.slice(2, 4)}`);
		let options = { hour: 'numeric', minute: 'numeric', hour12: true } as Intl.DateTimeFormatOptions;
		return time.toLocaleString('en-US', options);
	}

	private getDealers(page: number) {
		if (page > 1) {
			this.loading_data = true;

			this._dealer
				.get_dealers_with_page(page, '')
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						this.dealers_data = data.dealers;
						this.paging = data.paging;
						this.loading_data = false;
					},
					(error) => {
						throw new Error(error);
					}
				);
		} else {
			if (this.is_search) this.loading_search = true;

			this._dealer
				.get_dealers_with_page(page, '')
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						this.dealers_data = data.dealers;
						this.paging = data.paging;
						this.loading_data = false;
						this.loading_search = false;
					},
					(error) => {
						throw new Error(error);
					}
				);
		}
	}

	private initializeCreateHostForm() {
		this.new_host_form = this._form.group({
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
			timezone: ['', Validators.required],
			createdBy: this._auth.current_user_value.user_id
		});

		this.new_host_form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
			if (this.new_host_form.valid) {
				this.form_invalid = false;
			} else {
				this.form_invalid = true;
			}
		});
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

					this.categories_data = categories.map((category) => {
						category.categoryName = this._titlecase.transform(category.categoryName);
						return category;
					});

					this.gen_categories_data = genCategories.map((category) => {
						category.generalCategory = this._titlecase.transform(category.generalCategory);
						return category;
					});

                    this.city_loaded = true;
					this.timezone = timezones;
					this.dealers_data = dealersData.dealers;
					this.paging = dealersData.paging;
					this.loading_data = false;
					this.is_page_ready = true;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

    getCities() {
        this._location.get_cities()
			.pipe(
				takeUntil(this._unsubscribe),
			)
			.subscribe((response:any) => {
				this.city_state = response.map((city) => {
                    return new City(city.city, `${city.city}, ${city.state}`, city.state);
                });
			})
    }

    getCanadaCities() {
        this._location.get_canada_cities()
			.pipe(
				takeUntil(this._unsubscribe),
			)
			.subscribe((response:any) => {
				this.city_state = response.map((city) => {
                    return new City(city.city, `${city.city}, ${city.state_whole}`, city.state, city.region, city.state_whole);
                });
			})
    }
    
	setCity(data): void {
		if (!this.canada_selected) {
			this.newHostFormControls.city.setValue(data);
			this._location
				.get_states_regions(data.substr(data.indexOf(',') + 2))
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						this.newHostFormControls.state.setValue(data[0].abbreviation);
						this.newHostFormControls.region.setValue(data[0].region);
					},
					(error) => {
						throw new Error(error);
					}
				);
		} else {
			let sliced_address = data.split(', ');
			let filtered_data = this.city_state.filter((city) => {
				return city.city === sliced_address[0];
			});

			this.newHostFormControls.city.setValue(data);
			this.newHostFormControls.state.setValue(filtered_data[0].state);
			this.newHostFormControls.region.setValue(filtered_data[0].region);
		}
	}

	fillCityOfHost(state, city_add) {
		if (!this.canada_selected) {
			this._location
				.get_states_by_abbreviation(state)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						let city = city_add + ', ' + data[0].state;
						this.setCity(city);
					},
					(error) => {
						throw new Error(error);
					}
				);
		} else {
			let city = this.city_state.filter((canada_city) => canada_city.city === city_add);
			this.setCity(city[0].city_state);
		}
	}

	private mapOperationHours(data: { close: { day: number; time: number }; open: { day: number; time: number } }[]): void {
		this.operation_hours = data.map((hours) => {
			const hour = {
				id: uuid.v4(),
				day_id: hours.open.day,
				open: hours.open ? this.formatTime(hours.open.time) : '',
				close: hours.close ? this.formatTime(hours.close.time) : '',
				openingHourData: null,
				closingHourData: null
			};

			const setHourData = (hour: string) => {
				if (hour.length === 0 || !hour.includes(':')) {
					return {
						hour: 0,
						minute: 0,
						second: 0
					};
				}

				const hourData = moment(hour, 'hh:mm A').format('HH:mm').split(':');
				return { hour: parseInt(hourData[0]), minute: parseInt(hourData[1]), second: 0 };
			};

			hour.openingHourData = setHourData(hour.open);
			hour.closingHourData = setHourData(hour.close);
			return hour;
		});

		this.operation_days = this.google_operation_days.map((h) => {
			return {
				id: h.id,
				label: h.label,
				day: h.day,
				periods: this.operation_hours.filter((t) => t.day_id == h.id),
				status: this.operation_hours.filter((t) => t.day_id == h.id).length !== 0
			};
		});
	}

	private openConfirmationModal(status: string, message: string, data: string, hostId: string): void {
		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});

		dialogRef.afterClosed().subscribe(() => {
			if (!hostId) return;
			this._router.navigate([`/${this.roleRoute}/hosts`, hostId]);
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
				status: data.status
			};
		});
	}

    getCanadaAddress(value) {
        this.canada_selected = value.checked;
        this.clearAddressValue();
        if(value.checked) {
            this.getCanadaCities();
        } else {
            this.getCities();
        }
    }

    clearAddressValue() {
        this.newHostFormControls.address.setValue('');
        this.city_selected = '';
        this.newHostFormControls.city.setValue('');
        this.newHostFormControls.state.setValue('');
        this.newHostFormControls.region.setValue('');
        this.newHostFormControls.zip.setValue('');
    }

	private watchCategoryField() {
		this.newHostFormControls.category.valueChanges.subscribe((data) => {
			if (data === '') this.no_category = false;
		});

		this.newHostFormControls.category2.valueChanges.subscribe((data) => {
			if (data === '') this.no_category2 = false;
		});

        this.newHostFormControls.city.valueChanges.subscribe((data) => {
			this.city_selected = data;
		});
	}

	protected get _createFormFields() {
		return [
			{
				label: 'Host Business Name',
				control: 'businessName',
				placeholder: 'Ex. SM Center Pasig',
				col: 'col-lg-12',
				is_required: true
			},
			{
				label: 'Category',
				control: 'category',
				placeholder: 'Ex. Art School',
				col: 'col-lg-6',
				autocomplete: true,
				is_required: true
			},
			{
				label: 'General Category',
				control: 'category2',
				placeholder: 'Ex. School',
				col: 'col-lg-6',
				autocomplete: true,
				is_required: false
			},
			{
				label: 'Latitude',
				control: 'lat',
				placeholder: 'Ex. 58.933',
				col: 'col-lg-6',
				is_required: true
			},
			{
				label: 'Longitude',
				control: 'long',
				placeholder: 'Ex. 58.933',
				col: 'col-lg-6',
				is_required: true
			},
			{
				label: 'Address',
				control: 'address',
				placeholder: 'Ex. 21st Drive Fifth Avenue Place',
				col: 'col-lg-6',
				is_required: true
			},
			{
				label: 'City',
				control: 'city',
				placeholder: 'Ex. Chicago',
				col: 'col-lg-6',
				is_required: true,
                autocomplete: true
			},
			{
				label: 'State',
				control: 'state',
				placeholder: 'Ex. IL',
				col: 'col-lg-2',
				is_required: true
			},
			{
				label: 'Region',
				control: 'region',
				placeholder: 'Ex. NW',
				col: 'col-lg-2',
				is_required: true
			},
			{
				label: 'Zip Code',
				control: 'zip',
				placeholder: 'Ex. 54001',
				col: 'col-lg-4',
				is_required: true
			},
			{
				label: 'Timezone',
				control: 'timezone',
				placeholder: 'Ex. US/Central',
				col: 'col-lg-4',
				autocomplete: true,
				is_required: true
			}
		];
	}

	protected get _googleOperationDays() {
		return [
			{
				id: 1,
				label: 'M',
				day: 'Monday',
				preiods: [],
				status: false
			},
			{
				id: 2,
				label: 'T',
				day: 'Tuesday',
				preiods: [],
				status: false
			},
			{
				id: 3,
				label: 'W',
				day: 'Wednesday',
				periods: [],
				status: false
			},
			{
				id: 4,
				label: 'Th',
				day: 'Thursday',
				periods: [],
				status: false
			},
			{
				id: 5,
				label: 'F',
				day: 'Friday',
				periods: [],
				status: false
			},
			{
				id: 6,
				label: 'St',
				day: 'Saturday',
				periods: [],
				status: false
			},
			{
				id: 0,
				label: 'Sn',
				day: 'Sunday',
				periods: [],
				status: false
			}
		];
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

	protected get newHostFormControls() {
		return this.new_host_form.controls;
	}

	protected get roleInfo() {
		return this._auth.current_user_value.roleInfo;
	}

	protected get roleRoute() {
		return this._auth.roleRoute;
	}
}
