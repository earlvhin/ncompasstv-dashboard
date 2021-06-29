import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { CreateTagComponent } from '../create-tag/create-tag.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { Tag } from 'src/app/global/models/tag.model';
import { TagService } from 'src/app/global/services/tag.service';
import { TagType } from 'src/app/global/models/tag-type.model';

@Component({
	selector: 'app-view-tag',
	templateUrl: './view-tag.component.html',
	styleUrls: ['./view-tag.component.scss']
})
export class ViewTagComponent implements OnInit, OnDestroy {

	columns = [];
	hasDeleted = false;
	isLoading = true;
	tagName: string;
	tags: Tag[] = [];
	tagType: TagType;
	tagTypes: TagType[];
	title = 'View Tag';
	
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: { tagName: string, tagType: TagType, tagTypes: TagType[] },
		private _dialog: MatDialog,
		private _tag: TagService
	) { }
	
	ngOnInit() {
		const { tagName, tagType, tagTypes } = this._dialog_data;
		this.tagName = tagName;
		this.tagType = tagType;
		this.tagTypes = tagTypes;
		this.title = `Tag Name: ${this.tagName}`;
		this.setColumns();
		this.getTagsByNameAndType(tagName, this.tagType.tagTypeId);
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onAddTag(): void {
		const dialog = this._dialog.open(CreateTagComponent, {
			width: '500px',
			height: '500px',
			data: { tagName: this.tagName, tagType: this.tagType, tagTypes: this.tagTypes },
			panelClass: 'dialog-container-position-relative',
			autoFocus: false
		});

		dialog.afterClosed()
			.subscribe(
				(response: boolean) => {
					if (!response) return;
					this.getTagsByNameAndType(this.tagName, this.tagType.tagTypeId);
				}
			);
	}

	onDelete(tagId: number): void {

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { 
				status: 'warning', 
				message: 'Delete From Tag',  
				data: 'Are you sure about this?',
				return_msg: 'Confirmed deletion'
			}
		});

		dialog.afterClosed()
			.subscribe(
				response => {

					if (!response) return;
					this.isLoading = true;

					this._tag.deleteTag([`${tagId}`])
						.pipe(takeUntil(this._unsubscribe))
						.subscribe(
							() => {
								this.hasDeleted = true;

								this._tag.getTagsByNameAndType(this.tagName, this.tagType.tagTypeId)
									.pipe(takeUntil(this._unsubscribe))
									.subscribe(
										response => this.tags = response.tags,
										error => console.log('Error retrieving tags', error)
									)
									.add(() => this.isLoading = false)
							},
							error => console.log('Error deleting tag', error)
							
						);

				}
			);
	}

	private getTagsByNameAndType(tagName: string, tagTypeId: number): void {

		this._tag.getTagsByNameAndType(tagName, tagTypeId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { tags: Tag[] }) => this.tags = response.tags,
				error => console.log('Error retrieving distinct tags', error)
			)
			.add(() => this.isLoading = false);

	}

	private setColumns() {
		this.columns = [
			{ name: '#', class: 'p-3 index-column-width' },
			{ name: this.tagType.name, class: 'p-3' },
			{ name: 'Actions', class: 'p-3 text-center' }
		];
	}

	
}
