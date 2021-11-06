import { Component, Input, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { HostService } from 'src/app/global/services';
import { API_HOST_CONTENT, PAGING, UI_HOST_CONTENT } from 'src/app/global/models';
import { DatePipe } from '@angular/common';

@Component({
	selector: 'app-host-contents-tab',
	templateUrl: './contents-tab.component.html',
	styleUrls: ['./contents-tab.component.scss']
})
export class ContentsTabComponent implements OnInit {

	@Input() currentRole: string;
	@Input() hostId: string;

	contents: API_HOST_CONTENT[];
	contentsForDialog: any[];
	hasNoData = false;
	pagingData: PAGING;
	tableColumns: string[];
	tableData: UI_HOST_CONTENT[];
	
	protected _unsubscribe = new Subject<void>();

	constructor(
		private _date: DatePipe,
		private _host: HostService
	) { }
	
	ngOnInit() {
		this.tableColumns = this.columns;
		this.getContents();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getContents(page = 1): void {

		this.contents = [];

		this._host.get_contents(this.hostId, page)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {

					if (response.message || response.contents.length <= 0) {
						this.tableData = [];
						this.hasNoData = true;
						return;
					}

					this.pagingData = response.paging;
					this.contents = [...response.contents];
					this.contentsForDialog = this.mapToMediaPreviewDialog([...response.contents]);
					this.tableData = this.mapToTable([...response.contents]);

				},
				error => console.log('Error retrieving host contents', error)
			)
	}

	private mapToTable(data: API_HOST_CONTENT[]): UI_HOST_CONTENT[] {

		let count = this.pagingData.pageStart;
		
		return data.map(
			content => {

				return {
					id: { value: content.advertiserId, link: null , editable: false, hidden: true} ,
					index: { value: count++, link: null , editable: false, hidden: false },
					name: { value: this.parseFileName(content.fileName), link: `/${this.currentRole}/media-library/${content.contentId}`, new_tab_link: true, editable: false, hidden: false },
					type: { value: content.fileType == 'jpeg' || content.fileType == 'jfif' || content.fileType == 'jpg' || content.fileType == 'png' ? 'Image' : 'Video', link: null , editable: false, hidden: false },
					uploadDate: { value: this._date.transform(content.dateCreated, 'MMMM d, y') },
					uploadedBy: { value: content.createdByName ? content.createdByName : '--', link: null , editable: false, hidden: false },
				}

			}
		);

	}

	private mapToMediaPreviewDialog(data: API_HOST_CONTENT[]) {

		return data.map(
			content => {

				let {
					advertiserId,
					dealerId,
					duration,
					hostId,
					fileName, 
					fileType, 
					filesize, 
					dateCreated, 
					createdByName, 
					previewThumbnail, 
					title 
				} = content;

				duration = Math.round(duration);

				return {
					advertiser_id: advertiserId,
					dealer_id: dealerId,
					duration,
					host_id: hostId,
					fileName,
					fileType,
					filesize,
					dateCreated,
					uploaded_by: createdByName,
					createdBy: createdByName,
					thumbnail: previewThumbnail,
					title
				};
			}
		);
	}

	private parseFileName(name: string) {
		if (name.split('_').length === 1) return name;
		const segments = name.split('_');
		segments.splice(0, 1);
		return segments.join('');
	}

	protected get columns(): string[] {
		return [
			'#',
			'Name',
			'Type',
			'Upload Date',
			'Uploaded By',
		];
	}
	
}
