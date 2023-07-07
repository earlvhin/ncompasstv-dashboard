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
	all_media = this.page_data.all_media;
	selected_group = this.page_data.group;
	upload_holder: any;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public page_data: { group: any; all_media: any },
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
		// this._dialog.closeAll();
		const client = filestack.init(environment.third_party.filestack_api_key);
		client.picker(this.filestackOptions(['image/jpg', 'image/jpeg', 'image/png'], [720, 640], 'Image')).open();
	}

	onUploadVideo() {
		this.upload_holder = [];
		this._dialog.closeAll();
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
			// onFileSelected: (e) => {
			// 	this.data_to_upload = [];
			// 	return new Promise((resolve, reject) => {
			// 		// Do something async
			// 		this.all_media.map((med) => {
			// 			if (med.title != null && !this.removed_index) {
			// 				med.fileName = med.title;
			// 				var name_no_index = this.removeIndexes(med.fileName);
			// 				med.fileName = name_no_index + '.' + med.fileType;
			// 			} else {
			// 				var temp = med.fileName.split('.');
			// 				med.fileName = this.removeIndexes(med.fileName);
			// 				med.fileName = med.fileName + '.' + temp[temp.length - 1];
			// 			}
			// 		});

			// 		//Additional Checking for video conversion duplicate
			// 		if (e.originalFile.type.includes('video') && !convert_to_webm) {
			// 			var temp = e.originalFile.name.substr(0, e.originalFile.name.lastIndexOf('.'));
			// 			temp = temp + '.webm';
			// 			e.originalFile.name = temp;
			// 		}

			// 		e.originalFile.name = e.originalFile.name.substr(0, e.originalFile.name.lastIndexOf('.'));

			// 		if (!this.is_dealer) {
			// 			this.duplicate_files = this.summarized_media.filter((media) => {
			// 				return media.title.indexOf(e.originalFile.name) !== -1;
			// 			});
			// 		} else {
			// 			this.duplicate_files = this.all_media.filter((media) => {
			// 				return media.title.indexOf(e.originalFile.name) !== -1;
			// 			});
			// 		}

			// 		if (this.duplicate_files.length > 0) {
			// 			this.data_to_upload.push(e);

			// 			this.warningModal('warning', 'Duplicate Filename', 'Are you sure you want to continue upload?', '', 'rename').then(
			// 				(result) => {
			// 					if (result === 'upload') {
			// 						this.postContentInfo(this.duplicate_files, this.data_to_upload, false);
			// 						resolve({ filename: this.modified_data[0].filename });
			// 						//temporarily add recently uploaded to array
			// 						this.all_media.push({ fileName: this.modified_data[0].filename });
			// 					} else {
			// 						this.renameModal().then((name) => {
			// 							var temp = this.data_to_upload[0].mimetype.split('/');
			// 							resolve({ filename: name + '.' + temp[temp.length - 1] });
			// 						});
			// 					}
			// 				}
			// 			);
			// 		} else {
			// 			resolve({});
			// 		}
			// 	});
			// },
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

				// if (type === 'Video') {
				// 	console.log('FILES UPLOADED', response.filesUploaded);
				// 	console.log('FILES CONVERTED', this._filestack.convert_videos(response.filesUploaded[0]));
				// 	// const file_data = this._filestack.convert_videos(response.filesUploaded);
				// 	// if (file_data) {
				// 	// console.log('FILE DATA', file_data);
				// 	// this.uploadContentToDatabase(file_data.__zone_symbol__value, type);
				// 	// }
				// } else {
				this.uploadContentToDatabase(final_upload_to_db, type);
				// }
			}
		};
	}

	removeIndexes(data) {
		if (data.indexOf('(') > 0) {
			return data.slice(0, data.indexOf('('));
		} else {
			return data.slice(0, data.indexOf('.'));
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
