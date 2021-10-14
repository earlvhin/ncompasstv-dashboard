import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MatSelect } from '@angular/material';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

import { TagService } from 'src/app/global/services';
import { TAG, TAG_OWNER } from 'src/app/global/models';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-assign-tags',
	templateUrl: './assign-tags.component.html',
	styleUrls: ['./assign-tags.component.scss']
})
export class AssignTagsComponent implements OnInit, OnDestroy {
	
	@ViewChild('ownerMultiSelect', { static: true }) ownerMultiSelect: MatSelect;
	@ViewChild('tagMultiSelect', { static: true }) tagMultiSelect: MatSelect;
	description = 'Assign tags to the appropriate owner';
	filteredOwners = new ReplaySubject <TAG_OWNER[]>(1);
	filteredTags = new ReplaySubject<TAG[]>(1);
	form = this._form_builder.group({ selectedOwners: [ [], Validators.required ], selectedTags: [ [], Validators.required ]});
	isSearchingOwners = false;
	isSearchingTags = false;
	ownerFilterControl = new FormControl(null, [ Validators.required, Validators.minLength(3) ]);
	tagFilterControl = new FormControl(null, [ Validators.required, Validators.minLength(3) ]);
	selectedOwnersControl = this.form.get('selectedOwners');
	selectedTagsControl = this.form.get('selectedTags');
	title = 'Assign Tags';
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<AssignTagsComponent>,
		private _form_builder: FormBuilder,
		private _tag: TagService,
	) { }
	
	ngOnInit() {
		this.initializeSubscriptions();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onSubmit() {

		const owners = this.selectedOwnersControl.value as TAG_OWNER[];
		const tags = this.selectedTagsControl.value as TAG[];

		const ownersToSubmit = owners.map(
			owner => {
				const { ownerId, tagTypeId } = owner;
				return { ownerId, tagTypeId }
			}
		);

		const tagsToSubmit = tags.map(
			tag => {
				const { tagId } = tag;
				return tagId;
			}
		);

		this._tag.assignTags(ownersToSubmit, tagsToSubmit)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.showSuccessModal(),
				error => console.log('Error assigning tags', error)
			);
	}

	onRemoveOwner(index: number) {
		this.selectedOwnersControl.value.splice(index, 1);
		this.ownerMultiSelect.compareWith = (a, b) => a && b && a.ownerId === b.ownerId;
	}

	onRemoveTag(index: number) {
		this.selectedTagsControl.value.splice(index, 1);
		this.tagMultiSelect.compareWith = (a, b) => a && b && a.tagId === b.tagId;
	}

	private initializeSubscriptions(): void {
		this.subscribeToOwnerSearch();
		this.subscribeToTagSearch();
	}

	private searchOwners(key: string = null) {

		this.isSearchingOwners = true;

		this._tag.searchOwners(key).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { owners: { displayName: string, ownerId: string, tagTypeId: string, tagTypeName: string }[] }) => {

					const merged = this.selectedOwnersControl.value.concat(response.owners);
					const unique = merged.filter((owner, index, merged) => merged.findIndex(mergedOwner => (mergedOwner.ownerId === owner.ownerId) ) === index);
					this.filteredOwners.next(unique);

				},
				error => console.log('Error searching for owners', error)
			)
			.add(() => this.isSearchingOwners = false);

	}

	private searchTags(key: string = null): void {

		this.isSearchingTags = true;

		this._tag.searchAllTags(key).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				({ paging, tags, message }) => {

					if (message) return;
					const merged = this.selectedTagsControl.value.concat(tags);
					const unique = merged.filter((tag, index, merged) => merged.findIndex(mergedTag => (mergedTag.tagId === tag.tagId) ) === index);
					this.filteredTags.next(unique);

				},
				error => console.log('Error searching for tags', error)
			)
			.add(() => this.isSearchingTags = false)

	}

	private showSuccessModal(): void {

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status: 'success', message: 'Tags assigned!' }
		});

		dialog.afterClosed().subscribe(() => this._dialog_ref.close(true));

	}

	private subscribeToOwnerSearch(): void {

		const control = this.ownerFilterControl;

		control.valueChanges
			.pipe(
				takeUntil(this._unsubscribe), 
				debounceTime(1000), 
				map(
					keyword => {
						if (control.invalid) return;
						this.searchOwners(keyword);
					}
				)
			)
			.subscribe(() => this.ownerMultiSelect.compareWith = (a, b) => a && b && a.ownerId === b.ownerId);

	}

	private subscribeToTagSearch(): void {

		const control = this.tagFilterControl;

		control.valueChanges
			.pipe(
				takeUntil(this._unsubscribe), 
				debounceTime(1000), 
				map(
					keyword => {
						if (control.invalid) return;
						this.searchTags(keyword);
					}
				)
			)
			.subscribe(() => this.tagMultiSelect.compareWith = (a, b) => a && b && a.tagId === b.tagId);

	}
	
}
