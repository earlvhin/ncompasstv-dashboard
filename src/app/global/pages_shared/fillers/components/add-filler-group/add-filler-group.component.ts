import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-add-filler-group',
	templateUrl: './add-filler-group.component.html',
	styleUrls: ['./add-filler-group.component.scss']
})
export class AddFillerGroupComponent implements OnInit {
	description = 'Enter filler group details ';
	form: FormGroup;
	title = 'Create Filler Group';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _form_builder: FormBuilder) {}

	ngOnInit() {
		this.initializeForm();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	private initializeForm(): void {
		this.form = this._form_builder.group({
			fillerGroupName: [null, Validators.required],
			inPairs: [null, Validators.required]
		});
	}

	onTogglePairs(value) {}

	onUploadImage(value) {}
}
