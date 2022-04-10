import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { Subject } from 'rxjs';

import { AdvertiserService } from '../../../../global/services/advertiser-service/advertiser.service';
import { API_UPDATE_DEALER_PROFILE } from '../../../../global/models/api_update-user-info.model';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { ConfirmationModalComponent } from '../../../../global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ContentService } from 'src/app/global/services/content-service/content.service';
import { DEALER_PROFILE } from '../../../../global/models/api_user.model';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { LicenseService } from '../../../../global/services/license-service/license.service';
import { HostService } from '../../../../global/services/host-service/host.service';
import { UserService } from '../../../../global/services/user-service/user.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dealer-setting',
  templateUrl: './dealer-setting.component.html',
  styleUrls: ['./dealer-setting.component.scss'],
  providers: [DatePipe]
})
export class DealerSettingComponent implements OnInit {

    advertiser_details: any = {}; 
	content_data: any;
	content_details: any = {};
	form_fields_view = [{
		label: 'Business Name',
		control: 'business_name',
		placeholder: 'Ex: Dealer O1',
		type: 'text',
		width: 'col-lg-4'
	},{
		label: 'Dealer Id',
		control: 'dealer_id',
		type: 'text',
		width: 'col-lg-4'
	},{
		label: 'Owner Firstname',
		control: 'owner_f_name',
		placeholder: 'Ex: John',
		type: 'email',
		width: 'col-lg-4'
	},{
		label: 'Owner Lastname',
		control: 'owner_l_name',
		placeholder: 'Ex: Doe',
		type: 'email',
		width: 'col-lg-4'
	},{
		label: 'Email Address',
		control: 'email',
		placeholder: 'Ex: admin@blueiguana.com',
		type: 'email',
		width: 'col-lg-4'
	},{
		label: 'Contact Number',
		control: 'contact',
		placeholder: 'Ex: 123-456-789',
		type: 'text',
    	width: 'col-lg-4'
	},{
      	label: 'Contact Person',
      	control: 'contact_person',
      	placeholder: 'Ex: John Doe',
      	type: 'text',
      	width: 'col-lg-4'
	},{
      	label: 'Address',
      	control: 'address',
      	placeholder: 'Ex: 989 E. Strawberry Ave. Chula Vista',
      	type: 'text',
      	width: 'col-lg-4'
	},{
      	label: 'City',
      	control: 'city',
      	placeholder: 'Ex: Los Angeles',
      	type: 'text',
    	width: 'col-lg-4'
	},{
    	label: 'State',
    	control: 'state',
    	placeholder: 'Ex: CA',
    	type: 'text',
    	width: 'col-lg-4'
  	},{
    	label: 'Region',
    	control: 'region',
    	placeholder: 'Ex: West',
    	type: 'text',
    	width: 'col-lg-4'
	}];
	host_details: any = {};
	isDealer: boolean = false;
	license_details: any = {}; 
	loading_advertiser: boolean = true;
	loading_content: boolean = true;
	loading_host: boolean = true;
	loading_license: boolean = true;
	no_content: boolean;
	// subscription: Subscription = new Subscription();
	user_data: DEALER_PROFILE; 
	update_info_form_disabled: boolean = false;
	update_info_form_disabled_typing: boolean = true;
	update_user: FormGroup;

	protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
		private _form: FormBuilder,
		private _params: ActivatedRoute,
		private _dealer: DealerService,
		private _user: UserService,
		private _date: DatePipe,
		private _dialog: MatDialog,
    ) { }

    ngOnInit() {
        this.update_info_form_disabled = false;

		this.update_user = this._form.group(
			this._params.paramMap
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(() => this.getUserById(this._params.snapshot.params.data))
		);
    }

    ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getUserById(id) {

		this._user.get_user_alldata_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					this.user_data = Object.assign({},data.user, data.dealer[0]);
					this.user_data.dateCreated = this._date.transform(this.user_data.dateCreated, 'MMM dd, yyyy')
					this.readyUpdateForm();
				}, 
				error => console.log('Error retrieving user by ID', error)
			);

	}

	get f() {
		return this.update_user.controls;
	}
  
	readyUpdateForm() {
		this.update_user = this._form.group({
			dealer_id: [{value: this.user_data.dealerId, disabled: true},  Validators.required],
			business_name: [{value: this.user_data.businessName,  disabled: true}, Validators.required,],
			contact: [{value: this.user_data.contactNumber, disabled: true}, Validators.required],
			contact_person: [{value: this.user_data.contactPerson,  disabled: true}, Validators.required,],
			owner_f_name: [{value: this.user_data.firstName, disabled: true}, Validators.required],
			owner_l_name: [{value: this.user_data.lastName, disabled: true}, Validators.required],
			email: [{value: this.user_data.email, disabled: true}, Validators.required],
			address: [{value: this.user_data.address, disabled: true}, Validators.required],
			city: [{value: this.user_data.city, disabled: true}, Validators.required],
			state: [{value: this.user_data.state, disabled: true}, Validators.required],
			region: [{value: this.user_data.region, disabled: true}, Validators.required],
		})

		this.update_user.valueChanges
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
					if (this.update_user.valid) {
						this.update_info_form_disabled_typing = false;
					} else {
						this.update_info_form_disabled_typing = true;
					}
				}
			);
	}

	activateEdit(x) {
		if(x) {
			this.update_user.controls['contact_person'].enable();
			this.update_user.controls['business_name'].enable(); 
			this.update_user.controls['owner_f_name'].enable(); 
			this.update_user.controls['owner_l_name'].enable(); 
			this.update_user.controls['contact'].enable(); 
		} else {
			this.update_user.controls['contact_person'].disable();
			this.update_user.controls['business_name'].disable();
			this.update_user.controls['owner_f_name'].disable(); 
			this.update_user.controls['owner_l_name'].disable();  
			this.update_user.controls['contact'].disable();  
			this.readyUpdateForm();   
		}
		this.update_info_form_disabled = x;
	}
  
	mapDealerInfoChanges() {
		return new API_UPDATE_DEALER_PROFILE(
			this.user_data.userId,
			this.user_data.dealerId,
			this.f.contact_person.value,
			this.f.business_name.value,
			this.f.contact.value,
			this.user_data.userId,
		)
	}
  
	mapUserInfoChanges() {

		const { owner_f_name, owner_l_name, contact } = this.update_user.value;
		const { userId, dealerId } = this.user_data;
		const updatedBy = this.currentUser.user_id;
		
		return {
			userId,
			updatedBy,
			dealerId,
			firstName: owner_f_name,
			lastName: owner_l_name,
			contactNumber: contact,
		};

	}

	updateUserInfo() {
		this._user.update_user(this.mapUserInfoChanges()).subscribe(
			data => {
				this.updateDealer();
			}
		)
	}

	updateDealer() {
		this._dealer.update_dealer(this.mapDealerInfoChanges()).subscribe(
			data => {
				this.openConfirmationModal('success', 'Success!', 'Dealer info changed succesfully');
				this.ngOnInit();
			},
			error => {
				console.log('error', error);
			}
		)
	}

 	openConfirmationModal(status, message, data): void {
		this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: status,
				message: message,
				data: data
			}
		})
	}

	isDisabled() : boolean {
		return this.update_info_form_disabled;
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}

}
