import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Subscription } from 'rxjs';
import { API_CONTENT } from 'src/app/global/models/api_content.model';
import { IsimagePipe } from 'src/app/global/pipes/isimage.pipe';
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

	constructor(
		private _content: ContentService,
		private _is_image: IsimagePipe,
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any
	) { }

	ngOnInit() {
		this.getUserMediaFiles(this._dialog_data);
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	/**
	 * Get All Media Files Assigned to Passed User
	 * @param {string} dealer_id Passed Dealer ID from parent component
	 */
	private getUserMediaFiles(dealer_id: string): void {
		this.subscription.add(
			this._content.get_content_by_dealer_id(dealer_id, false, this.media_files_page++, 200).subscribe(
				(data: {contents: API_CONTENT[], paging: any}) => {
					this.mediaMapToUI(data)
	
					if (data.paging.hasNextPage) {
						this.getUserMediaFiles(dealer_id)
					}
				}
			)
		)
	}

	/** 
	 * Filter Result to Images Only 
	 * @param {contents: API_CONTENT[], paging: any} media_files Data returned by get_content_by_dealer_id API
	 */
	private mediaMapToUI(media_files: {contents: API_CONTENT[], paging: any}): void {
		media_files.contents.forEach(i => {
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
		if (this.selected_media_files.includes(media_file)) {
			this.selected_media_files = this.selected_media_files.filter(i => i.contentId !== media_file.contentId)
			return;
		}

		this.selected_media_files.push(media_file);
	}
}
