import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { API_CREDIT_CARD_DETAILS, UI_CREDIT_CARD_DETAILS, UI_CURRENT_USER } from 'src/app/global/models';
import { DealerService } from 'src/app/global/services';


@Component({
	selector: 'app-payment-setting',
	templateUrl: './payment-setting.component.html',
	styleUrls: ['./payment-setting.component.scss']
})
export class PaymentSettingComponent implements OnInit, OnDestroy, OnChanges {
	@Input() currentUser: UI_CURRENT_USER;
	@Input() dealerEmail: string;
	@Input() dealerId: string;

	addressTypes = [ 'billing', 'dealer' ];
	currentAddress: string;
	dealerAddressForm: FormGroup;
	isFormLoaded = false;
	paymentSettingForm: FormGroup;

	private actualCreditCardDetails: API_CREDIT_CARD_DETAILS;
	private addressFormFields = [ 'AddressLine1', 'AddressLine2', 'AddressCity', 'AddressState', 'AddressZip' ];
	private creditCardEmail: string;
	private creditCardFormFields = [ 'Number', 'ExpirationYear', 'ExpirationMonth', 'Cvc', 'Name', 'Email' ];
	private hasCreditCardSaved = false;
	protected _unsubscribe = new Subject<void>();
	
	constructor(
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _formBuilder: FormBuilder
	) { }
	
	ngOnInit() {
		this.initializeForm();
		this.getCreditCards();
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.dealerEmail = changes.dealerEmail.currentValue;
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onSetAsCurrentAddress(event: { checked: true },  type: string): void {

		if (!event.checked && (this.currentAddress === type)) this.currentAddress = type === 'billing' ? 'dealer' : 'billing';
		else this.currentAddress = type;

		let dealerAddress = this.dealerAddressForm.value;

		if (!this.hasCreditCardSaved && this.currentAddress === 'billing') dealerAddress = { AddressLine1: null, AddressCity: null, AddressState: null, AddressZip: null };

		if (this.hasCreditCardSaved && this.currentAddress === 'billing') {

			const { address_line1, address_line2, address_city, address_state, address_zip } = this.actualCreditCardDetails;

			dealerAddress = { 
				AddressLine1: address_line1,
				AddressLine2: address_line2,
				AddressCity: address_city,
				AddressState: address_state,
				AddressZip: address_zip 
			};

		}

		this.paymentSettingForm.patchValue(dealerAddress);

	}

	onSubmit(): void {

		let data: UI_CREDIT_CARD_DETAILS = this.paymentSettingForm.value;

		if (this.hasCreditCardSaved) {
			this.addressFormFields.forEach(field => data[field] = this.paymentSettingForm.get(field).value);
			data.Name = this.actualCreditCardDetails.name;
			data.email = this.creditCardEmail;
			data.ExpirationYear = this.actualCreditCardDetails.exp_year;
			data.ExpirationMonth = this.actualCreditCardDetails.exp_month;
			data.cardid = this.actualCreditCardDetails.id;
		}

		const type = this.hasCreditCardSaved ? 'update' : 'create';
		data.dealerId = this.dealerId;

		this._dealer.save_credit_card_details(data, type).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {

					this._dialog.open(ConfirmationModalComponent, {
						width: '500px',
						height: '350px',
						data: { status: 'success', message: 'Success!', data: 'Details Saved' }
					});

					const cardDetails = response.card;

					let details: any = {
						AddressLine1: cardDetails.address_line1,
						AddressLine2: cardDetails.address_line2,
						AddressCity: cardDetails.address_city,
						AddressState: cardDetails.address_state,
						AddressZip: cardDetails.address_zip,
					};

					if (type === 'create') {

						this.actualCreditCardDetails = cardDetails;
						this.creditCardEmail = data.Email;

						let creditCardNumber = `************${cardDetails.last4}`;
						const expiryMonth = (cardDetails.exp_month < 10) ? `0${cardDetails.exp_month}` : cardDetails.exp_month;
						const expiryYearString = `${cardDetails.exp_year}`;
						const expiryYear = expiryYearString.substring(2, expiryYearString.length);

						details.Number = creditCardNumber;
						details.Name = cardDetails.name;
						details.ExpirationYear = expiryYear;
						details.ExpirationMonth = expiryMonth;
						details.Cvc = 123;
						details.Email = data.Email;

					}

					this.paymentSettingForm.patchValue(details);
					this.hasCreditCardSaved = true;
					this.disableCreditCardFields();

				},
				error => console.log('Error saving credit card details', error)
			);
	}

	private disableCreditCardFields(): void {

		this.creditCardFormFields.forEach(
			field => {
				const control = this.paymentSettingForm.get(field);
				control.disable();
			}
		);

	}

	private fillOutDealerAddressForm(): void {

		const { address, city, state, zip } = this.currentUser.roleInfo;

		this.dealerAddressForm.patchValue({
			AddressLine1: address,
			AddressCity: city,
			AddressState: state,
			AddressZip: zip
		});

		this.dealerAddressForm.disable();

	}

	private getCreditCards(): void {
		
		this._dealer.get_credit_cards(this.dealerId).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					
					if (!response.cards) {
						this.paymentSettingForm.get('Email').patchValue(this.dealerEmail);
						this.hasCreditCardSaved = false;
						return; 
					}

					this.actualCreditCardDetails = response.cards.data[0];
					this.creditCardEmail = response.email;
					const cardDetails = response.cards.data[0] as API_CREDIT_CARD_DETAILS;

					let creditCardNumber = `************${cardDetails.last4}`;
					const expiryMonth = (cardDetails.exp_month < 10) ? `0${cardDetails.exp_month}` : cardDetails.exp_month; 
					const expiryYearString = `${cardDetails.exp_year}`;
					const expiryYear = expiryYearString.substring(2, expiryYearString.length);

					const creditCardDetails = {
						Number: creditCardNumber,
						Name: cardDetails.name,
						ExpirationYear: expiryYear,
						ExpirationMonth: expiryMonth,
						Cvc: 123,
						Email: response.email,
						AddressLine1: cardDetails.address_line1,
						AddressLine2: cardDetails.address_line2,
						AddressCity: cardDetails.address_city,
						AddressState: cardDetails.address_state,
						AddressZip: cardDetails.address_zip
					};

					this.paymentSettingForm.patchValue(creditCardDetails);
					this.hasCreditCardSaved = true;
					this.disableCreditCardFields();
					this.currentAddress = 'billing';

				},
				(error: HttpErrorResponse) => {
					if (error.status === 400) this.hasCreditCardSaved = false;
				}
			);
	}

	private initializeForm(): void {

		let paymentSettingFormGroup = {};
		let dealerAddressFormGroup = {};

		this._formFields.forEach(
			field => {

				let value = field.value;
				let validators: any[] = [];

				if (field.is_required) validators.push(Validators.required);
				if (field.name === 'Cvc') validators.push(Validators.minLength(3));
				if (this.addressFormFields.includes(field.name)) dealerAddressFormGroup[field.name] = [ null, validators ];

				paymentSettingFormGroup[field.name] = [ value, validators ];
				
			}
		);

		this.paymentSettingForm = this._formBuilder.group(paymentSettingFormGroup);
		this.dealerAddressForm = this._formBuilder.group(dealerAddressFormGroup);
		this.fillOutDealerAddressForm();
		this.isFormLoaded = true;

	}

	protected get _formFields(): { name: string, label: string, type: string, value: any, is_required: boolean, maxLength?: number }[] {

		return [
			{ name: 'Number', label: 'Card Number', type: 'number', value: null, maxLength: 20, is_required: true },
			{ name: 'Name', label: 'Name on card', type: 'string', value: null, is_required: true },
			{ name: 'ExpirationYear', label: null, type: 'tel', value: null, maxLength: 2, is_required: true },
			{ name: 'ExpirationMonth', label: null, type: 'tel', value: null, maxLength: 2, is_required: true },
			{ name: 'Cvc', label: 'CVC', type: 'string', value: null, is_required: true },
			{ name: 'Email', label: 'Email', type: 'email', value: null, is_required: true },
			{ name: 'AddressLine1', label: 'Address Line 1', type: 'string', value: null, is_required: false },
			{ name: 'AddressLine2', label: 'Address Line 2', type: 'string', value: null, is_required: false },
			{ name: 'AddressCity', label: 'City', type: 'string', value: null, is_required: false },
			{ name: 'AddressState', label: 'State', type: 'string', value: null, is_required: false },
			{ name: 'AddressZip', label: 'ZIP Code', type: 'string', value: null, is_required: false }

		];

	}
	
}
