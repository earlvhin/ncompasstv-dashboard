import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs/internal/Subscription';
import { NEWS_FEED_STYLE_DATA } from '../../../../global/models/api_feed_generator.model';
import { API_CONTENT } from '../../../../global/models/api_content.model';
import { FeedMediaComponent } from '../feed-media/feed-media.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FeedService } from '../../../../global/services/feed-service/feed.service';

@Component({
	selector: 'app-news-form',
	templateUrl: './news-form.component.html',
	styleUrls: ['./news-form.component.scss']
})

export class NewsFormComponent implements OnInit {
	@Input() selected_dealer: string;
	@Input() edit_news_data: NEWS_FEED_STYLE_DATA;
	@Output() open_media_library: EventEmitter<any> = new EventEmitter;
	@Output() news_feed_data: EventEmitter<any> = new EventEmitter;
	subscription: Subscription = new Subscription;
	
	is_marking: boolean = false;
	selected_background_image: string;
	selected_banner_image: string;
	rss_url_valid: boolean;
	rss_url_checking: boolean = false;

	font_family = [
		{ label: 'Helvetica' },
		{ label: 'Poppins' },
		{ label: 'Roboto' },
		{ label: 'Montserrat' }
	];

	orientation = [
		{ label: 'Vertical' },
		{ label: 'Horizontal' }
	];

	news_form: FormGroup;

	/** Form Control Names (form_control_name) have been set with the same keys required by the API */
	news_form_fields = [
		{
			label: 'Background Image',
			form_control_name: 'backgroundContentId',
			type: 'text',
			width: 'col-lg-6', 
			viewType: 'upload',
			imageUri: '',
			fileName: '',
			required: false,
			api_key_ref: 'backgroundContents',
			options: null
		},
		{
			label: 'Background Color',
			form_control_name: 'backgroundColor',
			type: 'text',
			viewType: 'colorpicker',
			colorValue: '#768fb4',
			width: 'col-lg-6', 
			required: false,
			value: '#768fb4',
			options: null
		},
		{
			label: 'Font Color',
			form_control_name: 'fontColor',
			type: 'text',
			viewType: 'colorpicker',
			colorValue: '#000000',
			width: 'col-lg-3', 
			required: false,
			value: '#000000',
			options: null
		},
		{
			label: 'Font Size',
			form_control_name: 'fontSize',
			errorMsg: '',
			type: 'number',
			width: 'col-lg-3', 
			required: false,
			value: 44,
			options: null
		},
		{
			label: 'Offset Left',
			form_control_name: 'marginLeft',
			errorMsg: '',
			type: 'number',
			width: 'col-lg-3', 
			required: false,
			value: 10,
			options: null
		},
		{
			label: 'Offset Top',
			form_control_name: 'marginTop',
			errorMsg: '',
			type: 'value',
			width: 'col-lg-3', 
			required: false,
			value: 23,
			options: null
		},
		{
			label: 'RSS Feed URL',
			form_control_name: 'rssFeedUrl',
			errorMsg: '',
			type: 'text',
			width: 'col-lg-4', 
			required: false,
			options: null
		},
		{
			label: 'Results',
			form_control_name: 'results',
			errorMsg: '',
			type: 'number',
			width: 'col-lg', 
			required: false,
			value: 3,
			options: null
		},
		{
			label: 'Transition Time',
			form_control_name: 'time',
			errorMsg: '',
			type: 'number',
			width: 'col-lg', 
			required: false,
			value: 8,
			options: null
		},
		{
			label: 'Loop Cycle',
			form_control_name: 'loopCycle',
			errorMsg: '',
			type: 'number',
			width: 'col-lg', 
			required: false,
			value: 9,
			options: null
		},
	]

	constructor(
		private _form: FormBuilder,
		private _feed: FeedService,
		private _dialog: MatDialog,
	) { }

	ngOnInit() {
		this.prepareForms();
	}

	/** On Color Picker Field Changed */
	colorPicker(e, form_control_name) {
		this.news_form.get(form_control_name).setValue(e);
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
				this.news_form.controls[form_control_name].setValue(data[0].contentId);

				/** Set UI Image Display */
				this.news_form_fields.map(
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


	/** Pass news feed data to parent component */
	generateNewsFeed() {
		const feedUrl = this.news_form.value.rssFeedUrl;
		this.news_form.value.rssFeedUrl = encodeURIComponent(feedUrl);
		this.news_feed_data.emit(this.news_form.value);
	}

	/** Remove Selected Media File 
	 * @param {string} control Clicked Upload Control Name
	*/
	removeSelectedMedia(control: string) {
		this.news_form.controls[control].reset();

		this.news_form_fields.map(i => {
			if (i.form_control_name === control) {
				i.fileName = '';
				i.imageUri = '';
			}
		})
	}

	/** news Form Control Getter */
	get f() {
		return this.news_form.controls;
	}

	/** Prepare Forms */
	private prepareForms(): void {

		let form_group_obj = {};

		/** Loop through form fields object and prepare for group */
		this.news_form_fields.map(
			i => {
				Object.assign(form_group_obj, {
					[i.form_control_name]: [i.value ? i.value : null, i.required ? Validators.required : null]
				})
			}
		)

		this.news_form = this._form.group(form_group_obj)

		if (this.edit_news_data) {
			this.news_form_fields.map(i => {
				if (i.viewType == 'upload' && this.edit_news_data[i.api_key_ref]) {
					i.imageUri = `${this.edit_news_data[i.api_key_ref].url}${this.edit_news_data[i.api_key_ref].fileName}`;
					i.fileName = this.edit_news_data[i.api_key_ref].title;
				}

				if (i.viewType == 'colorpicker') {
					i.colorValue = this.edit_news_data[i.form_control_name]
				}
			})

			this.f.backgroundContentId.setValue(this.edit_news_data.backgroundContentId);
			this.f.backgroundColor.setValue(this.edit_news_data.backgroundColor);
			this.f.fontColor.setValue(this.edit_news_data.fontColor);
			this.f.fontSize.setValue(this.edit_news_data.fontSize);
			this.f.loopCycle.setValue(this.edit_news_data.loopCycle);
			this.f.marginLeft.setValue(this.edit_news_data.marginLeft);
			this.f.marginTop.setValue(this.edit_news_data.marginTop);
			this.f.results.setValue(this.edit_news_data.results);
			this.f.rssFeedUrl.setValue(this.edit_news_data.rssFeedUrl);
			this.f.time.setValue(this.edit_news_data.time);

			this.validateRssUrl(this.f.rssFeedUrl.value);
			this.rss_url_checking = true;
			this.rss_url_valid = undefined;
		}

		/** No Debounce for UI Alert Display */
		this.subscription.add(
			this.f.rssFeedUrl.valueChanges.subscribe(_ => 
				{
					this.rss_url_checking = true;
					this.rss_url_valid = undefined;
				}
			)
		)

		/** Debounce for Field Validity and API Call */
		this.subscription.add(
			this.f.rssFeedUrl.valueChanges
			.pipe(debounceTime(2000), distinctUntilChanged())
			.subscribe(_ => {
				if (this.f.rssFeedUrl.valid) {
					this.validateRssUrl(this.f.rssFeedUrl.value);
				}
			})
		)
	}

	/** Validate rss_url if is within API jurisdiction
	 * @param {string} rss_url Entered rss_url
	 */
	private validateRssUrl(rss_url: string) {
		this._feed.validate_rss_url(rss_url).subscribe(
			(data: {success: boolean}) => {
				this.rss_url_valid = data.success;
				this.rss_url_checking = false;
			}, 
			error => {
				console.log(error);
			}
		)
	}
}