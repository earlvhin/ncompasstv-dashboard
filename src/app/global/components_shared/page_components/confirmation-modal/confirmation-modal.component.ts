import { Component, OnInit, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material'

@Component({
	selector: 'app-confirmation-modal',
	templateUrl: './confirmation-modal.component.html',
	styleUrls: ['./confirmation-modal.component.scss']
})

export class ConfirmationModalComponent implements OnInit {

	action: string;
	data: string;
	message: string;
	rename: boolean;
	return_msg: string;
	status: string;
	
	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		public dialogRef: MatDialogRef<ConfirmationModalComponent>
	) { }

	ngOnInit() {
		this.status = this._dialog_data.status;
		this.message = this._dialog_data.message;
		this.data = this._dialog_data.data;
		this.return_msg = this._dialog_data.return_msg;
		this.action = this._dialog_data.action;
		this.rename = this._dialog_data.rename;
	}

	displaySuccess() {
		this.status = 'success';
		this.message = this._dialog_data.message || 'Success!';
		this.data = this.return_msg;
	}

	deletePlaylist() {
		this.dialogRef.close('playlist_delete');
	}

	renameAllowed() {
		this.dialogRef.close('rename');
	}
	
	continueUpload() {
		this.dialogRef.close('upload');
	}
}
