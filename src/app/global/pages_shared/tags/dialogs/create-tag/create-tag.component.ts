import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { TagService, AuthService } from 'src/app/global/services';

@Component({
	selector: 'app-create-tag',
	templateUrl: './create-tag.component.html',
	styleUrls: ['./create-tag.component.scss']
})
export class CreateTagComponent implements OnInit, OnDestroy {
	currentUserId: string;
	description = 'Choose a color and type the name of the tag';
	form: FormGroup;
	isTagExcluded = false;
	selectedTagColor: string;
	tab: string;
	tagName: string;
	title = 'Create Tag';
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
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

	onExcludeTag(event: { checked: boolean }): void {
		const isExcludedValue = event.checked ? 1 : 0;

		this.form.get('exclude').setValue(isExcludedValue, { emitValue: false });
	}

	onSubmit(): void {
		let dataToSubmit: { name: string; role: number; tagColor: string; description?: string; createdBy: string; exclude: number } = {
			name: null,
			tagColor: null,
			createdBy: this.currentUserId,
			role: null,
			exclude: null
		};

		const form = this.form.value;
		const name = form.tagName as string;
		const tagColor = form.tagColor as string;
		const description = form.description as string;
		const role = this._isDealer() ? 2 : this._isAdmin() ? 1 : 3;
		const exclude = form.exclude;

		dataToSubmit.name = name;
		dataToSubmit.role = role;
		dataToSubmit.tagColor = tagColor;
		dataToSubmit.exclude = exclude;

		if (description) dataToSubmit.description = description;

		this._tag
			.createTag(dataToSubmit)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.showSuccessModal(),
				(error) => {
					console.error(error);
				}
			);
	}

	onSelectTagColor(value: string): void {
		this.tagColorCtrl.setValue(value);
	}

	private initializeForm(): void {
		let role: number;
		if (this._isDealer()) {
			role = 2;
		} else if (this._isDealerAdmin()) {
			role = 3;
		} else {
			role = 1;
		}

		this.form = this._form_builder.group({
			tagName: [null, Validators.required],
			tagColor: [null, Validators.required],
			role: [role, Validators.required],
			description: [null],
			exclude: [0, Validators.required]
		});

		this.form.get('role').disable({ emitEvent: false });
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

	_isDealer() {
		const DEALER_ROLES = ['dealer', 'sub-dealer'];
		return DEALER_ROLES.includes(this._auth.current_role);
	}

	_isDealerAdmin() {
		return this._auth.current_role === 'dealeradmin';
	}

	_isAdmin() {
		return this._auth.current_role === 'administrator';
	}

	protected getCtrl(name: string) {
		return this.form.get(name);
	}

	protected setCtrlValue(name: string, value: any) {
		this.getCtrl(name).setValue(value);
	}
}
