import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import * as filestack from 'filestack-js';
import { environment } from 'src/environments/environment';

import { LicenseService, AuthService, DealerService } from 'src/app/global/services';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { API_DEALER_VALUES, API_DEALER_VALUE, UI_ROLE_DEFINITION, ACTIVITY_LOGS } from 'src/app/global/models';

@Component({
	selector: 'app-dealers-view',
	templateUrl: './dealers-view.component.html',
	styleUrls: ['./dealers-view.component.scss']
})
export class DealersViewComponent implements OnInit {
	@Input() dealer: string;
	@Input() reload_dealer: boolean = false;

	accepted_file: any;
	all_info_data: API_DEALER_VALUES;
	billingDate: number;
	billingDateText: string;
	autoCharge: number;
	contracts: any = [];
	current_container: string;
	dealer_start_date: boolean = false;
	edit_mode: boolean;
	is_active: boolean = true;
	loaded_form: boolean = false;
	values_data: any;
	subscription: Subscription = new Subscription();
	current_count: number;
	update_info_form_disabled_typing: boolean = true;
	license_to_start: string;
	territory: any = [];
	update_billing: FormGroup;
	upload_mode: string;
	upload_holder: any;

	form_fields_view = [
		{
			label: 'License to Start',
			control: 'start',
			placeholder: 'Ex: 10',
			type: 'number',
			width: 'col-lg-6'
		},
		{
			label: '19 Months',
			control: 'nineteen',
			placeholder: 'Ex: 20',
			type: 'number',
			width: 'col-lg-6'
		},
		{
			label: '25 Months',
			control: 'twentyfive',
			placeholder: 'Ex: 25',
			type: 'number',
			width: 'col-lg-6'
		},
		{
			label: '31 Months',
			control: 'thirtyone',
			placeholder: 'Ex: 10',
			type: 'number',
			width: 'col-lg-6'
		},
		{
			label: '37 Months',
			control: 'thirtyseven',
			placeholder: 'Ex: 20',
			type: 'number',
			width: 'col-lg-6'
		},
		{
			label: 'Base Fee',
			control: 'base',
			placeholder: 'Ex: 50',
			type: 'number',
			width: 'col-lg-6'
		},
		{
			label: 'Price per License',
			control: 'price',
			placeholder: 'Ex: 100',
			type: 'number',
			width: 'col-lg-6'
		},
		{
			label: 'New License Price',
			control: 'new_price',
			placeholder: 'Ex: 100',
			type: 'number',
			width: 'col-lg-6'
		},
		{
			label: 'Billable Licenses',
			control: 'billable',
			placeholder: 'Ex: 20',
			type: 'number',
			width: 'col-lg-6'
		}
	];

	protected _unsubscribe = new Subject<void>();

	constructor(
		private _form: FormBuilder,
		private _dealer: DealerService,
		private _license: LicenseService,
		private _dialog: MatDialog,
		private _auth: AuthService,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.edit_mode = false;
		if (this._isDealer || this._isSubDealer) {
			this.dealer = this._auth.current_user_value.roleInfo.dealerId;
		} else {
			this.dealer = this.dealer;
			this.initializeCreateBillingForm();
			this.getDealerInfo(this.dealer);
		}

		this.getDealerValuesById(this.dealer);
		this.getDealerContractFiles(this.dealer);
		this.getDealerTerritoryFiles(this.dealer);
	}

	ngOnChanges() {
		if (this.reload_dealer) {
			this.ngOnInit();
		}
	}

	ngAfterContentChecked(): void {
		this.cdr.detectChanges();
	}

	getDealerInfo(id) {
		this._dealer.get_dealer_by_id(id).subscribe((response) => {
			if (response.startDate === null) {
				this.dealer_start_date = false;
				this.openConfirmationModal(
					'error',
					'Start Date is missing!',
					'To Edit Billing Controls, you must add a Start Date first under Dealer Profile Settings.'
				);
			} else {
				this.dealer_start_date = true;
			}

			if (response.status === 'A') {
				this.dealer_start_date = true;
			} else {
				this.dealer_start_date = false;
			}
		});
	}

	private updateBillingComputations(id) {
		// this.updateUserInfo();
	}

	private initializeCreateBillingForm() {
		this.update_billing = this._form.group({
			start: [{ value: '', disabled: true }, Validators.required],
			nineteen: [{ value: '', disabled: true }, Validators.required],
			twentyfive: [{ value: '', disabled: true }, Validators.required],
			thirtyone: [{ value: '', disabled: true }, Validators.required],
			thirtyseven: [{ value: '', disabled: true }, Validators.required],
			base: [{ value: '', disabled: true }, Validators.required],
			price: [{ value: '', disabled: true }, Validators.required],
			new_price: [{ value: '', disabled: true }, Validators.required],
			billable: [{ value: '', disabled: true }, Validators.required]
		});
	}

	onUploadBtn(mode) {
		const client = filestack.init(environment.third_party.filestack_api_key);
		this.upload_mode = mode;
		if (mode == 'contract') {
			this.accepted_file = ['.pdf'];
			this.current_container = 'n-compass-dealers/contract_details';
		} else {
			this.accepted_file = ['.png', '.jpg', '.jpeg'];
			this.current_container = 'n-compass-dealers/territory_details';
		}

		client.picker(this.filestackDocumentOptions).open();
	}

	protected get filestackDocumentOptions(): filestack.PickerOptions {
		return {
			storeTo: {
				location: 's3',
				container: this.current_container,
				region: 'us-east-2'
			},
			accept: this.accepted_file,
			maxFiles: 1,
			onUploadDone: (response) => {
				response.filesUploaded.map((uploaded) => {
					const { filename, key } = uploaded;
					this.upload_holder = [
						{
							dealerId: this.dealer,
							S3Filename: this.splitFileName(key),
							newFile: filename
						}
					];
				});

				if (this.upload_mode == 'contract') {
					this._dealer
						.upload_contract_files(this.upload_holder)
						.pipe(takeUntil(this._unsubscribe))
						.subscribe(
							() => this.ngOnInit(),
							(error) => {
								throw new Error(error);
							}
						);
				} else {
					this._dealer
						.upload_territory_files(this.upload_holder)
						.pipe(takeUntil(this._unsubscribe))
						.subscribe(
							() => this.ngOnInit(),
							(error) => {
								throw new Error(error);
							}
						);
				}
			}
		};
	}

	splitFileName(name) {
		const splitted_file_name = name.split('/').pop();
		return splitted_file_name;
	}

	popFileName(name) {
		const splitted_file_name = name.split('_').pop();
		return splitted_file_name;
	}

	getDealerContractFiles(id: string): void {
		this.subscription.add(
			this._dealer
				.get_dealer_contract_files(id)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe((response) => {
					if (response.length > 0) {
						this.contracts = response;
						this.contracts.map((contract) => {
							contract.newFilename = this.popFileName(contract.s3Filename);
						});
					} else {
						this.contracts = [];
					}
				})
		);
	}

	deleteFile(mode, data) {
		if (mode == 'contract') {
			this.subscription.add(
				this._dealer
					.delete_contract_details(data.s3Filename)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe((response) => {
						this.openConfirmationModal('success', 'Success!', 'File has been deleted succesfully');
						this.ngOnInit();
					})
			);
		} else {
			this.subscription.add(
				this._dealer
					.delete_territory_details(data.s3Filename)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe((response) => {
						this.openConfirmationModal('success', 'Success!', 'File has been deleted succesfully');
						this.ngOnInit();
					})
			);
		}
	}

	getDealerTerritoryFiles(id: string): void {
		this.subscription.add(
			this._dealer
				.get_dealer_territory_files(id)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe((response) => {
					if (response.length > 0) {
						this.territory = response;
						this.territory.map((territory) => {
							territory.newFilename = this.popFileName(territory.s3Filename);
						});
					} else {
						this.territory = [];
					}
				})
		);
	}

	getDealerValuesById(id: string): void {
		this.subscription.add(
			this._dealer
				.get_dealer_values_by_id(id)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(response) => {
						if (Object.prototype.hasOwnProperty.call(response, 'message')) {
							this.values_data = {
								month1: 0,
								month19: 0,
								month25: 0,
								month31: 0,
								month37: 0,
								baseFee: 0,
								perLicense: 0,
								billing: 0,
								billable: 0,
								billableLicenses: 0,
								licensePriceNew: 0
							};

							this.all_info_data = {
								currentMonth: 'Month1',
								currentMonthLicenseCount: 0,
								dealerValue: this.values_data,
								licensesDifference: 0,
								totalLicenses: 0
							};

							this.billingDateText = '0th';

							this.initializeCreateBillingForm();
							this.getTotalLicenses(id);

							return;
						}

						this.all_info_data = response as API_DEALER_VALUES;
						this.values_data = this.all_info_data.dealerValue;

						if (this.values_data.billingDate > 0) {
							this.billingDate = this.values_data.billingDate;
							this.billingDateText = `${this.billingDate}`;
							this.billingDateText += this.billingDate === 15 ? 'th' : 'st';
						}

						if (this.values_data.autoCharge != null) {
							this.autoCharge = this.values_data.autoCharge;
						}

						this.readyUpdateForm();
					},
					(error) => {
						throw new Error(error);
					}
				)
		);
	}

	getTotalLicenses(id) {
		this._license
			.get_licenses_total_by_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				this.all_info_data.totalLicenses = response.total;
			});
	}

	readyUpdateForm() {
		this.update_billing = this._form.group({
			start: [{ value: this.values_data.month1, disabled: true }, Validators.required],
			nineteen: [{ value: this.values_data.month19, disabled: true }],
			twentyfive: [{ value: this.values_data.month25, disabled: true }],
			thirtyone: [{ value: this.values_data.month31, disabled: true }],
			thirtyseven: [{ value: this.values_data.month37, disabled: true }],
			base: [{ value: this.values_data.baseFee, disabled: true }, Validators.required],
			price: [{ value: this.values_data.perLicense, disabled: true }, Validators.required],
			new_price: [{ value: this.values_data.licensePriceNew, disabled: true }, Validators.required],
			billable: [{ value: this.values_data.billableLicenses, disabled: true }, Validators.required]
		});

		this.subscription.add(
			this.update_billing.valueChanges.subscribe((data) => {
				if (this.update_billing.valid) {
					this.update_info_form_disabled_typing = false;
				} else {
					this.update_info_form_disabled_typing = true;
				}
			})
		);
	}

	activateEdit(x) {
		this.edit_mode = x;
		if (x) {
			this.update_billing.controls['start'].enable();
			this.update_billing.controls['nineteen'].enable();
			this.update_billing.controls['twentyfive'].enable();
			this.update_billing.controls['thirtyone'].enable();
			this.update_billing.controls['thirtyseven'].enable();
			this.update_billing.controls['base'].enable();
			this.update_billing.controls['price'].enable();
			this.update_billing.controls['new_price'].enable();
			this.update_billing.controls['billable'].enable();
		} else {
			this.update_billing.controls['start'].disable();
			this.update_billing.controls['nineteen'].disable();
			this.update_billing.controls['twentyfive'].disable();
			this.update_billing.controls['thirtyone'].disable();
			this.update_billing.controls['thirtyseven'].disable();
			this.update_billing.controls['base'].disable();
			this.update_billing.controls['price'].disable();
			this.update_billing.controls['new_price'].disable();
			this.update_billing.controls['billable'].disable();
			this.readyUpdateForm();
		}
	}

	updateUserInfo() {
		const newDealerActivityLog = new ACTIVITY_LOGS(this.dealer, 'modify_billing', this._auth.current_user_value.user_id);

		this._dealer.update_dealer_values(this.mapUserInfoChanges()).subscribe(
			() => {
				this.openConfirmationModal('success', 'Success!', 'Dealer Billing Info changed succesfully');
				this.ngOnInit();
			},
			(error) => {
				throw new Error(error);
			}
		);

		this.createActivity(newDealerActivityLog);
	}

	createActivity(activity) {
		this._dealer
			.create_dealer_activity_logs(activity)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					return data;
				},
				(error) => {
					console.log(error);
				}
			);
	}

	private openConfirmationModal(status: string, message: string, data: string) {
		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});

		dialogRef.afterClosed().subscribe(() => {
			this._dialog.closeAll();
		});
	}

	mapUserInfoChanges() {
		return {
			dealerId: this.dealer,
			month1: this.newBillingFormControls.start.value ? this.newBillingFormControls.start.value : 0,
			month19: this.newBillingFormControls.nineteen.value ? this.newBillingFormControls.nineteen.value : 0,
			month25: this.newBillingFormControls.twentyfive.value ? this.newBillingFormControls.twentyfive.value : 0,
			month31: this.newBillingFormControls.thirtyone.value ? this.newBillingFormControls.thirtyone.value : 0,
			month37: this.newBillingFormControls.thirtyseven.value ? this.newBillingFormControls.thirtyseven.value : 0,
			baseFee: this.newBillingFormControls.base.value,
			perLicense: this.newBillingFormControls.price.value,
			licensePriceNew: this.newBillingFormControls.new_price.value,
			billableLicenses: this.newBillingFormControls.billable.value,
			billingDate: this.billingDate,
			autoCharge: this.autoCharge
		};
	}

	billingDateChange(e) {
		this.billingDate = e.value;
	}

	autoChargeChange(e) {
		this.autoCharge = parseInt(e.value);
	}

	protected get newBillingFormControls() {
		return this.update_billing.controls;
	}

	get f() {
		return this.update_billing.controls;
	}

	public get _isDealer() {
		return this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer;
	}

	public get _isSubDealer() {
		return this._auth.current_user_value.role_id === UI_ROLE_DEFINITION['sub-dealer'];
	}
}
