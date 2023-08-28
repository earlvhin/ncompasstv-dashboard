import { Component, OnInit, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { Route, Router } from '@angular/router';
import * as filestack from 'filestack-js';
import { environment } from 'src/environments/environment';

import { API_CREATE_FILLER_GROUP } from 'src/app/global/models/api_create_filler_group';
import { FillerService, AuthService } from 'src/app/global/services';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-add-filler-group',
	templateUrl: './add-filler-group.component.html',
	styleUrls: ['./add-filler-group.component.scss']
})
export class AddFillerGroupComponent implements OnInit {
	added_data: any;
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
		private _auth: AuthService,
		private el: ElementRef
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
					this.added_data = data;
					// this._dialog.closeAll();
					this.selectionModal(
						'warning',
						'Filler Group Created!',
						'Hurray! You successfully created a Filler Group.' +
							'\n' +
							'Do you want to proceed with uploading the Filler Group Album Photo?'
					);
				},
				(error) => {}
			);
	}

	selectionModal(status, message, data) {
		let dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data,
				rename: true,
				filler_photo: true,
				is_selection: false
			}
		});

		dialogRef.afterClosed().subscribe((response) => {
			if (response != 'no_upload') {
				document.getElementsByClassName('cdk-overlay-container')[0].classList.add('hidden');
				this.onUploadImage();
				return;
			}
			this._dialog.closeAll();
		});
	}

	onUploadImage() {
		const client = filestack.init(environment.third_party.filestack_api_key);
		client.picker(this.filestackOptions).open();
	}

	protected get filestackOptions(): filestack.PickerOptions {
		return {
			storeTo: {
				container: this.added_data.bucketName + '/',
				region: 'us-east-2'
			},
			accept: ['image/jpg', 'image/jpeg', 'image/png'],
			maxFiles: 1,
			imageMax: [720, 640],
			onUploadDone: (response) => {
				let sliced_imagekey = response.filesUploaded[0].key.split('/');
				sliced_imagekey = sliced_imagekey[sliced_imagekey.length - 1].split('_');
				const coverphoto = {
					fillerGroupId: this.added_data.fillerGroupId,
					coverPhoto: sliced_imagekey[0] + '_' + response.filesUploaded[0].filename
				};
				this._filler
					.update_filler_group_photo(coverphoto)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe(() =>
						this.openConfirmationModal(
							'success',
							'Filler Group Cover Photo Updated!',
							'Hurray! You successfully updated Filler Group Cover Photo'
						)
					);
				document.getElementsByClassName('cdk-overlay-container')[0].classList.remove('hidden');
			},
			onCancel: () => {
				document.getElementsByClassName('cdk-overlay-container')[0].classList.remove('hidden');
				this._dialog.closeAll();
			}
		};
	}

	openConfirmationModal(status: string, message: string, data: any): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
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
}
