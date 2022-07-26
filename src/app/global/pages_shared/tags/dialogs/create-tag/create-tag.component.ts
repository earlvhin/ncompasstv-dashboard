import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { TagService } from 'src/app/global/services';

@Component({
	selector: 'app-create-tag',
	templateUrl: './create-tag.component.html',
	styleUrls: ['./create-tag.component.scss']
})
export class CreateTagComponent implements OnInit, OnDestroy {
	currentUserId: string;
	description = 'Choose a color and type the name of the tag';
	form: FormGroup;
	selectedTagColor: string;
	tagName: string;
	title = 'Create Tag';
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<CreateTagComponent>,
		private _form_builder: FormBuilder,
		private _tag: TagService
	) {}

	ngOnInit() {
		this.initializeForm();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onSubmit(): void {
		let dataToSubmit: { name: string; tagColor: string; description?: string; createdBy: string } = {
			name: null,
			tagColor: null,
			createdBy: this.currentUserId
		};

		let errorMessage = 'Error creating tag';

		const form = this.form.value;
		const name = form.tagName as string;
		const tagColor = form.tagColor as string;
		const description = form.description as string;

		dataToSubmit.name = name;
		dataToSubmit.tagColor = tagColor;
		if (description) dataToSubmit.description = description;

		this._tag
			.createTag([dataToSubmit])
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.showSuccessModal(),
				(error) => {
					throw new Error(error);
				}
			);
	}

	onSelectTagColor(value: string): void {
		this.tagColorCtrl.setValue(value);
	}

	private initializeForm(): void {
		this.form = this._form_builder.group({
			tagName: [null, Validators.required],
			tagColor: [null, Validators.required],
			description: [null]
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
