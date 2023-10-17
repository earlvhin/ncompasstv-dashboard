import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { BillingService } from 'src/app/global/services/billing-service/billing-service';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ACTIVITY_LOGS } from 'src/app/global/models';
import { AuthService, DealerService } from 'src/app/global/services';

@Component({
	selector: 'app-add-card',
	templateUrl: './add-card.component.html',
	styleUrls: ['./add-card.component.scss']
})
export class AddCardComponent implements OnInit {
	addCardForm: FormGroup;
	processing: boolean = false;
	dealer_id = this._auth.current_user_value.roleInfo.dealerId;
	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _auth: AuthService,
		private _dealer: DealerService,
		private _formBuilder: FormBuilder,
		private _billing: BillingService,
		private _dialog: MatDialog
	) {}

	ngOnInit() {
		this.initializeForm();
	}

	private initializeForm(): void {
		let addCardFormGroup = {};

		this._formFields.forEach((field) => {
			let value = field.value;
			let validators: any[] = [];

			if (field.is_required) validators.push(Validators.required);
			if (field.name === 'Cvc') validators.push(Validators.minLength(3));
			addCardFormGroup[field.name] = [value, validators];
		});

		this.addCardForm = this._formBuilder.group(addCardFormGroup);
	}

	protected get _formFields(): { name: string; label: string; type: string; value: any; is_required: boolean; maxLength?: number }[] {
		return [
			{ name: 'Card', label: 'Card Number', type: 'number', value: null, is_required: true, maxLength: 20 },
			{ name: 'Name', label: 'Name on card', type: 'string', value: null, is_required: true },
			{ name: 'ExpirationYear', label: null, type: 'tel', value: null, is_required: true, maxLength: 2 },
			{ name: 'ExpirationMonth', label: null, type: 'tel', value: null, is_required: true, maxLength: 2 },
			{ name: 'Cvc', label: 'CVC', type: 'string', value: null, is_required: true, maxLength: 3 },
			{ name: 'Email', label: 'Email', type: 'email', value: this._dialog_data.email, is_required: true }
		];
	}

	addCard() {
		const addCard = new ACTIVITY_LOGS(this.dealer_id, 'added_card', this._auth.current_user_value.user_id);
		this.processing = true;
		var card_to_add = {
			dealerId: this._dialog_data.id,
			email: this.addCardForm.get('Email').value,
			Number: this.addCardForm.get('Card').value,
			Name: this.addCardForm.get('Name').value,
			ExpirationYear: this.addCardForm.get('ExpirationYear').value,
			ExpirationMonth: this.addCardForm.get('ExpirationMonth').value,
			Cvc: this.addCardForm.get('Cvc').value
		};
		this._billing
			.add_credit_card(card_to_add)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					this.openConfirmationModal('success', 'Success!', 'Credit card successfully saved.');
					this.createActivity(addCard);
				},
				(error: HttpErrorResponse) => {
					if (error.status === 400) {
						this.openConfirmationModal('error', 'Failed!', error.error.message);
						this.processing = false;
					}
				}
			);
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

	openConfirmationModal(status, message, data): void {
		var dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});

		dialog.afterClosed().subscribe((response) => {
			if (response) {
				this._dialog.closeAll();
			}
		});
	}
}
