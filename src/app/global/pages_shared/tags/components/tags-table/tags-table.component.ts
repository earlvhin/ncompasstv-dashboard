import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { Tag, TagType } from 'src/app/global/models';
import { TagService,  } from 'src/app/global/services';
import { EditTagComponent } from '../../dialogs';

@Component({
	selector: 'app-tags-table',
	templateUrl: './tags-table.component.html',
	styleUrls: ['./tags-table.component.scss']
})
export class TagsTableComponent implements OnInit, OnDestroy {

	@Input() isLoading = true;
	@Input() tableType = 'tags';
	@Input() currentTagType: TagType;
	@Input() currentUserRole: string;
	@Input() tagOwners: { owner: { displayName: string }, tagTypeId: string, tags: Tag[] }[];
	@Input() tableColumns: any[];
	@Input() tableData: Tag[] | { owner: { displayName: string }, tagTypeId: string, tags: Tag[] }[] = [];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _dialog: MatDialog,
		private _tag: TagService
	) { }
	
	ngOnInit() {
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	async onDeleteTag(id: string): Promise<void> {
		
		const response = await this.openConfirmAPIRequestDialog('delete_tag').toPromise();

		if (!response) return;

		this._tag.deleteTag([id])
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this._tag.onRefreshTagsTable.emit(),
				error => console.log('Error deleting tag', error)
			);

	}

	async onDeleteAllTagsFromOwner(owner: any): Promise<void> {

		const response = await this.openConfirmAPIRequestDialog('delete_all_tags_from_owner').toPromise();

		if (!response) return;

		const ownerId = this.getOwnerId(owner);

		this._tag.deleteAllTagsFromOwner(ownerId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this._tag.onRefreshTagOwnersTable.emit(),
				error => console.log('Error deleting all tags from owner', error)
			);
	}

	async onDeleteTagFromOwner(tagId: string, data: { owner: any }): Promise<void> {
	
		const response = await this.openConfirmAPIRequestDialog('delete_tag_from_owner').toPromise();

		if (!response) return;

		const ownerId = this.getOwnerId(data.owner);

		this._tag.deleteTagByIdAndOwner(tagId, ownerId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this._tag.onRefreshTagOwnersTable.emit(),
				error => console.log('Error deleting tag from owner', error)
			);

	}

	async onOpenDialog(type: string, data: Tag | any) {

		let dialog: MatDialogRef<EditTagComponent | any>;

		switch (type) {

			case 'edit_tag':
				dialog = this._dialog.open(EditTagComponent, { width: '500px' })
				dialog.componentInstance.tag = data;
				break;

		}

		return await dialog.afterClosed().toPromise();

	}

	getOwnerLink(owner: any): string {
		const ownerId = this.getOwnerId(owner);
		const currentTagType = `${this.currentTagType.name.toLowerCase()}s`;
		return `/${this.currentUserRole}/${currentTagType}/${ownerId}`;
	}

	setTagColor(value: string): string {
		return value ? value : 'gray';
	}

	private getOwnerId(owner: any): string {

		let result = null;
		const type = this.currentTagType.name.toLowerCase();

		switch (type) {
			case 'host':
			case 'hosts':
				result = owner.hostId;
				break;

			case 'license':
			case 'licenses':
				result = owner.licenseId;
				break;
			
			case 'advertiser':
			case 'advertisers':
				result = owner.id;
				break;

			default:
				result = owner.dealerId;
		}

		return result;

	}

	private openConfirmAPIRequestDialog(type: string, data = {}) {

		let message: string;
		let title: string;
		let status = 'warning';
		let return_msg: string;
		let width = '500px';
		let height = '350px';

		switch (type) {

			case 'delete_tag':
				title = 'Delete Tag';
				message = `Associated ${this.currentTagType.name.toLowerCase()}s will be removed from this tag`;
				return_msg = 'Confirmed deletion';
				break;

			case 'delete_tag_from_owner':
				title = 'Remove Tag';
				message = `Remove `;

			case 'delete_all_tags_from_owner':
				title = 'Delete Owner Tags';
				message = `ALL associated tags from ${this.currentTagType.name.toLowerCase()} will be removed`
				return_msg = 'Confirmed deletion'
				break;
		}

		return this._dialog.open(ConfirmationModalComponent, { width, height, data: { status, message: title, data: message, return_msg } }).afterClosed();

	}

}
