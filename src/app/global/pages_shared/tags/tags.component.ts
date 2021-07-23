import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { debounceTime, delay, map, takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

import { CreateTagComponent } from './dialogs/create-tag/create-tag.component';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { Tag } from '../../models/tag.model';
import { TagService } from '../../services/tag.service';
import { TagType } from '../../models/tag-type.model';
import { ViewTagComponent } from './dialogs/view-tag/view-tag.component';
import { AuthService } from '../../services/auth-service/auth.service';

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
	isSearchingTags = true;
	owners: { owner: { displayName: string }, tagTypeId: string, tags: Tag[] }[];
	searchForm: FormGroup;
	tags: { name: string, count: number }[] = [];
	tagTypes: TagType[] = [];
	title = 'Tags';
	
	columns = [
		{ name: '#', class: 'p-3 index-column-width' },
		{ name: 'Owner', class: 'p-3' },
		{ name: 'Tags', class: 'p-3' },
		{ name: 'Actions', class: 'p-3 text-center' }
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _form_builder: FormBuilder,
		private _tag: TagService
	) { }
	
	ngOnInit() {
		this.initializeSearchForm();
		this.subscribeToOwnerSearch();
		this.getAllTagTypes();
		this.getTagsCount();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getOwnerLink(owner: any): string {
		const ownerId = this.getOwnerId(owner);
		const currentTagType = `${this.currentTagType.name.toLowerCase()}s`;
		return `/${this.currentUserRole}/${currentTagType}/${ownerId}`;
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
		const dialog = this._dialog.open(ViewTagComponent, {
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

	setTagColor(value: string): string {
		return value ? value : 'gray';
	}

	async onDelete(owner: any): Promise<void> {

		const response = await this.openConfirmAPIRequestDialog('delete_all_owner_tags').toPromise();

		if (!response) return;

		const ownerId = this.getOwnerId(owner);

		this._tag.deleteAllTagsFromOwner(ownerId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.searchTags(),
				error => console.log('Error retrieving distinct tags', error)
			);
	}

	async onDeleteTagFromOwner(tagId: string): Promise<void> {
	
		const response = await this.openConfirmAPIRequestDialog('delete_owner_tag').toPromise();

		if (!response) return;

		this._tag.deleteTag([tagId])
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.searchTags(),
				error => console.log('Error deleting tag', error)
			);

	}

	get tagFilter() {
		return this.tagFilterControl.value;
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

	private initializeSearchForm(): void {
		this.filteredOwners.next([]);

		this.searchForm = this._form_builder.group({
			tagFilter: [ null ]
		});

	}

	private openConfirmAPIRequestDialog(type: string) {

		let data: string;
		let message: string;
		let status = 'warning';
		let return_msg: string;
		let width = '500px';
		let height = '350px';

		switch (type) {

			case 'delete_owner_tag':
				message = 'Delete Tag';
				data = `Associated ${this.currentTagType.name.toLowerCase()}s will be removed from this tag`;
				return_msg = 'Confirmed deletion';
				break;

			case 'delete_all_owner_tags':
				message = 'Delete Owner Tags';
				data = `ALL associated tags from ${this.currentTagType.name.toLowerCase()} will be removed`
				return_msg = 'Confirmed deletion'
				break;
		}

		return this._dialog.open(ConfirmationModalComponent, { width, height, data: { status, message, data, return_msg } }).afterClosed();

	}

	private searchTags(keyword = ''): void {

		if (keyword == null) return;

		this.isLoadingTags = true;

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
			.add(() => this.isLoadingTags = false);

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

	protected get currentUserRole() {
		return this._auth.current_role;
	}

	protected get tagFilterControl() {
		return this.getSearchFormControl('tagFilter');
	}

	protected getSearchFormControl(name: string) {
		return this.searchForm.get(name);
	}
	
}
