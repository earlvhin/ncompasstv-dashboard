import { Component, OnInit, Inject } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../services/auth-service/auth.service';
import { AdvertiserService } from '../../services/advertiser-service/advertiser.service';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { API_DEALER } from '../../models/api_dealer.model';
import { API_UPDATE_ADVERTISER } from '../../models/api_update-advertiser.model';
import { API_PARENTCATEGORY } from '../../models/api_parentcategory.model';
import { CategoryService } from '../../services/category-service/category.service';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { API_ADVERTISER } from '../../models';

@Component({
	selector: 'app-edit-single-advertiser',
	templateUrl: './edit-single-advertiser.component.html',
	styleUrls: ['./edit-single-advertiser.component.scss'],
	providers: [TitleCasePipe]
})
export class EditSingleAdvertiserComponent implements OnInit {
	categories_data: API_PARENTCATEGORY[];
	cat_data: any = [];
	subscription: Subscription = new Subscription();
	dealer_name: string;
	initial_dealer: string;
	is_dealer: boolean = false;
	disable_business_name: boolean = true;
	category_selected: string;
	new_advertiser_form: FormGroup;
	advertiser_id: string;
	dealers_data: API_DEALER[] = [];
	current_dealer: any;
	paging: any;
	closed_without_edit: boolean = false;
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
			col: 'col-lg-12'
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
			label: 'Region',
			control: 'region',
			placeholder: 'Ex. SW',
			col: 'col-lg-6'
		},
		{
			label: 'Zip Code',
			control: 'zip',
			placeholder: 'Ex. 54001',
			col: 'col-lg-6'
		}
	];

	constructor(
		@Inject(MAT_DIALOG_DATA) public _advertiser_data: any,
		private _advertiser: AdvertiserService,
		private _form: FormBuilder,
		private _titlecase: TitleCasePipe,
		private _dealer: DealerService,
		private _categories: CategoryService,
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _router: Router
	) {}

	ngOnInit() {
		if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
		}

		this.new_advertiser_form = this._form.group({
			dealerId: ['', Validators.required],
			businessName: ['', Validators.required],
			address: ['', Validators.required],
			city: ['', Validators.required],
			state: ['', Validators.required],
			zip: ['', Validators.required],
			region: ['', Validators.required],
			category: ['', Validators.required],
			long: ['', Validators.required],
			lat: ['', Validators.required]
		});

		this.getDealers(1);
		this.getAdvertiserData(this._advertiser_data);

		this.subscription.add(
			this._categories.get_parent_categories().subscribe((data) => {
				data.map((category) => {
					category.categoryName = this._titlecase.transform(category.categoryName);
				});

				this.categories_data = data;
			})
		);
	}

	get f() {
		return this.new_advertiser_form.controls;
	}

	getAdvertiserData(id) {
		this.subscription.add(
			this._advertiser.get_advertiser_by_id(id).subscribe(
				(response) => this.fillForm(response.advertiser),
				(error) => {
					throw new Error(error);
				}
			)
		);
	}

	getDealers(e) {
		if (e > 1) {
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
					data.dealers.map((i) => {
						this.dealers_data.push(i);
					});
					this.paging = data.paging;
				})
			);
		} else {
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, '').subscribe((data) => {
					this.dealers_data = data.dealers;
					this.paging = data.paging;
				})
			);
		}
	}

	fillForm(data: API_ADVERTISER) {
		this.f.businessName.setValue(data.name);
		this.f.lat.setValue(data.latitude);
		this.f.long.setValue(data.longitude);
		this.f.address.setValue(data.address);
		this.f.city.setValue(data.city);
		this.f.state.setValue(data.state);
		this.f.zip.setValue(data.postalCode);
		this.f.region.setValue(data.region);
		this.setToCategory(data.category);
		this.setDealer(data.dealerId);

		this.initial_dealer = data.dealerId;
	}

	newAdvertiserProfile() {
		const newAdvertiserProfile = new API_UPDATE_ADVERTISER(
			this._advertiser_data,
			this.f.dealerId.value,
			this.f.businessName.value,
			this.f.lat.value,
			this.f.long.value,
			this.f.city.value,
			this.f.state.value,
			this.f.zip.value,
			this.f.region.value,
			this.f.address.value,
			this.f.category.value
		);

		this.subscription.add(
			this._advertiser.update_advertiser(newAdvertiserProfile).subscribe(
				(data: any) => {
					this.confirmationModal(
						'success',
						'Advertiser Details Updated!',
						'Hurray! You successfully updated the Advertiser Details',
						data.id
					);
				},
				(error) => {
					this.confirmationModal('error', 'Advertiser Details Update Failed', "Sorry, There's an error with your submission", null);
				}
			)
		);
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
		});

		dialogRef.afterClosed().subscribe((result) => {
			this.ngOnInit();
		});
	}

	setToCategory(e) {
		if (e != null) {
			e = e.replace(/_/g, ' ');
			this.category_selected = this._titlecase.transform(e);
			this.f.category.setValue(e);
		}
	}

	searchData(e) {
		this.subscription.add(
			this._dealer.get_search_dealer(e).subscribe((data) => {
				if (data.paging.entities.length > 0) {
					this.dealers_data = data.paging.entities;
				} else {
					this.dealers_data = [];
				}

				this.paging = data.paging;
			})
		);
	}

	editBusinessName(e) {
		if (e == true) {
			this.setDealer(this.initial_dealer);
			this.closed_without_edit = true;
		} else {
			this.closed_without_edit = false;
		}

		this.disable_business_name = e;
	}

	setDealer(e) {
		this.f.dealerId.setValue(e);
		var filtered = this.dealers_data.filter((i) => {
			return i.dealerId == e;
		});
		if (filtered.length == 0) {
			this.subscription.add(
				this._dealer.get_dealer_by_id(e).subscribe((data) => {
					this.current_dealer = data;
					this.dealers_data.push(this.current_dealer);
					this.dealer_name = this.current_dealer.businessName;
				})
			);
		} else {
			this.dealer_name = filtered[0].businessName;
		}
	}
}
