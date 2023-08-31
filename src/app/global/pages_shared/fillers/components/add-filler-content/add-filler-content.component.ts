import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import * as filestack from 'filestack-js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';

import { FillerService, FilestackService, AuthService } from 'src/app/global/services';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { AddFillerFeedsComponent } from './components/add-filler-feeds/add-filler-feeds.component';

@Component({
	selector: 'app-add-filler-content',
	templateUrl: './add-filler-content.component.html',
	styleUrls: ['./add-filler-content.component.scss']
})
export class AddFillerContentComponent implements OnInit {
	form: FormGroup;
	media_type = 'image';
	all_media = this.page_data.all_media;
	selected_group = this.page_data.group;
	upload_holder: any;
	converted: boolean = false;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public page_data: { group: any; all_media: any },
		private _form_builder: FormBuilder,
		private _filler: FillerService,
		private _dialog: MatDialog,
		private _filestack: FilestackService,
		private _router: Router,
		private _auth: AuthService
	) {}

	ngOnInit() {}

	onUploadImage() {
		this.hidePrevModal();
		const client = filestack.init(environment.third_party.filestack_api_key);
		client.picker(this.filestackOptions(['image/jpg', 'image/jpeg', 'image/png'], [720, 640], 'Image', 1000)).open();
	}

	onUploadVideo() {
		this.hidePrevModal();
		const client = filestack.init(environment.third_party.filestack_api_key);
		client.picker(this.filestackOptions(['video/mp4', 'video/webm'], [1280, 720], 'Video', 10)).open();
	}

	onUploadFeed() {
		this.hidePrevModal();
		let dialogRef = this._dialog.open(AddFillerFeedsComponent, {
			width: '500px',
			height: '350px',
			data: {}
		});

		dialogRef.afterClosed().subscribe((response) => {
			if (response) {
				const modified_details = {
					title: response.title,
					filetype: this.media_type,
					url: response.url,
					filename: response.filename
				};
				const files_temp = [];
				files_temp.push(modified_details);
				const final_upload_to_db = {
					fillerGroupId: this.selected_group.fillerGroupId,
					files: files_temp
				};
				this.uploadContentToDatabase(final_upload_to_db, this.media_type);
			}
		});
	}

	hidePrevModal() {
		this.upload_holder = [];
		let body = document.getElementsByClassName('cdk-overlay-container')[0];
		body.classList.add('z-index-10');
	}

	filestackOptions(filetypes, imagemaximum, type, maxitems?): filestack.PickerOptions {
		return {
			storeTo: {
				container: this.selected_group.bucketName + '/',
				region: 'us-east-2'
			},
			accept: filetypes,
			maxFiles: maxitems,
			imageMax: imagemaximum,
			onUploadDone: (response) => {
				response.filesUploaded.map((uploaded) => {
					const modified_details = {
						filename: this.splitFileName(uploaded.key),
						filetype: this.media_type == 'video' ? 'webm' : uploaded.key.substring(uploaded.key.lastIndexOf('.') + 1),
						handlerid: uploaded.handle,
						title: uploaded.filename
					};
					modified_details.title = this.removeHandleIdOnFileName(modified_details.filename);
					this.upload_holder.push(modified_details);
				});

				const final_upload_to_db = {
					fillerGroupId: this.selected_group.fillerGroupId,
					files: this.upload_holder
				};

				this.uploadContentToDatabase(final_upload_to_db, type);
				if (this.media_type == 'video') this.processUploadedFiles(response.filesUploaded);
			}
		};
	}

	async processUploadedFiles(data): Promise<void> {
		let file_data: any;
		let folder = 'dev';
		if (environment.production) folder = 'prod';
		else if (environment.base_uri.includes('stg')) folder = 'staging';
		else folder = 'dev';

		file_data = await this._filestack.process_uploaded_files(data, '', true, this.selected_group.fillerGroupId, folder);
		if (file_data) {
			this._filestack.post_content_info(file_data).pipe(takeUntil(this._unsubscribe)).subscribe();
		}
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

	removeHandleIdOnFileName(name) {
		const splitted_file_name = name.split('_').slice(1).join('_');
		return splitted_file_name;
	}

	protected get roleRoute() {
		return this._auth.roleRoute;
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
