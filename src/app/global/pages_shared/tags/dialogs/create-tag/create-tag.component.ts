import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MatSelect, MAT_DIALOG_DATA } from '@angular/material';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { Tag, TagType } from 'src/app/global/models';

import { AdvertiserService, HostService, LicenseService, TagService } from 'src/app/global/services';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';

@Component({
	selector: 'app-create-tag',
	templateUrl: './create-tag.component.html',
	styleUrls: ['./create-tag.component.scss']
})
export class CreateTagComponent implements OnInit, OnDestroy {
	
	@ViewChild('ownerMultiSelect', { static: true }) ownerMultiSelect: MatSelect;
	advertisers = [];
	dealers = [];
	filteredOwners: ReplaySubject<any> = new ReplaySubject(1);
	filteredTags: ReplaySubject<Tag[]> = new ReplaySubject(1);
	form: FormGroup;
	hosts = [];
	isInitialLoad = false;
	isLoadingSearchResults = false;
	isSearching = false
	licenses = [];
	ownerSearchSettings = { label: '', placeholder: '', };
	pendingTags: { name: string, tagColor: string }[] = [];
	searchTagsResult: Tag[];
	selectedTagColor: string;
	tagName: string;
	tagType: TagType;
	tagTypes: TagType[];
	title = 'Create Tag';
	uniqueOwners = [];
	
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: { tagName: string, tagType: TagType, tagTypes: TagType[] },
		private _advertiser: AdvertiserService,
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<CreateTagComponent>,
		private _dealer: DealerService,
		private _form_builder: FormBuilder,
		private _host: HostService,
		private _license: LicenseService,
		private _tag: TagService,
	) { }
	
	ngOnInit() {
		this.tagName = this._dialog_data.tagName;
		this.tagTypes = this._dialog_data.tagTypes;
		this.tagType = this._dialog_data.tagType;
		this.initializeForm();
		this.subscribeToOwnerSearch();
		this.subscribeToTagNameSearch();
		this.searchTags();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onAddTag(name: string): void {

		name = name.trim().replace(/\s+/g, '');
		this.resetFields();

		const pendingTagNames = this.pendingTags.map(tag => tag.name);

		if (!name || name.length <= 0 || pendingTagNames.includes(name)) return;

		this.ownerMultiSelect.compareWith = (a, b) => a && b && a === b;
		this.pendingTags.push({ name, tagColor: this.selectedTagColor });
		this.filteredTags.next(this.searchTagsResult);
		this.selectedTagColor = null;

	}

	onRemovePendingTag(index: number): void {
		this.pendingTags.splice(index, 1);
	}

	onRemoveSelectedOwner(index: number): void {
		this.selectedOwners.splice(index, 1);
		this.ownerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
	}

	onSelectTag(data: Tag): void {
		this.resetFields();
		const { name, tagColor } = data;
		this.pendingTags.push({ name, tagColor });
		this.ownerMultiSelect.compareWith = (a, b) => a && b && a === b;
		this.filteredTags.next(this.searchTagsResult);
		this.selectedTagColor = null;
	}

	onSelectTagType(tagTypeId: number): void {

		const tagType: TagType = this.tagTypes.filter(type => type.tagTypeId === tagTypeId)[0];
		const type = tagType.name.toLowerCase();

		let settings = {
			label: 'Select Dealer',
			placeholder: 'Search Dealers...',
		};

		switch (type) {

			case 'host':
			case 'hosts':

				settings = {
					label: 'Select Host',
					placeholder: 'Search Hosts...',
				};

				break;

			case 'license':
			case 'licenses':

				settings = {
					label: 'Select License',
					placeholder: 'Search Licenses...',
				};

				break;

			case 'advertiser':
			case 'advertisers':

				settings = {
					label: 'Select Advertiser',
					placeholder: 'Search Advertisers...',
				};

				break;

			default:

		}

		this.ownerSearchSettings = settings;
	}

	onSubmit(): void {

		let errorMessage = 'Error creating tag';
		const { tagTypeId, name } = this.tagType;
		const tagTypeName = name.toLowerCase();
		const names = this.pendingTags;
		const tagColor = this.tagColor;

		if (names.length > 1) errorMessage += 's';

		const owners = this.selectedOwners.map(
			owner => {
				let result;

				switch (tagTypeName) {

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
						result = owner.advertiserId;
						break;
		
					default:
						result = owner.dealerId;
				}

				return result;

			}
		);

		this._tag.createTag(tagTypeId, tagColor, names, owners)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.showSuccessModal(),
				error => console.log(errorMessage, error)
			);

	}

	onSelectTagColor(value: string): void {
		this.tagColorCtrl.setValue(value);
	}

	searchBoxTrigger(event: { is_search: boolean, page: number }, type: string): void {
		type = type.toLowerCase();
		this.isSearching = event.is_search;
		this.searchOwner('', type);
	}

	searchOwner(keyword = '', type: string): void {
		type = type.toLowerCase();

		switch (type) {
			case 'host':
			case 'hosts':
				this.searchHost(keyword);
				break;

			case 'license':
			case 'licenses':
				this.searchLicense(keyword);
				break;
			
			case 'advertiser':
			case 'advertisers':
				this.searchAdvertiser(keyword);
				break;

			default:
				this.searchDealer(keyword);
		}
	}

	get isFormValid(): boolean {
		const owners = this.selectedOwners;
		const tagNames = this.pendingTags;
		return this.tagColor && owners.length > 0 && tagNames.length > 0;
	}

	get name() {
		return this.tagNameCtrl.value;
	}

	get selectedOwners(): any[] {
		return this.selectedOwnersCtrl.value;
	}

	get tagColor() {
		return this.tagColorCtrl.value;
	}

	get tagTypeId() {
		return this.tagTypeIdCtrl.value;
	}

	private initializeForm(): void {

		let tagTypeId = null;
		let name = null;

		if (this.tagName) name = { value: this.tagName, disabled: true };

		if (this.tagType) {
			tagTypeId = { value: this.tagType.tagTypeId, disabled: true };
			this.onSelectTagType(this.tagType.tagTypeId);
		}

		this.form = this._form_builder.group({
			tagTypeId: [ tagTypeId, Validators.required ],
			tagName: [ name ],
			tagColor: [ null ],
			selectedOwners: [ [], Validators.required ],
			selectedTag: [ null ],
			ownerFilter: [ null ]
		});

	}

	private resetFields(): void {
		this.setCtrlValue('selectedTag', null);
		this.setCtrlValue('tagName', null);
	}

	private searchDealer(keyword = '', page = 1): void {

		if (!keyword || keyword.trim().length <= 0) return;

		this.isSearching = true;

		this._dealer.get_dealers_with_sort(page, keyword, '', '', '', '', '', 'A')
			.pipe(takeUntil(this._unsubscribe))
			.map(
				(response: { paging?: { entities: any[] }, message?: string }) => {

					const { paging, message } = response;

					if (message) {
						response.paging = { entities: [] };
						return response;
					}

					const { entities } = paging;

					const dealers = entities.map(
						(dealer: { displayName: string, businessName: string}) => {
							const { businessName } = dealer;
							dealer.displayName = businessName;
							return dealer;
						}
					);

					response.paging.entities = dealers;
					return response;
				}
			)
			.subscribe(
				(response: { paging: { entities: any[] } }) => {

					const { paging } = response;
					const { entities } = paging;
					const merged = this.selectedOwners.concat(entities);

					const unique = merged.filter(
						(owner, index, merged) => merged.findIndex(mergedOwner => (mergedOwner.dealerId === owner.dealerId) ) === index
					);

					this.uniqueOwners = unique;
					this.filteredOwners.next(unique);

				},
				error => console.log('Error searching for dealer ', error)
			)
			.add(() => {
				this.isInitialLoad = false;
				this.isSearching = false;
			});

	}

	private searchHost(keyword = '', page = 1): void {
		this.isSearching = true;

		if (!keyword || keyword.trim().length <= 0) return;

		this._host.get_host_by_page(page, keyword)
			.pipe(takeUntil(this._unsubscribe))
			.map(
				(response: { paging?: { entities: any[] }, message?: string }) => {

					const { paging, message } = response;

					if (message) {
						response.paging = { entities: [] };
						return response;
					}

					const { entities } = paging;

					const hosts = entities.map(
						(host: { displayName: string, name: string, city: string }) => {
							const { name, city } = host;
							host.displayName = `${name} (${city})`;
							return host;
						}
					);

					response.paging.entities = hosts;
					return response;

				}
			)
			.subscribe(
				(response: { paging: { entities: any[] } }) => {

					const { paging } = response;
					const { entities } = paging;
					const merged = this.selectedOwners.concat(entities);

					const unique = merged.filter(
						(owner, index, merged) => merged.findIndex(mergedOwner => (mergedOwner.hostId === owner.hostId) ) === index
					);

					this.uniqueOwners = unique;
					this.filteredOwners.next(unique);

				},
				error => console.log('Error searching for host ', error)
			)
			.add(() => {
				this.isInitialLoad = false;
				this.isSearching = false;
			});

	}

	private searchLicense(keyword = '', page = 1): void {
		this.isSearching = true;

		if (!keyword || keyword.trim().length <= 0) return;

		this._license.search_license(keyword)
			.pipe(takeUntil(this._unsubscribe))
			.map((response: { licenses: any[], message?: string }) => {

				if (response.message) return [];

				const licenses = response.licenses.map(
					(license: { licenseAlias: string, hostName: string, displayName: string, licenseKey: string }) => {
						const { licenseAlias, hostName, licenseKey } = license;
						license.displayName = licenseAlias ? `${licenseAlias} (${hostName})` : licenseKey; 
						return license;
					}
				);

				return licenses;

			})
			.subscribe(
				(response: any[]) => {

					if (response.length <= 0) return;
					const merged = this.selectedOwners.concat(response);

					const unique = merged.filter(
						(owner, index, merged) => merged.findIndex(mergedOwner => (mergedOwner.licenseId === owner.licenseId) ) === index
					);

					this.uniqueOwners = unique;
					this.filteredOwners.next(unique);
					
				},
				error => console.log('Error searching for license ', error)
			)
			.add(() => {
				this.isInitialLoad = false;
				this.isSearching = false;
			});

	}

	private searchAdvertiser(keyword = '', page = 1): void {
		this.isSearching = true;

		if (!keyword || keyword.trim().length <= 0) return;

		this._advertiser.search_advertiser(keyword)
			.pipe(takeUntil(this._unsubscribe))
			.map((response: { advertisers: any[], message?: string }) => {

				if (response.message) return [];

				const advertisers = response.advertisers.map(
					(advertiser: { dealerName: string, advertiserName: string, displayName: string }) => {
						const { advertiserName } = advertiser;
						advertiser.displayName = advertiserName;
						return advertiser;
					}
				);

				return advertisers;

			})
			.subscribe(
				(response: any[]) => {
					
					if (response.length <= 0) return;
					const merged = this.selectedOwners.concat(response);

					const unique = merged.filter(
						(owner, index, merged) => merged.findIndex(mergedOwner => (mergedOwner.advertiserId === owner.advertiserId) ) === index
					);

					this.uniqueOwners = unique;
					this.filteredOwners.next(unique);

				},
				error => console.log('Error searching for advertiser ', error)
			)
			.add(() => {
				this.isInitialLoad = false;
				this.isSearching = false;
			});

	}

	private searchTags(): void {

		this._tag.getDistinctTagsByType(this.tagTypeId)
			.map((response: { tags: Tag[] }) => response.tags)
			.subscribe(
				(response: Tag[]) => {
					this.searchTagsResult = response;
					this.filteredTags.next(response);
				},
				error => console.log('Error searching for tags', error)
			);

	}

	private showSuccessModal(): void {

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status: 'success', message: 'Tag created!' }
		});

		dialog.afterClosed().subscribe(() => this._dialog_ref.close(true));

	}

	private subscribeToOwnerSearch(): void {
		const control = this.form.get('ownerFilter');

		control.valueChanges
			.pipe(
				takeUntil(this._unsubscribe),
				debounceTime(200),
				map(keyword => this.searchOwner(keyword, this.tagType.name)),
			)
			.subscribe(
				() => this.ownerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId
			);
	}

	private subscribeToTagNameSearch(): void {

		this.tagNameCtrl.valueChanges
			.pipe(takeUntil(this._unsubscribe), debounceTime(200))
			.subscribe(
				() => {
					const results = this.searchTagsResult;
					const keyword = this.tagNameCtrl.value;

					if (!keyword) {
						this.filteredTags.next(results);
						return;
					};

					this.filteredTags.next(
						results.filter(tag => tag.name.toLowerCase().indexOf(keyword.toLowerCase()) > - 1)
					);
				}
			);

	}

	protected get tagNameCtrl() {
		return this.getCtrl('tagName');
	}

	protected get selectedOwnersCtrl() {
		return this.getCtrl('selectedOwners');
	}

	protected get tagTypeIdCtrl() {
		return this.getCtrl('tagTypeId');
	}

	protected get tagColorCtrl() {
		return this.getCtrl('tagColor');
	}

	protected getCtrl(name: string) {
		return this.form.get(name);
	}

	protected setCtrlValue(name: string, value: any) {
		this.getCtrl(name).setValue(value);
	}
	
}
