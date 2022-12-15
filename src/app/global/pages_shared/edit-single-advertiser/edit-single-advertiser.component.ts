import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatSlideToggleChange, MatDialogRef } from '@angular/material';
import { TitleCasePipe } from '@angular/common';
import { takeUntil, map } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AdvertiserService, AuthService, CategoryService, ConfirmationDialogService, DealerService } from 'src/app/global/services';
import { API_ADVERTISER, API_DEALER, API_PARENT_CATEGORY, API_UPDATE_ADVERTISER, PAGING, UI_CONFIRMATION_MODAL } from 'src/app/global/models';
@Component({
	selector: 'app-edit-single-advertiser',
	templateUrl: './edit-single-advertiser.component.html',
	styleUrls: ['./edit-single-advertiser.component.scss'],
	providers: [TitleCasePipe]
})
export class EditSingleAdvertiserComponent implements OnInit, OnDestroy {
	advertiser: API_ADVERTISER = this.dialog_data.advertiser;
	category_selected: string;
	categories_data: API_PARENT_CATEGORY[] = [];
	categories_loaded = false;
	closed_without_edit: boolean = false;
	current_dealer: API_DEALER;
	dealer_name: string;
	dealers_data: API_DEALER[] = [];
	dealers_loaded = false;
	disable_business_name: boolean = true;
	edit_advertiser_form: FormGroup;
	edit_advertiser_form_fields = this._editAdvertiserFormFields;
	initial_dealer_id: string;
	is_active_advertiser = this.advertiser.status === 'A';
	is_form_ready = false;
	is_dealer = this._auth.current_role === 'dealer';
	paging: PAGING;

	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public dialog_data: { advertiser: API_ADVERTISER; dealer: API_DEALER },
		private _advertiser: AdvertiserService,
		private _auth: AuthService,
		private _categories: CategoryService,
		private _confirmationDialog: ConfirmationDialogService,
		private _dealer: DealerService,
		private _dialogReference: MatDialogRef<EditSingleAdvertiserComponent>,
		private _form: FormBuilder,
		private _titlecase: TitleCasePipe
	) {}

	ngOnInit() {
		this.searchDealers();
		this.getCategories();
		this.initializeForm();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	editBusinessName(value: boolean): void {
		this.closed_without_edit = value;
		this.disable_business_name = value;
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
			newStatus
		);

		if (this.advertiser.status !== newStatus) message += ` This will ${newStatus === 'A' ? 'activate' : 'deactivate'} the advertiser.`;

		const confirmChange = await this._confirmationDialog.warning({ message: title, data: message }).toPromise();

		if (!confirmChange) return;

		this._advertiser
			.update_advertiser(newAdvertiserProfile)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				async () => {
					const dialogData = {
						message: 'Advertiser Details Updated!',
						data: 'Your changes have been saved'
					};

					await this._confirmationDialog.success(dialogData).toPromise();
					this._dialogReference.close(true);
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	searchDealers(keyword = '') {
		this._dealer
			.get_search_dealer(keyword)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data) => {
				if (data.paging.entities.length <= 0) {
					this.dealers_data = [];
					return;
				}

				this.dealers_data = data.paging.entities;
				this.paging = data.paging;
			})
			.add(() => (this.dealers_loaded = true));
	}

	setDealer(dealerId: string) {
		const filteredDealer = this.dealers_data.filter((dealer) => dealer.dealerId === dealerId)[0];
		this._formControls.dealerId.setValue(this.initial_dealer_id);
		this.dealer_name = filteredDealer.businessName;
		this.current_dealer = filteredDealer;
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
				})
			)
			.subscribe((response) => {
				this.categories_data = response;
			})
			.add(() => (this.categories_loaded = true));
	}

	private initializeForm() {
		this.edit_advertiser_form = this._form.group({
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

		this.setFormData();
	}

	private setFormData(): void {
		const { advertiser, dealer } = this.dialog_data;
		this._formControls.businessName.setValue(advertiser.name);
		this._formControls.lat.setValue(advertiser.latitude);
		this._formControls.long.setValue(advertiser.longitude);
		this._formControls.address.setValue(advertiser.address);
		this._formControls.city.setValue(advertiser.city);
		this._formControls.state.setValue(advertiser.state);
		this._formControls.zip.setValue(advertiser.postalCode);
		this._formControls.region.setValue(advertiser.region);
		this._formControls.dealerId.setValue(this.dialog_data.dealer.dealerId);
		this.dealer_name = dealer.businessName;
		this.onSelectCategory(advertiser.category);
		this.initial_dealer_id = advertiser.dealerId;
		this.is_form_ready = true;
	}

	protected get _editAdvertiserFormFields() {
		return [
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
	}

	protected get _formControls() {
		return this.edit_advertiser_form.controls;
	}
}
