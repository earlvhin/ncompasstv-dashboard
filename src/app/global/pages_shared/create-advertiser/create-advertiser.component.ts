import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { MatDialog } from '@angular/material';
import { AuthService } from '../../services/auth-service/auth.service';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { AdvertiserService } from '../../services/advertiser-service/advertiser.service';
import { CategoryService } from '../../services/category-service/category.service';
import { UI_TABLE_DEALERS } from '../../models/ui_table_dealers.model';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from '../../models/ui_role-definition.model';
import { API_DEALER } from '../../models/api_dealer.model';
import { MapService } from '../../services/map-service/map.service';
import { API_GOOGLE_MAP } from '../../models/api_google-map.model';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { UI_OPERATION_HOURS, UI_OPERATION_DAYS } from '../../models/ui_operation-hours.model';
import { API_CREATE_ADVERTISER } from '../../models/api_create-advertiser.model';
import * as uuid from 'uuid';
import { API_PARENTCATEGORY } from '../../models/api_parentcategory.model';
import { RoleService } from '../../../global/services/role-service/role.service';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-create-advertiser',
  templateUrl: './create-advertiser.component.html',
  styleUrls: ['./create-advertiser.component.scss'],
  providers: [TitleCasePipe]
})

export class CreateAdvertiserComponent implements OnInit {
	categories_data: any;
	cat_data:  any = [];	
	category_selected: string;
	creating_advertiser: boolean = false;
	dealer_id: string;
	dealer_name: string;
	dealers_data: Array<any> = [];
	filtered_data:  UI_TABLE_DEALERS[] = [];
	form_invalid: boolean = true;
	google_result = [];
	is_24hours: boolean = false;
	lat: number = 39.7395247;
	lng: number = -105.1524133;
	location_field: boolean = true;
	location_candidate_fetched: boolean = false;
	location_selected: boolean = false;
	new_advertiser_form: FormGroup;
	google_place_form: FormGroup;
	search_keyword: string = '';
	selected_location: any;
	subscription: Subscription = new Subscription;
	title: string = "Create Advertiser Profile";
	is_dealer: boolean = false;
	dealerControl = new FormControl();
	no_result : boolean = false;
	paging: any;
	loading_data: boolean = true;
	loading_search: boolean = false;
	is_search: boolean = false;
	no_category: boolean = false;
	advertiser_form_view = [
		{
			label: 'Advertiser Business Name',
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
			col: 'col-lg-6'
		},
		{
			label: 'Zip Code',
			control: 'zip',
			placeholder: 'Ex. 54001',
			col: 'col-lg-6'
		}
	]

	constructor(
		private _auth: AuthService,
		private _categories: CategoryService,
		private _form: FormBuilder,
		private _advertiser: AdvertiserService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _map: MapService,
		private _router: Router,
		private _role: RoleService,
		private _titlecase: TitleCasePipe
	) { }

	ngOnInit() {

		this.getDealers(1);

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
		)
		
		this.subscription.add(
			this._categories.get_parent_categories().subscribe(
				data => {
					data.map(
						category => {
							category.categoryName = this._titlecase.transform(category.categoryName);
						}
					)
					this.categories_data = data;
					this.prepareForm();
				}
			)
		)
	}

	prepareForm() {
		this.new_advertiser_form = this._form.group(
			{
				dealerId: ['', Validators.required],
				businessName: ['', Validators.required],
				address: [''],
				city: ['', Validators.required],
				state: ['', Validators.required],
				zip: ['', Validators.required],
				category: ['', Validators.required],
				long: [''],
				lat: [''],
				createdBy: this._auth.current_user_value.user_id
			}
		)

		this.subscription.add(
			this.new_advertiser_form.valueChanges.subscribe(
				data => {
					if (this.new_advertiser_form.valid) {
						this.form_invalid = false;
					} else {
						this.form_invalid = true;
					}
				}
			)
		)
		
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

	searchData(e) {
		this.loading_search = true;
		this.subscription.add(
			this._dealer.get_search_dealer(e).subscribe(
				data => {
					if (data.paging.entities.length > 0) {
						this.dealers_data = data.paging.entities;
						this.loading_search = false;
					} else {
						this.dealers_data = [];
						// this.getDealers(1);
						this.loading_search = false;
					}
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
						data.dealers.map(
							i => {
								this.dealers_data.push(i)
							}
						)
						this.paging = data.paging;
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
						this.paging = data.paging;
						this.loading_data = false;
						this.loading_search = false;
					}
				)
			)
		}
	}

	searchBoxTrigger (event) {
		this.is_search = event.is_search;
		this.getDealers(event.page);		
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	// Convenience getter for easy access to form fields
	get f() { return this.new_advertiser_form.controls; }

	get g() { return this.google_place_form.controls; }

	googleMap() {
		this.no_result = false;
		this.google_result = [];
		this.location_candidate_fetched = true;
		this.location_selected = false;
		this.subscription.add(
			this._map.get_google_location_info(this.g.location.value).subscribe(
				(data: API_GOOGLE_MAP['google_search']) => {
					if(data.length > 0) {
						this.google_result = data;
					} else {
						this.no_result = true;
					}
					
				}
			)
		)
	}

	plotToMap(data: API_GOOGLE_MAP) {
		console.log(data);
		let sliced_address = data.result.formatted_address.split(', ')
		let state = data.result.formatted_address.substring(data.result.formatted_address.lastIndexOf(',')+1)
		let category_one = data.result.types[0];
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
			console.log(sliced_address);
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
	}

	newAdvertiserProfile() {
		const newAdvertiserProfile = new API_CREATE_ADVERTISER(
			this.f.dealerId.value,
			this.f.businessName.value,
			this._auth.current_user_value.user_id,
			this.f.lat.value,
			this.f.long.value,
			this.f.address.value,
			this.f.city.value,
			this.f.state.value,
			this.f.zip.value,
			this.f.category.value
		)

		this.creating_advertiser = true;

		if (this.creating_advertiser) {
			this.subscription.add(
				this._advertiser.add_advertiser_profile(newAdvertiserProfile).subscribe(
					(data: any) => {
						this.confirmationModal('success', 'Advertiser Profile Created!', 'Hurray! You successfully created an Advertiser Profile', data.id);
					}, 
					error => {
						this.creating_advertiser = false;
						this.confirmationModal('error', 'Advertiser Profile Creation Failed', 'Sorry, There\'s an error with your submission', null);
					}
				)
			)
		}
	}

	setToDealer(e) {
		this.f.dealerId.setValue(e);
	}

	confirmationModal(status, message, data, id): void {
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
			if (id) {
				const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
				this._router.navigate([`/${route}/advertisers/`, id]);
			}
		});
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
		console.log('no', this._titlecase.transform(e).replace(/_/g, " "))
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
}

