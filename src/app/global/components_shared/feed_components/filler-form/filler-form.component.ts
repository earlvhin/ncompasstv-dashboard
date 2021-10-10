import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-filler-form',
    templateUrl: './filler-form.component.html',
    styleUrls: ['./filler-form.component.scss']
})

export class FillerFormComponent implements OnInit {

    @Input() selected_dealer: string;

	filler_settings_form: FormGroup;

	filler_fields = [
		{
			label: 'Transition Skip',
			form_control_name: 'num',
			type: 'number',
			viewType: 'text',
			colorValue: '',
			width: 'col-lg-3', 
			required: true,
			value: 2,
		},
		{
			label: 'Transition Time in minutes',
			form_control_name: 'min',
			type: 'number',
			viewType: 'text',
			colorValue: '',
			width: 'col-lg-3', 
			required: true,
			value: 30
		}
	]

    constructor() { }

    ngOnInit() {
		// this.filler_settings_form = 
    }

	prepareForms(): void {

		let form_group_obj = {};

		/** Loop through form fields object and prepare for group */
		this.filler_fields.map(
			i => {
				Object.assign(form_group_obj, {
					[i.form_control_name]: [i.value ? i.value : null, i.required ? Validators.required : null]
				})
			}
		)
	}
}