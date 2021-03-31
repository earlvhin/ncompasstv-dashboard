import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { UserService } from '../../services/user-service/user.service';
import { API_USER_DATA } from '../../models/api_user-data.model';
import { API_UPDATE_USER_INFO } from '../../models/api_update-user-info.model';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-single-user',
	templateUrl: './single-user.component.html',
	styleUrls: ['./single-user.component.scss']
})

export class SingleUserComponent implements OnInit {

	subscription: Subscription = new Subscription;
	update_user: FormGroup;
	change_password: FormGroup;
	user_data: API_USER_DATA;
	update_info_form_disabled: boolean = true;
	change_password_form_disabled: boolean = true;
	password_invalid: boolean;
	password_match: boolean;
	password_is_match: string;
	password_validation_message: string;
	form_fields_view = [
		{
			label: 'Firstname',
			control: 'firstname',
			placeholder: 'Ex: John',
			type: 'text',
			width: 'col-lg-6'
		},
		{
			label: 'Middlename',
			control: 'middlename',
			placeholder: 'Ex: Cruz',
			type: 'text',
			width: 'col-lg-6'
		},
		{
			label: 'Lastname',
			control: 'lastname',
			placeholder: 'Ex: Doe',
			type: 'text',
			width: 'col-lg-6'
		},
		{
			label: 'Email Address',
			control: 'email',
			placeholder: 'Ex: admin@blueiguana.com',
			type: 'email',
			width: 'col-lg-6'
		}
	]

	user$: Observable<API_USER_DATA>;

	constructor(
		private _user: UserService,
		private _params: ActivatedRoute,
		private _form: FormBuilder,
		private _dialog: MatDialog
	) { }

	ngOnInit() {	
		this.subscription.add(
			this._params.paramMap.subscribe(
				data => {
					this.getUserById(this._params.snapshot.params.data)
				}
			)
		)
	}

	getUserById(id) {
		this.user$ = this._user.get_user_by_id(id);
		this.user$.subscribe(
			(data: any) => {
				this.user_data = data;
				this.readyUpdateForm();
				this.readyChangePassword();
			}, 
			error => {
				console.log(error)
			}
		)
	}

	get f() {
		return this.update_user.controls;
	}

	get passw() {
		return this.change_password.controls;
	}

	mapUserInfoChanges() {
		return new API_UPDATE_USER_INFO(
			this.user_data.userId,
			this.f.firstname.value,
			this.f.middlename.value,
			this.f.lastname.value,
			this.f.email.value,
			this.user_data.password
		)
	}

	mapPasswordChanges() {
		return new API_UPDATE_USER_INFO(
			this.user_data.userId,
			this.user_data.firstName,
			this.user_data.middleName,
			this.user_data.lastName,
			this.user_data.email,
			this.passw.new_password.value
		)
	}

	changeUserPassword() {
		this.change_password_form_disabled = true;
		this._user.update_user(this.mapPasswordChanges()).subscribe(
			data => {
				console.log(data)
				this.openConfirmationModal('success', 'Success!', 'Password changed succesfully');
				this.ngOnInit();
			}, 
			error => {
				this.change_password_form_disabled = false;
				console.log(error)
			}
		)
	}

	updateUserInfo() {
		this.update_info_form_disabled = true;
		this._user.update_user(this.mapUserInfoChanges()).subscribe(
			data => {
				console.log(data)
				this.openConfirmationModal('success', 'Success!', 'User info changed succesfully');
				this.ngOnInit();
			}, 
			error => {
				this.change_password_form_disabled = false;
				console.log(error)
			}
		)
	}

	readyUpdateForm() {
		this.update_user = this._form.group(
			{
				firstname: [this.user_data.firstName, Validators.required],
				middlename: [this.user_data.middleName || null],
				lastname: [this.user_data.lastName, Validators.required],
				email: [{value: this.user_data.email, disabled: true}, Validators.required]
			}
		)

		this.subscription.add(
			this.update_user.valueChanges.subscribe(
				data => {
					if (this.update_user.valid) {
						this.update_info_form_disabled = false;
					} else {
						this.update_info_form_disabled = true;
					}
				}
			)
		)
	}

	readyChangePassword() {
		this.change_password = this._form.group(
			{
				new_password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
				re_password: ['', Validators.required]
			}
		)

		this.subscription.add(
			this.change_password.valueChanges.subscribe(
				data => {
					if (this.passw.new_password.invalid) {
						this.password_invalid = true;
						this.password_validation_message = 'Must be atleast 8 characters';
					} else {
						this.password_invalid = false;
						this.password_validation_message = 'Password Passed'
					}

					if (this.change_password.valid && this.passw.new_password.value == this.passw.re_password.value) {
						this.password_match = true;
						this.password_is_match = 'Password Match';
						this.change_password_form_disabled = false;
					} else {
						this.password_match = false;
						this.password_is_match = 'Password Does Not Match';
						this.change_password_form_disabled = true;
					}
				}
			)
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
}
