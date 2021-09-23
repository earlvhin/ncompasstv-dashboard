import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { TAG_OWNER, TAG_TYPE } from 'src/app/global/models';
import { CreateTagComponent } from './dialogs';
import { AuthService, TagService, } from 'src/app/global/services';

@Component({
	selector: 'app-tags',
	templateUrl: './tags.component.html',
	styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit, OnDestroy {

	count = { dealer: 0, host: 0, advertiser: 0, license: 0 };
	currentTabIndex = 0;
	currentTagType: TAG_TYPE;
	isLoadingCount = false;
	isOwnersTabLoading = false;
	owners: TAG_OWNER[] = [];
	ownersTabSearchKey = null;
	searchForm: FormGroup;
	tagTypes: TAG_TYPE[] = [];
	tagTypesMutated: TAG_TYPE[] = [];
	title = 'Tags';

	tagsTableSettings = { columns: this.getColumns() };
	tagOwnersTableSettings = { columns: this.getColumns('tag-owners') };
	
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _tag: TagService,
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
			height: '700px',
			data: { tagTypes: this.tagTypes, tagType: null },
			panelClass: 'dialog-container-position-relative'
		});

		dialog.afterClosed()
			.subscribe(
				(response: boolean) => {
					if (!response) return;
					this.getTagsCount();
					// this.searchOwnerTags();
				}
			);
	}

	onChangeTab(event: { index: number }): void {
		this.currentTabIndex = event.index;
		this.ownersTabSearchKey = null;
	}

	onClickTagName(event: { tag: string }): void {
		this.ownersTabSearchKey = event.tag;
		this.currentTabIndex = 1;
	}

	get currentUserRole() {
		return this._auth.current_role;
	}

	private getAllTagTypes(): void {

		this._tag.getAllTagTypes()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { tag_types: TAG_TYPE[] }) => {
					this.tagTypes = [ ...response.tag_types ] ;
					this.tagTypesMutated = [ ...response.tag_types ];
					this.tagTypesMutated.unshift({ tagTypeId: 0, name: 'All', dateCreated: null, status: null });
					this.currentTagType = response.tag_types.filter(type => type.name.toLowerCase() === 'dealer')[0];
				},
				error => console.log('Error retrieving tag types', error)
			);

	}

	private getColumns(table = '') {

		let columns = [
			{ name: '#', class: 'p-3 index-column-width' },
		];

		switch (table) {

			case 'tag-owners':
				columns.push(
					{ name: 'Owner', class: 'p-3' },
					{ name: 'Tag Type', class: 'p-3' },
					{ name: 'Tags', class: 'p-3' },
				);

				break;

			default:

				columns.push(
					{ name: 'Name', class: 'p-3' },
				);

				break;
		}

		columns.push({ name: 'Actions', class: 'p-3 text-center' });
		return columns;

	}

	private getTagsCount(): void {

		this.isLoadingCount = true;

		this._tag.getAllTagsCount()
			.pipe(takeUntil(this._unsubscribe), map(response => response.tags))
			.subscribe(
				(response: {}[]) => {
					response.forEach(data => Object.keys(data).forEach(key => this.count[key.toLowerCase()] = data[key]));
				},
				error => console.log('Error retrieving tags count ', error)
			)
			.add(() => this.isLoadingCount = false);

	}
	
}
