import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_TEMPLATE, DIALOG_DATA_CHANGE_TEMPLATE, FORM_CONTROL, UI_SCREEN_ZONE_PLAYLIST, UI_ZONE_PLAYLIST } from 'src/app/global/models';

@Component({
	selector: 'app-change-template',
	templateUrl: './change-template.component.html',
	styleUrls: ['./change-template.component.scss']
})
export class ChangeTemplateComponent implements OnInit, OnDestroy {
	
	currentTemplate: API_TEMPLATE;
	changeTemplateForm: FormGroup;
	fieldInputList = [ 'text', 'number', 'select' ];
	otherInputList = [ 'accordion-select' ];
	formControls: FORM_CONTROL[];
	hasSelectedTemplate = false;
	isFormReady = false;
	mappedZones: UI_ZONE_PLAYLIST[];
	mappedTemplates: { name: string, id: string }[];
	playlistId: string;
	playlistRoute: string;
	screenZonePlaylists: UI_SCREEN_ZONE_PLAYLIST[];
	selectedTemplate: API_TEMPLATE;
	templates: API_TEMPLATE[];
	title = 'Change Template';

	selectedZonesFormArray: FormArray;

	protected _unsubscribe = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) private _dialog_data: DIALOG_DATA_CHANGE_TEMPLATE,
		private _form_builder: FormBuilder,
	) { }
	
	ngOnInit() {
		this.setDialogData();
		this.initializeForm();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	private initializeForm(): void {

		const config: any = {};

		this._formControls.forEach(
			control => {
				let controlValue: any = [ null ];
				if (control.required) controlValue.push(Validators.required);
				config[control.name] = controlValue;
			}
		);

		this.changeTemplateForm = this._form_builder.group(config);
		this.mappedTemplates = this.mapTemplates();
		this.mappedZones = this.mapZones();
		this.formControls = this._formControls;
		this.isFormReady = true;

		this.changeTemplateForm.controls.template.valueChanges.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { name: string, id: string }) => {
					this.selectedTemplate = this.templates.filter(data => data.template.templateId === response.id)[0];
					this.changeTemplateForm.removeControl('zones');
					this.changeTemplateForm.addControl('zones', this._form_builder.array(this.selectedTemplate.templateZones));
					this.selectedZonesFormArray = this.changeTemplateForm.get('zones') as FormArray;
					this.hasSelectedTemplate = true;
				}
			);
 
	}

	private mapTemplates() {
		return this._dialog_data.templates.map(data => {
			const { name, templateId } = data.template;
			return { name, id: templateId };
		});
	}

	private mapZones() {
		return this._dialog_data.screenZonePlaylists.map(data => data.screen_template);
	}

	private setDialogData() {
		const { currentTemplate, screenZonePlaylists, playlistId, playlistRoute, templates } = this._dialog_data;
		this.currentTemplate = currentTemplate;
		this.screenZonePlaylists = [...screenZonePlaylists];
		this.playlistId = playlistId;
		this.playlistRoute = playlistRoute;
		this.templates = [...templates];
	}

	protected get _formControls(): FORM_CONTROL[] {
		return [
			{ name: 'template', label: 'Select Template', type: 'select', options: this.mappedTemplates, option_label: 'name', required: true },
		];
	}
	
}
