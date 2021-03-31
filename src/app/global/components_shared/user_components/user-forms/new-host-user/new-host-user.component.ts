import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { UI_ROLE_DEFINITION } from '../../../../models/ui_role-definition.model';
import { AuthService } from '../../../../services/auth-service/auth.service';
import { DealerService } from '../../../../services/dealer-service/dealer.service';
import { HostService } from '../../../../services/host-service/host.service';
import { API_HOST } from '../../../../models/api_host.model';
import { UserService } from '../../../../services/user-service/user.service';
import { ConfirmationModalComponent } from '../../../page_components/confirmation-modal/confirmation-modal.component';
import { Router } from '@angular/router';

@Component({
	selector: 'app-new-host-user',
	templateUrl: './new-host-user.component.html',
	styleUrls: ['./new-host-user.component.scss']
})

export class NewHostUserComponent implements OnInit {

	form_title: string = "New Host User";
	form_invalid: boolean = true;
	is_submitted: boolean;
	server_error: string;
	host_loading: boolean = true;
	hosts: API_HOST[] = [];
	new_host_form: FormGroup;
	no_host_place: boolean = false;
	password_is_match: boolean;
	password_match_msg: string;
	password_is_valid: boolean;
	password_is_valid_msg: string;
	subscription: Subscription = new Subscription;
	@Output() host_created = new EventEmitter();
	form_fields_view: any;
	back_btn: string;

	is_search: boolean = false;
	paging: any;
	loading_search: boolean = false;
	search_key: string = '';
	loading_data: boolean = true;
	hosts_data: any = [];

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _form: FormBuilder,
		private _host: HostService,
		private _user: UserService,
		private _router: Router,
	) { }

	ngOnInit() {

		if(this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			this.back_btn = '/dealer/users/create-user';
		} else if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.administrator){
			this.back_btn = '/administrator/users/create-user';
		}

		this.new_host_form = this._form.group(
			{
				roleid: [UI_ROLE_DEFINITION.host],
				firstname: ['', Validators.required],
				lastname: ['', Validators.required],
				address: '',
				host_place: [{ value: '', disabled: true }, Validators.required],
				contactNumber: ['', Validators.required],
				dealerId: ['', Validators.required],
				hostid: ['', Validators.required],
				email: ['', Validators.required],
				password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
				re_password: ['', Validators.required],
				createdBy: [this._auth.current_user_value.user_id]
			}
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
				label: 'Full Address (Optional)',
				control: 'address',
				type: 'text',
				placeholder: 'Ex: 51st Drive, Fifth Avenue Place, Global City, UK',
				width: 'col-lg-12'
			},
			{
				label: 'Host Place',
				control: 'host_place',
				type: 'text',
				placeholder: 'Ex: Blue Iguana',
				width: 'col-lg-6',
				is_autocomplete: true
			},
			{
				label: 'Contact Person Phone',
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
				width: 'col-lg-12'
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
				width: 'col-lg-6',
				placeholder: 'Note: Must match entered password',
				re_password_field: true
			},
		]

		this.subscription.add(
			this.new_host_form.valueChanges.subscribe(
				data => {
					if (this.new_host_form.valid && this.f.password.value === this.f.re_password.value) {
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
						this.password_match_msg = "Password is match"
					} else {
						this.password_is_match = false;
						this.password_match_msg = "Password not match"
					}
				}
			)
		)
		
		this.getHostPlaces(1);
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}
	
	get f() {
		return this.new_host_form.controls;
	}

	getHostPlaces(page) {
		if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
			if(this.search_key != "") {
				this.loading_search = true;
				this.hosts_data = [];
			}
			if(page > 1) {
				this.loading_data = true;
				this.subscription.add(
					this._host.get_host_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_key).subscribe(
						data => {
							data.hosts.map (
								i => {
									if(this.search_key != "") {
										this.hosts.push(i.host)
									} else {
										this.hosts.push(i.host)
									}
									this.hosts_data.push(i.host)
								}
							)
							this.paging = data.paging
							this.loading_data = false;
						}
					)
				)
			} else {
				this.subscription.add(
					this._host.get_host_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId, page, this.search_key).subscribe(
						data => {
							console.log("DD", data)
							if(!data.message) {
								data.hosts.map (
									i => {
										if(this.search_key != "") {
											this.hosts.push(i.host)
										} else {
											this.hosts.push(i.host)
										}
										this.hosts_data.push(i.host)
									}
								)
								this.paging = data.paging
							} else {
								this.no_host_place = true;
							}
							this.host_loading = false;
							this.loading_data = false;
							this.loading_search = false;
						}
					)
				)
			}
		} else {
			if(page > 1) {
				this.loading_data = true;
				this.subscription.add(
					this._host.get_host_by_page(page,this.search_key).subscribe(
						data => {
							data.host.map (
								i => {
									if(this.search_key != "") {
										this.hosts.push(i)
									} else {
										this.hosts.push(i)
									}
									this.hosts_data.push(i)
								}
							)
							this.paging = data.paging
							this.loading_data = false;
							this.loading_search = false;
						}
					)
				)
			} else {
				if(this.search_key != "") {
					this.loading_search = true;
					this.hosts_data = [];
				}
				this.subscription.add(
					this._host.get_host_by_page(page,this.search_key).subscribe(
						data => {
							if(!data.message) {
								data.host.map (
									i => {
										if(this.search_key != "") {
											this.hosts.push(i)
										} else {
											this.hosts.push(i)
										}
										this.hosts_data.push(i)
									}
								)
								this.paging = data.paging
							}
							this.host_loading = false;
							this.loading_data = false;
							this.loading_search = false;
						}
					)
				)
			}
		}
	}

	searchData(e) {
		this.search_key = e;
		this.getHostPlaces(1);
	}

	searchBoxTrigger (event) {
		this.is_search = event.is_search;
		if(this.is_search) {
			this.search_key = '';
			this.hosts_data = [];
			this.loading_search = true;
		}
		if(this.paging.hasNextPage || this.is_search) {
			this.getHostPlaces(event.page);
		}
	}

	createNewHost(formDirective) {
		this.is_submitted = true;
		this.form_invalid = true;

		if (!this._user.validate_email(this.f.email.value)) {
			this.openConfirmationModal('error', 'Oops something went wrong, Sorry!', 'The email you entered is not valid.'); 
			this.is_submitted = false;
			this.form_invalid = false;
			return false;
		}

		this._user.create_new_user(this.f.roleid.value, this.new_host_form.value).subscribe(
			data => {
				this.openConfirmationModal('success', 'Account creation successful!', 'Host Owner account has been added to database.');
				formDirective.resetForm();
				this.is_submitted = false;
				this.form_invalid = false;
				this.new_host_form.reset();
				this.ngOnInit();
			},
			error => {
				this.is_submitted = false; 
				this.form_invalid = false;
				this.openConfirmationModal('error', 'Oops something went wrong, Sorry!', error.error.message);
			}
		)
	}

	hostSelected(e) {
		const hostData = this.hosts.filter(h => {
			 return h.hostId === e;
		})
		
		this.f.dealerId.setValue(hostData[0].dealerId);
		this.f.hostid.setValue(e);
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
}
