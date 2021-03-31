import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UI_ROLE_DEFINITION } from '../../../../models/ui_role-definition.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { MatDialog } from '@angular/material';
import { UserService } from 'src/app/global/services/user-service/user.service';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { Subscription } from 'rxjs';
import { ConfirmationModalComponent } from '../../../page_components/confirmation-modal/confirmation-modal.component';
import { Router } from '@angular/router';

@Component({
	selector: 'app-new-advertiser',
	templateUrl: './new-advertiser.component.html',
	styleUrls: ['./new-advertiser.component.scss']
})

export class NewAdvertiserComponent implements OnInit {

	form_fields_view: any;
	form_invalid: boolean = true;
	is_submitted: boolean;
	server_error: string;
	dealers: API_DEALER[] = [];
	new_advertiser_form: FormGroup;	
	password_is_match: boolean;
	password_match_msg: string;
	password_is_valid: boolean;
	password_is_valid_msg: string;
	subscription: Subscription = new Subscription;
	back_btn: string;
	is_dealer: boolean = false;

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _form: FormBuilder,
		private _user: UserService,
		private _router: Router,
	) { }

	ngOnInit() {
		if (this._auth.current_user_value.roleInfo.dealerId) {
			this.is_dealer = true;
		}

		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.back_btn = '/dealer/users/create-user';
		} else if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.administrator){
			this.back_btn = '/administrator/users/create-user';
		}
		
		this.new_advertiser_form = this._form.group({
			roleid: [UI_ROLE_DEFINITION.advertiser],
            firstname: ['', Validators.required],
			lastname: ['', Validators.required],
			contactNumber: ['', Validators.required],
			dealerId: this._auth.current_user_value.roleInfo.dealerId || ['', Validators.required],
			dealer: [{value: '', disabled: true}, Validators.required],
			email: ['', Validators.required],
			password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
			re_password: ['', Validators.required],
			createdby: [this._auth.current_user_value.user_id]
		});

		this.subscription.add(
			this._dealer.get_dealers().subscribe(
				data => {
					this.dealers = data
				}
			)
		)

		this.subscription.add(
			this.new_advertiser_form.valueChanges.subscribe(
				data => {
					if (this.new_advertiser_form.valid && this.f.password.value === this.f.re_password.value) {
						this.form_invalid = false;
					} else {
						this.form_invalid = true;
					}
				}
			)
		)

		this.form_fields_view = [
			{
				label: 'Firstname',
				control: 'firstname',
				type: 'text',
				placeholder: 'Ex: John',
				width: 'col-lg-6'
			},
			{
				label: 'Lastname',
				control: 'lastname',
				type: 'text',
				placeholder: 'Ex: Doe',
				width: 'col-lg-6'
			},
			{
				label: 'Dealer',
				control: 'dealer_id',
				type: 'text',
				placeholder: 'Ex: Blue Iguana',
				width: 'col-lg-6',
				is_autocomplete: true,
				is_dealer: this.is_dealer
			},
			{
				label: 'Contact Number',
				control: 'contactNumber',
				type: 'text',
				placeholder: 'Ex: 1-222-456-7890',
				width: 'col-lg-6'
			},
			{
				label: 'Email Address',
				control: 'email',
				type: 'email',
				placeholder: 'Ex: admin@blueiguana.com',
				width: this.is_dealer ? 'col-lg-6' : 'col-lg-12'
			},
			{
				label: 'Password',
				control: 'password',
				type: 'password',
				placeholder: 'Note: Minimum of 8 characters',
				width: 'col-lg-6',
				password_field: true
			},
			{
				label: 'Re-type Password',
				control: 're_password',
				type: 'password',
				placeholder: 'Note: Must match entered password',
				width: 'col-lg-6',
				re_password_field: true
			},
		]

		this.subscription.add(
			this.f.password.valueChanges.subscribe(
				data => {
					if (this.f.password.invalid) {
						this.password_is_valid = false;
						this.password_is_valid_msg = "Must be atleast 8 characters"
					} else {
						this.password_is_valid = true;
						this.password_is_valid_msg = "Password is valid"
					}
				}
			)
		)

		this.subscription.add(
			this.f.re_password.valueChanges.subscribe(
				data => {
					if (this.f.password.value == this.f.re_password.value) {
						this.password_is_match = true;
						this.password_match_msg = "Password is match"
					} else {
						this.password_is_match = false;
						this.password_match_msg = "Password not match"
					}
				}
			)
		)
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	get f() {
		return this.new_advertiser_form.controls;
	}

	dealerSelected(e) {
		this.f.dealerId.setValue(e);
	}
	
	openConfirmationModal(status, message, data): void {
		var dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: status,
				message: message,
				data: data
			}
		})

		dialog.afterClosed().subscribe(r => {
			const route = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
			this._router.navigate([`/${route}/users/`]);
		})
	}

	createNewAdvertiser(formDirective) {
		this.is_submitted = true;
		this.form_invalid = true;

		if (!this._user.validate_email(this.f.email.value)) {
			this.openConfirmationModal('error', 'Oops something went wrong, Sorry!', 'The email you entered is not valid.'); 
			this.is_submitted = false;
			this.form_invalid = false;
			return false;
		}

		this._user.create_new_user(this.f.roleid.value, this.new_advertiser_form.value).subscribe(
			data => {
				this.openConfirmationModal('success', 'Account creation successful!', 'Advertiser account has been added to database.');
				formDirective.resetForm();
				this.is_submitted = false;
				this.form_invalid = false;
				this.new_advertiser_form.reset();
				this.ngOnInit();
			},
			error => {
				this.is_submitted = false; 
				this.form_invalid = false;
				this.openConfirmationModal('error', 'Oops something went wrong, Sorry!', error.error.message);
			}
		)
	}

}
