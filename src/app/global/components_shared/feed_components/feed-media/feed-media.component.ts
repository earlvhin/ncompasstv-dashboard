import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Subscription } from 'rxjs';
import { API_CONTENT } from '../../../../global/models/api_content.model';
import { PAGING } from '../../../../global/models/paging.model';
import { IsimagePipe } from '../../../../global/pipes/isimage.pipe';
import { ContentService } from '../../../../global/services/content-service/content.service';

@Component({
	selector: 'app-feed-media',
	templateUrl: './feed-media.component.html',
	styleUrls: ['./feed-media.component.scss'],
	providers: [ IsimagePipe ]
})

export class FeedMediaComponent implements OnInit {

	media_files: API_CONTENT[] = [];
	selected_media_files: API_CONTENT[] = [];
	subscription: Subscription = new Subscription();
	media_files_page: number = 1;
	pageEnd: boolean = false;
	scroll_end: boolean;
	single_select: boolean = false;
	has_page_left: boolean;

	constructor(
		private _content: ContentService,
		private _is_image: IsimagePipe,
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any
	) { }

	ngOnInit() {
		console.log(typeof(this._dialog_data));

		if (this._dialog_data) {
			this.getUserMediaFiles(this._dialog_data.dealer);
			this.single_select = this._dialog_data.singleSelect || false;
		}
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	/**
	 * Detect End of Y Scroll
	 * @param event
	 */
	@HostListener("scroll", ["$event"]) onScroll(event: any) {
		if (event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight && this.has_page_left) {
			this.pageEnd = false;

			if (this._dialog_data) {
				this.getUserMediaFiles(this._dialog_data);
			}
		}
	}

	/**
	 * Get unassigned media files if no dealer selected
	 */
	private getUserMediaFiles(dealer_id: string) {
		this.subscription.add(
			this._content.get_contents_with_page(
				this.media_files_page++, 
				'image',
				'',
				dealer_id,
			).map(data => { return { contents: data.iContents, paging: data.paging }}).subscribe(
				(data: {contents: API_CONTENT[], paging: PAGING}) => {
					this.mediaMapToUI(data)

					if (data.paging.hasNextPage) {
						this.getUserMediaFiles(dealer_id)
					} else {
						this.pageEnd = true;
					}
				}, 
				error => {
					console.log(error)
				}
			)
		)
	}

	/** 
	 * Filter Result to Images Only 
	 * @param {contents: API_CONTENT[], paging: any} media_files Data returned by get_content_by_dealer_id API
	 */
	private mediaMapToUI(media_files: {contents: API_CONTENT[], paging: any}): void {
		media_files.contents.forEach((i: API_CONTENT) => {
			if (this._is_image.transform(i.fileType)) {
				this.media_files.push(i);
			}
		});
	}

	/**
	 * Add/Remove clicked thumbnail to selected_media_file array
	 * @param media_file Media File Clicked via UI
	 */
	imageSelected(media_file: API_CONTENT) {
		console.log(this.single_select);

		if (!this.single_select) {
			if (this.selected_media_files.includes(media_file)) {
				this.selected_media_files = this.selected_media_files.filter(i => i.contentId !== media_file.contentId)
				return;
			}

			this.selected_media_files.push(media_file);
		} else {
			if (this.selected_media_files.length < 1) {
				this.selected_media_files.push(media_file);
			} else {
				if (this.selected_media_files.includes(media_file)) {
					this.selected_media_files = this.selected_media_files.filter(i => i.contentId !== media_file.contentId)
					return;
				}
			}
		}
	}
}
