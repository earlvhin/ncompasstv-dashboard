import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Sortable } from 'sortablejs';
import { FeedMediaComponent } from '../../../components_shared/feed_components/feed-media/feed-media.component';
import { FeedItem } from '../../../../global/models/ui_feed_item.model';
import { API_CONTENT } from '../../../../global/models/api_content.model';
import { SLIDE_GLOBAL_SETTINGS } from '../../../../global/models/api_feed_generator.model';

@Component({
	selector: 'app-slider-form',
	templateUrl: './slider-form.component.html',
	styleUrls: ['./slider-form.component.scss']
})

export class SliderFormComponent implements OnInit {
	@Input() banner_image_data: API_CONTENT;
	@Input() global_settings: SLIDE_GLOBAL_SETTINGS;
	@Input() selected_dealer: string;
	@Input() feed_items: FeedItem[] = [];
	@ViewChild('draggables', { static: false }) draggables: ElementRef<HTMLCanvasElement>;
	@Output() structured_slide_feed = new EventEmitter();
	apply_to_all_btn_status: boolean = false;
	image_animation: number = 1;
	selected_banner_image: string;
	slide_global_settings_form: FormGroup;

	font_family = [
		{
			label: 'Helvetica'
		},
		{
			label: 'Poppins'
		},
		{
			label: 'Roboto'
		},
		{
			label: 'Montserrat'
		}
	]

	alignment = [
		{
			label: 'Left'
		},
		{
			label: 'Center'
		},
		{
			label: 'Right'
		}
	]

	/** Form Control Names (form_control_name) have been set with the same keys required by the API */
	slide_global_settings = [
		{
			label: 'Banner Image',
			form_control_name: 'bannerImage',
			type: 'text',
			width: 'col-lg-4', 
			viewType: 'upload',
			imageUri: '',
			fileName: '',
			required: false,
			api_key_ref: 'bannerImageData'
		},
		{
			label: 'Font Family',
			form_control_name: 'fontFamily',
			type: 'text',
			width: 'col-lg-4', 
			viewType: 'select',
			options: this.font_family,
			required: true
		},
		{
			label: 'Text Alignment',
			form_control_name: 'textAlign',
			type: 'text',
			width: 'col-lg-4', 
			viewType: 'select',
			options: this.alignment,
			required: true
		},
		{
			label: 'Headline Background Color',
			form_control_name: 'headlineBackground',
			type: 'text',
			viewType: 'colorpicker',
			colorValue: '',
			width: 'col-lg-3', 
			required: false
		},
		{
			label: 'Headline Color',
			form_control_name: 'headlineColor',
			type: 'text',
			viewType: 'colorpicker',
			colorValue: '',
			width: 'col-lg-3', 
			required: true
		},
		{
			label: 'Overlay Background and Transparency for Context',
			form_control_name: 'overlay',
			type: 'text',
			viewType: 'colorpicker',
			colorValue: '',
			width: 'col-lg-3', 
			required: true
		},
		{
			label: 'Font Color',
			form_control_name: 'fontColor',
			type: 'text',
			viewType: 'colorpicker',
			colorValue: '',
			width: 'col-lg-3', 
			required: true
		}
	];

	constructor(
		private _dialog: MatDialog,
		private _form: FormBuilder
	) { }

	ngOnInit() {
		this.prepareForms();
	}

	/** 
	 * Apply Set Duration a Field to All Items
	 *  @param {number} duration Duration set from UI
	 */
	applyDurationToAll(duration: number): void {
		this.feed_items.forEach(
			i => {
				i.context.duration = duration || 5;
			}
		)

		this.apply_to_all_btn_status = !this.apply_to_all_btn_status;
	}

	/** Color Picker */
	colorPicker(e, form_control_name): void {
		this.slide_global_settings_form.get(form_control_name).setValue(e);
	}

	/** Change set image of slide item */
	changeImageSlide(f: FeedItem) {
		let dialog = this._dialog.open(FeedMediaComponent, {
			width: '1024px',
			data: {
				dealer: this.selected_dealer,
				singleSelect: true
			}
		})

		dialog.afterClosed().subscribe((data: API_CONTENT[]) => {
			if (data && data.length > 0) {
				f.image.content_id = data[0].contentId,
				f.image.filename = data[0].title,
				f.image.filetype = data[0].fileType,
				f.image.preview_url = data[0].previewThumbnail,
				f.image.file_url = `${data[0].url}${data[0].fileName}`
			}
		})
	}

	/** Open Media Library where contents are assigned to selected dealer */
	openMediaLibraryModal(form_control_name?: string, singleSelect?: boolean): void {
		console.log(this.selected_dealer);

		let dialog = this._dialog.open(FeedMediaComponent, {
			width: '1024px',
			data: {
				dealer: this.selected_dealer,
				singleSelect: singleSelect || false
			}
		})

		dialog.afterClosed().subscribe((data: API_CONTENT[]) => {
			if (data && data.length > 0) {
				if (!form_control_name) {
					this.structureFeedItems(data);
					this.sortableJSInit();
				} else {
					/** Set Form Control Field Value */
					this.slide_global_settings_form.controls[form_control_name].setValue(data[0].contentId);
						
					/** Set UI Image Display */
					this.slide_global_settings.map(
						i => {
							if (i.form_control_name === form_control_name) {
								i.imageUri = data[0].thumbnail;
								i.fileName = data[0].title;
							}

							if (form_control_name === 'bannerImage') {
								this.selected_banner_image = `${data[0].url}${data[0].fileName}`
							}
						}
					)
				}
			}
		})
	}

	/** Pass Feed Items to Parent Component */
	passFeedItems(): void {
		this.structured_slide_feed.emit({
			globalSettings: this.slide_global_settings_form.value,
			feedItems: this.feed_items,
			selectedBannerImage: this.selected_banner_image,
			imageAnimation: this.image_animation
		})
	}

	/**
	 * Remove X-ed Feed Item 
	 * @param {any} f Feed Item X-ed on UI
	*/
	removeFeedItem(f: any): void {
		this.feed_items = this.feed_items.filter(i => i !== f);
	}

	/**
	 * Set Zooming Effect of Slide Image
	 * @param e
	*/
	setImageAnimation(e) {
		this.image_animation = e.checked ? 1 : 0; 
	}

	/** Slide Global Settings Form Control Getter */
	private get f() {
		return this.slide_global_settings_form.controls;
	}

	/** Prepare Forms */
	private prepareForms(): void {
		let form_group_obj = {};

		this.slide_global_settings.map(
			i => {
				Object.assign(form_group_obj, {
					[i.form_control_name]: ['', i.required ? Validators.required : null]
				})
			}
		)

		this.slide_global_settings_form = this._form.group(form_group_obj)
	
		if (this.global_settings) {
			this.slide_global_settings.map(i => {
				if (i.viewType == 'colorpicker') {
					i.colorValue = this.global_settings[i.form_control_name]
				}

				if (i.viewType == 'upload' && this.banner_image_data) {
					i.imageUri = `${this.banner_image_data.url}${this.banner_image_data.fileName}`;
					i.fileName = this.banner_image_data.title;
					this.selected_banner_image = `${this.banner_image_data.url}${this.banner_image_data.fileName}`;
				}
			})

			this.image_animation = this.global_settings.imageAnimation;
			this.f.bannerImage.setValue(this.banner_image_data ? this.banner_image_data.contentId : '');
			this.f.textAlign.setValue(this.global_settings.textAlign);
			this.f.overlay.setValue(this.global_settings.overlay);
			this.f.fontColor.setValue(this.global_settings.fontColor);
			this.f.fontFamily.setValue(this.global_settings.fontFamily);
			this.f.headlineBackground.setValue(this.global_settings.headlineBackground);
			this.f.headlineColor.setValue(this.global_settings.headlineColor);
		}
	}

	/**
	 * Structure the Feed Items Sequence
	 * @param {API_CONTENT[]} data The Feed Items
	 */
	private structureFeedItems(data: API_CONTENT[]): void {
		data.forEach(
			(f: API_CONTENT) => {
				this.feed_items.push(
					new FeedItem(
						{
							heading: 'Click Here To Change Heading',
							duration: 5,
							paragraph: ''
						},
						{
							content_id: f.contentId,
							filename: f.title,
							filetype: f.fileType,
							preview_url: f.previewThumbnail,
							file_url: `${f.url}${f.fileName}`
						}
					)
				)
			}
		);
	}
	
	/** Sortable JS Plugin Initialization */
	private sortableJSInit(): void {
		const set = (sortable) => {
			let sorted_feed_items = [];
			
			sortable.toArray().forEach(i => {
				this.feed_items.forEach(f => {
					if (i == f.image.content_id) {
						sorted_feed_items.push(f)
					}
				})
			})
			
			sorted_feed_items;
			this.feed_items = sorted_feed_items;
		}

		setTimeout(() => {
			new Sortable(this.draggables.nativeElement, {
				swapThreshold: 1,
				sort: true,
				animation: 500,
				ghostClass: 'dragging',
				scrollSensitivity: 200,
				multiDrag: true,
				selectedClass: 'selected',
				fallbackOnBody: true,
				forceFallback: true,
				group: 'feed_content_items',
				fallbackTolerance: 10,
				store: { set }
			});
		}, 0)
	}
}
