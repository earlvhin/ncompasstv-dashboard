import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import * as filestack from 'filestack-js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';

import { FillerService, FilestackService } from 'src/app/global/services';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-add-filler-content',
	templateUrl: './add-filler-content.component.html',
	styleUrls: ['./add-filler-content.component.scss']
})
export class AddFillerContentComponent implements OnInit {
	form: FormGroup;
	media_type = 'photos';
	selected_group = this.page_data.group;
	upload_holder: any;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public page_data: { group: any },
		private _form_builder: FormBuilder,
		private _filler: FillerService,
		private _dialog: MatDialog,
		private _filestack: FilestackService
	) {}

	ngOnInit() {
		console.log('FG', this.selected_group);
		this.initializeForm();
	}

	private initializeForm(): void {
		// this.form = this._form_builder.group({
		// 	media_type: [null, Validators.required]
		// });
	}

	onUploadImage() {
		this.upload_holder = [];
		const client = filestack.init(environment.third_party.filestack_api_key);
		client.picker(this.filestackOptions(['image/jpg', 'image/jpeg', 'image/png'], [720, 640], 'Image')).open();
	}

	onUploadVideo() {
		this.upload_holder = [];
		const client = filestack.init(environment.third_party.filestack_api_key);
		client.picker(this.filestackOptions(['video/mp4', 'video/webm'], [1280, 720], 'Video')).open();
	}

	filestackOptions(filetypes, imagemaximum, type): filestack.PickerOptions {
		return {
			storeTo: {
				container: this.selected_group.bucketName + '/',
				region: 'us-east-2'
			},
			accept: filetypes,
			maxFiles: 10,
			imageMax: imagemaximum,
			onUploadDone: (response) => {
				response.filesUploaded.map((uploaded) => {
					const file_type = uploaded.mimetype.split('/');
					const modified_details = {
						filename: this.splitFileName(uploaded.key),
						filetype: file_type[0],
						handlerid: uploaded.handle
					};
					this.upload_holder.push(modified_details);
				});

				const final_upload_to_db = {
					fillerGroupId: this.selected_group.fillerGroupId,
					files: this.upload_holder
				};

				if (type === 'Video') {
					console.log('FILES UPLOADED', response.filesUploaded);
					const file_data = this._filestack.process_uploaded_files(response.filesUploaded, '');
					// if (file_data) {
					console.log('FILE DATA', file_data);
					// this.uploadContentToDatabase(file_data, type);
					// }
				} else {
					this.uploadContentToDatabase(final_upload_to_db, type);
				}
			}
		};
	}

	uploadContentToDatabase(data, type) {
		this._filler
			.update_filler_contents(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(() =>
				this.openConfirmationModal('success', 'Filler ' + type + 's Uploaded!', 'Hurray! You successfully uploaded a Filler ' + type + 's')
			);
	}

	splitFileName(name) {
		const splitted_file_name = name.split('/').pop();
		return splitted_file_name;
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
}
