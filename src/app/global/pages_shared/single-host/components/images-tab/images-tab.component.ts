import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_HOST_FILE, PAGING, UI_CURRENT_USER, UI_HOST_FILE } from 'src/app/global/models';
import { HelperService, HostService } from 'src/app/global/services';
import { UploadImageDialogComponent } from '../upload-image-dialog/upload-image-dialog.component';

@Component({
	selector: 'app-images-tab',
	templateUrl: './images-tab.component.html',
	styleUrls: ['./images-tab.component.scss']
})
export class ImagesTabComponent implements OnInit, OnDestroy {

	@Input() currentRole: string;
	@Input() currentUser: UI_CURRENT_USER;
	@Input() hostId: string;

	hasNoData = false;
	images: API_HOST_FILE[] = [];
	isViewOnly: boolean;
	pagingData: PAGING;
	tableColumns: string[];
	tableData: UI_HOST_FILE[] = [];

	protected _unsubscribe = new Subject<void>();
	
	constructor(
		private _date: DatePipe,
		private _dialog: MatDialog,
		private _helper: HelperService,
		private _host: HostService,
	) { }
	
	ngOnInit() {
		this.tableColumns = this.columns;
		this.isViewOnly = this.currentUser.roleInfo.permission === 'V';
		this.getImages();
		this.subscribeToRefreshPage();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getImages(page = 1) {

		this.images = [];

		this._host.get_files_by_type(this.hostId, 1, page)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					this.pagingData = response;

					if (!response.entities || response.entities.length <= 0) {
						this.hasNoData = true;
						return;
					}

					const images = response.entities as API_HOST_FILE[];
					this.images = [...images];
					this.tableData = this.mapToTable([...images]);
				},
				error => console.log('Error retrieving host images', error)
			);
	}

	onClickUploadBtn() {
		const config: MatDialogConfig = { width: '600px', disableClose: true };
		const dialog = this._dialog.open(UploadImageDialogComponent, config);
		dialog.componentInstance.hostId = this.hostId;
		dialog.componentInstance.currentUser = this.currentUser;
		dialog.afterClosed().subscribe(() => this.getImages());
	}

	private mapToTable(data: API_HOST_FILE[]): UI_HOST_FILE[] {

		let count = this.pagingData.pageStart;

		return data.map(
			file => {
				return {
					id: { value: file.id, link: null , editable: false, hidden: true} ,
					index: { value: count++, link: null , editable: false, hidden: false },
					thumbnail: { value: file.url, link: null, isImage: true, editable: false, hidden: false },
					date: { value: this._date.transform(file.dateCreated, 'MMM dd, y h:mm a'), editable: false, hidden: false },
					fileName: { value: file.filename, link: null , editable: false, hidden: false },
					s3FileName: { value: file.s3Filename },
				};
			}
		);

	}

	private subscribeToRefreshPage() {
		this._helper.onRefreshSingleHostImagesTab.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => this.getImages())
	}

	protected get columns() {
		return [ '#', 'Thumbnail', 'Upload Date', 'Filename', 'S3 Filename', 'Actions' ];
	}
	
}
