import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Subject } from 'rxjs';

import { TAG } from 'src/app/global/models/tag.model';
import { TagService } from 'src/app/global/services/tag.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'app-view-tag',
	templateUrl: './edit-tag.component.html',
	styleUrls: ['./edit-tag.component.scss']
})
export class EditTagComponent implements OnInit, OnDestroy {
	columns = [];
	currentUserId: string;
	form: FormGroup;
	hasUpdated = false;
	isLoading = true;
	isTagExcluded = false;
	selectedTagColor: string;
	tag: TAG;
	title = 'Edit Tag';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(public _dialog_ref: MatDialogRef<EditTagComponent>, private _form_builder: FormBuilder, private _tag: TagService) {}

	ngOnInit() {
		this.initializeForm();
		this.isLoading = false;
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onExcludeTag(event: { checked: boolean }): void {
		const isExcludedValue = event.checked ? 1 : 0;
		this.form.get('exclude').setValue(isExcludedValue, { emitEvent: false });
	}

	onSelectTagColor(value: string): void {
		this.form.get('tagColor').setValue(value);
	}

	onSubmit(): void {
		const { tagId } = this.tag;
		const { tagColor, name, description, exclude } = this.form.value;

		this._tag.updateTag(tagId, name, tagColor, this.currentUserId, description, exclude)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this._dialog_ref.close();
					this._tag.onRefreshTagsTable.emit();
					this._tag.onRefreshTagsCount.emit();
					this._tag.onRefreshTagOwnersTable.emit();
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private initializeForm() {
		const data = this.tag;

		this.isTagExcluded = data.exclude === 1 ? true : false;

		this.form = this._form_builder.group({
			tagId: [ data.tagId, Validators.required ],
			name: [ data.name, Validators.required ],
			tagColor: [ data.tagColor, Validators.required ],
			description: [ data.description ],
			exclude: [ data.exclude ]
		});

		this.selectedTagColor = this.form.get('tagColor').value;
	}
}
