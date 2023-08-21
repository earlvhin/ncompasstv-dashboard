import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { UI_CONFIRMATION_MODAL } from 'src/app/global/models';

@Component({
	selector: 'app-confirmation-modal',
	templateUrl: './confirmation-modal.component.html',
	styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent implements OnInit {
	action: string;
	delete = false;
	message: string;
	title: string;
	rename: boolean;
	return_msg: string;
	status: string;
	is_selection?: boolean;
	is_installation?: boolean;
	filler_photo?: boolean;

	constructor(@Inject(MAT_DIALOG_DATA) public dialogData: UI_CONFIRMATION_MODAL, public dialogRef: MatDialogRef<ConfirmationModalComponent>) {}

	ngOnInit() {
		this.status = this.dialogData.status;
		this.title = this.dialogData.message;
		this.message = this.dialogData.data;
		this.return_msg = this.dialogData.return_msg;
		this.action = this.dialogData.action;
		this.rename = this.dialogData.rename;
		this.is_selection = typeof this.dialogData.is_selection !== 'undefined' ? this.dialogData.is_selection : false;
		this.is_installation = typeof this.dialogData.is_installation !== 'undefined' ? this.dialogData.is_installation : false;
		this.filler_photo = typeof this.dialogData.filler_photo !== 'undefined' ? this.dialogData.filler_photo : false;
		this.delete = this.dialogData.delete;
	}

	displaySuccess() {
		this.status = 'success';
		this.title = this.dialogData.message || 'Success!';
		this.message = this.return_msg;
	}

	deletePlaylist() {
		this.dialogRef.close('playlist_delete');
	}

	renameAllowed() {
		if (this.filler_photo) {
			this.dialogRef.close('no_upload');
			return;
		}
		this.dialogRef.close('rename');
	}

	continueUpload() {
		this.dialogRef.close('upload');
	}

	deleteContent() {
		this.dialogRef.close('delete');
	}
}
