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

	@Input() tag: TAG;

	columns = [];
	form: FormGroup;
	hasUpdated = false;
	isLoading = true;
	selectedTagColor: string;
	title = 'Edit Tag';
	
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		public _dialog_ref: MatDialogRef<EditTagComponent>,
		private _form_builder: FormBuilder,
		private _tag: TagService
	) { }
	
	ngOnInit() {
		this.initializeForm();
		this.isLoading = false;
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onSelectTagColor(value: string) {
		this.form.get('tagColor').setValue(value);
	}

	onSubmit() {

		const { tagId } = this.tag;
		const { tagColor, name } = this.form.value;

		this._tag.updateTag(tagId, name, tagColor)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this._dialog_ref.close();
					this._tag.onRefreshTagsTable.emit();
				},
				error => console.log('Error updating tag', error)
			);

	}

	private initializeForm() {

		const data = this.tag;

		this.form = this._form_builder.group({
			tagId: [ data.tagId , Validators.required ],
			name: [ data.name , Validators.required ],
			tagColor: [ data.tagColor , Validators.required ]
		});

		this.selectedTagColor = this.form.get('tagColor').value;

	}

	
}
