import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ACTIVITY_LOGS, API_CREDIT_CARD_DETAILS, UI_CREDIT_CARD_DETAILS, UI_CURRENT_USER } from '../../../models';
import { AuthService, DealerService } from '../../../services';
import { BillingService } from '../../../services/billing-service/billing-service';
import { AddCardComponent } from '../../../pages_shared/profile-setting/payment-setting/add-card/add-card.component';
import { ViewCardsComponent } from '../../../pages_shared/profile-setting/payment-setting/view-cards/view-cards.component';

@Component({
	selector: 'app-payment-setting',
	templateUrl: './payment-setting.component.html',
	styleUrls: ['./payment-setting.component.scss']
})
export class PaymentSettingComponent implements OnInit, OnDestroy {
	@Input() currentUser: UI_CURRENT_USER;
	@Input() dealerEmail: string;
	@Input() dealerId: string;

	addressTypes = ['billing', 'dealer'];
	billingDetails: any;
	cardNumber: any = '';
	cardSelected: any;
	dealerAddressForm: FormGroup;
	cardForm: FormGroup;
	isFormLoaded = false;
	loadingDetails = true;
	paymentSettingForm: FormGroup;

	actualCreditCardDetails: any = [];
	addressFormFields = ['AddressLine1', 'AddressLine2', 'AddressCity', 'AddressState', 'AddressZip'];
	protected _unsubscribe = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _billing: BillingService,
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _formBuilder: FormBuilder
	) {}

	ngOnInit() {
		this.loadingDetails = true;
		this.subscribeToDealerDataLoaded();
		this.initializeForm();
		this.getCreditCards();
		this.cardForm.disable();
		this.cardNumber = '';
	}

	// ngOnChanges(changes: SimpleChanges): void {
	// 	this.dealerEmail = changes.dealerEmail.currentValue;
	//     // if(this.cardForm) {
	//         this.cardForm.get('Email').patchValue(this.dealerEmail);
	//     // }
	// }

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onSetAsCurrentAddress(event): void {
		if (event.checked) {
			this.paymentSettingForm.patchValue({
				AddressLine1: this.dealerAddressForm.get('AddressLine1').value,
				AddressCity: this.dealerAddressForm.get('AddressCity').value,
				AddressState: this.dealerAddressForm.get('AddressState').value,
				AddressZip: this.dealerAddressForm.get('AddressZip').value
			});
		} else {
			this.populateBillingAddress();
		}
	}

	updateBillingDetails() {
		const updateBillingAddress = new ACTIVITY_LOGS(this.dealerId, 'update_billing_address', this._auth.current_user_value.user_id);
		var billing = {
			DealerId: this.dealerId,
			AddressLine1: this.paymentSettingForm.get('AddressLine1').value,
			AddressLine2: this.paymentSettingForm.get('AddressLine2').value,
			AddressCity: this.paymentSettingForm.get('AddressCity').value,
			AddressState: this.paymentSettingForm.get('AddressState').value,
			AddressZip: this.paymentSettingForm.get('AddressZip').value
		};

		this._billing
			.update_billing_details(billing)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				if (response) {
					this.openConfirmationModal('success', 'Success!', 'Billing Address successfully saved.');
					this.createActivity(updateBillingAddress);
				}
			});
	}

	openConfirmationModal(status, message, data): void {
		var dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});

		dialog.afterClosed().subscribe(() => this.ngOnInit());
	}

	deleteCard() {
		this.warningModal('warning', 'Delete Card', 'Are you sure you want to delete this card?', '', 'delete_card', this.cardSelected[0].id);
	}

	warningModal(status: string, message: string, data: string, return_msg: string, action: string, id: any): void {
		const deleteCardActivity = new ACTIVITY_LOGS(this.dealerId, 'delete_card', this._auth.current_user_value.user_id);

		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data, return_msg, action }
		});

		dialogRef.afterClosed().subscribe((result) => {
			switch (result) {
				case 'delete_card':
					var card_to_delete = {
						cardId: this.cardSelected[0].id,
						dealerId: this.dealerId
					};
					this._billing
						.delete_credit_card(card_to_delete)
						.pipe(takeUntil(this._unsubscribe))
						.subscribe(
							(response) => {
								this.openConfirmationModal('success', 'Success!', 'Credit card successfully deleted.');
								this.createActivity(deleteCardActivity);
							},
							(error: HttpErrorResponse) => {
								if (error.status === 400) {
									this.openConfirmationModal('error', 'Failed!', error.error.message);
								}
							}
						);
					this.ngOnInit();
					break;
				default:
			}
		});
	}

	updateCard() {
		const updateCardActivity = new ACTIVITY_LOGS(this.dealerId, 'update_card', this._auth.current_user_value.user_id);

		var card_to_update = {
			cardId: this.cardSelected[0].id,
			dealerId: this.dealerId,
			email: this.dealerEmail,
			Name: this.cardForm.get('Name').value,
			ExpirationYear: this.cardForm.get('ExpirationYear').value,
			ExpirationMonth: this.cardForm.get('ExpirationMonth').value
		};
		this._billing
			.update_credit_card(card_to_update)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					this.openConfirmationModal('success', 'Success!', 'Credit card details successfully updated.');
					this.createActivity(updateCardActivity);
				},
				(error: HttpErrorResponse) => {
					if (error.status === 400) {
						this.openConfirmationModal('error', 'Failed!', error.error.message);
					}
				}
			);
	}

	cardSelection(data) {
		if (data != '') {
			this.cardSelected = this.actualCreditCardDetails.filter((card) => {
				return card.last4 === data.value;
			});

			this.cardNumber = this.cardSelected[0].last4;
			this.cardForm.patchValue({
				Name: this.cardSelected[0].name,
				ExpirationMonth: this.cardSelected[0].exp_month,
				ExpirationYear: this.cardSelected[0].exp_year,
				Cvc: 123
			});

			this.cardForm.enable();
		} else {
			this.cardForm.disable();
		}
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
					console.error(error);
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

	addCard() {
		const dialogRef = this._dialog.open(AddCardComponent, {
			width: '700px',
			panelClass: 'app-add-card',
			disableClose: true,
			data: {
				email: this.dealerEmail,
				id: this.dealerId
			}
		});

		dialogRef.afterClosed().subscribe((response) => {
			this.ngOnInit();
		});
	}

	private getCreditCards(): void {
		this._dealer
			.get_credit_cards(this.dealerId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					if (!response.message) {
						// if (!response.cards) {
						this.dealerEmail = response.email;
						this.cardForm.get('Email').patchValue(this.dealerEmail);
						//     return;
						// }
						if (response.addressBook && response.addressBook.length > 0) {
							this.billingDetails = response.addressBook.filter((address) => address.typeId === 1);
							this.populateBillingAddress();
						} else {
							this.billingDetails = [];
						}
						this.actualCreditCardDetails = response.cards.data;
						this.actualCreditCardDetails.map((card) => {
							card.brand = card.brand.toLowerCase();
						});
						this.loadingDetails = false;
					} else {
						this.actualCreditCardDetails = [];
						this.loadingDetails = false;
					}
				},
				(error: HttpErrorResponse) => {
					if (error.status === 400) {
						// this.hasCreditCardSaved = false;

						this.loadingDetails = false;
					}
				}
			);
	}

	populateBillingAddress() {
		if (this.billingDetails.length > 0) {
			this.paymentSettingForm.patchValue({
				AddressLine1: this.billingDetails[0].address,
				AddressCity: this.billingDetails[0].city,
				AddressState: this.billingDetails[0].state,
				AddressZip: this.billingDetails[0].zip
			});
		} else {
			this.paymentSettingForm.patchValue({
				AddressLine1: '',
				AddressCity: '',
				AddressState: '',
				AddressZip: ''
			});
		}
	}

	private initializeForm(): void {
		let paymentSettingFormGroup = {};
		let dealerAddressFormGroup = {};
		let cardFormGroup = {};
		this._formFields.forEach((field) => {
			let value = field.value;
			let validators: any[] = [];
			if (field.is_required) validators.push(Validators.required);
			if (field.name === 'Cvc') validators.push(Validators.minLength(3));
			if (this.addressFormFields.includes(field.name)) dealerAddressFormGroup[field.name] = [null, validators];
			paymentSettingFormGroup[field.name] = [value, validators];
			cardFormGroup[field.name] = [value, validators];
		});
		this.paymentSettingForm = this._formBuilder.group(paymentSettingFormGroup);
		this.dealerAddressForm = this._formBuilder.group(dealerAddressFormGroup);
		this.cardForm = this._formBuilder.group(cardFormGroup);
		this.fillOutDealerAddressForm();
		this.isFormLoaded = true;
	}

	private subscribeToDealerDataLoaded(): void {
		this._dealer.onDealerDataLoaded.pipe(takeUntil(this._unsubscribe)).subscribe((response) => (this.dealerEmail = response.email));
	}

	protected get _formFields(): { name: string; label: string; type: string; value: any; is_required: boolean; maxLength?: number }[] {
		return [
			{ name: 'Number', label: 'Card Number', type: 'number', value: null, is_required: true, maxLength: 20 },
			{ name: 'Name', label: 'Name on card', type: 'string', value: null, is_required: true },
			{ name: 'ExpirationYear', label: null, type: 'tel', value: null, is_required: true, maxLength: 2 },
			{ name: 'ExpirationMonth', label: null, type: 'tel', value: null, is_required: true, maxLength: 2 },
			{ name: 'Cvc', label: 'CVC', type: 'string', value: null, is_required: true },
			{ name: 'Email', label: 'Email', type: 'email', value: null, is_required: true },
			{ name: 'AddressLine1', label: 'Address Line 1', type: 'string', value: null, is_required: false },
			{ name: 'AddressLine2', label: 'Address Line 2', type: 'string', value: null, is_required: false },
			{ name: 'AddressCity', label: 'City', type: 'string', value: null, is_required: false },
			{ name: 'AddressState', label: 'State', type: 'string', value: null, is_required: false },
			{ name: 'AddressZip', label: 'ZIP Code', type: 'string', value: null, is_required: false }
		];
	}

	viewAllCards() {
		const dialogRef = this._dialog.open(ViewCardsComponent, {
			width: '700px',
			panelClass: 'app-view-cards',
			disableClose: true,
			data: this.actualCreditCardDetails
		});

		dialogRef.afterClosed().subscribe((response) => {
			this.ngOnInit();
		});
	}
}
