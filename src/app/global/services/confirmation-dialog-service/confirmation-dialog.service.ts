import { Injectable } from '@angular/core';

import { UI_CONFIRMATION_MODAL } from 'src/app/global/models';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material';

@Injectable({
	providedIn: 'root'
})

export class ConfirmationDialogService {

	constructor(private dialog: MatDialog) {

	}

	error() {

	}

	/**
	 * 
	 * @param width: string | e.g. 500px
	 * @param height: string | e.g. 350px
	 * @param disableClose: boolean
	 * @param data: UI_CONFIRMATION_MODAL
	 */
	success(data: UI_CONFIRMATION_MODAL, width: string = '500px', height: string = '350px', disableClose: boolean = true) {

		data.status = 'success';
		const config = { width, height, disableClose, data };
		const dialog = this.dialog.open(ConfirmationModalComponent, config);
		return dialog.afterClosed();


	}

	warning() {

	}

}