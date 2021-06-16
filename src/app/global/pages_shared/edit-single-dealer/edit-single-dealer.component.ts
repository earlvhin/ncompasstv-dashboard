import { Component, OnInit, Inject, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Subject, Observable } from 'rxjs';

import { API_UPDATE_DEALER_PROFILE_BY_ADMIN } from '../../models/api_update-user-info.model';
import { API_UPDATE_DEALER_USER_PROFILE_BY_ADMIN } from '../../models/api_update-user-info.model';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { DealerService } from '../../services/dealer-service/dealer.service';
import { ReassignDealerComponent } from './reassign-dealer/reassign-dealer.component';
import { UserService } from '../../services/user-service/user.service';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'app-edit-single-dealer',
	templateUrl: './edit-single-dealer.component.html',
	styleUrls: ['./edit-single-dealer.component.scss']
})

export class EditSingleDealerComponent implements OnInit, OnDestroy {

	@Output() updated = new EventEmitter;

	dealer_form: FormGroup;
	email_not_valid : boolean = false;
	enable_update_form : boolean = false;
	has_duplicate_email : boolean = false;
	is_set_to_active = false;
	other_users: any;
	
	dealer_form_view = [
		{
			label: 'Business Name',
			control: 'business_name',
			placeholder: 'Ex. SM Center Pasig',
			col: 'col-lg-6'
		},
		{
			label: 'Dealer Id',
			control: 'dealer_id',
			col: 'col-lg-6 p-0',
		},	
		{
			label: 'Dealer Alias',
			control: 'dealer_alias',
			col: 'col-lg-6'
		},
		{
			label: 'Owner Firstname',
			control: 'owner_f_name',
			placeholder: 'Ex. John',
			col: 'col-lg-6 p-0'
		},
		{
			label: 'Owner Lastname',
			control: 'owner_l_name',
			placeholder: 'Ex. Doe',
			col: 'col-lg-6'
		},
		{
			label: 'Email Address',
			control: 'email',
			placeholder: 'Ex. dealer@mail.com',
			col: 'col-lg-6 p-0',
			type: 'email'
		},
		{
			label: 'Contact Number',
			control: 'c_number',
			placeholder: 'Ex. 0123456789',
			col: 'col-lg-6'
		},
		{
			label: 'Contact Person',
			control: 'c_person',
			placeholder: 'Ex. John Doe',
			col: 'col-lg-6 p-0'
		},
		{
			label: 'Address',
			control: 'address',
			placeholder: 'Ex. 123 Lot 14, Blk 9',
			col: 'col-lg-6'
		},
		{
			label: 'City',
			control: 'city',
			placeholder: 'Ex. St. Peter',
			col: 'col-lg-6 p-0',
		},
		{
			label: 'State',
			control: 'state',
			placeholder: 'Ex. MO',
			col: 'col-lg-3',
		},
		{
			label: 'Region',
			control: 'region',
			placeholder: 'Ex. MW',
			col: 'col-lg-3',
		},
		{
			label: 'Status',
			control: 'status',
			type: 'toggle',
			col: 'col-lg-6 p-0 mt-20'
		}
	];

	private duplicate_email: any;
	private status = '';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dealer_data: any,
		public _dialog_ref: MatDialogRef<EditSingleDealerComponent>,
		private _form: FormBuilder,
		private _user: UserService,
		private _dialog: MatDialog,
		private _dealer: DealerService
	) { }

	ngOnInit() {
		this.initializeForm();
		this.fillForm(this._dealer_data);
		this.getOtherUsers(1);
		this.subscribeToFormChanges();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
        this._unsubscribe.complete();
	}

	get f() { return this.dealer_form.controls; }

	fillForm(data: any) {

		this.f.business_name.setValue(data.businessName);
		this.f.dealer_id.setValue(data.dealerId);
		this.f.dealer_alias.setValue(data.dealerIdAlias);
		this.f.owner_f_name.setValue(data.firstName);
		this.f.owner_l_name.setValue(data.lastName);
		this.f.email.setValue(data.email);
		this.f.c_number.setValue(data.contactNumber);
		this.f.c_person.setValue(data.contactPerson);
		this.f.address.setValue(data.address);
		this.f.city.setValue(data.city);
		this.f.region.setValue(data.region);
		this.f.state.setValue(data.state);
		this.f.status.setValue(data.status);

		if (data.status !== 'A') this.is_set_to_active = false;
		else this.is_set_to_active = true;

		if (this.dealer_form.valid) this.enable_update_form = true;

	}

	onReassignDealer(): void {
		const editDialog = this._dialog_ref;
		const width = '350px';
		const height = '400px';

		editDialog.close('reassign-dealer');

		editDialog.afterClosed().subscribe(
			() => this._dialog.open(ReassignDealerComponent, {
				width,
				height,
				panelClass: 'position-relative',
				autoFocus: false,
				data: { dealer_id: this.dealer_form.get('dealer_id').value }
			}
		));
	}

	onSubmit(): void {
		
		let body_msg = 'This will deactivate the dealer. Proceed?';
		const currentStatus = this._dealer_data.status === 'A' ? 'active' : 'inactive';
		const newStatus = this.is_set_to_active ? 'active' : 'inactive';
		const return_msg = 'Success!';

		if (currentStatus === newStatus) {

			const observables = [ this.updateDealerData(), this.updateUserData() ];
			
			forkJoin(observables).pipe(takeUntil(this._unsubscribe))
				.subscribe(
					() => this.openConfirmationModal('success', 'Success!', 'Dealer info changed succesfully'), 
					error => console.log('Error updating dealer info', error)
				);

			return;

		}

		if (newStatus === 'active') {
			body_msg = 'This will activate the dealer. Proceed?';
		}

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: 'warning',
				message: 'Update Dealer and Status',
				data: body_msg,
				return_msg
			}
		});

		dialog.afterClosed().subscribe(
			response => {
				if (!response) return;
				const dealerId = this._dealer_data.dealerId;
				const status = newStatus === 'active' ? 'A' : 'C';

				const observables = [ 
					this.updateDealerData(),
					this.updateUserData(), 
				];
				
				forkJoin(observables).pipe(takeUntil(this._unsubscribe))
					.subscribe(
						() => {

							this.updateDealerStatus(dealerId, status).pipe(takeUntil(this._unsubscribe))
								.subscribe(
									() => this._dialog_ref.close(false),
									error => console.log('Error updating dealer status', error)
								);

						},
						error => console.log('Error updating dealer info', error)
					);

			},
			error => console.log('Error on closing confirmation modal', error)
		);

	}

	onToggleStatus(event: any): void {
		event.preventDefault();
		this.is_set_to_active = !this.is_set_to_active;
		if (this.is_set_to_active) this.status = 'active';
		else this.status = 'inactive';
	}

	private getOtherUsers(page: number): void {

		if (page == 1) {

			this._user.get_users_by_page(page, '').pipe(takeUntil(this._unsubscribe))
				.subscribe(
					data => {
						this.other_users = data.users;
						if(data.paging.hasNextPage) {
							this.getOtherUsers(data.paging.page + 1)
						}
					}
				);

		} else {

			this._user.get_users_by_page(page, '').pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data:any) => {
						data.users.map (
							i => {
								this.other_users.push(i)
							}
						)
						if(data.paging.hasNextPage) {
							this.getOtherUsers(data.paging.page + 1)
						}
					}
				);

		}
	}

	private checkEmailDuplicate(current_value: string): void {

		this.duplicate_email = this.other_users.filter(
			user => {
				if (user.email == current_value && current_value != this._dealer_data.email) {
					return user;
				}
			}
		);

		if (this.duplicate_email.length > 0) this.has_duplicate_email = true;			
		else this.has_duplicate_email = false;
	}

	private initializeForm(): void {

		this.dealer_form = this._form.group({
			dealer_id: [{value: '', disabled: true}, Validators.required],
			business_name: ['', Validators.required],
			dealer_alias: [''],
			owner_f_name: ['', Validators.required],
			owner_l_name: ['', Validators.required],
			email: ['', Validators.required],
			c_number: ['', Validators.required],
			c_person: ['', Validators.required],
			address: [''],
			city: ['', Validators.required],
			region: ['', Validators.required],
			state: ['', Validators.required],
			status: [ '', Validators.required ]
		});

	}

	private mapDealerInfoChanges(): API_UPDATE_DEALER_PROFILE_BY_ADMIN {
		return new API_UPDATE_DEALER_PROFILE_BY_ADMIN(
			this._dealer_data.userId,
			this.f.dealer_id.value,
			this.f.c_person.value,
			this.f.business_name.value,
			this.f.dealer_alias.value,
			this.f.email.value,
			this.f.c_number.value,
			this.f.address.value,
			this.f.region.value,
			this.f.city.value,
			this.f.state.value,
			this._dealer_data.userId
		);
	}
  
  	private mapUserInfoChanges(): API_UPDATE_DEALER_USER_PROFILE_BY_ADMIN {
		return new API_UPDATE_DEALER_USER_PROFILE_BY_ADMIN(
			this._dealer_data.userId,
			this.f.dealer_id.value,
			this.f.owner_f_name.value,
			this.f.owner_l_name.value,
			this.f.email.value,
		);
	}

	private openConfirmationModal(status: string, message: string, data: string): void {

		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: status,
				message: message,
				data: data
			}
		})

		dialogRef.afterClosed().subscribe(r => {
			this._dialog.closeAll();
		});

	}

	private subscribeToFormChanges(): void {

		this.dealer_form.valueChanges.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
					if (this._user.validate_email(data.email)) {
						this.checkEmailDuplicate(data.email);
						this.email_not_valid = false;
					} else {
						this.email_not_valid = true;
					}

					if (this.dealer_form.valid && !this.has_duplicate_email && !this.email_not_valid) {
						this.enable_update_form = true;
					} else {
						this.enable_update_form = false;
					}
				},
				error => console.log('Error on dealer form update', error)
			);

	}

	private updateUserData(): Observable<any> {
		return this._user.update_user(this.mapUserInfoChanges()).pipe(takeUntil(this._unsubscribe));
	}

	private updateDealerData(): Observable<any> {
		return this._dealer.update_dealer(this.mapDealerInfoChanges()).pipe(takeUntil(this._unsubscribe));
	}

	private updateDealerStatus(id: string, status: string): Observable<any> {
		return this._dealer.update_status(id, status).pipe(takeUntil(this._unsubscribe));
	}

}
