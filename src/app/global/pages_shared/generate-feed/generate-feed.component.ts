import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FeedMediaComponent } from '../../components_shared/feed_components/feed-media/feed-media.component';
import { API_CONTENT } from '../../models/api_content.model';
import { AuthService } from '../../services/auth-service/auth.service';
import { DealerService } from '../../services/dealer-service/dealer.service';

import { Sortable } from 'sortablejs';
import { FeedItem } from '../../models/ui_feed_item.model';

@Component({
	selector: 'app-generate-feed',
	templateUrl: './generate-feed.component.html',
	styleUrls: ['./generate-feed.component.scss']
})

export class GenerateFeedComponent implements OnInit {
	@ViewChild('draggables', { static: false }) draggables: ElementRef<HTMLCanvasElement>;
	
	title: string = "Generate Feed";
	selected_dealer: string;
	selected_index: number = 0;
	dealers: {
		dealerId: string,
		businessName: string
	}[];

	new_feed_form: FormGroup;
	feed_items: FeedItem[] = [];
	filtered_options: Observable<{dealerId: string, businessName: string}[]>;

	constructor(
		private _auth: AuthService,
		private _dealer: DealerService,
		private _form: FormBuilder,
		private _dialog: MatDialog,
	) { }

	ngOnInit() {
		this.getDealers();
	}

	/** Initialize Angular Material Autocomplete Component */
	private matAutoFilter(): void {
		this.filtered_options = this.f.assign_to.valueChanges.pipe(
			startWith(''),
			map(value => this.filter(value))
		)
	}

	/**
	 * Filter Method for the Angular Material Autocomplete
	 * @param {string} value The entered phrase in the field
	 * @returns {dealerId: string, businessName: string} Array of filtered results
 	 */
	private filter(value: string): {dealerId: string, businessName: string}[] {
		const filter_value = value.toLowerCase();
		const filtered_result = this.dealers.filter(i => i.businessName.toLowerCase().includes(filter_value));
		this.selected_dealer = filtered_result[0] ? filtered_result[0].dealerId : null;
		return filtered_result;
	}

	/** Get all dealers to display on the auto-complete field. For admin only */
	private getDealers(): void {
		this._dealer.export_dealers().subscribe(
			(data: any) => {
				this.dealers = data;
				this.prepareFeedInfoForm();
				this.matAutoFilter();
			}, 
			error => console.log(error)
		)
	}

	/** Build Feed Information Form with fields of feed_title, description, assign_to */
	private prepareFeedInfoForm(): void {
		this.new_feed_form = this._form.group(
			{
				feed_title: ['', Validators.required],
				description: [''],
				assign_to: ['', Validators.required],
				assign_to_id: ['', Validators.required]
			}
		)
	}

	/** New Feed Form Control Getter */
	private get f() {
		return this.new_feed_form.controls;
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
		
		if (this.draggables) {
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
		}
	}

	/** Open Media Library where contents are assigned to selected dealer */
	openMediaLibraryModal(): void {
		let dialog = this._dialog.open(FeedMediaComponent, {
			width: '1024px',
			data: this.selected_dealer
		})

		dialog.afterClosed().subscribe((data: API_CONTENT[]) => {
			if (data && data.length > 0) {
				this.structureFeedItems(data);
				this.sortableJSInit();
			}
		})
	}

	/**
	 * On Angular Material Selection Change Event
	 * @param e Selection Change Event Object
	 */
	selectionChange(e): void {
		this.selected_index = e.selectedIndex;
	}
}