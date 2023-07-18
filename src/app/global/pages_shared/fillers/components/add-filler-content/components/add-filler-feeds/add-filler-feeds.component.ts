import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material';

@Component({
	selector: 'app-add-filler-feeds',
	templateUrl: './add-filler-feeds.component.html',
	styleUrls: ['./add-filler-feeds.component.scss']
})
export class AddFillerFeedsComponent implements OnInit {
	form: FormGroup;

	constructor(private _form_builder: FormBuilder, public dialogRef: MatDialogRef<AddFillerFeedsComponent>) {}

	ngOnInit() {
		this.initializeForm();
	}

	private initializeForm(): void {
		this.form = this._form_builder.group({
			feedName: [null, Validators.required],
			feedUrl: [null, Validators.required]
		});
	}

	onSubmit() {
		const fillerFeedDetails = {
			title: this._formControls.feedName.value,
			filename: this._formControls.feedName.value,
			url: this._formControls.feedUrl.value
		};
		this.dialogRef.close(fillerFeedDetails);
	}

	protected get _formControls() {
		return this.form.controls;
	}
}
