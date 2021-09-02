import { Component, OnInit, Inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import * as uuid from 'uuid';

import { API_CONTENT } from '../../models/api_content.model';
import { API_DEALER } from '../../models/api_dealer.model';
import { API_PARENTCATEGORY } from '../../models/api_parentcategory.model';
import { API_SINGLE_HOST } from '../../models/api_host.model';
import { API_UPDATE_HOST } from '../../models/api_update-host.model';
import { AuthService } from '../../services/auth-service/auth.service';
import { BulkEditBusinessHoursComponent } from '../../components_shared/page_components/bulk-edit-business-hours/bulk-edit-business-hours.component';
import { CategoryService } from '../../services/category-service/category.service';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { HostService } from '../../services/host-service/host.service';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { UI_OPERATION_HOURS, UI_OPERATION_DAYS } from '../../models/ui_operation-hours.model';

@Component({
	selector: 'app-edit-single-host',
	templateUrl: './edit-single-host.component.html',
	styleUrls: ['./edit-single-host.component.scss'],
	providers: [TitleCasePipe]
})

export class EditSingleHostComponent implements OnInit {

	business_hours: UI_OPERATION_DAYS[];
	categories_data: Observable<API_PARENTCATEGORY[]>;
	category_selected: string;
	closed_without_edit: boolean = false;
	current_dealer: any;
	dealer_id: string;
	dealer_name: string = '';
	dealers_data: API_DEALER[] = [];
	disable_business_name: boolean = true;
	has_bulk_selected_business_hours = false;
	has_content = false;
	host_data:  any = [];
	initial_dealer: string;
	is_dealer: boolean = false;
	host_id: string;
	host_timezone: { id: string; name: string; status: string; };
	new_host_form: FormGroup;
	operation_hours: UI_OPERATION_HOURS[];
	paging: any;
	subscription: Subscription = new Subscription();
	timezones: any;
	
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
			autocomplete: true,
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
			col: 'col-lg-12'
		}
	];

	google_business_hours = [
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
		}
	];

	private initial_business_hours: any;

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
		private _titlecase: TitleCasePipe,
	) { }

	ngOnInit() {
		if (this.isCurrentUserDealer) this.is_dealer = true;

		this.getDealers(1);
		this.getHostData(this._host_data);

		this.subscription.add(
			this._host.get_content_by_host_id(this._host_data)
				.subscribe(
					(response: { contents: API_CONTENT[] }) => {	
						if (response && response.contents && response.contents.length  > 0) return this.has_content = true;
						this.has_content = false;
					},
					error => console.log('Error retrieving content by host', error)
				)
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

		this.business_hours = this.google_business_hours.map(
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

		this.new_host_form = this._form.group({
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
			notes: ['']
		});

		this.getTimezones();
	}

	get f() { return this.new_host_form.controls; }

	get isCurrentUserAdmin() {
		return this.currentUser.role_id === UI_ROLE_DEFINITION.administrator;
	}

	getHostData(id: string): void {
		this.subscription.add(
			this._host.get_host_by_id(id).subscribe(
				(data: API_SINGLE_HOST) => {
					this.dealer_id = data.host.dealerId;
					this.host_data = data.host;
					this.host_timezone = data.timezone;
					this.initial_business_hours = JSON.parse(this.host_data.storeHours);
					this.business_hours = JSON.parse(this.host_data.storeHours);
					this.fillForm(this.host_data, this.host_timezone);
				}
			)
		);
	}

	searchData(e): void {
		this.subscription.add(
			this._dealer.get_search_dealer(e).subscribe(
				data => {
					if (data.paging.entities.length > 0) {
						this.dealers_data = data.paging.entities;
					} else {
						this.dealers_data = [];
					}
					this.paging = data.paging;
				}
			)
		);
	}

	getDealers(page: number): void {

		if (page > 1) {
			this.subscription.add(
				this._dealer.get_dealers_with_page(page, '').subscribe(
					data => {
						data.dealers.map (
							i => {
								this.dealers_data.push(i)
							}
						)
						this.paging = data.paging
					}
				)
			);
		} else {
			this.subscription.add(
				this._dealer.get_dealers_with_page(page, '').subscribe(
					data => {
						this.dealers_data = data.dealers;
						this.paging = data.paging
					}
				)
			);
		}
	}
	  
	setTimezone(e): void {
		this.f.timezone.setValue(e);
	}

	fillForm(data: any, time: any): void {
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
		this.f.timezone.setValue(time.id);
		this.f.notes.setValue(data.notes);
		this.f.vistar_venue_id.setValue(data.vistarVenueId)
	}

	getTimezones(): void {
		this._host.get_time_zones().subscribe(
			data => {
				this.timezones = data
			},
			error => {
				console.log('Error retrieving time zones', error);
			}
		);
	}

	newHostPlace(): void {
		const newHostPlace = new API_UPDATE_HOST(
			this._host_data,
			this.f.dealerId.value,
			this.f.businessName.value,
			this.f.lat.value,
			this.f.long.value,
			this.f.city.value,
			this.f.state.value,
			this.f.zip.value,
			this.f.region.value,
			this.f.address.value,
			this.f.category.value,
			JSON.stringify(this.business_hours),
			this.f.timezone.value,
			this.f.vistar_venue_id.value
		);

		if (this.f.notes.value && this.f.notes.value.trim().length > 0) {
			newHostPlace.notes = this.f.notes.value;
		}

		if (this.hasUpdatedBusinessHours) this._host.onUpdateBusinessHours.emit(true);

		this.subscription.add(
			this._host.update_single_host(newHostPlace).subscribe(
				(data: any) => {
					this.confirmationModal('success', 'Host Profile Details Updated!', 'Hurray! You successfully updated the Host Profile Details', data.host.hostId);
				}, error => {
					console.log(error);
					this.confirmationModal('error', 'Host Profile Details Update Failed', 'Sorry, There\'s an error with your submission', null);
				}
			)
		);
	}

	confirmationModal(status: string, message: string, data: any, id: string): void {

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data
			}
		});

		dialog.afterClosed().subscribe(() => this.ngOnInit());
	}

	onDeleteHost(): void {
		let isForceDelete = false;
		const status = 'warning';
		const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
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

				this.subscription.add(
					this._host.delete_host([ hostId ], isForceDelete)
						.subscribe(
							() => {
								this._dialogRef.close('delete-host');
                                if(!this.is_dealer) {
                                    this._router.navigate([`/${route}/dealers/${this.dealer_id}`]);
                                } else {
                                    this._router.navigate([`/${route}/hosts`]);
                                }
								
							},
							error => console.log('Error deleting host', error)
						)
				);

			},
			error => console.log('Error closing confirmation modal', error)
		);

	}

	operationDays(data: { periods: any[], status: boolean, id: string }): void {
		data.periods.length = 0;

		const hours = {
			id: uuid.v4(),
			day_id: data.id,
			open: '',
			close: '',
		};
		
		data.status = !data.status;
		data.periods.push(hours);
	}

	addHours(data: { periods: any[], id: string }): void {

		const hours = {
			id: uuid.v4(),
			day_id: data.id,
			open: '',
			close: '',
		};

		data.periods.push(hours);
	}

	removeHours(data: { periods: any[] }, index: number): void {
		data.periods.splice(index, 1);
	}

	setToCategory(event: string): void {

		if (event != null) {
			event = event.replace(/_/g," ");
			this.category_selected = this._titlecase.transform(event);
			this.f.category.setValue(event);
		}

	}
  
	editBusinessName(event: boolean): void {

		if (event == true) {
			this.setDealer(this.initial_dealer);
			this.closed_without_edit = true;
		} else {
			this.closed_without_edit = false;
		}
		
		this.disable_business_name = event;
	}

	onBulkEditHours(): void {
		const dialog = this._dialog.open(BulkEditBusinessHoursComponent, {
			width: '550px',
			height: '450px',
			panelClass: 'position-relative',
			data: { },
			autoFocus: false
		});

		dialog.afterClosed().subscribe(
			response => {
				if (response) this.business_hours = response
			},
			error => console.log('Error on closing bulk edit hours', error)
		);
		
	}

	setDealer(id) {
		this.f.dealerId.setValue(id);
		const filtered = this.dealers_data.filter(dealer => dealer.dealerId == id);
		if (filtered.length == 0) {
			this.subscription.add(
				this._dealer.get_dealer_by_id(id).subscribe(
					data => {
						this.current_dealer = data;
						this.dealers_data.push(this.current_dealer);
						this.dealer_name = this.current_dealer.businessName;
					}
				)
			)
		} else {
			this.dealer_name = filtered[0].businessName;
		}
	}

	private get hasUpdatedBusinessHours(): boolean {
		return JSON.stringify(this.business_hours) !== JSON.stringify(this.initial_business_hours);
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

	protected get isCurrentUserDealer() {
		return this.currentUser.role_id === UI_ROLE_DEFINITION.dealer;
	}
}

