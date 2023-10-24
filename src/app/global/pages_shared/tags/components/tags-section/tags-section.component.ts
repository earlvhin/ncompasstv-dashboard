import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

import { PAGING, TAG, TAG_TYPE } from 'src/app/global/models';
import { TagService, AuthService } from 'src/app/global/services';

@Component({
	selector: 'app-tags-section',
	templateUrl: './tags-section.component.html',
	styleUrls: ['./tags-section.component.scss']
})
export class TagsSectionComponent implements OnInit, OnDestroy {
	@Input() columns: { name: string; class: string }[];
	@Input() currentTagType: TAG_TYPE;
	@Input() currentUserId: string;
	@Input() currentUserRole: string;
	@Input() tab: string;
	@Input() tagTypes: TAG_TYPE[];

	currentFilter = 'All';
	isLoading = true;
	filteredOwners: ReplaySubject<any> = new ReplaySubject(1);
	searchFormControl = new FormControl(null, Validators.minLength(3));
	tags: TAG[] = [];
	title = 'tags management';
	pagingData: PAGING;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _tag: TagService, private _auth: AuthService) {}

	ngOnInit() {
		if (!this.tags || this.tags.length <= 0) this.searchTags();
		this.subscribeToSearch();
		this.subscribeToRefreshTableData();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	clickedPageNumber(page: number): void {
		this.searchTags(null, page);
	}

	private searchTags(keyword = '', page = 1) {
		let role = 0;
		this.isLoading = true;

		if (this._isDealer()) {
			role = 2;
		} else if (this._isDealerAdmin()) {
			role = 3;
		} else {
			role = 1;
		}

		let searchParams: { page: number; role: number; keyword?: string } = { page, role };

		if (keyword && keyword.length > 0) searchParams.keyword = keyword;

		return this._tag
			.searchAllTags(searchParams, this._isDealer())
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				({ tags, paging, message }) => {
					if (message) {
						this.tags = [];
						return;
					}

					this.tags = tags;
					this.pagingData = paging;
				},
				(error) => {
					console.error(error);
				}
			)
			.add(() => (this.isLoading = false));
	}

	_isDealer() {
		const DEALER_ROLES = ['dealer', 'sub-dealer'];
		return DEALER_ROLES.includes(this._auth.current_role);
	}

	_isDealerAdmin() {
		return this._auth.current_role === 'dealeradmin';
	}

	private subscribeToSearch(): void {
		this._tag.onSearch.pipe(takeUntil(this._unsubscribe)).subscribe((keyword) => {
			if (this.searchFormControl.invalid) return;
			this.isLoading = true;
			this.searchTags(keyword).add(() => (this.isLoading = false));
		});
	}

	private subscribeToRefreshTableData(): void {
		this._tag.onRefreshTagsTable.pipe(takeUntil(this._unsubscribe)).subscribe(() => this.searchTags());
	}
}
