import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as uuid from 'uuid';

import {
	API_CONTENT,
	API_DEALER,
	API_PARENT_CATEGORY,
	API_UPDATE_HOST,
	UI_ROLE_DEFINITION,
	UI_OPERATION_DAYS,
	API_HOST
} from 'src/app/global/models';

import { AuthService, CategoryService, DealerService, HostService } from 'src/app/global/services';
import { BulkEditBusinessHoursComponent } from '../../components_shared/page_components/bulk-edit-business-hours/bulk-edit-business-hours.component';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-edit-single-host',
	templateUrl: './edit-single-host.component.html',
	styleUrls: ['./edit-single-host.component.scss'],
	providers: [TitleCasePipe]
})
export class EditSingleHostComponent implements OnInit, OnDestroy {
	business_hours: UI_OPERATION_DAYS[];
	categories_data: API_PARENT_CATEGORY[];
	category_selected: string;
	closed_without_edit = false;
	dealer_name = '';
	dealers_data: API_DEALER[] = [];
	disable_business_name = true;
	edit_host_form: FormGroup;
	edit_host_form_controls = this._editHostFormControls;
	is_dealer = false;
	host_timezone: { id: string; name: string; status: string };
	paging: any;
	timezones: any;

	private current_dealer: API_DEALER;
	private dealer_id: string;
	private form_invalid = false;
	private has_content = false;
	private host_data: API_HOST;
	private initial_business_hours: any;
	private initial_dealer: string;
	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _host_data: any,
		private _auth: AuthService,
		private _categories: CategoryService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _dialogRef: MatDialogRef<EditSingleHostComponent>,
		private _form: FormBuilder,
		private _host: HostService,
		private _router: Router,
		private _titlecase: TitleCasePipe
	) {}

	ngOnInit() {
		if (this.isCurrentUserDealer) this.is_dealer = true;
		this.getDealers(1);
		this.getHostData(this._host_data);
		this.getHostContents();
		this.getCategories();
		this.setBusinessHours();
		this.initializeForm();
		this.getTimezones();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	get isCurrentUserAdmin() {
		return this.currentUser.role_id === UI_ROLE_DEFINITION.administrator;
	}

	addHours(data: { periods: any[]; id: string }): void {
		const hours = {
			id: uuid.v4(),
			day_id: data.id,
			open: '',
			close: ''
		};

		data.periods.push(hours);
	}

	editBusinessName(data: boolean): void {
		this.closed_without_edit = data;

		if (data) {
			this.setDealer(this.initial_dealer);
		}

		this.disable_business_name = data;
	}

	getDealers(page: number): void {
		this._dealer
			.get_dealers_with_page(page, '')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				if (page > 1) this.dealers_data.concat(response.dealers);
				else this.dealers_data = response.dealers;
				this.paging = response.paging;
			});
	}

	onBulkEditHours(): void {
		const dialog = this._dialog.open(BulkEditBusinessHoursComponent, {
			width: '550px',
			height: '450px',
			panelClass: 'position-relative',
			data: {},
			autoFocus: false
		});

		dialog.afterClosed().subscribe(
			(response) => {
				if (response) this.business_hours = response;
			},
			(error) => {
				throw new Error(error);
			}
		);
	}

	onDeleteHost(): void {
		let isForceDelete = false;
		const status = 'warning';
		const route = Object.keys(UI_ROLE_DEFINITION).find((key) => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		const hostId = this._host_data;
		let data: any = { status, message: 'Delete Host', data: 'Are you sure about this?' };

		if (this.has_content) {
			data = { status, message: 'Force Delete', data: 'This host has content. Delete those as well?', is_selection: true };
		}

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data
		});

		dialog.afterClosed().subscribe(
			(response: boolean | string) => {
				if (typeof response === 'undefined' || !response) return;
				if (this.has_content && response !== 'no') isForceDelete = true;

				this._host
					.delete_host([hostId], isForceDelete)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe(
						() => {
							this._dialogRef.close('delete-host');
							if (!this.is_dealer) {
								this._router.navigate([`/${route}/dealers/${this.dealer_id}`]);
							} else {
								this._router.navigate([`/${route}/hosts`]);
							}
						},
						(error) => {
							throw new Error(error);
						}
					);
			},
			(error) => {
				throw new Error(error);
			}
		);
	}

	parseBusinessHours(data: { periods: any[]; status: boolean; id: string }): void {
		data.periods.length = 0;

		const hours = {
			id: uuid.v4(),
			day_id: data.id,
			open: '',
			close: ''
		};

		data.status = !data.status;
		data.periods.push(hours);
	}

	removeHours(data: { periods: any[] }, index: number): void {
		data.periods.splice(index, 1);
	}

	saveHostData(): void {
		this.checkBusinessHoursFields();

		if (this.form_invalid) {
			this.displayWarningModal(
				'error',
				'Failed to update host',
				'Kindly verify that all business hours opening should have closing time.',
				null,
				null
			);

			return;
		}

		const newHostPlace = new API_UPDATE_HOST(
			this._host_data,
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
			JSON.stringify(this.business_hours),
			this._formControls.timezone.value,
			this._formControls.vistar_venue_id.value
		);

		if (this._formControls.notes.value && this._formControls.notes.value.trim().length > 0) {
			newHostPlace.notes = this._formControls.notes.value;
		}

		if (this._formControls.others.value && this._formControls.others.value.trim().length > 0) {
			newHostPlace.others = this._formControls.others.value;
		}

		if (this.hasUpdatedBusinessHours) this._host.onUpdateBusinessHours.emit(true);

		this._host
			.update_single_host(newHostPlace)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { host: { hostId: string } }) => {
					this.showConfirmationModal(
						'success',
						'Host Profile Details Updated!',
						'Hurray! You successfully updated the Host Profile Details',
						response.host.hostId
					);
				},
				(error) => {
					this.showConfirmationModal('error', 'Host Profile Details Update Failed', "Sorry, There's an error with your submission", null);
				}
			);
	}

	searchData(keyword: string): void {
		this._dealer
			.get_search_dealer(keyword)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				let searchDealerResults = [];

				if (response.paging.entities.length > 0) {
					searchDealerResults = response.paging.entities;
					this.paging = response.paging;
				}

				this.dealers_data = searchDealerResults;
			});
	}

	setDealer(id: string): void {
		this._formControls.dealerId.setValue(id);
		const filtered = this.dealers_data.filter((dealer) => dealer.dealerId == id);

		if (filtered.length > 0) {
			this.dealer_name = filtered[0].businessName;
			return;
		}

		this._dealer
			.get_dealer_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				this.current_dealer = response;
				this.dealers_data.push(this.current_dealer);
				this.dealer_name = this.current_dealer.businessName;
			});
	}

	setTimezone(data: string): void {
		this._formControls.timezone.setValue(data);
	}

	setToCategory(event: string): void {
		if (event != null) {
			event = event.replace(/_/g, ' ');
			this.category_selected = this._titlecase.transform(event);
			this._formControls.category.setValue(event);
		}
	}

	private get hasUpdatedBusinessHours(): boolean {
		return JSON.stringify(this.business_hours) !== JSON.stringify(this.initial_business_hours);
	}

	private checkBusinessHoursFields(): void {
		this.business_hours.map((data) => {
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
	}

	private displayWarningModal(status: string, message: string, data: string, return_msg: string, action: string): void {
		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data, return_msg, action }
		});

		dialogRef.afterClosed().subscribe(() => (this.form_invalid = false));
	}

	private fillForm(data: API_HOST, time: { id: string }): void {
		this._formControls.businessName.setValue(data.name);
		this._formControls.lat.setValue(data.latitude);
		this._formControls.long.setValue(data.longitude);
		this._formControls.address.setValue(data.address);
		this._formControls.city.setValue(data.city);
		this._formControls.state.setValue(data.state);
		this._formControls.zip.setValue(data.postalCode);
		this._formControls.region.setValue(data.region);
		this.setToCategory(data.category);
		this.setDealer(data.dealerId);
		this.initial_dealer = data.dealerId;
		this._formControls.timezone.setValue(time.id);
		this._formControls.notes.setValue(data.notes);
		this._formControls.others.setValue(data.others);
		this._formControls.vistar_venue_id.setValue(data.vistarVenueId);
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
					})
				)
			)
			.subscribe((response) => {
				this.categories_data = response;
			});
	}

	private getHostContents(): void {
		this._host
			.get_content_by_host_id(this._host_data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { contents: API_CONTENT[] }) => {
					if (response && response.contents && response.contents.length > 0) return (this.has_content = true);
					this.has_content = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private getHostData(id: string): void {
		this._host
			.get_host_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				if (response.message) return;
				this.dealer_id = response.host.dealerId;
				this.host_data = response.host;
				this.host_timezone = response.timezone;
				this.initial_business_hours = JSON.parse(this.host_data.storeHours);
				this.business_hours = JSON.parse(this.host_data.storeHours);
				this.fillForm(this.host_data, this.host_timezone);
			});
	}

	private getTimezones(): void {
		this._host
			.get_time_zones()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => (this.timezones = response),
				(error) => {
					throw new Error(error);
				}
			);
	}

	private initializeForm(): void {
		this.edit_host_form = this._form.group({
			dealerId: ['', Validators.required],
			businessName: ['', Validators.required],
			address: ['', Validators.required],
			city: ['', Validators.required],
			state: ['', Validators.required],
			zip: ['', Validators.required],
			region: ['', Validators.required],
			category: ['', Validators.required],
			long: ['', Validators.required],
			lat: ['', Validators.required],
			timezone: ['', Validators.required],
			vistar_venue_id: ['', Validators.required],
			notes: [''],
			others: ['']
		});
	}

	private setBusinessHours(): void {
		this.business_hours = this._businessHours.map((h) => {
			return new UI_OPERATION_DAYS(h.id, h.label, h.day, [], h.status);
		});
	}

	private showConfirmationModal(status: string, message: string, data: any, id: string) {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data
			}
		});

		dialog.afterClosed().subscribe(() => {
			if (status) {
				this.ngOnInit();
				this._dialog.closeAll();
			}
		});
	}

	protected get _businessHours(): UI_OPERATION_DAYS[] {
		return [
			{
				id: 1,
				label: 'M',
				day: 'Monday',
				periods: [],
				status: false
			},
			{
				id: 2,
				label: 'T',
				day: 'Tuesday',
				periods: [],
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

	protected get _editHostFormControls() {
		return [
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
				col: 'col-lg-3'
			},
			{
				label: 'State',
				control: 'state',
				placeholder: 'Ex. IL',
				col: 'col-lg-3'
			},
			{
				label: 'Region',
				control: 'region',
				placeholder: 'Ex. SW',
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
				autocomplete: true
			},
			{
				label: 'Vistar Venue ID',
				control: 'vistar_venue_id',
				placeholder: 'Ex. Venue ID for Vistar',
				col: 'col-lg-12'
			},
			{
				label: 'Notes',
				control: 'notes',
				placeholder: 'Enter your notes here...',
				type: 'textarea',
				col: 'col-lg-6'
			},
			{
				label: 'Others',
				control: 'others',
				placeholder: 'Enter your others here...',
				type: 'textarea',
				col: 'col-lg-6'
			}
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
}
