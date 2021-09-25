import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

import { PAGING, TAG, TAG_TYPE } from 'src/app/global/models';
import { TagService,  } from 'src/app/global/services';

@Component({
	selector: 'app-tags-tab',
	templateUrl: './tags-tab.component.html',
	styleUrls: ['./tags-tab.component.scss']
})
export class TagsTabComponent implements OnInit, OnDestroy {

	@Input() columns: { name: string, class: string }[];
	@Input() currentTabIndex: number;
	@Input() currentTagType: TAG_TYPE;
	@Input() currentUserRole: string;
	@Input() tagTypes: TAG_TYPE[];
	@Output() clickedTagName = new EventEmitter<{ tag: string }>();
	
	currentFilter = 'All';
	isLoading = true;
	filteredOwners: ReplaySubject<any> = new ReplaySubject(1);
	searchFormControl = new FormControl(null, Validators.minLength(3));
	tags: TAG[] = [];
	pagingData: PAGING;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _tag: TagService,
	) { }
	
	ngOnInit() {
		if (!this.tags || this.tags.length <= 0) this.searchTags();
		this.subscribeToSearch();
		this.subscribeToRefreshTableData();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onClickPageNumber(page: number): void {
		this.searchTags(page);
	}

	onClickTagName(event: { tag: string }): void {
		this.clickedTagName.emit(event);
	}

	private searchTags(page = 1) {

		this.isLoading = true;
		const keyword = this.searchFormControl.value;
		let request = this._tag.searchAllTags(keyword, page);
		if (!keyword || keyword.trim().length === 0) request = this._tag.getAllTags(page);

		return request.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				({ tags, paging, message }) => {

					if (message) {
						this.tags = [];
						return;
					}

					this.tags = tags;
					this.pagingData = paging;

				},
				error => console.log('Error searching for tags ', error)
			)
			.add(() => this.isLoading = false);

	}

	private subscribeToSearch(): void {

		this.searchFormControl.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000))
			.subscribe(
				() => {
					if (this.searchFormControl.invalid) return;
					this.isLoading = true;
					this.searchTags().add(() => this.isLoading = false);
				}
			);

	}

	private subscribeToRefreshTableData(): void {

		this._tag.onRefreshTagsTable.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => this.searchTags());

	}
	
}
