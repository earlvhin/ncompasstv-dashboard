import { Component, OnInit, Input } from '@angular/core';
import * as filestack from 'filestack-js';
import { Subscription, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { MediaModalComponent } from '../../components_shared/media_components/media-modal/media-modal.component';
import { RenameModalComponent } from '../../components_shared/media_components/rename-modal/rename-modal.component';
import { FilestackService } from '../../services/filestack-service/filestack.service';
import { AuthService } from '../../services/auth-service/auth.service';
import { ContentService } from 'src/app/global/services/content-service/content.service';
import { UI_ROLE_DEFINITION } from '../../models/ui_role-definition.model';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
 
@Component({
	selector: 'app-media-library',
	templateUrl: './media-library.component.html',
	styleUrls: ['./media-library.component.scss']
})

export class MediaLibraryComponent implements OnInit {

	advertiser_field_disabled: boolean = true;
	assigned_users: any;
	data_to_upload: any = [];
	dealer_field_disabled: boolean = true;
	duplicate_files: any = [];
	eventsSubject: Subject<void> = new Subject<void>();
	filestack_client: any;
	host_field_disabled: boolean = true;
	loading_overlay:boolean = false;
	modified_data: any;
	reload: boolean;
	subscription: Subscription = new Subscription;
	title: string = "Media Library"
	upload_respond: any;
	uploaded_files: any;
	all_media: any = [];
	is_dealer: boolean = false;

	compare:any;
	count_1: any;
	count_2: any;
	count_3: any;

	constructor(
		private _filestack: FilestackService,
		private _dialog: MatDialog,
		private _auth: AuthService,
		private _content: ContentService,
	) { 
		this.filestack_client = filestack.init(environment.third_party.filestack_api_key);
	}

	ngOnInit() {
		const roleId = this._auth.current_user_value.role_id;

		if (roleId === UI_ROLE_DEFINITION.dealer || roleId === UI_ROLE_DEFINITION['sub-dealer']) {
			this.is_dealer = true;
			this.getDealerContents(this._auth.current_user_value.roleInfo.dealerId, 1, 60);
		} else {
			this.getContents();
		}
		
	}

	// Upload Modal
	assignContent() {
		let dialogRef = this._dialog.open(MediaModalComponent, {
			width: '600px',
			panelClass: 'app-media-modal',
			disableClose: true 
		})

		dialogRef.afterClosed().subscribe(r => {
			this.assigned_users = r;
			this.loading_overlay = true;
			if (r != false) {
				this.uploadContent();
			} else {
				this.loading_overlay = false;
			}
		});
	}

	displayStats(e) {
		console.log("E", e)
		if (e) {
			this.compare = {
				basis: e.all,
				basis_label: 'Contents',
				// good_value: e.active,
				// good_value_label: 'Active',
				// bad_value: e.inactive,
				// bad_value_label: 'Inactive'
			}
			
	
			this.count_1 = {
				data_value: e.videos,
				data_label: 'Videos',
				data_description: 'Videos'
			}
	
			this.count_2 = {
				data_value: e.images,
				data_label: 'Images',
				data_description: 'Images'
			}

			this.count_3 = {
				data_value: e.feeds,
				data_label: 'Feeds',
				data_description: 'Feeds'
			}
		} else {
			this.compare = false;
			this.count_1 = false;
			this.count_2 = false;
		}
		console.log("COMPARE", this.compare)
	}

	// Get All Media Files
	getContents() {
		this.subscription.add(
			this._content.get_contents().subscribe(
				(data: any) => {
					if(!data.message) {
						this.all_media = data.iContents;
					}
				}
			)
		)
	}
	
	//Dealer Contents
	getDealerContents(id: string, page: number, pageSize: number) {
		this.subscription.add(
			this._content.get_content_by_dealer_id(id, false, page, pageSize).subscribe(
				(data: any) => {
					if(!data.message) {
						this.all_media = data.contents;
					}
				}
			)
		);
	}

	// Filestack
	uploadContent() {
		const filestack_option = {
			accept: [
				'image/jpg',
				'image/jpeg',
				'image/png',
				'video/mp4',
				'video/webm'
			],
			maxFiles: 5,
			onFileSelected: (e) => {
				this.data_to_upload = [];
				return new Promise((resolve, reject) => {
					// Do something async
					this.all_media.map (
						med => {
							if(med.fileName != null) {
								med.fileName = this.removeFilenameHandle(med.fileName);
								var name_no_index = this.removeIndexes(med.fileName);
								med.fileName = name_no_index + med.fileName.substring(0, med.fileName.lastIndexOf('.'));
							}
						}
					)

					this.duplicate_files = this.all_media.filter( 
						media => media.fileName === e.filename
					);

					if(this.duplicate_files.length > 0) {
						this.data_to_upload.push(e);
						this.warningModal('warning', 'Duplicate Filename', 'Are you sure you want to continue upload?','','rename')
						.then(result => {
							if(result === 'upload') {
								this.postContentInfo(this.duplicate_files, this.data_to_upload, false)
								resolve({ filename: this.modified_data[0].filename })
								//temporarily add recently uploaded to array
								this.all_media.push({ fileName: this.modified_data[0].filename })
							} else {
								this.renameModal().then(name => {
									resolve({ filename: name + this.data_to_upload[0].filename.substring(0, this.data_to_upload[0].filename.lastIndexOf('.')) })
								});
							}
						})
					} else {
						resolve({});
					}
				});
			},
			onOpen: (e) => {
				this.ngOnInit();
			},
			onUploadDone: (respond) => {
				this.uploaded_files = respond.filesUploaded;
				this.reload = true;
				this.processUploadedFiles(this.uploaded_files, this.assigned_users);
			},
			onClose: (respond) => {
				this.loading_overlay = false;
			}
		}
		this.filestack_client.picker(filestack_option).open();
	}

	removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}

	warningModal(status, message, data, return_msg, action) {
		return new Promise((resolve) => {
			this._dialog.closeAll();
		
			let dialogRef = this._dialog.open(ConfirmationModalComponent, {
				width: '500px',
				height: '350px',
				disableClose: true,
				data: {
					status: status,
					message: message,
					data: data,
					return_msg: return_msg,
					action: action,
					rename: true
				}
			})
	
			dialogRef.afterClosed().subscribe(result => resolve(result));
		})
	}

	renameModal() {
		return new Promise((resolve) => {
			this._dialog.closeAll();

			let dialogRef = this._dialog.open(RenameModalComponent, {
				width: '500px',
				height: '450px',
				panelClass: 'app-media-modal',
				disableClose: true 
			})
	
			dialogRef.afterClosed().subscribe(r => resolve(r));
		})
	}

	// Filestack
	async processUploadedFiles(data, users) {
		const file_data = await this._filestack.process_uploaded_files(data, users || '');
		if(file_data) {
			this.postContentInfo('', file_data, true);
			this.processFiles();
		}
	}

	removeIndexes(data) {
		if(data.indexOf('(') > 0) {
			return data.slice(0, data.indexOf('('));
		} else {
			return data.slice(0, data.indexOf('.'));
		}
	}

	// Filestack
	postContentInfo(duplicateArray, data, upload) {
		data.map(
			i => {
				if(i.fileName) {
					i.filename = i.fileName
				}
				i.createdBy = this._auth.current_user_value.user_id;
				if(duplicateArray) {
					var name_of_file = this.removeIndexes(i.filename)
					var index_to_set = duplicateArray.length + 1;
					i.filename = name_of_file + "(" + index_to_set + ")" + i.filename.substring(0, i.filename.lastIndexOf('.'))
					delete i.fileName;
				}
			}
		)
		this.modified_data = data;
		if (upload) {
			console.log('DATA TO BE UPLOADED', data);

			this.subscription.add(
				this._filestack.post_content_info(data).subscribe(
					data => {
						this.emitReloadMedia();
					},
					error => {
						console.log(error);
					}
				)
			)
		}
		
	}

	// Filestack
	processFiles() {
		this.subscription.add(
			this._filestack.process_files().subscribe(
				data => {
					// this.compare = undefined;
				},
				error => {
					console.log('#processFiles', error);
				}
			)
		)
	}

	// Send Reload Signal to Child Component after Upload
	emitReloadMedia() {
		this.eventsSubject.next();
	}
}
