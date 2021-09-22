import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_ADVERTISER, API_DEALER, API_HOST, API_LICENSE, TAG, TAG_OWNER, TAG_TYPE } from 'src/app/global/models';
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
	
	currentTagType: TAG_TYPE;
	isLoading = false;
	owners: TAG_OWNER[];
	currentFilter = 'All';
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

	onSelectTagType(type: TAG_TYPE): void {
		this.currentTagType = type;
		this.currentFilter = type.name;
		this.searchOwnerTags(null, this.currentTagType.tagTypeId);;
	}

	private searchOwnerTags(keyword = null, tagTypeId = 0): void {

		if (!this.currentTagType) return;
		this.isLoading = true;

		this._tag.searchOwnersByTagType(tagTypeId, keyword)
			.pipe(
				takeUntil(this._unsubscribe),
				map(
					(response: TAG_OWNER[]) => {

						let displayName = null;
	
						response.forEach(
							(data, index) => {
	
								const { owner, tagTypeName } = data;
	
								switch (tagTypeName.toLowerCase()) {
									case 'host':
									case 'hosts':
										const host = owner as API_HOST;
										displayName = `${host.name} (${host.city})`;
										break;
						
									case 'license':
									case 'licenses':
										const license = owner as API_LICENSE['license'];
										displayName = license.alias ? license.alias : license.licenseKey;
										break;
									
									case 'advertiser':
									case 'advertisers':
										const advertiser = owner as API_ADVERTISER;
										displayName = advertiser.name;
										break;
						
									default:
										const dealer = owner as API_DEALER;
										displayName = dealer.businessName;
								}
	
								response[index].displayName = displayName;
								response[index].url = `/${this.currentUserRole}/${tagTypeName.toLowerCase()}s/${data.ownerId}`;
	
							}
						);
	
						return response;
					}
				)
			)
			.subscribe(
				(response: TAG_OWNER[]) => this.owners = response,
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
			.subscribe(keyword => this.searchOwnerTags(keyword));

	}
	
}
