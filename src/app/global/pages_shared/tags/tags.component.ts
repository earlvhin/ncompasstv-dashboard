import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { CreateTagComponent } from './dialogs/create-tag/create-tag.component';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { Tag } from '../../models/tag.model';
import { TagService } from '../../services/tag.service';
import { TagType } from '../../models/tag-type.model';
import { ViewTagComponent } from './dialogs/view-tag/view-tag.component';

@Component({
	selector: 'app-tags',
	templateUrl: './tags.component.html',
	styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit, OnDestroy {

	count = { dealer: 0, host: 0, advertiser: 0, license: 0 };
	currentTagType: TagType;
	isLoadingCount = false;
	isLoadingTags = false;
	tags: { name: string, count: number }[] = [];
	tagTypes: TagType[] = [];
	title = 'Tags';
	
	columns = [
		{ name: '#', class: 'p-3 index-column-width' },
		{ name: 'Name', class: 'p-3' },
	 	{ name: 'Count', class: 'p-3' },
		{ name: 'Actions', class: 'p-3 text-center' }
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _dialog: MatDialog,
		private _tag: TagService
	) { }
	
	ngOnInit() {
		this.getAllTagTypes();
		this.getTagsCount();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onAddTag(): void {
		const dialog = this._dialog.open(CreateTagComponent, {
			width: '500px',
			height: '500px',
			data: { tagTypes: this.tagTypes },
			panelClass: 'dialog-container-position-relative'
		});

		dialog.afterClosed()
			.subscribe(
				(response: boolean) => {
					if (!response) return;
					this.getTagsCount();
					this.getDistinctTagsByTypeId(this.currentTagType.tagTypeId);
				}
			);
	}

	onDelete(tagName: string): void {

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { 
				status: 'warning', 
				message: 'Delete Tag',  
				data: `Associated ${this.currentTagType.name.toLowerCase()}s will be removed from this tag`,
				return_msg: 'Confirmed deletion'
			}
		});

		dialog.afterClosed()
			.subscribe(
				response => {

					if (!response) return;

					this._tag.getTagsByNameAndType(tagName, this.currentTagType.tagTypeId)
						.pipe(takeUntil(this._unsubscribe))
						.subscribe(
							async (response: { tags: Tag[] }) => {

								const tagIdsToDelete = response.tags.map(tag => `${tag.tagId}`);

								try {

									await this._tag.deleteTag(tagIdsToDelete).toPromise();
									this.getTagsCount();
									this.getDistinctTagsByTypeId(this.currentTagType.tagTypeId);

								} catch (error) {
									console.error('Error deleting tag', error);
								}


							},
							error => console.log('Error retrieving distinct tags', error)
						);

				}
			);
	}

	onSelectTagType(type: TagType): void {
		this.currentTagType = type;
		this.getDistinctTagsByTypeId(this.currentTagType.tagTypeId);
	}

	onViewTag(tagName: string): void {
		const dialog = this._dialog.open(ViewTagComponent, {
			width: '500px',
			height: '450px',
			data: { tagName, tagType: this.currentTagType, tagTypes: this.tagTypes },
			autoFocus: false
		});

		dialog.afterClosed().subscribe(
			response => {

				if (!response) return;
				this.getTagsCount();
				this.getDistinctTagsByTypeId(this.currentTagType.tagTypeId);

			}
		);
	}

	private getDistinctTagsByTypeId(typeId: number): void {
		this.isLoadingTags = true;

		this._tag.getDistinctTagsByTypeId(typeId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { tags: { name: string, count: number }[] }) => {
					this.tags = response.tags;
				},
				error => console.log('Error retrieving distinct tags', error)
			)
			.add(() => this.isLoadingTags = false);

	}

	private getAllTagTypes(): void {

		this._tag.getAllTagTypes()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { tag_types: TagType[] }) => {
					this.tagTypes = response.tag_types;
					this.currentTagType = response.tag_types.filter(type => type.name.toLowerCase() === 'dealer')[0];
				},
				error => console.log('Error retrieving tag types', error)
			)
			.add(() => {
				this.getDistinctTagsByTypeId(this.currentTagType.tagTypeId);
			});

	}

	private getTagsCount(): void {

		this._tag.getAllTagsCount()
			.pipe(takeUntil(this._unsubscribe))
			.map((response: { tags: any[][] }) => {
				const filtered = response.tags.filter(tag => tag.length);

				const mapped = filtered.map((tag: { name: string, count: number }[]) => {
					const { name, count } = tag[0]; 
					return { name, count };
				});

				return mapped;
			})
			.subscribe(
				(response: { name: string, count: number }[]) => {

					response.forEach(
						countObj => {
							const countName = countObj.name.toLowerCase();
							this.count[countName] = countObj.count;
						}
					);

				},
				error => console.log('Error retrieving tags count ', error)
			);

	}
	
}
