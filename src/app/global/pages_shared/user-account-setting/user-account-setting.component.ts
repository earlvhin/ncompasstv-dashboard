import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { UserService } from '../../services/user-service/user.service';
import { API_USER_DATA } from '../../models/api_user-data.model';
import { API_UPDATE_USER_INFO } from '../../models/api_update-user-info.model';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';
import { AuthService } from '../../services/auth-service/auth.service';

@Component({
  selector: 'app-user-account-setting',
  templateUrl: './user-account-setting.component.html',
  styleUrls: ['./user-account-setting.component.scss']
})

export class UserAccountSettingComponent implements OnInit {

	subscription: Subscription = new Subscription;
	change_password: FormGroup;
	user_data: API_USER_DATA;
	change_password_form_disabled: boolean = true;
	password_invalid: boolean;
	password_old_not_match: boolean;
	password_match: boolean = false;
	password_is_match: string;
	password_validation_message: string;
	current_password_validation_message: string;

	role: string;
	route: string;
	user$: Observable<API_USER_DATA>;

	constructor(
		private _user: UserService,
		private _params: ActivatedRoute,
		private _form: FormBuilder,
		private _dialog: MatDialog,
		private _auth: AuthService,
		private _router: Router,
	) { }

	ngOnInit() {	
    this.change_password = this._form.group(
      this.subscription.add(
        this._params.paramMap.subscribe(
          data => {
            this.getUserById(this._params.snapshot.params.data)
          }
        )
      )
    )
	}

	getUserById(id) {
		this.user$ = this._user.get_user_by_id(id);
		this.user$.subscribe(
			(data: any) => {
				this.user_data = data;
				this.readyChangePassword();
			}, 
			error => {
				console.log(error)
			}
		)
	}

	get passw() {
		return this.change_password.controls;
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
			}, 
			error => {
				this.change_password_form_disabled = false;
				console.log(error)
			}
		)
	}

	readyChangePassword() {
		this.change_password = this._form.group(
			{
				new_password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
        		re_password: ['', Validators.required],
        		current_password: ['', Validators.required]
			}
		)

		this.subscription.add(
			this.change_password.valueChanges.subscribe(
				data => {
          			if(this.passw.current_password.value != this.user_data.password) {
            			this.password_old_not_match = true;
						this.current_password_validation_message = 'Current Password is incorrect';
         			} else {
            			this.password_old_not_match = false;
						this.current_password_validation_message = 'Password Passed';
          			}
					if (this.passw.new_password.invalid) {
						this.password_invalid = true;
						this.password_validation_message = 'Must be atleast 8 characters';
					} else {
            			this.password_invalid = false;
						this.password_validation_message = 'Password Passed'
					}
					if (this.passw.new_password.value == this.passw.re_password.value) {
						this.password_match = true;
            			this.password_is_match = 'Password Match';
					} else {
						this.password_match = false;
						this.password_is_match = 'Password Does Not Match';
					}
					if(this.change_password.valid && this.password_match && !this.password_old_not_match) {
						this.change_password_form_disabled = false;
					} else {
						this.change_password_form_disabled = true;
					}
				}
			)
		)
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
			this._router.navigate([`/${route}/dashboard/`]);
		})
	}	
}
