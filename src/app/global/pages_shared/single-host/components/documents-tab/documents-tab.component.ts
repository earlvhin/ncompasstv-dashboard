import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as filestack from 'filestack-js';

import { environment } from 'src/environments/environment';
import { API_HOST_FILE, HOST_S3_FILE, PAGING, UI_CURRENT_USER, UI_HOST_FILE } from 'src/app/global/models';
import { HelperService, HostService } from 'src/app/global/services';
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

	constructor(private _date: DatePipe, private _dialog: MatDialog, private _helper: HelperService, private _host: HostService) {}

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

		this._host
			.get_files_by_type(this.hostId, 2, page)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					this.pagingData = response;

					if (!response.entities || response.entities.length <= 0) {
						this.hasNoData = true;
						return;
					}

					const documents = response.entities as API_HOST_FILE[];
					this.documents = [...documents];
					this.tableData = this.mapToTable([...documents]);
				},
				(error) => {
					console.error(error);
				}
			);
	}

	onClickUploadBtn() {
		const client = filestack.init(environment.third_party.filestack_api_key);
		client.picker(this.filestackOptions).open();
	}

	private mapToTable(data: API_HOST_FILE[]): UI_HOST_FILE[] {
		let count = this.pagingData.pageStart;

		return data.map((file) => {
			return {
				id: { value: file.id, link: null, editable: false, hidden: true },
				index: { value: count++, link: null, editable: false, hidden: false },
				fileName: { value: file.filename, link: file.url, new_tab_link: true, isFile: true, editable: false, hidden: false },
				alias: { value: file.alias, id: file.id, editable: true, label: 'Host Document Alias', hidden: false },
				date: { value: this._date.transform(file.dateCreated, 'MMM dd, y h:mm a'), editable: false, hidden: false },
				s3FileName: { value: file.s3Filename, hidden: true }
			};
		});
	}

	private subscribeToRefreshPage() {
		this._helper.onRefreshSingleHostDocumentsTab.pipe(takeUntil(this._unsubscribe)).subscribe(() => this.getDocuments());
	}

	protected get columns() {
		return ['#', 'File', 'Alias', 'Upload Date', 'Actions'];
	}

	protected get filestackOptions(): filestack.PickerOptions {
		return {
			storeTo: {
				location: 's3',
				container: 'n-compass-files',
				region: 'us-east-1'
			},
			accept: ['.doc', '.docx', '.pdf'],
			maxFiles: 10,
			onUploadDone: (response) => {
				const files = response.filesUploaded.map((uploaded) => {
					const { filename, key } = uploaded;
					return { oldFile: filename, newFile: key };
				});

				const toUpload: HOST_S3_FILE = {
					hostId: this.hostId,
					type: 2,
					createdBy: this.currentUser.user_id,
					files
				};

				this._host
					.upload_s3_files(toUpload)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe(
						() => this.ngOnInit(),
						(error) => {
							console.error(error);
						}
					);
			}
		};
	}
}
