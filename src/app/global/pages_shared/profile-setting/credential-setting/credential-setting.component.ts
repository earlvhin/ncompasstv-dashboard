import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService } from '../../../services/auth-service/auth.service';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from '../../../models/ui_role-definition.model';
import { API_USER_DATA } from '../../../models/api_user-data.model';
import { API_UPDATE_USER_INFO } from '../../../models/api_update-user-info.model';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../services/user-service/user.service';

@Component({
	selector: 'app-credential-setting',
	templateUrl: './credential-setting.component.html',
	styleUrls: ['./credential-setting.component.scss']
})
export class CredentialSettingComponent implements OnInit {
	change_password: FormGroup;
	change_password_form_disabled: boolean = true;
	current_password_validation_message: string;
	is_dealer: boolean = false;
	is_password_field_type = true;
	is_new_password_field_type = true;
	is_retype_password_field_type = true;
	other_settings_form: FormGroup;
	password_invalid: boolean;
	password_is_match: string;
	password_match: boolean = false;
	password_old_not_match: boolean;
	password_validation_message: string;
	user_data: API_USER_DATA;
	role: string;
	route: string;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _user: UserService,
		private _params: ActivatedRoute,
		private _form: FormBuilder,
		private _dialog: MatDialog
	) {}

	ngOnInit() {
		if (this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealer) {
			this.is_dealer = true;
		}
		this.change_password = this._form.group(
			this._params.paramMap
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(() => this.getUserById(this._params.snapshot.params.data).add(() => this.initializeOtherSettingsForm()))
		);
	}

	private initializeOtherSettingsForm(): void {
		this.other_settings_form = this._form.group({
			allowEmail: [0, Validators.required]
		});

		this.fillUpOtherSettingsForm();
	}

	private fillUpOtherSettingsForm(): void {
		const { allowEmail } = this.user_data;
		const value = allowEmail === 1 ? true : false;
		this.other_settings_form.get('allowEmail').setValue(value);
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getUserById(id) {
		return this._user
			.get_user_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					if ('message' in response) return;
					this.user_data = response as API_USER_DATA;
					this.readyChangePassword();
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	get passwordFormControl() {
		return this.change_password.controls;
	}

	mapPasswordChanges() {
		const { userId, firstName, middleName, lastName, email } = this.user_data;
		const isEmailAllowed = this.other_settings_form.get('allowEmail').value;
		const allowEmail = isEmailAllowed ? 1 : 0;

		return new API_UPDATE_USER_INFO(userId, firstName, middleName, lastName, email, this.passwordFormControl.new_password.value, allowEmail);
	}

	changeUserPassword() {
		this.change_password_form_disabled = true;

		const body = {
			userId: this.user_data.userId,
			password: this.passwordFormControl.new_password.value,
			oldPassword: this.passwordFormControl.current_password.value,
			updatedBy: this.currentUser.user_id
		};

		this._user
			.update_user(body)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.openConfirmationModal('success', 'Success!', 'Password changed succesfully'),
				(error: HttpErrorResponse) => {
					this.change_password_form_disabled = false;

					if (error.error.message.toLowerCase().includes('old password does not match')) {
						this.current_password_validation_message = 'Old password does not match';
						this.password_old_not_match = true;
					}
				}
			);
	}

	onSaveOtherSettings(): void {
		const { userId } = this.user_data;
		const isEmailAllowed = this.other_settings_form.get('allowEmail').value;
		const allowEmail = isEmailAllowed ? 1 : 0;
		const updatedBy = this.currentUser.user_id;
		const body = { userId, allowEmail, updatedBy };

		this._user
			.update_user(body)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.openConfirmationModal('success', 'Success', 'Updated email notification settings'),
				(error) => {
					throw new Error(error);
				}
			);
	}

	readyChangePassword() {
		this.change_password = this._form.group({
			new_password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
			re_password: ['', Validators.required],
			current_password: ['', Validators.required]
		});

		this.change_password.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
			if (this.passwordFormControl.new_password.invalid) {
				this.password_invalid = true;
				this.password_validation_message = 'Must be atleast 8 characters';
			} else {
				this.password_invalid = false;
				this.password_validation_message = 'Password Passed';
			}

			if (this.passwordFormControl.new_password.value == this.passwordFormControl.re_password.value) {
				this.password_match = true;
				this.password_is_match = 'Password Match';
			} else {
				this.password_match = false;
				this.password_is_match = 'Password Does Not Match';
			}

			if (this.change_password.valid && this.password_match) {
				this.change_password_form_disabled = false;
			} else {
				this.change_password_form_disabled = true;
			}
		});
	}

	openConfirmationModal(status, message, data): void {
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

	toggleNewPasswordFieldType(): void {
		this.is_new_password_field_type = !this.is_new_password_field_type;
	}

	togglePasswordFieldType(): void {
		this.is_password_field_type = !this.is_password_field_type;
	}

	toggleRetypePasswordFieldType(): void {
		this.is_retype_password_field_type = !this.is_retype_password_field_type;
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}
}
