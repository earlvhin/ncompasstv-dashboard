import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';

import { API_UPDATE_USER_PROFILE } from '../../../models/api_update-user-info.model';
import { AuthService } from '../../../services/auth-service/auth.service';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { UserService } from '../../../services/user-service/user.service';
import { USER_PROFILE } from '../../../models/api_user.model';

@Component({
	selector: 'app-user-setting',
	templateUrl: './user-setting.component.html',
	styleUrls: ['./user-setting.component.scss']
})
export class UserSettingComponent implements OnInit {
	subscription: Subscription = new Subscription();
	update_user: FormGroup;
	user_data: USER_PROFILE;
	update_info_form_disabled: boolean = false;
	update_info_form_disabled_typing: boolean = true;
	user_type: string;
	is_dealer = false;
	is_view_only = false;
	current_role: string;
	disabled_fields: boolean = true;
	user$: Observable<USER_PROFILE>;

	form_fields_view = [
		{
			label: 'User Type',
			control: 'usertype',
			placeholder: 'Ex: Admin',
			type: 'text',
			width: 'col-lg-6'
		},
		{
			label: 'Firstname',
			control: 'firstname',
			placeholder: 'Ex: John',
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
		},
		{
			label: 'Contact Number',
			control: 'contact',
			placeholder: 'Ex: 123-456-789',
			type: 'text',
			width: 'col-lg-6'
		}
	];

	// Additional Fields
	form_fields_view_additional = [
		{
			label: 'Address',
			control: 'address',
			placeholder: 'Ex: 989 E. Strawberry Ave. Chula Vista',
			type: 'text',
			width: 'col-lg-6'
		},
		{
			label: 'Region',
			control: 'region',
			placeholder: 'Ex: West',
			type: 'text',
			width: 'col-lg-6'
		},
		{
			label: 'City',
			control: 'city',
			placeholder: 'Ex: Los Angeles',
			type: 'text',
			width: 'col-lg-6'
		},
		{
			label: 'State',
			control: 'state',
			placeholder: 'Ex: CA',
			type: 'text',
			width: 'col-lg-6'
		}
	];

	constructor(
		private _auth: AuthService,
		private _user: UserService,
		private _params: ActivatedRoute,
		private _form: FormBuilder,
		private _dialog: MatDialog
	) {}

	ngOnInit() {
		this.update_info_form_disabled = false;

		this.update_user = this._form.group(
			this.subscription.add(
				this._params.paramMap.subscribe(() => {
					this.getUserById(this._params.snapshot.params.data);
				})
			)
		);

		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	getUserById(id: string): void {
		this.subscription.add(
			this._user.get_user_alldata_by_id(id).subscribe(
				(response: any) => {
					if (response.dealer.length > 0) {
						this.user_data = Object.assign({}, response.dealer[0], response.user);
						this.is_dealer = true;
					} else {
						this.user_data = response.user;
					}

					this.readyUpdateForm();
				},
				(error) => {
					throw new Error(error);
				}
			)
		);
	}

	get f() {
		return this.update_user.controls;
	}

	mapUserInfoChanges() {
		const { contact, firstname, lastname } = this.update_user.value;

		return {
			userId: this.user_data.userId,
			contactNumber: contact,
			firstName: firstname,
			lastName: lastname,
			updatedBy: this.currentUser.user_id
		};
	}

	updateUserInfo() {
		this._user.update_user(this.mapUserInfoChanges()).subscribe(
			() => {
				this.openConfirmationModal('success', 'Success!', 'User info changed succesfully');
				this.ngOnInit();
			},
			(error) => {
				throw new Error(error);
			}
		);
	}

	readyUpdateForm() {
		this.update_user = this._form.group({
			usertype: [{ value: this.user_data.userRoles[0].roleName, disabled: true }, Validators.required],
			firstname: [{ value: this.user_data.firstName, disabled: true }, Validators.required],
			lastname: [{ value: this.user_data.lastName, disabled: true }, Validators.required],
			email: [{ value: this.user_data.email, disabled: true }, Validators.required],
			contact: [{ value: this.user_data.contactNumber, disabled: true }, Validators.required],
			address: [{ value: this.user_data.address, disabled: true }, Validators.required],
			city: [{ value: this.user_data.city, disabled: true }, Validators.required],
			state: [{ value: this.user_data.state, disabled: true }, Validators.required],
			region: [{ value: this.user_data.region, disabled: true }, Validators.required]
		});
		this.subscription.add(
			this.update_user.valueChanges.subscribe((data) => {
				if (this.update_user.valid) {
					this.update_info_form_disabled_typing = false;
				} else {
					this.update_info_form_disabled_typing = true;
				}
			})
		);
	}

	openConfirmationModal(status, message, data): void {
		this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data
			}
		});
	}

	activateEdit(x) {
		if (x) {
			this.update_user.controls['contact'].enable();
			this.update_user.controls['firstname'].enable();
			this.update_user.controls['lastname'].enable();
		} else {
			this.update_user.controls['contact'].disable();
			this.update_user.controls['firstname'].disable();
			this.update_user.controls['lastname'].disable();
			this.readyUpdateForm();
		}
		this.update_info_form_disabled = x;
	}

	isDisabled(): boolean {
		return this.update_info_form_disabled;
	}

	private get currentUser() {
		return this._auth.current_user_value;
	}
}
