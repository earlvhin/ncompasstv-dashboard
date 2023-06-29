import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { Route, Router } from '@angular/router';

import { API_CREATE_FILLER_GROUP } from 'src/app/global/models/api_create_filler_group';
import { FillerService, AuthService } from 'src/app/global/services';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-add-filler-group',
	templateUrl: './add-filler-group.component.html',
	styleUrls: ['./add-filler-group.component.scss']
})
export class AddFillerGroupComponent implements OnInit {
	description = 'Enter filler group details ';
	form: FormGroup;
	inpairs = 0;
	title = 'Create Filler Group';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _form_builder: FormBuilder,
		private _filler: FillerService,
		private _dialog: MatDialog,
		private _router: Router,
		private _auth: AuthService
	) {}

	ngOnInit() {
		this.initializeForm();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	private initializeForm(): void {
		this.form = this._form_builder.group({
			fillerGroupName: [null, Validators.required]
		});
	}

	onSubmit() {
		const newFillerGroup = new API_CREATE_FILLER_GROUP(this.newFillerGroupControls.fillerGroupName.value, this.inpairs);
		this._filler
			.add_filler_group(newFillerGroup)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					this.openConfirmationModal('success', 'Filler Group Created!', 'Hurray! You successfully created a Filler Group');
				},
				(error) => {
					// this.is_creating_host = false;
					// this.openConfirmationModal('error', 'Host Place Creation Failed', 'An error occured while saving your data', null);
				}
			);
	}

	openConfirmationModal(status: string, message: string, data: any): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data
			}
		});

		dialog.afterClosed().subscribe(() => {
			this._dialog.closeAll();
		});
	}

	protected get roleRoute() {
		return this._auth.roleRoute;
	}

	protected get newFillerGroupControls() {
		return this.form.controls;
	}

	onTogglePairs(toggle) {
		this.inpairs = toggle.returnValue == true ? 1 : 0;
	}

	onUploadImage() {}
}
