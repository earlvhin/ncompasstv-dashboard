import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { API_UPDATE_DEALER_PROFILE_BY_ADMIN } from '../../models/api_update-user-info.model';
import { API_UPDATE_DEALER_USER_PROFILE_BY_ADMIN } from '../../models/api_update-user-info.model';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { UserService } from '../../services/user-service/user.service';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-edit-single-dealer',
	templateUrl: './edit-single-dealer.component.html',
	styleUrls: ['./edit-single-dealer.component.scss']
})

export class EditSingleDealerComponent implements OnInit {

	subscription: Subscription = new Subscription();
	dealer_form: FormGroup;
	duplicate_email: any;
	@Output() updated = new EventEmitter;
	enable_update_form : boolean = false;
	has_duplicate_email : boolean = false;
	email_not_valid : boolean = false;
	other_users: any;

	dealer_form_view = [
		{
			label: 'Business Name',
			control: 'business_name',
			placeholder: 'Ex. SM Center Pasig',
			col: 'col-lg-6'
		},
		{
			label: 'Dealer Id',
			control: 'dealer_id',
			col: 'col-lg-6',
		},	
		{
			label: 'Dealer Alias',
			control: 'dealer_alias',
			col: 'col-lg-6'
		},
		{
			label: 'Owner Firstname',
			control: 'owner_f_name',
			placeholder: 'Ex. John',
			col: 'col-lg-6'
		},
		{
			label: 'Owner Lastname',
			control: 'owner_l_name',
			placeholder: 'Ex. Doe',
			col: 'col-lg-6'
		},
		{
			label: 'Email Address',
			control: 'email',
			placeholder: 'Ex. dealer@mail.com',
			col: 'col-lg-6',
			type: 'email'
		},
		{
			label: 'Contact Number',
			control: 'c_number',
			placeholder: 'Ex. 0123456789',
			col: 'col-lg-6'
		},
		{
			label: 'Contact Person',
			control: 'c_person',
			placeholder: 'Ex. John Doe',
			col: 'col-lg-6'
		},
		{
			label: 'Address',
			control: 'address',
			placeholder: 'Ex. 123 Lot 14, Blk 9',
			col: 'col-lg-6'
		},
		{
			label: 'City',
			control: 'city',
			placeholder: 'Ex. St. Peter',
			col: 'col-lg-6',
		},
		{
			label: 'State',
			control: 'state',
			placeholder: 'Ex. MO',
			col: 'col-lg-6',
		},
		{
			label: 'Region',
			control: 'region',
			placeholder: 'Ex. MW',
			col: 'col-lg-6',
		}
	]


	constructor(
		@Inject(MAT_DIALOG_DATA) public _dealer_data: any,
		private _form: FormBuilder,
		private _user: UserService,
		private _dialog: MatDialog,
		private _dealer: DealerService
	) { }

	ngOnInit() {
		this.dealer_form = this._form.group({
				dealer_id: [{value: '', disabled: true}, Validators.required],
				business_name: ['', Validators.required],
				dealer_alias: [''],
				owner_f_name: ['', Validators.required],
				owner_l_name: ['', Validators.required],
				email: ['', Validators.required],
				c_number: ['', Validators.required],
				c_person: ['', Validators.required],
				address: [''],
				city: ['', Validators.required],
				region: ['', Validators.required],
				state: ['', Validators.required]
		})

		this.fillForm(this._dealer_data);

		this.getOtherUsers(1);

		this.subscription.add(
			this.dealer_form.valueChanges.subscribe(
				data => {
					if (this._user.validate_email(data.email)) {
						this.checkEmailDuplicate(data.email)
						this.email_not_valid = false;
					} else {
						this.email_not_valid = true;
					}

					if (this.dealer_form.valid && !this.has_duplicate_email && !this.email_not_valid) {
						this.enable_update_form = true;
					} else {
						this.enable_update_form = false;
					}
				}
			)
		)
	}

	get f() { return this.dealer_form.controls; }

	fillForm(data: any) {
		this.f.business_name.setValue(data.businessName);
		this.f.dealer_id.setValue(data.dealerId);
		this.f.dealer_alias.setValue(data.dealerIdAlias);
		this.f.owner_f_name.setValue(data.firstName);
		this.f.owner_l_name.setValue(data.lastName);
		this.f.email.setValue(data.email);
		this.f.c_number.setValue(data.contactNumber);
		this.f.c_person.setValue(data.contactPerson);
		this.f.address.setValue(data.address);
		this.f.city.setValue(data.city);
		this.f.region.setValue(data.region);
		this.f.state.setValue(data.state);
	}

	mapDealerInfoChanges() {
		return new API_UPDATE_DEALER_PROFILE_BY_ADMIN(
			this._dealer_data.userId,
			this.f.dealer_id.value,
			this.f.c_person.value,
			this.f.business_name.value,
			this.f.dealer_alias.value,
			this.f.email.value,
			this.f.c_number.value,
			this.f.address.value,
			this.f.region.value,
			this.f.city.value,
			this.f.state.value,
			this._dealer_data.userId
		)
	}

	getOtherUsers(e) {
		if (e == 1) {
			this.subscription.add(
				this._user.get_users_by_page(e, "").subscribe(
					data => {
						console.log("DATA", data)
						this.other_users = data.users;
						if(data.paging.hasNextPage) {
							this.getOtherUsers(data.paging.page + 1)
						}
					}
				)
			)
		} else {
			this.subscription.add(
				this._user.get_users_by_page(e, "").subscribe(
					(data:any) => {
						data.users.map (
							i => {
								this.other_users.push(i)
							}
						)
						if(data.paging.hasNextPage) {
							this.getOtherUsers(data.paging.page + 1)
						}
					}
				)
			)
		}
	}

	checkEmailDuplicate(current_value) {
		this.duplicate_email = this.other_users.filter(
			i => {
				if (i.email == current_value && current_value != this._dealer_data.email) {
					return i;
				}
			}
		);

		if(this.duplicate_email.length > 0) {
			this.has_duplicate_email = true;			
		} else {
			this.has_duplicate_email = false;
		}
	}
  
  	mapUserInfoChanges() {
		return new API_UPDATE_DEALER_USER_PROFILE_BY_ADMIN(
			this._dealer_data.userId,
			this.f.dealer_id.value,
			this.f.owner_f_name.value,
			this.f.owner_l_name.value,
			this.f.email.value,
		)
	}

	updateDealerInfo() {
		this._user.update_user(this.mapUserInfoChanges()).subscribe(
			data => {
				this._dealer.update_dealer(this.mapDealerInfoChanges()).subscribe(
					data => {
						this.openConfirmationModal('success', 'Success!', 'Dealer info changed succesfully');
					}, 
					error => {
						console.log('error', error);
					}
				)
			}
		)
	}

	openConfirmationModal(status, message, data): void {
		let dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: status,
				message: message,
				data: data
			}
		})

		dialogRef.afterClosed().subscribe(r => {
			this._dialog.closeAll();
		});
	}
}
