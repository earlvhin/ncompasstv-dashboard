import { Component, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Router } from '@angular/router';
import { Subscription, Subject, forkJoin, ObservableInput } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
	MapService
} from 'src/app/global/services';

import {
	API_DEALER,
	API_CREATE_ADVERTISER,
	API_GOOGLE_MAP,
	API_PARENT_CATEGORY,
	City,
	PAGING,
	UI_ROLE_DEFINITION,
	UI_TABLE_DEALERS
} from 'src/app/global/models';

@Component({
	selector: 'app-create-advertiser',
	templateUrl: './create-advertiser.component.html',
	styleUrls: ['./create-advertiser.component.scss'],
	providers: [TitleCasePipe]
})
export class CreateAdvertiserComponent implements OnInit {
	categories_data: any;
	// cat_data: any = [];
	// category_selected: string;
	// creating_advertiser: boolean = false;
	city_loaded = false;
	city_state: City[] = [];
	canada_selected: boolean = false;
	city_selected: string;
	gen_categories_data: any[];
	category_selected: string;
	child_category: string;
	current_host_image: string;
	dealer_id: string;
	dealer_name: string;
	dealers_data: Array<any> = [];
	filtered_data: UI_TABLE_DEALERS[] = [];
	form_invalid: boolean = true;
	google_place_form: FormGroup;
	google_result: any;
	is_creating_advertiser: boolean = false;
	is_dealer: boolean = false;
	is_page_ready = false;
	// is_24hours: boolean = false;
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
	selected_location: any;
	subscription: Subscription = new Subscription();
	title: string = 'Create Advertiser Profile';

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
		private _titlecase: TitleCasePipe
	) {}

	ngOnInit() {
		this.getDealers(1);
		this.current_host_image = this.default_host_image;
		this.initializeCreateAdvertiserForm();
		this.initializeGooglePlaceForm();
		this.loadInitialData();
		this.getCities();

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

	protected get _createFormFields() {
		return [
			{
				label: 'Advertiser Name',
				control: 'businessName',
				placeholder: 'Ex. SM Center Pasig',
				col: 'col-lg-12'
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
				col: 'col-lg-3',
				is_required: true
			},
			{
				label: 'Region',
				control: 'region',
				placeholder: 'Ex. NW',
				col: 'col-lg-3',
				is_required: true
			},
			{
				label: 'Zip Code',
				control: 'zip',
				placeholder: 'Ex. 54001',
				col: 'col-lg-6',
				is_required: true
			}
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
			createdBy: this._auth.current_user_value.user_id
		});

		this.subscription.add(
			this.new_advertiser_form.valueChanges.subscribe((data) => {
				if (this.new_advertiser_form.valid) {
					this.form_invalid = false;
				} else {
					this.form_invalid = true;
				}
			})
		);

		// for dealer_users auto fill
		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
			this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
			this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
			this.setToDealer(this.dealer_id);
		}

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
			this._dealer.get_dealers_with_page(1, '').pipe(takeUntil(this._unsubscribe))
		];

		forkJoin(requests)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				([generalCategories, getCategories, getDealers, getTimeZones]) => {
					const categories = generalCategories;
					const genCategories = getCategories;
					const dealersData = getDealers as { dealers: API_DEALER[]; paging: PAGING };

					this.categories_data = categories.map((category) => {
						category.categoryName = this._titlecase.transform(category.categoryName);
						return category;
					});

					this.gen_categories_data = genCategories.map((category) => {
						category.generalCategory = this._titlecase.transform(category.generalCategory);
						return category;
					});

					this.city_loaded = true;
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

	setCity(data): void {
		if (!this.canada_selected) {
			this.newAdvertiserFormControls.city.setValue(data);
			this._location
				.get_states_regions(data.substr(data.indexOf(',') + 2))
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						this.newAdvertiserFormControls.state.setValue(data[0].abbreviation);
						this.newAdvertiserFormControls.region.setValue(data[0].region);
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

			this.newAdvertiserFormControls.city.setValue(data);
			this.newAdvertiserFormControls.state.setValue(filtered_data[0].state);
			this.newAdvertiserFormControls.region.setValue(filtered_data[0].region);
		}
	}

	getCities() {
		this._location
			.get_cities()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response: any) => {
				this.city_state = response.map((city) => {
					return new City(city.city, `${city.city}, ${city.state}`, city.state);
				});
			});
	}

	getCanadaCities() {
		this._location
			.get_canada_cities()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response: any) => {
				this.city_state = response.map((city) => {
					return new City(city.city, `${city.city}, ${city.state_whole}`, city.state, city.region, city.state_whole);
				});
			});
	}

	searchData(e) {
		this.loading_search = true;
		this.subscription.add(
			this._dealer.get_search_dealer(e).subscribe((data) => {
				if (data.paging.entities.length > 0) {
					this.dealers_data = data.paging.entities;
					this.loading_search = false;
				} else {
					this.dealers_data = [];
					// this.getDealers(1);
					this.loading_search = false;
				}
				this.paging = data.paging;
			})
		);
	}

	getDealers(e) {
		if (e > 1) {
			this.loading_data = true;
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
					data.dealers.map((i) => {
						this.dealers_data.push(i);
					});
					this.paging = data.paging;
					this.loading_data = false;
				})
			);
		} else {
			if (this.is_search) {
				this.loading_search = true;
			}
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
					this.dealers_data = data.dealers;
					this.paging = data.paging;
					this.loading_data = false;
					this.loading_search = false;
				})
			);
		}
	}

	searchBoxTrigger(event) {
		this.is_search = event.is_search;
		this.getDealers(event.page);
	}

	// Convenience getter for easy access to form fields
	get f() {
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
					throw new Error(error);
				}
			);
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
		this.selected_location = data;
		this.newAdvertiserFormControls.businessName.setValue(data.title);
		this.newAdvertiserFormControls.lat.setValue(data.latitude);
		this.newAdvertiserFormControls.long.setValue(data.longitude);

		// ADDRESS MAPPING

		if (state.includes('Canada')) {
			let state_zip = sliced_address[2].split(' ');
			this.newAdvertiserFormControls.address.setValue(sliced_address[0]);
			this.fillCityOfHost(state_zip[0], sliced_address[1]);
			this.newAdvertiserFormControls.zip.setValue(`${state_zip[1]}` + ' ' + `${state_zip[2]}`);
		} else {
			if (sliced_address.length == 3) {
				let state_zip = sliced_address[2].split(' ');
				this.newAdvertiserFormControls.address.setValue(`${sliced_address[0]}`);
				this.fillCityOfHost(state_zip[0], sliced_address[1]);
				this.newAdvertiserFormControls.zip.setValue(`${state_zip[1]}`);
			}
			if (sliced_address.length == 4) {
				let state_zip = sliced_address[2].split(' ');
				this.newAdvertiserFormControls.address.setValue(sliced_address[0]);
				this.setCity(sliced_address[1]);
				this.newAdvertiserFormControls.zip.setValue(`${state_zip[1]} ${state_zip[2]}`);
			}
			if (sliced_address.length == 5) {
				let state_zip = sliced_address[3].split(' ');
				this.newAdvertiserFormControls.address.setValue(`${sliced_address[0]} ${sliced_address[1]}`);
				this.setCity(sliced_address[1]);
				this.newAdvertiserFormControls.zip.setValue(`${state_zip[1]} ${state_zip[2]}`);
			}
		}

		this.new_advertiser_form.markAllAsTouched();
		this._helper.onTouchPaginatedAutoCompleteField.next();
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
			this.current_host_image
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
							data.id
						);
					},
					(error) => {
						this.is_creating_advertiser = false;
						this.openConfirmationModal(
							'error',
							'Advertiser Profile Creation Failed',
							"Sorry, There's an error with your submission",
							null
						);
					}
				);
		}
	}

	setToDealer(e) {
		this.f.dealerId.setValue(e);
	}

	getCanadaAddress(value) {
		this.canada_selected = value.checked;
		this.clearAddressValue();
		if (value.checked) {
			this.getCanadaCities();
		} else {
			this.getCities();
		}
	}

	clearAddressValue() {
		this.newAdvertiserFormControls.address.setValue('');
		this.city_selected = '';
		this.newAdvertiserFormControls.city.setValue('');
		this.newAdvertiserFormControls.state.setValue('');
		this.newAdvertiserFormControls.region.setValue('');
		this.newAdvertiserFormControls.zip.setValue('');
	}

	private openConfirmationModal(status: string, message: string, data: any, id: string): void {
		let dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data
			}
		});

		dialogRef.afterClosed().subscribe(() => {
			if (!id) return;
			this._router.navigate([`/${this.roleRoute}/advertisers/`, id]);
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
				if (!data.message) {
					this.setToGeneralCategory(data.category.generalCategory);
				} else {
					this.setToGeneralCategory('Others');
				}
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
			this.city_selected = data;
		});
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
