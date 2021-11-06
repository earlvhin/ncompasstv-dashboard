import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatFileUploadQueueComponent } from 'angular-material-fileupload';

import { UI_CURRENT_USER } from 'src/app/global/models';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-upload-document-dialog',
	templateUrl: './upload-document-dialog.component.html',
	styleUrls: ['./upload-document-dialog.component.scss']
})
export class UploadDocumentDialogComponent implements OnInit {
	
	@ViewChild('documentUploadQueue', { static: false }) queuedImages: MatFileUploadQueueComponent;
	@Input() currentUser: UI_CURRENT_USER;
	@Input() currentRole: string;
	@Input() hostId: string;

	isLoading = false;
	uploadUrl: string;
	
	constructor() { }
	
	ngOnInit() {
		this.uploadUrl = `${this.apiBase}${this.uploadEndpoint}?hostId=${this.hostId}&type=2&createdBy=${this.currentUserId}`;
	}

	onClickChooseFilesBtn() {
		const input = document.getElementById('singleFile');
		input.click();
	}

	onQueueDocument() {

		// workaround to filter out non-approved document files
		setTimeout(() => {
			const acceptedTypes = [ '.pdf', '.doc', '.docx' ];
			const files = [...this.queuedImages.files as File[]];
			this.queuedImages.files = files.filter(file => acceptedTypes.some(type => file.name.includes(type)));
		}, 1000);
		
	}

	protected get apiBase() {
		return environment.base_uri;
	}

	protected get currentUserId() {
		return this.currentUser.user_id;
	}

	protected get uploadEndpoint() {
		return environment.create.amazon_s3_upload;
	}
	
}
