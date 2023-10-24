import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../../services/auth-service/auth.service';
import { City, State } from '../../../../models/ui_city_state_region.model';
import { ConfirmationModalComponent } from '../../../page_components/confirmation-modal/confirmation-modal.component';
import { LocationService } from '../../../../services/data-service/location.service';
import { UI_ROLE_DEFINITION, UI_ROLE_DEFINITION_TEXT } from '../../../../models/ui_role-definition.model';
import { UserService } from 'src/app/global/services/user-service/user.service';

@Component({
	selector: 'app-new-dealer',
	templateUrl: './new-dealer.component.html',
	styleUrls: ['./new-dealer.component.scss']
})
export class NewDealerComponent implements OnInit, OnDestroy {
	@Output() dealer_created = new EventEmitter();
	city_state: City[] = [];
	form_description: string = 'Fill the form below to create a new Dealer.';
	form_fields_view: any[];
	form_invalid: boolean = true;
	form_title: string = 'New Dealer';
	is_password_field_type = true;
	is_retype_password_field_type = true;
	is_submitted: boolean;
	new_dealer_form: FormGroup;
	password_is_match: boolean;
	password_match_msg: string;
	password_is_valid: boolean;
	password_is_valid_msg: string;
	server_error: string;
	state_region: State[] = [];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _form: FormBuilder,
		private _location: LocationService,
		private _router: Router,
		private _user: UserService
	) {}

	ngOnInit() {
		this._location.get_cities().subscribe((response: any[]) => {
			this.city_state = response.map((city) => {
				return new City(city.city, `${city.city}, ${city.state}`, city.state);
			});

			this.createForm();
		});
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	get f() {
		return this.new_dealer_form.controls;
	}

	createNewDealer(directive: FormGroupDirective): void {
		this.is_submitted = true;
		this.form_invalid = true;

		if (!this._user.validate_email(this.f.email.value)) {
			this.openConfirmationModal('error', 'Oops something went wrong, Sorry!', 'The email you entered is not valid.', false);
			this.is_submitted = false;
			this.form_invalid = false;
			return;
		}

		this._user
			.create_new_user(this.f.roleid.value, this.new_dealer_form.getRawValue())
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.openConfirmationModal('success', 'Account creation successful!', 'Dealer account has been added to database.', true);
					directive.resetForm();
					this.is_submitted = false;
					this.form_invalid = false;
					this.new_dealer_form.reset();
					this.ngOnInit();
				},
				(error) => {
					this.is_submitted = false;
					this.form_invalid = false;
					this.openConfirmationModal('error', 'Oops something went wrong, Sorry!', error.error.message, false);
				}
			);
	}

	citySelected(value: string): void {
		this.f.city.setValue(value.substr(0, value.indexOf(', ')));

		this._location
			.get_states_regions(value.substr(value.indexOf(',') + 2))
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					this.f.state.setValue(data[0].abbreviation);
					this.f.region.setValue(data[0].region);
				},
				(error) => {
					console.error(error);
				}
			);
	}

	openConfirmationModal(status: string, message: string, data: string, redirect: boolean): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});

		dialog.afterClosed().subscribe(() => {
			if (redirect) {
				this._router.navigate([`/${this.roleRoute}/users/`]);
			}
		});
	}

	togglePasswordFieldType(): void {
		this.is_password_field_type = !this.is_password_field_type;
	}

	toggleRetypePasswordFieldType(): void {
		this.is_retype_password_field_type = !this.is_retype_password_field_type;
	}

	private createForm(): void {
		this.form_fields_view = [
			{
				label: 'Owner Firstname',
				control: 'firstname',
				placeholder: 'Ex: John',
				width: 'col-lg-6',
				type: 'text'
			},
			{
				label: 'Owner Lastname',
				control: 'lastname',
				placeholder: 'Ex: Doe',
				width: 'col-lg-6',
				type: 'text'
			},
			{
				label: 'Dealer ID',
				control: 'generatedid',
				placeholder: 'Ex: D.001',
				width: 'col-lg-3',
				type: 'text'
			},
			{
				label: 'Dealer Alias',
				control: 'dealerIdAlias',
				placeholder: 'Ex: NCMPS-BLUEIGUANA-9921',
				width: 'col-lg-3',
				type: 'text'
			},
			{
				label: 'Business Name',
				control: 'businessName',
				placeholder: 'Ex: Blue Iguana',
				width: 'col-lg-6',
				type: 'text'
			},
			{
				label: 'Contact Person',
				control: 'contactPerson',
				placeholder: 'Ex: Jane Doe',
				width: 'col-lg-6',
				type: 'text'
			},
			{
				label: 'Contact Person Phone',
				control: 'contactNumber',
				placeholder: 'Ex: 1-222-456-7890',
				width: 'col-lg-6',
				type: 'text'
			},
			{
				label: 'City',
				control: 'city',
				placeholder: 'Ex: Los Angeles',
				width: 'col-lg-6',
				type: 'text',
				data: this.city_state,
				is_autocomplete: true
			},
			{
				label: 'State',
				control: 'state',
				placeholder: 'Ex: California',
				width: 'col-lg-3',
				type: 'text'
			},
			{
				label: 'Region',
				control: 'region',
				placeholder: 'Ex: NW',
				width: 'col-lg-3',
				type: 'text'
			},
			{
				label: 'Email Address',
				control: 'email',
				placeholder: 'Ex: admin@blueiguana.com',
				width: 'col-lg-12',
				type: 'email'
			},
			{
				label: 'Password',
				control: 'password',
				placeholder: 'Note: Minimum of 8 characters',
				width: 'col-lg-6',
				type: 'password',
				password_field: true
			},
			{
				label: 'Re-type Password',
				control: 're_password',
				placeholder: 'Note: Must match entered password',
				width: 'col-lg-6',
				type: 'password',
				re_password_field: true
			}
		];

		this.new_dealer_form = this._form.group({
			roleid: [UI_ROLE_DEFINITION.dealer],
			firstname: ['', Validators.required],
			lastname: ['', Validators.required],
			email: ['', Validators.required],
			password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
			re_password: [{ value: '', disabled: true }, Validators.required],
			contactNumber: ['', Validators.required],
			generatedid: ['', Validators.required],
			dealerIdAlias: ['', Validators.required],
			businessName: ['', Validators.required],
			contactPerson: ['', Validators.required],
			city: ['', Validators.required],
			state: [{ value: '', disabled: true }, Validators.required],
			region: [{ value: '', disabled: true }, Validators.required],
			createdby: [this._auth.current_user_value.user_id]
		});

		this.subscribeToFormChanges();
		this.subscribeToPasswordValidation();
	}

	private subscribeToFormChanges(): void {
		this.new_dealer_form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
			if (this.new_dealer_form.valid && this.f.password.value === this.f.re_password.value) {
				this.form_invalid = false;
			} else {
				this.form_invalid = true;
			}
		});
	}

	private subscribeToPasswordValidation(): void {
		this.f.password.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
			if (this.f.password.invalid) {
				this.password_is_valid = false;
				this.password_is_valid_msg = 'Must be atleast 8 characters';
			} else {
				this.password_is_valid = true;
				this.password_is_valid_msg = 'Password is valid';
			}

			if (!this.f.password.value || this.f.password.value.length === 0) {
				this.f.re_password.setValue(null);
				this.f.re_password.disable();
			} else {
				this.f.re_password.enable();
			}
		});

		this.f.re_password.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
			if (this.f.password.value == this.f.re_password.value && this.f.password.value.length !== 0) {
				this.password_is_match = true;
				this.password_match_msg = 'Password matches';
			} else {
				this.password_is_match = false;
				this.password_match_msg = 'Password does not match';
			}
		});
	}

	protected get roleRoute() {
		return this._auth.roleRoute;
	}
}
