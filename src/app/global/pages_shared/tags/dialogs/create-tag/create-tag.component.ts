import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AdvertiserService } from 'src/app/global/services/advertiser-service/advertiser.service';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { HostService } from 'src/app/global/services/host-service/host.service';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { TagService } from 'src/app/global/services/tag.service';
import { TagType } from 'src/app/global/models/tag-type.model';

@Component({
	selector: 'app-create-tag',
	templateUrl: './create-tag.component.html',
	styleUrls: ['./create-tag.component.scss']
})
export class CreateTagComponent implements OnInit, OnDestroy {
	
	advertisers = [];
	dealers = [];
	form: FormGroup;
	hosts = [];
	isInitialLoad = false;
	isLoadingSearchResults = false;
	isSearching = false
	licenses = [];
	paging: any;
	tagName: string;
	tagType: TagType;
	tagTypes: TagType[];
	title = 'Create Tag';
	
	ownerSearchSettings = { 
		data_reference: [], 
		key: '', 
		label: '', 
		placeholder: '', 
		primary_keyword: '', 
		search_keyword: '',
		type: '',
		tagTypeId: null
	};

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
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onSelectTagType(tagTypeId: number) {

		const tagType: TagType = this.tagTypes.filter(type => type.tagTypeId === tagTypeId)[0];
		const type = tagType.name.toLowerCase();

		let settings = {
			data_reference: this.dealers,
			key: 'dealerId',
			label: 'Select Dealer',
			placeholder: 'Search Dealers...',
			primary_keyword: 'businessName',
			search_keyword: 'dealer',
			type: 'dealer',
			tagTypeId
		};

		switch (type) {

			case 'host':
			case 'hosts':

				settings = {
					data_reference: this.hosts,
					key: 'hostId',
					label: 'Select Host',
					placeholder: 'Search Hosts...',
					primary_keyword: 'name',
					search_keyword: 'name',
					type,
					tagTypeId

				};

				this.searchHost();
				break;

			case 'license':
			case 'licenses':

				settings = {
					data_reference: this.licenses,
					key: 'licenseId',
					label: 'Select License',
					placeholder: 'Search Licenses...',
					primary_keyword: 'licenseAlias',
					search_keyword: '',
					type,
					tagTypeId
				};

				this.searchLicense();
				break;

			case 'advertiser':
			case 'advertisers':

				settings = {
					data_reference: this.advertisers,
					key: 'advertiserId',
					label: 'Select Advertiser',
					placeholder: 'Search Advertisers...',
					primary_keyword: 'advertiserName',
					search_keyword: '',
					type,
					tagTypeId
				};

				this.searchAdvertiser();
				break;

			default:
				this.searchDealer();

		}

		this.ownerSearchSettings = settings;
	}

	onSubmit(): void {

		this._tag.createTag(this.tagTypeId, this.ownerId, this.name)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.showSuccessModal(),
				error => console.log('Error creating tag ', error)
			);

	}

	onSelectOwner(value: any): void {
		console.log('on select value', value);
		this.setCtrlValue('ownerId', value);
		console.log('form ', this.form);
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

	get name() {
		return this.nameCtrl.value;
	}

	get tagTypeId() {
		return this.tagTypeIdCtrl.value;
	}

	get ownerId() {
		return this.ownerIdCtrl.value;
	}

	private initializeForm(): void {

		let tagTypeId = null;
		let name = null;

		if (this.tagName) name = { value: this.tagName, disabled: true };

		if (this.tagType) {
			tagTypeId = { value: this.tagType.tagTypeId, disabled: true };
			this.onSelectTagType(this.tagType.tagTypeId);
		}

		const formGroup = this._form_builder.group({
			tagTypeId: [ tagTypeId, Validators.required ],
			ownerId: [ null, Validators.required ],
			name: [ name, Validators.required ]
		});

		this.form = formGroup;

	}

	private searchDealer(keyword = '', page = 1): void {
		this.isSearching = true;

		this._dealer.get_dealers_with_sort(page, keyword, '', '', '', '', '', 'A')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { dealers: any[], paging }) => {
					this.paging = response.paging;
					this.ownerSearchSettings.data_reference = response.dealers;
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

		this._host.get_host_by_page(page, keyword)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { host: any[], paging }) => {
					this.paging = response.paging;
					this.ownerSearchSettings.data_reference = response.host;
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
		this.paging = true;

		this._license.search_license(keyword)
			.pipe(takeUntil(this._unsubscribe))
			.map((response: { licenses: any[], message?: string }) => {

				if (response.message) return [];

				const licenses = response.licenses.map(
					license => {
						license.licenseAlias += ` (${license.hostName})`;
						return license;
					}
				);

				return licenses;

			})
			.subscribe(
				(response: any[]) => {

					if (response.length <= 0) return;

					this.ownerSearchSettings.data_reference = response;
					
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
		this.paging = true;

		this._advertiser.search_advertiser(keyword)
			.pipe(takeUntil(this._unsubscribe))
			.map((response: { advertisers: any[], message?: string }) => {

				if (response.message) return [];

				const advertisers = response.advertisers.map(
					advertiser => {
						advertiser.advertiserName += ` (${advertiser.dealerName})`;
						return advertiser;
					}
				);

				return advertisers;

			})
			.subscribe(
				(response: any[]) => {
					
					if (response.length <= 0) return;

					this.ownerSearchSettings.data_reference = response;
					
				},
				error => console.log('Error searching for advertiser ', error)
			)
			.add(() => {
				this.isInitialLoad = false;
				this.isSearching = false;
			});

	}

	private showSuccessModal(): void {

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status: 'success', message: 'Tag created!' }
		});

		dialog.afterClosed().subscribe(() => this._dialog_ref.close(true));

	}

	protected get nameCtrl() {
		return this.getCtrl('name');
	}

	protected get tagTypeIdCtrl() {
		return this.getCtrl('tagTypeId');
	}

	protected get ownerIdCtrl() {
		return this.getCtrl('ownerId');
	}

	protected getCtrl(name: string) {
		return this.form.get(name);
	}

	protected setCtrlValue(name: string, value: any) {
		this.getCtrl(name).setValue(value);
	}
	
}
