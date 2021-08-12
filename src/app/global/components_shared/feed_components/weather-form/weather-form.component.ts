import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { API_CONTENT } from '../../../../global/models/api_content.model';
import { FeedMediaComponent } from '../feed-media/feed-media.component';

@Component({
	selector: 'app-weather-form',
	templateUrl: './weather-form.component.html',
	styleUrls: ['./weather-form.component.scss']
})

export class WeatherFormComponent implements OnInit {
	@Input() selected_dealer: string;
	@Output() open_media_library: EventEmitter<any> = new EventEmitter;
	@Output() weather_feed_data: EventEmitter<any> = new EventEmitter;

	is_marking: boolean = false;
	selected_background_image: string;
	selected_banner_image: string;

	font_family = [
		{ label: 'Helvetica' },
		{ label: 'Poppins' },
		{ label: 'Roboto' },
		{ label: 'Montserrat' }
	]

	orientation = [
		{ label: 'Vertical' },
		{ label: 'Horizontal' }
	]

	weather_form: FormGroup;
	weather_form_fields = [
		{
			label: 'Select Background Image',
			form_control_name: 'backgroundContentId',
			type: 'text',
			width: 'col-lg-6', 
			viewType: 'upload',
			imageUri: '',
			fileName: '',
			required: true
		},
		{
			label: 'Select Banner Image',
			form_control_name: 'bannerContentId',
			type: 'text',
			width: 'col-lg-6', 
			viewType: 'upload',
			imageUri: '',
			fileName: '',
			required: true
		},
		{
			label: 'Box Background Color',
			form_control_name: 'boxBackgroundColor',
			type: 'text',
			viewType: 'colorpicker',
			colorValue: '',
			width: 'col-lg-4', 
			required: true
		},
		{
			label: 'Days Font Color',
			form_control_name: 'daysFontColor',
			type: 'text',
			width: 'col-lg-4', 
			viewType: 'colorpicker',
			colorValue: '',
			required: true
		},
		{
			label: 'Number of days to display',
			form_control_name: 'daysToDisplay',
			type: 'number',
			width: 'col-lg-4', 
			required: true
		},
		{
			label: 'Font Family',
			form_control_name: 'fontFamily',
			type: 'text',
			width: 'col-lg-6', 
			viewType: 'select',
			options: this.font_family,
			required: true
		},
		{
			label: 'Zip Code',
			form_control_name: 'zipCode',
			type: 'text',
			width: 'col-lg-6', 
			required: true
		}
	]

	constructor(
		private _form: FormBuilder,
		private _dialog: MatDialog,
	) { }

	ngOnInit() {
		let form_group_obj = {};

		/** Loop through form fields object and prepare for group */
		this.weather_form_fields.map(
			i => {
				Object.assign(form_group_obj, {
					[i.form_control_name]: ['', Validators.required]
				})
			}
		)

		this.weather_form = this._form.group(form_group_obj)

		this.f.daysToDisplay.setValidators([Validators.min(1), Validators.max(5)])
	}

	/** On Color Picker Field Changed */
	colorPicker(e, form_control_name) {
		this.weather_form.get(form_control_name).setValue(e);
	}

	/** Open Media Library where contents are assigned to selected dealer */
	openMediaLibraryModal(form_control_name: string): void {
		/** Open Feed Media Modal */
		let dialog = this._dialog.open(FeedMediaComponent, {
			width: '1024px',
			data: {
				dealer: this.selected_dealer,
				singleSelect: true
			}
		})

		/** On Modal Close */
		dialog.afterClosed().subscribe((data: API_CONTENT[]) => {
			if (data && data.length > 0) {
				/** Set Form Control Field Value */
				this.weather_form.controls[form_control_name].setValue(data[0].contentId);

				/** Set UI Image Display */
				this.weather_form_fields.map(
					i => {
						if (i.form_control_name === form_control_name) {
							i.imageUri = data[0].thumbnail;
							i.fileName = data[0].title;
						}
					}
				)
			}
		})
	}

	/** Pass weather feed data to parent component */
	generateWeatherFeed() {
		this.weather_feed_data.emit(this.weather_form.value);
	}

	/** Weather Form Control Getter */
	private get f() {
		return this.weather_form.controls;
	}
}