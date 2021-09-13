import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_ZONE } from 'src/app/global/models';
import { TemplateService } from 'src/app/global/services';

@Component({
	selector: 'app-zone-expansion-panel',
	templateUrl: './zone-expansion-panel.component.html',
	styleUrls: ['./zone-expansion-panel.component.scss']
})
export class ZoneExpansionPanelComponent implements OnInit, OnDestroy {

	@Input() data: API_ZONE 

	form: FormGroup;

	formControlConfigs = [
		{ name: 'name', type: 'text', label: '', placeholder: 'Name', required: true, row: 1 },
		{ name: 'description', type: 'text', label: '', placeholder: 'Description', required: true, row: 1 },
		{ name: 'background', type: 'color', label: '', placeholder: 'Color', required: true, row: 1 },
		{ name: 'width', type: 'number', label: '', placeholder: 'Width', required: true, row: 2 },
		{ name: 'height', type: 'number', label: '', placeholder: 'Height', required: true, row: 2 },
		{ name: 'xPos', type: 'number', label: '', placeholder: 'X-Position', required: true, row: 2 },
		{ name: 'yPos', type: 'number', label: '', placeholder: 'Y-Position', required: true, row: 2 },
		{ name: 'order', type: 'number', label: '', placeholder: 'Order', required: true, row: 1 },
	];

	firstRowFields = this.formControlConfigs.filter(config => config.row === 1);
	secondRowFields = this.formControlConfigs.filter(config => config.row === 2);
	selectedZoneColor: string;
	
	private originalData: API_ZONE;
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _form_builder: FormBuilder,
		private _template: TemplateService,
	) { }
	
	ngOnInit() {
		this.initializeForm();
		this.originalData = Object.freeze(this.data);
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onReset(): void {
		this.initializeForm(true);
	}

	onSelectZoneColor(value: string): void {
		this.form.get('background').setValue(value);
	}

	onSubmit(): void {
		const data = this.form.value;

		this._template.update_template_zone(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => console.log('updated template zone', response),
				error => console.log('Error updating template zone', error)
			);
	}
	
	private initializeForm(reset = false): void {

		let formConfiguration = {};
		let zone = this.data;
		if (reset) zone = this.originalData; 

        this.formControlConfigs.forEach(
            config => {
                let data: any[] = [ zone[config.name] ];
                if (config.required) data.push(Validators.required);
                formConfiguration[config.name] = data;
            }
        );

		this.form = this._form_builder.group(formConfiguration);
		this.selectedZoneColor = this.form.get('background').value;

	}
	
}
