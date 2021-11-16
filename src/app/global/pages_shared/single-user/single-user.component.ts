import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { forkJoin, Subject } from 'rxjs';

import { API_USER_DATA } from '../../models/api_user-data.model';
import { AuthService } from '../../services/auth-service/auth.service';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { UserService } from '../../services/user-service/user.service';
import { HelperService } from '../../services';

@Component({
	selector: 'app-single-user',
	templateUrl: './single-user.component.html',
	styleUrls: ['./single-user.component.scss']
})

export class SingleUserComponent implements OnInit, OnDestroy {

	info_form: FormGroup;
	info_form_disabled = false;
	is_initial_load = true;
	is_loading = true;
	is_password_field_type = true;
	is_retype_password_field_type = true;
	is_sub_dealer = false;
	password_form: FormGroup;
	password_form_disabled = false;
	password_is_match: string;
	password_invalid: boolean;
	password_match: boolean;
	password_validation_message: string;
	permissions = [ { label: 'View', value: 'V' }, { label: 'Edit', value: 'E' } ];
	user: API_USER_DATA;

	info_form_fields = [
		{
			label: 'Firstname',
			control: 'firstName',
			placeholder: 'Ex: John',
			type: 'text',
			width: 'col-lg-6',
			required: true
		},
		{
			label: 'Middlename',
			control: 'middleName',
			placeholder: 'Ex: Cruz',
			type: 'text',
			width: 'col-lg-6',
			required: false
		},
		{
			label: 'Lastname',
			control: 'lastName',
			placeholder: 'Ex: Doe',
			type: 'text',
			width: 'col-lg-6',
			required: true
		},
		{
			label: 'Email Address',
			control: 'email',
			placeholder: 'Ex: admin@blueiguana.com',
			type: 'email',
			width: 'col-lg-6',
			required: true
		},
		{
			label: 'Email Notification',
			control: 'allowEmail',
			type: 'toggle',
			required: true
		},
		{
			label: 'Permission',
			control: 'permission',
			type: 'radio',
			width: 'col-lg-6',
			name: 'permissionList',
			required: false
		},
	];

	private current_permission: string;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _form: FormBuilder,
		private _helper: HelperService,
		private _params: ActivatedRoute,
		private _router: Router,
		private _user: UserService,
	) { }

	ngOnInit() {
		this.getUserData();
	}

	private getUserData() {

		if (this.is_initial_load && (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer')) {
			this.setPageData(this._helper.singleUserData);
			this.initializeForms();
			this.is_initial_load = false;
			this.is_loading = false;
			return;
		}

		this._params.paramMap.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.getUserById(this._params.snapshot.params.data)
					.add(() => {
						this.initializeForms();
						this.is_loading = false;
					})
			);
	}

	ngOnDestroy() {
		this._unsubscribe.next();
        this._unsubscribe.complete();
	}

	get infoFormControls() {
		return this.info_form.controls;
	}

	get passwordFormControls() {
		return this.password_form.controls;
	}

	get can_delete_sub_dealer() {
		return this.currentRole === 'administrator' || this.currentRole === 'dealer';
	}

	changeUserPassword() {
		this.password_form_disabled = true;

		this._user.update_user(this.mapPasswordChanges()).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.openConfirmationModal('success', 'Success!', 'Password changed succesfully');
					this.ngOnInit();
				}, 
				error => {
					console.log('Error changing user password', error);
					this.password_form_disabled = false;
				}
			);
	}

	onDelete(userId: string): void {

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: 'warning',
				message: 'Delete User',
				data: 'Proceed deleting this user?'
			}
		});

		dialog.afterClosed().subscribe(
			response => {

				if (!response) return;

				this._user.deleteUser(userId).pipe(takeUntil(this._unsubscribe))
					.subscribe(
						() => this._router.navigate([`/${this.currentRole}/users`]),
						error => console.log('Error deleting user', error)
					);

			}
		);

	}

	togglePasswordFieldType(): void {
		this.is_password_field_type = !this.is_password_field_type;
	}

	toggleRetypePasswordFieldType(): void {
		this.is_retype_password_field_type = !this.is_retype_password_field_type;
	}

	updateUserInfo(): void {
		this.info_form_disabled = true;

		const observables = [ this._user.update_user(this.mapUserInfoChanges()) ];

		if (this.infoFormControls.permission.value !== this.current_permission) {
			const { userId } = this.user;
			const permission = this.infoFormControls.permission.value;
			observables.push(this._user.update_permission(userId, permission));
		}

		forkJoin(observables).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.openConfirmationModal('success', 'Success!', 'User info changed succesfully');
					this.ngOnInit();
				},
				error => {
					console.log('Error updating user info', error);
					this.password_form_disabled = false;
				}
			);

	}

	private get currentUser() {
		return this._auth.current_user_value;
	}
	
	private getUserById(id: string) {

		return this._user.get_user_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: API_USER_DATA) => {
					console.log('get user by id', response);
					this.setPageData(response);
				}, 
				error => console.log('Error retrieving user data', error)
			);

	}

	private initializeForms(): void {
		this.initializeInfoForm();
		this.initializePasswordForm();
		this.subscribeToUpdateFormChanges();
		this.subscribeToPasswordFormChanges();
	}

	private initializePasswordForm(): void {

		this.password_form = this._form.group(
			{
				new_password: [ '', Validators.compose([ Validators.required, Validators.minLength(8) ]) ],
				re_password: [ '', Validators.required ]
			}
		);

	}

	private initializeInfoForm(): void {
		let data: any;
		const config: any = {};
		const { userRoles } = this.user;
		const { permission } = userRoles[0];
		const controls = this.info_form_fields.map(field => field.control);

		controls.forEach(
			control => {

				let controlValue = [];

				switch (control) {
					case 'allowEmail':
						data = this.user[control] === 1 ? true : false;
						break;

					case 'permission':
						data = permission;
						break;

					default:
						data = this.user[control];
				}

				controlValue.push(data);
				config[control] = controlValue;

			}
		);

		// initialize update user form
		this.info_form = this._form.group(config);

	}

	private mapPasswordChanges() {
		const { userId, } = this.user;
		const password = this.passwordFormControls.new_password.value;
		const updatedBy = this.currentUser.user_id;
		return { userId, password, updatedBy };
	}

	private mapUserInfoChanges() {

		const { firstName, middleName, lastName, email, permission } = this.info_form.value;
		const isEmailAllowed = this.info_form.value.allowEmail;
		const allowEmail = isEmailAllowed ? 1 : 0;
		const { userId } = this.user;
		const updatedBy = this.currentUser.user_id;

		return {
			userId,
			firstName,
			middleName,
			lastName,
			email,
			allowEmail,
			permission,
			updatedBy,
		};
		
	}

	private setPageData(data: API_USER_DATA) {

		const { userRoles } = data;
		const { permission, roleName } = userRoles[0];

		this.user = data;
		this.user.permission = permission;
		this.current_permission = permission;
		this.is_sub_dealer = roleName === 'Sub Dealer';

	}

	private subscribeToUpdateFormChanges(): void {

		this.info_form.valueChanges.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					if (this.info_form.valid) this.info_form_disabled = false; 
					else this.info_form_disabled = true;
				}
			);

	}

	private subscribeToPasswordFormChanges(): void {

		this.password_form.valueChanges.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {

					const isValidForm = this.password_form.valid;
					const newPassword = this.password_form.value.new_password;
					const reTypePassword = this.password_form.value.re_password;

					if (this.passwordFormControls.new_password.invalid) {
						this.password_invalid = true;
						this.password_validation_message = 'Must be atleast 8 characters';
					} else {
						this.password_invalid = false;
						this.password_validation_message = 'Password Passed';
					}

					if (isValidForm && newPassword === reTypePassword) {
						this.password_match = true;
						this.password_is_match = 'Password Match';
						this.password_form_disabled = false;

					} else {
						this.password_match = false;
						this.password_is_match = 'Password Does Not Match';
						this.password_form_disabled = true;
					}

				}
			);

	}

	private openConfirmationModal(status: string, message: string, data: string): void {

		this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  { status, message, data }
		});

	}

	protected get currentRole() {
		return this._auth.current_role;
	}
	
}
