import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UI_HOST_SUPPORT } from 'src/app/global/models';
import { HostService } from 'src/app/global/services';
import { CreateEntryComponent } from '../create-entry/create-entry.component';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-edit-ticket',
	templateUrl: './edit-ticket.component.html',
	styleUrls: ['./edit-ticket.component.scss']
})
export class EditTicketComponent implements OnInit {
	@Output() reload_host_page = new EventEmitter();
	disabled_submit = true;
	form_invalid: boolean;
	is_creating_support = false;
	edit_ticket_form: FormGroup;
	reload_page: boolean;

	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _ticket_data: UI_HOST_SUPPORT,
		private _form: FormBuilder,
		private _host: HostService,
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<CreateEntryComponent>
	) {}

	ngOnInit() {
		this.initializeForm();
	}

	saveEditSupport() {
		this._host
			.edit_support_ticket(this._ticket_data.ticketId.value, this.edit_ticket_form.value)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					this._dialog_ref.close(data);
					this.showConfirmationDialog('success', 'Ticket Saved Successfully', 'Click OK to continue');
				},
				(error) => {
					this.showConfirmationDialog('error', 'Error while saving Entry', error.error.message);
				}
			);
	}

	private initializeForm() {
		const url = this._ticket_data.url.value as { value: string };
		const note = this._ticket_data.notes.value as { value: string };

		this.edit_ticket_form = this._form.group({
			Url: [url],
			Notes: [note]
		});

		this.edit_ticket_form.valueChanges.subscribe((v) => {
			this.disabled_submit = !((v.Url || v.Notes !== null) && (v.Url || v.Notes !== ''));
		});
	}

	private showConfirmationDialog(status: string, message: string, data: string) {
		const dialogData = { status, message, data };
		const dialogConfig = { width: '500px', height: '350px', data: dialogData };
		this._dialog.open(ConfirmationModalComponent, dialogConfig);
	}
}
