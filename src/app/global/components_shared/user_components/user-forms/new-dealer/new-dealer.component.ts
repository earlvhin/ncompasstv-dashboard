import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { UI_ROLE_DEFINITION } from '../../../../models/ui_role-definition.model';
import { AuthService } from '../../../../services/auth-service/auth.service';
import { DealerService } from '../../../../services/dealer-service/dealer.service';
import { UserService } from 'src/app/global/services/user-service/user.service';
import { LocationService } from '../../../../services/data-service/location.service';
import { City, State } from '../../../../models/ui_city_state_region.model';
import { ConfirmationModalComponent } from '../../../page_components/confirmation-modal/confirmation-modal.component';
import { Router } from '@angular/router';

@Component({
	selector: 'app-new-dealer',
	templateUrl: './new-dealer.component.html',
	styleUrls: ['./new-dealer.component.scss']
})

export class NewDealerComponent implements OnInit {

	@Output() dealer_created = new EventEmitter();
	city_state: City[] = [];
	form_description: string = "Fill the form below to create a new Dealer.";
	form_fields_view: any[];
	form_invalid: boolean = true;
	form_title: string = "New Dealer";
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
	subscription: Subscription = new Subscription;

	constructor(
		private _auth: AuthService,
		private _form: FormBuilder,
		private _location: LocationService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _user: UserService,
		private _router: Router,
	) { }

	ngOnInit() {
		this._location.get_cities().subscribe(
			(response: any[]) => {

				this.city_state = response.map(
					city => {
						return new City(
							city.city,
							`${city.city}, ${city.state}`,
							city.state
						);
					}
				);

				this.createForm();
			}
		)
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}
	
	createForm() {
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
				label: 'Dealer Alias',
				control: 'generatedid',
				placeholder: 'Ex: NCMPS-BLUEIGUANA-9921',
				width: 'col-lg-6',
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
				type: 'text',
			},
			{
				label: 'Region',
				control: 'region',
				placeholder: 'Ex: NW',
				width: 'col-lg-3',
				type: 'text',
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
			},
		]

		this.new_dealer_form = this._form.group(
			{
				roleid: [UI_ROLE_DEFINITION.dealer],
				firstname: ['', Validators.required],
				lastname: ['', Validators.required],
				email: ['', Validators.required],
				password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
				re_password: ['', Validators.required],
				contactNumber: ['', Validators.required],
				generatedid: ['', Validators.required],
				businessName: ['', Validators.required],
				contactPerson: ['', Validators.required],
				city: ['', Validators.required],
				state: [{value: '', disabled: true}, Validators.required],
				region: [{value: '', disabled: true}, Validators.required],
				createdby: [this._auth.current_user_value.user_id]
			}
		)

		this.subscription.add(
			this.new_dealer_form.valueChanges.subscribe(
				data => {
					if (this.new_dealer_form.valid && this.f.password.value === this.f.re_password.value) {
						this.form_invalid = false;
					} else {
						this.form_invalid = true;
					}
				}
			)
		)

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
						this.password_match_msg = "Password matches"
					} else {
						this.password_is_match = false;
						this.password_match_msg = "Password does not match"
					}
				}
			)
		)
	}

	createNewDealer(formDirective) {	
		this.is_submitted = true;
		this.form_invalid = true;

		if (!this._user.validate_email(this.f.email.value)) {
			this.openConfirmationModal('error', 'Oops something went wrong, Sorry!', 'The email you entered is not valid.'); 
			this.is_submitted = false;
			this.form_invalid = false;
			return false;
		}

		this._user.create_new_user(this.f.roleid.value, this.new_dealer_form.getRawValue()).subscribe(
			data => {
				this.openConfirmationModal('success', 'Account creation successful!', 'Dealer account has been added to database.');
				formDirective.resetForm();
				this.is_submitted = false;
				this.form_invalid = false;
				this.new_dealer_form.reset();
				this.ngOnInit();
			},
			error => {
				this.is_submitted = false; 
				this.form_invalid = false;
				this.openConfirmationModal('error', 'Oops something went wrong, Sorry!', error.error.message);
			}
		)
	}

	get f() {
		return this.new_dealer_form.controls;
	}

	citySelected(e) {
		this.f.city.setValue(e.substr(0, e.indexOf(', ')));
		this._location.get_states_regions(e.substr(e.indexOf(",")+2)).subscribe(
			data => {
				this.f.state.setValue(data[0].abbreviation);
				this.f.region.setValue(data[0].region);
			}
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
			this._router.navigate([`/${route}/dealers/`]);
		})
	}

	togglePasswordFieldType(): void {
		this.is_password_field_type = !this.is_password_field_type;
	}

	toggleRetypePasswordFieldType(): void {
		this.is_retype_password_field_type = !this.is_retype_password_field_type;
	}
}
