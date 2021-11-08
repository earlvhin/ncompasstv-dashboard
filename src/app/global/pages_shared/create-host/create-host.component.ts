import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { AuthService } from '../../services/auth-service/auth.service';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { HostService } from '../../services/host-service/host.service';
import { CategoryService } from '../../services/category-service/category.service';
import { UI_TABLE_DEALERS } from '../../models/ui_table_dealers.model';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from '../../models/ui_role-definition.model';
import { API_DEALER } from '../../models/api_dealer.model';
import { MapService } from '../../services/map-service/map.service';
import { API_GOOGLE_MAP, GOOGLE_MAP_SEARCH_RESULT } from '../../models/api_google-map.model';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { UI_OPERATION_HOURS, UI_OPERATION_DAYS } from '../../models/ui_operation-hours.model';
import { API_CREATE_HOST } from '../../models/api_create-host.model';
import * as uuid from 'uuid';
import { API_PARENTCATEGORY } from '../../models/api_parentcategory.model';
import { RoleService } from '../../../global/services/role-service/role.service';
import { TitleCasePipe } from '@angular/common';
import { BulkEditBusinessHoursComponent } from '../../components_shared/page_components/bulk-edit-business-hours/bulk-edit-business-hours.component';
import { ImageSelectionModalComponent } from '../../components_shared/page_components/image-selection-modal/image-selection-modal.component';

@Component({
	selector: 'app-create-host',
	templateUrl: './create-host.component.html',
	styleUrls: ['./create-host.component.scss'],
	providers: [TitleCasePipe]
})

export class CreateHostComponent implements OnInit {
	categories_data: API_PARENTCATEGORY[];
	cat_data:  any = [];	
	category_selected: string;
	creating_host: boolean = false;
	current_host_image: string;
	dealer_id: string;
	dealer_name: string;
	dealers_data: Array<any> = [];
	filtered_data:  UI_TABLE_DEALERS[] = [];
	form_invalid: boolean = true;
	google_result: GOOGLE_MAP_SEARCH_RESULT[] = [];
	no_result : boolean = false;
	is_24hours: boolean = false;
	is_current_user_admin = false;
	lat: number = 39.7395247;
	lng: number = -105.1524133;
	location_field: boolean = true;
	location_candidate_fetched: boolean = false;
	location_selected: boolean = false;
	logo_data: { images: string[], logo: string };
	new_host_form: FormGroup;
	google_place_form: FormGroup;
	search_keyword: string = '';
	selected_location: any;
	subscription: Subscription = new Subscription;
	title: string = "Create Host";
	timezone: any;
	is_dealer: boolean = false;
	dealerControl = new FormControl();
	paging: any;
	place_id: string;
	loading_data: boolean = true;
	loading_search: boolean = false;
	is_search: boolean = false;
	no_category: boolean = false;
	host_form_view = [
		{
			label: 'Host Business Name',
			control: 'businessName',
			placeholder: 'Ex. SM Center Pasig',
			col: 'col-lg-6'
		},
		{
			label: 'Category',
			control: 'category',
			placeholder: 'Ex. School',
			col: 'col-lg-6',
			autocomplete: true
		},	
		{
			label: 'Latitude',
			control: 'lat',
			placeholder: 'Ex. 58.933',
			col: 'col-lg-6'
		},
		{
			label: 'Longitude',
			control: 'long',
			placeholder: 'Ex. 58.933',
			col: 'col-lg-6'
		},
		{
			label: 'Address',
			control: 'address',
			placeholder: 'Ex. 21st Drive Fifth Avenue Place',
			col: 'col-lg-6'
		},
		{
			label: 'City',
			control: 'city',
			placeholder: 'Ex. Chicago',
			col: 'col-lg-6'
		},
		{
			label: 'State',
			control: 'state',
			placeholder: 'Ex. IL',
			col: 'col-lg-4'
		},
		{
			label: 'Zip Code',
			control: 'zip',
			placeholder: 'Ex. 54001',
			col: 'col-lg-4'
		},
		{
			label: 'Timezone',
			control: 'timezone',
			placeholder: 'Ex. US/Central',
			col: 'col-lg-4',
			autocomplete: true,
		}
	]

	operation_hours: UI_OPERATION_HOURS[];
	operation_days: UI_OPERATION_DAYS[];

	google_operation_days = [
		{
			id: 1,
			label: 'M',
			day: 'Monday',
			preiods: [],
			status: false,
		},
		{
			id: 2,
			label: 'T',
			day: 'Tuesday',
			preiods: [],
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
		}
	];

	protected default_host_image = 'assets/media-files/admin-icon.png';

	constructor(
		private _auth: AuthService,
		private _categories: CategoryService,
		private _form: FormBuilder,
		private _host: HostService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _map: MapService,
		private _router: Router,
		private _role: RoleService,
		private _titlecase: TitleCasePipe
	) { }

	ngOnInit() {

		this.is_current_user_admin = this.currentRole === 'administrator';
		
		this.new_host_form = this._form.group(
			{
				dealerId: ['', Validators.required],
				businessName: ['', Validators.required],
				address: ['', Validators.required],
				city: ['', Validators.required],
				state: ['', Validators.required],
				zip: ['', Validators.required],
				category: ['', Validators.required],
				long: ['', Validators.required],
				lat: ['', Validators.required],
				timezone: ['', Validators.required],
				createdBy: this._auth.current_user_value.user_id
			}
		);

		this.current_host_image = this.default_host_image;

		this.getDealers(1);

		this.subscription.add(
			this.new_host_form.valueChanges.subscribe(
				data => {
					if (this.new_host_form.valid) {
						this.form_invalid = false;
					} else {
						this.form_invalid = true;
					}
				}
			)
		)

		this.google_place_form = this._form.group(
			{
				location: ['', Validators.required]
			}
		)

		this.subscription.add(
			this.google_place_form.valueChanges.subscribe(
				data => {
					if (this.google_place_form.valid) {
						this.location_field = false;
					} else {
						this.location_field = true;
						this.location_candidate_fetched = false;
					}
				}
			)
		);

		this.operation_days = this.google_operation_days.map(
			h => {
				return new UI_OPERATION_DAYS(
					h.id,
					h.label,
					h.day,
					[],
					h.status
				)
			}
		);
		
		this.subscription.add(
			this._categories.get_parent_categories().subscribe(
				data => {
					data.map(
						category => {
							category.categoryName = this._titlecase.transform(category.categoryName);
						}
					)
					this.categories_data = data;
				}
			)
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

		// Timezone
		this.subscription.add(
			this._host.get_time_zones().subscribe(
				data => {
					this.timezone = data;
				}
			)
		);

		this.watchCategoryField();
	}

	searchData(e) {
		console.log("E")
		this.loading_search = true;
		this.subscription.add(
			this._dealer.get_search_dealer(e).subscribe(
				data => {
					if (data.paging.entities.length > 0) {
						this.dealers_data = data.paging.entities;
						this.loading_search = false;
					} else {
						this.dealers_data = [];
						this.loading_search = false;
						// this.getDealers(1);
					}
					console.log("DEALERS DATA SEARCHED", this.dealers_data)
					this.paging = data.paging;
				}
			)
		)
	}

	getDealers(e) {
		if(e > 1) {
			this.loading_data = true;
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, "").subscribe(
					data => {
						data.dealers.map (
							i => {
								this.dealers_data.push(i)
							}
						)
						this.paging = data.paging
						this.loading_data = false;
					}
				)
			)
		} else {
			if(this.is_search) {
				this.loading_search = true;
			}
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, "").subscribe(
					data => {
						this.dealers_data = data.dealers;
						this.paging = data.paging
						this.loading_data = false;
						this.loading_search = false;
					}
				)
			)
		}
	}

	searchBoxTrigger (event) {
		console.log("EVENT", event)
		this.is_search = event.is_search;
		this.getDealers(event.page);
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	// Convenience getter for easy access to form fields
	get f() { return this.new_host_form.controls; }

	get g() { return this.google_place_form.controls; }

	filterData(data) {
		this.filtered_data = data;
	}

	setTimezone(e) {
		this.f.timezone.setValue(e);
	}

	googleMap() {
		this.no_result = false;
		this.google_result = [];
		this.location_candidate_fetched = true;
		this.location_selected = false;

		this.subscription.add(
			this._map.get_google_location_info(this.g.location.value).subscribe(
				(data: API_GOOGLE_MAP['google_search']) => {

					if (data.length <= 0) {
						this.no_result = true;
						return;
					}

					this.google_result = data;
					
				}
			)
		);
	}

	mapOperationHours(data) {
		let count = 0;
		this.operation_hours = data.map(
			h => {
				return new UI_OPERATION_HOURS(
					uuid.v4(),
					h.open.day,
					h.open ? this.formatTime(h.open.time) : '',
					h.close ? this.formatTime(h.close.time) : '',
				)
			}
		)
		
		
		this.operation_days = this.google_operation_days.map(
			h => {
				return new UI_OPERATION_DAYS(
					h.id,
					h.label,
					h.day,
					this.operation_hours.filter(t => t.day_id == h.id),
					this.operation_hours.filter(t => t.day_id == h.id).length != 0 ? true : false
				)
			}
		)
	}

	formatTime(data): string {
		let time = new Date(`January 1, 1990 ${data.slice(0,2)}:${data.slice(2,4)}`);
		let options = { hour: 'numeric', minute: 'numeric', hour12: true } as Intl.DateTimeFormatOptions;
		return time.toLocaleString('en-US', options);
	}


	plotToMap(data: GOOGLE_MAP_SEARCH_RESULT) {
		let sliced_address = data.result.formatted_address.split(', ')
		let state = data.result.formatted_address.substring(data.result.formatted_address.lastIndexOf(',')+1)
		let category_one = data.result.types[0];
		this.place_id = data.result.place_id;
		this.current_host_image = this.default_host_image;
		this.location_selected = true;
		this.location_candidate_fetched = false;
		this.selected_location = data.result;
		this.f.businessName.setValue(data.result.name);
		this.f.lat.setValue(data.result.geometry.location.lat);
		this.f.long.setValue(data.result.geometry.location.lng);
		this.setToCategory(category_one);

		if (!state.includes("Canada")) {
			let state_zip = sliced_address[2].split(' ');
			this.f.address.setValue(sliced_address[0]);
			this.f.city.setValue(sliced_address[1]);
			this.f.state.setValue(state_zip[0]);
			this.f.zip.setValue(state_zip[1]);
		} else {
			if (sliced_address.length == 4) {
				let state_zip = sliced_address[2].split(' ');
				this.f.address.setValue(sliced_address[0]);
				this.f.city.setValue(sliced_address[1]);
				this.f.state.setValue(state_zip[0]);
				this.f.zip.setValue(`${state_zip[1]} ${state_zip[2]}`);
			} if (sliced_address.length == 5) {
				let state_zip = sliced_address[3].split(' ');
				this.f.address.setValue(`${sliced_address[0]} ${sliced_address[1]}`);
				this.f.city.setValue(sliced_address[2]);
				this.f.state.setValue(state_zip[0]);
				this.f.zip.setValue(`${state_zip[1]} ${state_zip[2]}`);
			}
		}

		if (data.result.opening_hours) {
			this.mapOperationHours(data.result.opening_hours.periods);
		}
	}
	
	newHostPlace() {
		const newHostPlace = new API_CREATE_HOST(
			this.f.dealerId.value,
			this.f.businessName.value,
			this._auth.current_user_value.user_id,
			this.f.lat.value,
			this.f.long.value,
			this.f.address.value,
			this.f.city.value,
			this.f.state.value,
			this.f.zip.value,
			JSON.stringify(this.operation_days), 
			this.f.category.value,
			this.f.timezone.value,
			this.logo_data.logo,
			this.logo_data.images,
		);

		this.creating_host = true;

		if (this.creating_host = true) {
			this.subscription.add(
				this._host.add_host_place(newHostPlace).subscribe(
					(data: any) => {
						this.confirmationModal('success', 'Host Place Created!', 'Hurray! You successfully created a Host Place', data.hostId);
					}, error => {
						this.creating_host = false;
						this.confirmationModal('error', 'Host Place Creation Failed', 'Sorry, There\'s an error with your submission', null);
					}
				)
			)
		}
	}

	setToDealer(e) {
		this.f.dealerId.setValue(e);
	}

	confirmationModal(status, message, data, hostid): void {
		let dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data
			}
		})

		dialogRef.afterClosed().subscribe(result => {
			if (hostid) {
				const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
				this._router.navigate([`/${route}/hosts/`, hostid]);
			}
		});
	}

	operationDays(data) {
		data.periods.length = 0;
		const hours = {
			id: uuid.v4(),
			day_id: data.id,
			open: '',
			close: '',
		}
		data.status = !data.status;
		data.periods.push(hours)
	}

	addHours(data) {
		const hours = {
			id: uuid.v4(),
			day_id: data.id,
			open: '',
			close: '',
		}
		data.periods.push(hours)
	}

	removeHours(data, i) {
		data.periods.splice(i, 1);
	}


	setToCategory(e) {
		let category = this.categories_data.filter(
			(i: any) => {
				return e == i.slug;
			}
		)[0];

		// If it does, then it will set the Display Field and the Value Field.
		// if (category) {
		// 	console.log('yes', category, this._titlecase.transform(e).replace(/_/g, " "))
		// 	this.category_selected = this._titlecase.transform(category.categoryName);
		// 	this.f.category.setValue(category.categoryName);
		// } else {
		// }

		this.no_category = true;
		this.f.category.setValue(this._titlecase.transform(e).replace(/_/g, " "));
	}

	watchCategoryField() {
		this.f.category.valueChanges.subscribe(
			data => {
				if (data === '') {
					this.no_category = false;
				}
			}
		)
	}

	onBulkAddHours(): void {
		const dialog = this._dialog.open(BulkEditBusinessHoursComponent, {
			width: '550px',
			height: '450px',
			panelClass: 'position-relative',
			data: { },
			autoFocus: false
		});

		dialog.afterClosed().subscribe(
			response => {
				if (response) this.operation_days = response
			},
			error => console.log('Error on closing bulk edit hours', error)
		);
		
	}

	onChoosePhotos() {

		const config: MatDialogConfig = {
			width: '700px',
			disableClose: true,
		};
		
		const dialog = this._dialog.open(ImageSelectionModalComponent, config);
		dialog.componentInstance.placeId = this.place_id;
		
		dialog.afterClosed()
			.subscribe(
				(response: { images: string[], logo: string } | boolean) => {
					if (!response) return;
					const data = response as { images: string[], logo: string };
					this.logo_data = data;
					this.current_host_image = data.logo;
				}
			);
	}

	protected get currentRole() {
		return this._auth.current_role;
	}
}
