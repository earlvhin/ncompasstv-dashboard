import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { debounceTime, delay, map, takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

import { Tag, TagType } from 'src/app/global/models';
import { CreateTagComponent, EditTagComponent } from './dialogs';
import { AuthService, TagService,  } from 'src/app/global/services';

@Component({
	selector: 'app-tags',
	templateUrl: './tags.component.html',
	styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit, OnDestroy {

	count = { dealer: 0, host: 0, advertiser: 0, license: 0 };
	currentTagType: TagType;
	filteredOwners: ReplaySubject<any> = new ReplaySubject(1);
	isLoadingCount = false;
	isLoadingTags = false;
	isLoadingTagOwners = false;
	isSearchingTags = true;
	owners: { owner: { displayName: string }, tagTypeId: string, tags: Tag[] }[];
	searchForm: FormGroup;
	tags: Tag[];
	tagTypes: TagType[] = [];
	title = 'Tags';

	tagsTableSettings = { columns: this.getColumns() };
	tagOwnersTableSettings = { columns: this.getColumns('tag-owners') };
	
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _form_builder: FormBuilder,
		private _tag: TagService,
	) { }
	
	ngOnInit() {
		this.initializeSearchForm();
		this.subscribeToOwnerSearch();
		this.getAllTagTypes();
		this.getTagsCount();
		this.getAllTags();
		this.subscribeToEventEmitters();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onAddTag(): void {
		const dialog = this._dialog.open(CreateTagComponent, {
			width: '900px',
			height: '500px',
			data: { tagTypes: this.tagTypes, tagType: this.currentTagType },
			panelClass: 'dialog-container-position-relative'
		});

		dialog.afterClosed()
			.subscribe(
				(response: boolean) => {
					if (!response) return;
					this.getTagsCount();
					this.searchTags();
				}
			);
	}

	onSelectTagType(type: TagType): void {
		this.currentTagType = type;
		this.searchTags();
		this.tagFilterControl.setValue(null);
	}

	onViewTag(tagName: string): void {
		const dialog = this._dialog.open(EditTagComponent, {
			width: '500px',
			height: '450px',
			data: { tagName, tagType: this.currentTagType, tagTypes: this.tagTypes },
			autoFocus: false
		});

		dialog.afterClosed()
			.subscribe(
				response => {

					if (!response) return;
					this.getTagsCount();

				}
			);
	}

	get currentUserRole() {
		return this._auth.current_role;
	}

	get tagFilter() {
		return this.tagFilterControl.value;
	}

	private getAllTags() {

		this.isLoadingTags = true;

		return this._tag.getAllTags()
			.pipe(takeUntil(this._unsubscribe), map(response => response.tags))
			.subscribe(
				response => this.tags = response,
				error => console.log('Error retrieving all tags', error)
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
			.add(() => this.searchTags());

	}

	private getColumns(table = '') {

		let columns = [
			{ name: '#', class: 'p-3 index-column-width' },
		];

		switch (table) {

			case 'tag-owners':
				columns.push(
					{ name: 'Owner', class: 'p-3' },
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

	private initializeSearchForm(): void {
		this.filteredOwners.next([]);

		this.searchForm = this._form_builder.group({
			tagFilter: [ null ]
		});

	}

	private searchTags(keyword = ''): void {

		if (keyword == null) return;

		this.isLoadingTagOwners = true;

		this._tag.searchOwnersByTagType(this.currentTagType.tagTypeId, keyword)
			.pipe(takeUntil(this._unsubscribe))
			.map(
				(response: { owner: any, tagTypeId: string, tags: any[] }[]) => {

					const type = this.currentTagType.name.toLowerCase();
					let displayName = null;

					response.forEach(
						(data, index) => {

							const { owner } = data;

							switch (type) {
								case 'host':
								case 'hosts':
									displayName = `${owner.name} (${owner.city})`;
									break;
					
								case 'license':
								case 'licenses':
									displayName = owner.alias ? owner.alias : owner.licenseKey;
									break;
								
								case 'advertiser':
								case 'advertisers':
									displayName = owner.name;
									break;
					
								default:
									displayName = owner.businessName;
							}

							response[index].owner.displayName = displayName;

						}
					);

					return response;
				}
			)
			.subscribe(
				(response: { owner: any, tagTypeId: string, tags: Tag[] }[]) => this.owners = response,
				error => console.log('Error retrieving tags by tag type', error)
			)
			.add(() => this.isLoadingTagOwners = false);

	}

	private subscribeToOwnerSearch(): void {
		
		this.tagFilterControl.valueChanges
			.pipe(
				takeUntil(this._unsubscribe),
				debounceTime(1000),
				map(keyword => this.searchTags(keyword)),
				delay(500),
				takeUntil(this._unsubscribe)
			)
			.subscribe(() => { });

	}

	private subscribeToEventEmitters(): void {

		this._tag.onRefreshTagsTable
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => this.getAllTags());

		this._tag.onRefreshTagOwnersTable
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => this.searchTags());

	}

	protected get tagFilterControl() {
		return this.getSearchFormControl('tagFilter');
	}

	protected getSearchFormControl(name: string) {
		return this.searchForm.get(name);
	}
	
}
