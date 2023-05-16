import { Component, Input, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';
import { FormControl, Validators } from '@angular/forms';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { PAGING, TAG, TAG_OWNER, TAG_TYPE, UI_ROLE_DEFINITION_TEXT } from 'src/app/global/models';
import { TagService, AuthService } from 'src/app/global/services';
import { CreateTagComponent } from '../../dialogs';
import { AssignTagsComponent } from '../../dialogs/assign-tags/assign-tags.component';

@Component({
	selector: 'app-tag-owners-section',
	templateUrl: './tag-owners-section.component.html',
	styleUrls: ['./tag-owners-section.component.scss']
})
export class TagOwnersSectionComponent implements OnInit, OnDestroy {
	@Input() columns: { name: string; class: string }[];
	@Input() currentUserId: string;
	@Input() currentUserRole: string;
	@Input() tab: string;
	@Input() tagTypes: TAG_TYPE[];
	@Output() onRefreshTagsCount = new EventEmitter<void>();

	currentFilter = 'All';
	currentTagType: TAG_TYPE;
	hasTagSelected = false;
	isLoading = false;
	owners: TAG_OWNER[] = [];
	ownerTypes = this._tagOwnerTypes;
	pagingData: PAGING;
	searchFormControl = new FormControl(null, Validators.minLength(3));
	selectedTag: TAG;
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _dialog: MatDialog, private _tag: TagService, private _auth: AuthService) {}

	ngOnInit() {
		const defaultType = this.tagTypes[0];
		this.currentTagType = defaultType;
		this.currentFilter = defaultType.name;
		this.searchOwnerTags();
		this.subscribeToRefreshTableData();
		this.subscribeToSearch();
		this.subscribeToTagNameClick();
		if (this.currentUserRole === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
			this.currentUserRole = UI_ROLE_DEFINITION_TEXT.administrator;
		}
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	clickedPageNumber(page: number): void {
		let tagId = null;
		const keyword = this.searchFormControl.value;
		if (this.selectedTag && this.selectedTag.tagId) tagId = this.selectedTag.tagId;
		this.searchOwnerTags(keyword, tagId, null, page);
	}

	onClearSelectedTag(): void {
		this.clearSelectedTag();
		this.searchOwnerTags();
	}

	onFilterByOwnerType(data: { id: number; name: string }): void {}

	openDialog(name: string): void {
		let dialogConfig: MatDialogConfig = null;
		let dialog: MatDialogRef<CreateTagComponent | AssignTagsComponent> = null;

		switch (name) {
			case 'add_tag':
				dialogConfig = {
					width: '500px',
					height: '400px',
					panelClass: 'dialog-container-position-relative',
					data: { user: this.currentUserId }
				};

				dialog = this._dialog.open(CreateTagComponent, dialogConfig);
				(dialog as MatDialogRef<CreateTagComponent>).componentInstance.currentUserId = this.currentUserId;
				(dialog as MatDialogRef<CreateTagComponent>).componentInstance.tab = this.tab;

				break;

			case 'assign_tags':
				dialogConfig = {
					width: '500px',
					height: '700px',
					panelClass: 'dialog-container-position-relative'
				};

				dialog = this._dialog.open(AssignTagsComponent, dialogConfig);
				(dialog as MatDialogRef<AssignTagsComponent>).componentInstance.tab = this.tab;

				break;
		}

		dialog.afterClosed().subscribe((response: boolean) => {
			if (!response) return;
			this._tag.onRefreshTagsCount.next();
			this._tag.onRefreshTagOwnersTable.next();
			this._tag.onRefreshTagsTable.next();
		});
	}

	private clearSelectedTag(): void {
		this.hasTagSelected = false;
		this.selectedTag = null;
	}

	private searchOwnerTags(keyword: string = null, tagId: string = null, typeId: number = null, page = 1): void {
		if (!this.currentTagType) return;
		this.isLoading = true;

		if (this.searchFormControl.value) keyword = this.searchFormControl.value;
		let role: number;
		if (this._isDealer()) {
			role = 2;
		} else if (this._isDealerAdmin()) {
			role = 3;
		} else {
			role = 1;
		}

		this._tag
			.searchOwnersByTagType({ keyword, tagId, typeId, page, role }, this._isDealer())
			.pipe(
				takeUntil(this._unsubscribe),
				map(({ tags, paging, message }) => {
					if (message) return { tags: [] };

					tags.forEach((data, index) => {
						const { tagTypeName } = data;
						tags[index].url = `/${this.currentUserRole}/${tagTypeName.toLowerCase()}s/${data.ownerId}`;
					});

					return { tags, paging };
				})
			)
			.subscribe(
				({ tags, paging }) => {
					this.owners = tags;
					this.pagingData = paging;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => (this.isLoading = false));
	}

	private subscribeToRefreshTableData(): void {
		this._tag.onRefreshTagOwnersTable.pipe(takeUntil(this._unsubscribe)).subscribe(() => this.searchOwnerTags());
	}

	private subscribeToSearch(): void {
		this.searchFormControl.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000)).subscribe((keyword) => {
			if (this.searchFormControl.invalid) return;
			this.clearSelectedTag();
			this.searchOwnerTags(keyword, null, 0);
			this._tag.onSearch.next(keyword);
		});
	}

	private subscribeToTagNameClick(): void {
		this._tag.onClickTagName.pipe(takeUntil(this._unsubscribe)).subscribe(({ tag, tab }) => {
			if (tab !== this.tab) return;

			this.selectedTag = tag;
			this.searchOwnerTags(null, tag.tagId);
			this.hasTagSelected = true;
		});
	}

	_isDealer() {
		const DEALER_ROLES = ['dealer', 'sub-dealer'];
		return DEALER_ROLES.includes(this._auth.current_role);
	}

	_isDealerAdmin() {
		return this._auth.current_role === 'dealeradmin';
	}

	protected get _tagOwnerTypes() {
		if (!this._isDealer()) {
			return [
				{ id: 1, name: 'dealer' },
				{ id: 2, name: 'license' },
				{ id: 3, name: 'host' },
				{ id: 4, name: 'advertiser' }
			];
		} else {
			return [
				{ id: 2, name: 'license' },
				{ id: 3, name: 'host' },
				{ id: 4, name: 'advertiser' }
			];
		}
	}
}
