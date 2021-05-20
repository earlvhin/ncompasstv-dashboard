import { Component, OnInit } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { LicenseService } from '../../../../global/services/license-service/license.service';
import { AdvertiserService } from '../../../../global/services/advertiser-service/advertiser.service';
import { HostService } from '../../../../global/services/host-service/host.service';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { DEALER_PROFILE } from '../../../../global/models/api_user.model';
import { DealerService } from '../../../../global/services/dealer-service/dealer.service';
import { UserService } from '../../../../global/services/user-service/user.service';
import { DatePipe } from '@angular/common';
import { ConfirmationModalComponent } from '../../../../global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { API_UPDATE_DEALER_PROFILE } from '../../../../global/models/api_update-user-info.model';
import { API_UPDATE_DEALER_USER_PROFILE } from '../../../../global/models/api_update-user-info.model';
import { ContentService } from 'src/app/global/services/content-service/content.service';

@Component({
  selector: 'app-dealer-profile',
  templateUrl: './dealer-profile.component.html',
  styleUrls: ['./dealer-profile.component.scss'],
  providers: [DatePipe]
})
export class DealerProfileComponent implements OnInit {
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
	subscription: Subscription = new Subscription();
	user_data: DEALER_PROFILE; 
	update_info_form_disabled: boolean = false;
	update_info_form_disabled_typing: boolean = true;
	update_user: FormGroup;

  	constructor(
		private _license: LicenseService,
		private _advertiser: AdvertiserService,
		private _auth: AuthService,
		private _host: HostService,
		private _form: FormBuilder,
		private _params: ActivatedRoute,
		private _dealer: DealerService,
		private _user: UserService,
		private _date: DatePipe,
		private _dialog: MatDialog,
		private _content: ContentService,
	) { }

  	ngOnInit() {
		this.getTotalLicenses(this._auth.current_user_value.roleInfo.dealerId);
		this.getTotalAdvertisers(this._auth.current_user_value.roleInfo.dealerId);
		this.getTotalHosts(this._auth.current_user_value.roleInfo.dealerId);
		this.getTotalContents(this._auth.current_user_value.roleInfo.dealerId);
		this.update_info_form_disabled = false;
		this.update_user = this._form.group(
			this.subscription.add(
				this._params.paramMap.subscribe(
					data => {
					this.getUserById(this._params.snapshot.params.data)
					}
				)
			)
		)
  	}

  	getTotalContents(id) {
		this.subscription.add(
			this._content.get_contents_total_by_dealer(id).subscribe(
				(data: any) => {
					this.content_details.basis = data.total;
					this.content_details.basis_label = 'Media Library';
					this.content_details.good_value = data.totalImages;
					this.content_details.good_value_label = 'Images';
					this.content_details.bad_value =  data.totalVideos;
					this.content_details.bad_value_label = 'Videos';
					this.content_details.additional_value = data.totalFeeds;
					this.content_details.additional_value_label = 'Feed';
					this.loading_content = false;
				}
			)
		)
	}

	getUserById(id) {
		this.subscription.add(
			this._user.get_user_alldata_by_id(id).subscribe(
				(data: any) => {
					this.user_data = Object.assign({},data.user, data.dealer[0]);
					this.user_data.dateCreated = this._date.transform(this.user_data.dateCreated, 'MMM dd, yyyy')
					this.readyUpdateForm();
				}, 
				error => {
					console.log('Error', error);
				}
			)
		)
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

		this.subscription.add(
			this.update_user.valueChanges.subscribe(
				data => {
					if (this.update_user.valid) {
						this.update_info_form_disabled_typing = false;
					} else {
						this.update_info_form_disabled_typing = true;
					}
				}
			)
		)
	}

	activateEdit(x) {
		if(x) {
			this.update_user.controls['contact_person'].enable();
			this.update_user.controls['business_name'].enable(); 
			this.update_user.controls['owner_f_name'].enable(); 
			this.update_user.controls['owner_l_name'].enable(); 
		} else {
			this.update_user.controls['contact_person'].disable();
			this.update_user.controls['business_name'].disable();
			this.update_user.controls['owner_f_name'].disable(); 
			this.update_user.controls['owner_l_name'].disable();  
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
			this.user_data.userId
		)
	}
  
	mapUserInfoChanges() {
		return new API_UPDATE_DEALER_USER_PROFILE(
			this.user_data.userId,
			this.user_data.dealerId,
			this.f.owner_f_name.value,
			this.f.owner_l_name.value
		)
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

  getTotalLicenses(id) {
    this.subscription.add(
		this.subscription.add(
			this._license.get_license_total_per_dealer(id).subscribe(
				(data: any) => {
					this.license_details.basis = data.total;
					this.license_details.basis_label = 'Licenses';
					this.license_details.good_value = data.totalActive;
					this.license_details.good_value_label = 'Active';
					this.license_details.bad_value = data.totalInActive;
					this.license_details.bad_value_label = 'Inactive';
					this.loading_license = false;
				}
			)
		)
	)
  }

  getTotalAdvertisers(id) {
    this.subscription.add(
		this.subscription.add(
			this._advertiser.get_advertisers_total_by_dealer(id).subscribe(
				data => {
					this.advertiser_details.basis = data.total;
					this.advertiser_details.basis_label = 'Advertisers';
					this.advertiser_details.good_value = data.totalActive;
					this.advertiser_details.good_value_label = 'Active';
					this.advertiser_details.bad_value = data.totalInActive;
					this.advertiser_details.bad_value_label = 'Inactive';
					this.loading_advertiser = false;
				}
			)
		)
	)
  }

  	getTotalHosts(id) {
		this.subscription.add(
			this._host.get_host_total_per_dealer(id).subscribe(
				data => {
					this.host_details.basis = data.total;
					this.host_details.basis_label = 'Hosts';
					this.host_details.good_value = data.totalActive;
					this.host_details.good_value_label = 'Active';
					this.host_details.bad_value = data.totalInActive;
					this.host_details.bad_value_label = 'Inactive';
					this.loading_host = false;
				}
			)
		)
  	}
}
