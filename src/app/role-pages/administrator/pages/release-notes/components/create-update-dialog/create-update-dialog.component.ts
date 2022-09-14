import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import { API_RELEASE_NOTE, UI_CONFIRMATION_MODAL } from 'src/app/global/models';
import { AuthService, ConfirmationDialogService, ReleaseNotesService } from 'src/app/global/services';

@Component({
	selector: 'app-create-update-release-notes-dialog',
	templateUrl: './create-update-dialog.component.html',
	styleUrls: ['./create-update-dialog.component.scss']
})
export class CreateUpdateDialogComponent implements OnInit, OnDestroy {
	ckEditor = ClassicEditor;
	dialogMode: 'create' | 'update' = 'create';
	isFormLoaded = false;
	isSaving = false;
	note: API_RELEASE_NOTE;
	notesForm: FormGroup;
	textEditorControl = new FormControl();
	textPreview = '';
	title = 'Create Release Notes';
	protected _unsubscribe = new Subject<void>();

	constructor(
		private _alert: ConfirmationDialogService,
		private _auth: AuthService,
		private _dialog_reference: MatDialogRef<CreateUpdateDialogComponent>,
		private _form_builder: FormBuilder,
		private _release: ReleaseNotesService
	) {}

	ngOnInit() {
		this.initializeForm();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onSubmit(): void {
		if (this.isSaving) return;

		this.isSaving = true;
		let data = this.notesForm.value as API_RELEASE_NOTE;
		data.createdBy = this._auth.current_user_value.user_id;

		if (this.dialogMode === 'update') data.releaseNoteId = this.note.releaseNoteId;

		this.createOrUpdateNote(data);
	}

	private createOrUpdateNote(data: API_RELEASE_NOTE): void {
		this._release
			.createOrUpdateNote(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					const dialogData: UI_CONFIRMATION_MODAL = {
						data: 'Success!',
						message: 'Your note has been saved.'
					};

					this._alert.success(dialogData).subscribe(() => this._dialog_reference.close(response.releaseNotes));
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => (this.isSaving = false));
	}

	private initializeForm(): void {
		const config: any = {};

		this._fieldControls.forEach((control) => {
			const configValue = this.dialogMode === 'create' ? [control.value] : [this.note[control.name]];
			if (control.is_required) configValue.push(Validators.required);
			config[control.name] = configValue;
		});

		this.notesForm = this._form_builder.group(config);

		if (this.dialogMode === 'update') this.textPreview = this.notesForm.get('description').value;

		this.isFormLoaded = true;
		this.subscribeToParagraphChanges();
	}

	private subscribeToParagraphChanges(): void {
		this.notesForm
			.get('description')
			.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(2000))
			.subscribe((response: string) => (this.textPreview = response));
	}

	protected get _fieldControls() {
		return [
			{ name: 'title', type: 'text', value: null, is_required: true },
			{ name: 'version', type: 'text', value: null, is_required: true },
			{ name: 'description', type: 'text', value: null, is_required: true }
		];
	}
}
