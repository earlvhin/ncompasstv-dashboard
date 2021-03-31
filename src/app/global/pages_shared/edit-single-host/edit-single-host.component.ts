import { Component, OnInit, Inject } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../services/auth-service/auth.service';
import { HostService } from '../../services/host-service/host.service';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { API_DEALER } from '../../models/api_dealer.model';
import { API_UPDATE_HOST } from '../../models/api_update-host.model';
import { API_PARENTCATEGORY } from '../../models/api_parentcategory.model';
import { CategoryService } from '../../services/category-service/category.service';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import * as uuid from 'uuid';
import { UI_OPERATION_HOURS, UI_OPERATION_DAYS } from '../../models/ui_operation-hours.model';
import { API_SINGLE_HOST } from '../../models/api_host.model';

@Component({
  selector: 'app-edit-single-host',
  templateUrl: './edit-single-host.component.html',
  styleUrls: ['./edit-single-host.component.scss'],
  providers: [TitleCasePipe]
})

export class EditSingleHostComponent implements OnInit {
	categories_data: Observable<API_PARENTCATEGORY[]>;
	host_data:  any = [];
	// business_hours:  any;
	subscription: Subscription = new Subscription();
	dealer_name: string;
	initial_dealer: string;
	is_dealer: boolean = false;
	disable_business_name: boolean = true;
	category_selected: string;
	new_host_form: FormGroup;
	host_id: string;
	dealers_data: API_DEALER[] = [];
	operation_hours: UI_OPERATION_HOURS[];
	business_hours: UI_OPERATION_DAYS[];
	current_dealer: any;
	paging: any;
	closed_without_edit: boolean = false;

	private initial_business_hours: any;

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
			label: 'Notes',
			control: 'notes',
			placeholder: 'Enter your notes here...',
			type: 'textarea',
			col: 'col-lg-12'
		}
	]

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
	]
	timezones: any;
	host_timezone: { id: string; name: string; status: string; };

	constructor(
		@Inject(MAT_DIALOG_DATA) public _host_data: any,
		private _host: HostService,
		private _form: FormBuilder,
		private _titlecase: TitleCasePipe,
		private _dealer: DealerService,
		private _categories: CategoryService,
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _router: Router,
	) { }

	ngOnInit() {
		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
		}

		this.getDealers(1);
		this.getHostData(this._host_data);

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
			notes: ['']
		});

		this.getTimezones();
	}

	get f() { return this.new_host_form.controls; }

	getHostData(id) {
		this.subscription.add(
			this._host.get_host_by_id(id).subscribe(
				(data: API_SINGLE_HOST) => {
					this.host_data = data.host;
					this.host_timezone = data.timezone;
					this.initial_business_hours = JSON.parse(this.host_data.storeHours);
					this.business_hours = JSON.parse(this.host_data.storeHours);
					this.fillForm(this.host_data, this.host_timezone);
				}
			)
		);
	}

	searchData(e) {
		console.log("E")
		this.subscription.add(
			this._dealer.get_search_dealer(e).subscribe(
				data => {
					console.log("DATA", data)
					if (data.paging.entities.length > 0) {
						this.dealers_data = data.paging.entities;
					} else {
						this.dealers_data = [];
					}
					console.log("DEALERS DATA SEARCHED", this.dealers_data)
					this.paging = data.paging;
				}
			)
		);
	}

	getDealers(e) {
		console.log("E", e);

		if (e > 1) {
			this.subscription.add(
				this._dealer.get_dealers_with_page(e, "").subscribe(
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
				this._dealer.get_dealers_with_page(e, "").subscribe(
					data => {
						console.log("DATA", data)
						this.dealers_data = data.dealers;
						this.paging = data.paging
					}
				)
			);
		}
	}
	  
	setTimezone(e) {
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
	}

	getTimezones() {
		this._host.get_time_zones().subscribe(
			data => {
				this.timezones = data
			},
			error => {
				console.log(error);
			}
		)
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
			this.f.timezone.value
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
			this.ngOnInit() 
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
		if(e != null) {
			e = e.replace(/_/g," ");
			this.category_selected = this._titlecase.transform(e);
			this.f.category.setValue(e);
		}
	}
  
	editBusinessName(e) {
		if(e == true) {
			this.setDealer(this.initial_dealer)
			this.closed_without_edit = true;
		} else {
			this.closed_without_edit = false;
		}
		
		this.disable_business_name = e;
	}

	setDealer(e) {
		console.log("EE", e)
		this.f.dealerId.setValue(e);
		var filtered = this.dealers_data.filter(
			i => {
				return i.dealerId == e;
			}
		)
		if(filtered.length == 0) {
			this.subscription.add(
				this._dealer.get_dealer_by_id(e).subscribe(
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
}

