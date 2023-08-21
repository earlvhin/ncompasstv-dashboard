import { Component, Inject, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_CREATE_SUPPORT } from 'src/app/global/models';
import { HostService } from 'src/app/global/services';
import { AuthService } from 'src/app/global/services';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-create-entry',
	templateUrl: './create-entry.component.html',
	styleUrls: ['./create-entry.component.scss']
})
export class CreateEntryComponent implements OnInit {
	@Output() reload_page = new EventEmitter();
	is_creating_support = false;
	new_support_form: FormGroup;
	create_support_fields = this._formFields;
	is_submitted: boolean;
	form_invalid : boolean;

	protected _unsubscribe = new Subject<void>();

	constructor(
		private _form: FormBuilder,
		private _host: HostService,
		@Inject(MAT_DIALOG_DATA) public data: { hostId: string },
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<CreateEntryComponent>
	) {}

	ngOnInit() {
		this.initializeForm();
		console.log(this.data);
	}

	get s() {
		return this.new_support_form.controls
	}


	saveSupport() {
		this.is_creating_support = true;
		this.is_submitted = true;
		this.form_invalid = true;
		const createdBy = this._auth.current_user_value.user_id;

		const new_entry = new API_CREATE_SUPPORT(
			this.data.hostId,
			this.form_controls.supportNotes.value,
			this.form_controls.supportUrl.value,
			createdBy
		);

		if (!this._host.validate_url(this.s.supportUrl.value)) {
			this.showConfirmationDialog('error', 'Oops something went wrong, Sorry!', 'The URL you entered is not valid.');
			this.is_submitted = false;
			this.form_invalid = false;
			return false;
		}

		this._host
			.create_support_entry(new_entry)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					console.log(data);
					this.is_submitted = false;
					this.form_invalid = false;
					this._dialog_ref.close(data);
					this.reload_page.emit(true);
					this.showConfirmationDialog('success', 'Entry Saved Successfully', 'Click OK to continue');
				},
				(error) => {
					console.log(error);
					this.is_submitted = false;
					this.form_invalid = false;
					this.showConfirmationDialog('error', 'Error while saving Entry', error.error.message);
				}
			);
	}

	private initializeForm() {
		this.new_support_form = this._form.group({
			supportUrl: [null],
			supportNotes: [null]
		});
	}

	private get form_controls() {
		return this.new_support_form.controls;
	}

	private showConfirmationDialog(status: string, message: string, data: string) {
		const dialogData = { status, message, data };
		const dialogConfig = { width: '500px', height: '350px', data: dialogData };
		this._dialog.open(ConfirmationModalComponent, dialogConfig);
	}

	protected get _formFields() {
		return [
			{
				label: 'URL *',
				control: 'supportUrl',
				placeholder: 'Ticket URL',
				type: 'link'
			},
			{
				label: 'Notes',
				control: 'supportNotes',
				placeholder: 'Ticket Notes/Details',
				type: 'text'
			}
		];
	}
}
