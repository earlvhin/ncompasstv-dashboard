import { Component, OnInit, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FillerService } from 'src/app/global/services';
import { debounceTime, map, takeUntil } from 'rxjs/operators';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-create-filler-feed',
	templateUrl: './create-filler-feed.component.html',
	styleUrls: ['./create-filler-feed.component.scss']
})
export class CreateFillerFeedComponent implements OnInit {
	form: FormGroup;
	selected_group = this.page_data.group;
	final_data_to_upload: any;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public page_data: { group: any },
		private _form_builder: FormBuilder,
		private _filler: FillerService,
		private _dialog: MatDialog
	) {}

	ngOnInit() {
		this.initializeForm();
	}

	private initializeForm(): void {
		this.form = this._form_builder.group({
			fillerGroupName: [null, Validators.required],
			fillerQuantity: [null, Validators.required],
			fillerInterval: [null, Validators.required],
			fillerDuration: [null, Validators.required],
			fillerGroup: [{ value: this.selected_group.name, disabled: true }, Validators.required]
		});
	}

	protected get _formControls() {
		return this.form.controls;
	}

	onSubmit(data) {
		console.log('HERE', data);
		this._filler
			.add_filler_feed(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data: any) => {
					this.openConfirmationModal('success', 'Filler Feed Created!', 'Hurray! You successfully created a Filler Feed', true);
				},
				(error) => {}
			);
	}

	openConfirmationModal(status: string, message: string, data: any, close?): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data
			}
		});

		if (close) {
			dialog.afterClosed().subscribe(() => {
				this._dialog.closeAll();
			});
		}
	}

	arrangeData() {
		this.final_data_to_upload = {
			name: this._formControls.fillerGroupName.value,
			Interval: this._formControls.fillerInterval.value,
			Duration: this._formControls.fillerDuration.value,
			PlaylistGroups: []
		};

		if (this.selected_group) {
			const groups = {
				fillerGroupId: this.selected_group.fillerGroupId,
				Quantity: this._formControls.fillerQuantity.value
			};
			this.final_data_to_upload.PlaylistGroups.push(groups);
		}

		this.onSubmit(this.final_data_to_upload);
	}
}
