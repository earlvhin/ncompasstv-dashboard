import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_HOST_FILE, PAGING, UI_CURRENT_USER, UI_HOST_FILE } from 'src/app/global/models';
import { HelperService, HostService } from 'src/app/global/services';
import { UploadDocumentDialogComponent } from '../upload-document-dialog/upload-document-dialog.component';
@Component({
	selector: 'app-documents-tab',
	templateUrl: './documents-tab.component.html',
	styleUrls: ['./documents-tab.component.scss']
})
export class DocumentsTabComponent implements OnInit, OnDestroy {
	
	@Input() currentRole: string;
	@Input() currentUser: UI_CURRENT_USER;
	@Input() hostId: string;

	documents: API_HOST_FILE[] = [];
	hasNoData = false;
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
		this.getDocuments();
		this.subscribeToRefreshPage();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getDocuments(page = 1) {

		this.documents = [];

		this._host.get_files_by_type(this.hostId, 2, page)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					this.pagingData = response;

					if (!response.entities || response.entities.length <= 0) {
						this.hasNoData = true;
						return;
					}

					const documents = response.entities as API_HOST_FILE[];
					this.documents = [...documents];
					this.tableData = this.mapToTable([...documents]);
				},
				error => console.log('Error retrieving host images', error)
			);
	}

	onClickUploadBtn() {
		const config: MatDialogConfig = { width: '600px', disableClose: true };
		const dialog = this._dialog.open(UploadDocumentDialogComponent, config);
		dialog.componentInstance.hostId = this.hostId;
		dialog.componentInstance.currentUser = this.currentUser;
		dialog.afterClosed().subscribe(() => this.getDocuments());
	}

	private mapToTable(data: API_HOST_FILE[]): UI_HOST_FILE[] {

		let count = this.pagingData.pageStart;

		return data.map(
			file => {
				return {
					id: { value: file.id, link: null , editable: false, hidden: true } ,
					index: { value: count++, link: null , editable: false, hidden: false },
					fileName: { value: file.filename, link: file.url, isFile: true, editable: false, hidden: false },
					date: { value: this._date.transform(file.dateCreated, 'MMM dd, y h:mm a'), editable: false, hidden: false },
					s3FileName: { value: file.s3Filename, hidden: true },
				};
			}
		);

	}

	private subscribeToRefreshPage() {
		this._helper.onRefreshSingleHostDocumentsTab.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => this.getDocuments())
	}

	protected get columns() {
		return [ '#', 'File', 'Upload Date', 'Actions' ];
	}
	
}
