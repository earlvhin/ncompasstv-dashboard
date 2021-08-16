import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs/internal/Subscription';
import { WEATHER_FEED_STYLE_DATA } from 'src/app/global/models/api_feed_generator.model';
import { API_CONTENT } from '../../../../global/models/api_content.model';
import { FeedMediaComponent } from '../feed-media/feed-media.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FeedService } from 'src/app/global/services/feed-service/feed.service';

@Component({
	selector: 'app-weather-form',
	templateUrl: './weather-form.component.html',
	styleUrls: ['./weather-form.component.scss']
})

export class WeatherFormComponent implements OnInit {
	@Input() selected_dealer: string;
	@Input() edit_weather_data: WEATHER_FEED_STYLE_DATA;
	@Output() open_media_library: EventEmitter<any> = new EventEmitter;
	@Output() weather_feed_data: EventEmitter<any> = new EventEmitter;
	subscription: Subscription = new Subscription;
	
	is_marking: boolean = false;
	selected_background_image: string;
	selected_banner_image: string;
	zipcode_valid: boolean;
	zipcode_checking: boolean = false;

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

	/** Form Control Names (form_control_name) have been set with the same keys required by the API */
	weather_form_fields = [
		{
			label: 'Select Background Image',
			form_control_name: 'backgroundContentId',
			type: 'text',
			width: 'col-lg-6', 
			viewType: 'upload',
			imageUri: '',
			fileName: '',
			required: true,
			api_key_ref: 'backgroundContents'
		},
		{
			label: 'Select Banner Image',
			form_control_name: 'bannerContentId',
			type: 'text',
			width: 'col-lg-6', 
			viewType: 'upload',
			imageUri: '',
			fileName: '',
			required: true,
			api_key_ref: 'bannerContents'
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
			label: 'Number of days to display, Maximum 5',
			form_control_name: 'numberDays',
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
			label: 'US Zip Code',
			form_control_name: 'zipCode',
			errorMsg: '',
			type: 'text',
			width: 'col-lg-6', 
			required: true
		}
	]

	constructor(
		private _form: FormBuilder,
		private _feed: FeedService,
		private _dialog: MatDialog,
	) { }

	ngOnInit() {
		console.log(this.edit_weather_data);

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
		this.f.numberDays.setValidators([Validators.min(1), Validators.max(5)])
		this.f.zipCode.setValidators([Validators.minLength(5), Validators.maxLength(5)])

		if (this.edit_weather_data) {
			this.weather_form_fields.map(i => {
				if (i.viewType == 'upload') {
					i.imageUri = `${this.edit_weather_data[i.api_key_ref].url}${this.edit_weather_data[i.api_key_ref].fileName}`;
					i.fileName = this.edit_weather_data[i.api_key_ref].title;
				}

				if (i.viewType == 'colorpicker') {
					i.colorValue = this.edit_weather_data[i.form_control_name]
				}
			})

			this.f.backgroundContentId.setValue(this.edit_weather_data.backgroundContentId);
			this.f.bannerContentId.setValue(this.edit_weather_data.bannerContentId);
			this.f.boxBackgroundColor.setValue(this.edit_weather_data.boxBackgroundColor);
			this.f.daysFontColor.setValue(this.edit_weather_data.daysFontColor);
			this.f.numberDays.setValue(this.edit_weather_data.numberDays);
			this.f.fontFamily.setValue(this.edit_weather_data.fontFamily);
			this.f.zipCode.setValue(this.edit_weather_data.zipCode);

			this.validateZipCode(this.f.zipCode.value);
		}

		/** No Debounce for UI Alert Display */
		this.subscription.add(
			this.f.zipCode.valueChanges.subscribe(_ => 
				{
					this.zipcode_checking = true;
					this.zipcode_valid = undefined;
				}
			)
		)

		/** Debounce for Field Validity and API Call */
		this.subscription.add(
			this.f.zipCode.valueChanges
			.pipe(debounceTime(1000), distinctUntilChanged())
			.subscribe(_ => {
				if (this.f.zipCode.valid) {
					this.validateZipCode(this.f.zipCode.value);
				}
			})
		)
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
	get f() {
		return this.weather_form.controls;
	}

	private validateZipCode(zipCode: string) {
		this._feed.validate_weather_zip(zipCode).subscribe(
			(data: {success: boolean}) => {
				this.zipcode_valid = data.success;
				this.zipcode_checking = false;
			}, 
			error => {
				console.log(error);
			}
		)
	}
}