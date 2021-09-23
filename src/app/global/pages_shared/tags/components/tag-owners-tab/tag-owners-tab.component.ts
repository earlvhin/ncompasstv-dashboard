import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { PAGING, TAG_OWNER, TAG_TYPE } from 'src/app/global/models';
import { TagService,  } from 'src/app/global/services';

@Component({
	selector: 'app-tag-owners-tab',
	templateUrl: './tag-owners-tab.component.html',
	styleUrls: ['./tag-owners-tab.component.scss']
})
export class TagOwnersTabComponent implements OnInit, OnDestroy {
	
	@Input() columns: { name: string, class: string }[];
	@Input() currentUserRole: string;
	@Input() tagTypes: TAG_TYPE[];
	@Input() searchKey: string;
	
	currentFilter = 'All';
	currentTagType: TAG_TYPE;
	isLoading = false;
	owners: TAG_OWNER[] = [];
	pagingData: PAGING;
	searchFormControl = new FormControl();
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _tag: TagService,
	) { }
	
	ngOnInit() {
		const defaultType = this.tagTypes[0];
		this.currentTagType = defaultType;
		this.currentFilter = defaultType.name;
		this.searchOwnerTags(this.searchKey, 0);
		this.subscribeToRefreshTableData();
		this.subscribeToSearch();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onClickPageNumber(page: number): void {
		const keyword = this.searchFormControl.value;
		this.searchOwnerTags(keyword, null, page);
	}

	onSelectTagType(type: TAG_TYPE): void {
		this.currentTagType = type;
		this.currentFilter = type.name;
		this.searchOwnerTags(null, type.tagTypeId);
	}

	private searchOwnerTags(keyword = null, tagTypeId = null, page = 1): void {

		if (!this.currentTagType) return;
		this.isLoading = true;

		if (this.searchFormControl.value) keyword = this.searchFormControl.value;

		this._tag.searchOwnersByTagType(keyword, tagTypeId, page)
			.pipe(
				takeUntil(this._unsubscribe),
				map(
					({ tags, paging, message}) => {
	
						if (message) return { tags: [] };

						tags.forEach(
							(data, index) => {
								const { tagTypeName } = data;
								tags[index].url = `/${this.currentUserRole}/${tagTypeName.toLowerCase()}s/${data.ownerId}`;
							}
						);
	
						return { tags, paging };
					}
				)
			)
			.subscribe(
				({ tags, paging }) => {
					this.owners = tags;
					this.pagingData = paging;
				},
				error => console.log('Error retrieving tags by tag type', error)
			)
			.add(() => this.isLoading = false);

	}

	private subscribeToRefreshTableData(): void {

		this._tag.onRefreshTagOwnersTable
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => this.searchOwnerTags());

	}

	private subscribeToSearch(): void {

		this.searchFormControl.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000))
			.subscribe(
				keyword => this.searchOwnerTags(keyword, 0)
			);

	}
	
}
