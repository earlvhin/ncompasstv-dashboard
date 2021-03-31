import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../global/services/auth-service/auth.service';
import { USER_LOGIN } from 'src/app/global/models/api_user.model';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from '../../../global/models/ui_role-definition.model';
import { ThemePalette } from '@angular/material/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';

@Component({
	selector: 'app-login-form',
	templateUrl: './login-form.component.html',
	styleUrls: ['./login-form.component.scss']
})

export class LoginFormComponent implements OnInit {

	login_form: FormGroup;
	auth_error: boolean;
	error_msg: string;
	is_error: boolean;
	is_submitted: boolean;
	show_overlay: boolean;

	// Spinner
	color: ThemePalette = 'primary';
	mode: ProgressSpinnerMode = 'determinate';
	value = 50;

	constructor(
		private _auth: AuthService,
		private _form: FormBuilder,
		private _router: Router
	) { }

	control: string = 'username';

	login_form_view = [
		{
			label: 'Enter Email Address',
			control: 'username',
			placeholder: 'Ex: user@name.com',
			icon: 'fas fa-user',
			error: 'Email is required',
			type: 'email'
		},
		{
			label: 'Enter Password',
			control: 'password',
			placeholder: 'Password',
			icon: 'fas fa-lock',
			error: 'Password is required',
			type: 'password'
		}
	]

	ngOnInit() {
		this.login_form = this._form.group(
			{
				username: ['', Validators.required],
				password: ['', Validators.required]
			}
			)
		console.log(this.form[this.control])
	}

	// convenience getter for easy access to form fields
	get form() { return this.login_form.controls; }

	authUser() {
		this.is_submitted = true;

		if (this.login_form.invalid) {
			return;
		}
		
		this.show_overlay = true;

		this._auth.authenticate_user(this.login_form.value).pipe(first()).subscribe(
			(data: USER_LOGIN) => {
				const user_data = {
					user_id: data.userId,
					firstname: data.firstName,
					lastname: data.lastName,
					role_id: data.userRole.roleId,
					roleInfo: data.roleInfo,
					jwt: {
						token: data.token,
						refreshToken: data.refreshToken
					}
				}
				localStorage.setItem('current_user', JSON.stringify(user_data));
				localStorage.setItem('current_token', JSON.stringify(user_data.jwt));
				this.refreshToken(data.userRole.roleId);
			},
			error => {
				this.show_overlay = false;
				this.is_error = true;
				this.error_msg = `${error.error.message}`;
				console.log('#onSubmit - Error', error);
			}
		)
	}

	refreshToken(role) {
		// Store User Info and Token to Local Storage
		this.redirectToPage(role);
		if(!this._auth.refresh_token()) {
			// Invalid Tokens
			this.auth_error = true;
			this.error_msg = "Token Error";
			console.log(this.error_msg);
			return false;
		}
	}

	redirectToPage(role_data) {
		let role: string;

		switch (role_data) {
			case UI_ROLE_DEFINITION.administrator:
				role = UI_ROLE_DEFINITION_TEXT.administrator
				break;
			case UI_ROLE_DEFINITION.dealer:
				role = UI_ROLE_DEFINITION_TEXT.dealer
				break;
			case UI_ROLE_DEFINITION.host:
				role = UI_ROLE_DEFINITION_TEXT.host
				break;
			case UI_ROLE_DEFINITION.advertiser:
				role = UI_ROLE_DEFINITION_TEXT.advertiser
				break;
			case UI_ROLE_DEFINITION.tech:
				role = UI_ROLE_DEFINITION_TEXT.tech
				break;
			default:
				role = 'login'
		}
		this._router.navigate([role]);
	}
}
