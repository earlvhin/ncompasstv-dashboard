import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Sortable } from 'sortablejs';
import { FeedMediaComponent } from '../../../components_shared/feed_components/feed-media/feed-media.component';
import { FeedItem } from '../../../../global/models/ui_feed_item.model';
import { API_CONTENT } from '../../../../global/models/api_content.model';

@Component({
	selector: 'app-slider-form',
	templateUrl: './slider-form.component.html',
	styleUrls: ['./slider-form.component.scss']
})

export class SliderFormComponent implements OnInit {
	@Input() selected_dealer: string;
	@Input() feed_items: FeedItem[] = [];
	@ViewChild('draggables', { static: false }) draggables: ElementRef<HTMLCanvasElement>;
	@Output() structured_feed_items = new EventEmitter();

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

	slide_global_settings = [
		{
			label: 'Overlay Background and Transparency for Context',
			form_control_name: 'overlay',
			type: 'text',
			viewType: 'colorpicker',
			colorValue: '',
			width: 'col-lg-4', 
			required: true
		},
		{
			label: 'Font Color',
			form_control_name: 'fontColor',
			type: 'text',
			viewType: 'colorpicker',
			colorValue: '',
			width: 'col-lg-4', 
			required: true
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
	]

	slide_global_settings_form: FormGroup;
	
	apply_to_all_btn_status: boolean = false;

	constructor(
		private _dialog: MatDialog,
		private _form: FormBuilder
	) { }

	ngOnInit() {
		let form_group_obj = {};

		this.slide_global_settings.map(
			i => {
				Object.assign(form_group_obj, {
					[i.form_control_name]: ['', Validators.required]
				})
			}
		)

		this.slide_global_settings_form = this._form.group(form_group_obj)
	}

	/** Apply Set Duration a Field to All Items
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

	/** Open Media Library where contents are assigned to selected dealer */
	openMediaLibraryModal(): void {
		console.log(this.selected_dealer);

		let dialog = this._dialog.open(FeedMediaComponent, {
			width: '1024px',
			data: {
				dealer: this.selected_dealer,
				singleSelect: false
			}
		})

		dialog.afterClosed().subscribe((data: API_CONTENT[]) => {
			if (data && data.length > 0) {
				this.structureFeedItems(data);
				this.sortableJSInit();
			}
		})
	}

	/** Pass Feed Items to Parent Component */
	passFeedItems(): void {
		this.structured_feed_items.emit(
			{
				globalSettings: this.slide_global_settings_form.value,
				feedItems: this.feed_items
			}
		)
	}

	/** Remove X-ed Feed Item 
	 * @param {any} f Feed Item X-ed on UI
	*/
	removeFeedItem(f: any): void {
		this.feed_items = this.feed_items.filter(i => i !== f);
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
	
	/** Sortable JS Plugin Initialization*/
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
