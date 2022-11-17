import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';

import { UI_CONFIRMATION_MODAL } from 'src/app/global/models';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Injectable({
	providedIn: 'root'
})
export class ConfirmationDialogService {
	constructor(private dialog: MatDialog) {}

	error(width: string = '500px', height: string = '350px', disableClose: boolean = true) {
		const dialogData = { status: 'error', data: 'Error! Something went wrong.', message: 'Please contact your administrator' };
		const config = { width, height, disableClose, dialogData };
		const dialog = this.dialog.open(ConfirmationModalComponent, config);
		return dialog.afterClosed();
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

	warning(data: UI_CONFIRMATION_MODAL, width: string = '500px', height: string = '350px', disableClose: boolean = true) {
		data.status = 'warning';
		const config = { width, height, disableClose, data };
		const dialog = this.dialog.open(ConfirmationModalComponent, config);
		return dialog.afterClosed();
	}
}
