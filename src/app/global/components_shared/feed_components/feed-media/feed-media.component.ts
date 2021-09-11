import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { API_CONTENT } from '../../../../global/models/api_content.model';
import { PAGING } from '../../../../global/models/paging.model';
import { IsimagePipe } from '../../../../global/pipes/isimage.pipe';
import { ContentService } from '../../../../global/services/content-service/content.service';
import { UI_ROLE_DEFINITION } from '../../../../global/models/ui_role-definition.model';

@Component({
	selector: 'app-feed-media',
	templateUrl: './feed-media.component.html',
	styleUrls: ['./feed-media.component.scss'],
	providers: [ IsimagePipe ]
})

export class FeedMediaComponent implements OnInit {

	floating_content: API_CONTENT[] = [];
	has_page_left: boolean;
	image_search_key: string;
	is_admin: boolean = false;
	media_files: API_CONTENT[] = [];
	media_files_backup: API_CONTENT[] = [];
	media_files_page: number = 1;
	no_media: boolean = false;
	pageEnd: boolean = false;
	scroll_end: boolean;
	selected_media_files: API_CONTENT[] = [];
	show_floating_content: boolean = false;
	single_select: boolean = false;
	subscription: Subscription = new Subscription();
	file_not_found: boolean;

	constructor(
		private _content: ContentService,
		private _is_image: IsimagePipe,
		private _auth: AuthService,
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
					if (data.contents && data.paging) {
						this.mediaMapToUI(data)

						if (data.paging.hasNextPage) {
							this.getUserMediaFiles(dealer_id)
						} else {
							this.pageEnd = true;
						}

						return;
					}

					this.no_media = true;
					this.pageEnd = true;
				}, 
				error => {
					console.log(error)
				}
			)
		)

		if (this._auth.current_user_value.role_id == UI_ROLE_DEFINITION.administrator || this._auth.current_user_value.role_id == UI_ROLE_DEFINITION.tech) {
			this.is_admin = true;
			this.subscription.add(
				this._content.get_floating_contents().subscribe(
					data => {
						this.floating_content = data.filter(i => this._is_image.transform(i.fileType));
					}
				)
			)
		} 
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

		this.media_files_backup = this.media_files;
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

	/**
	 * Show Floating Contents, For Admin and Tech Support only
	 *  @param e Toggle Status
	*/
	showFloatingContent(e: any) {
		this.show_floating_content = e.checked;

		if (e.checked) {
			if (this.floating_content) this.no_media = false;
			this.media_files = this.media_files.concat(this.floating_content);
		} else {
			this.media_files = this.media_files.filter(i => i.dealerId !== null && i.dealerId !== "");
			this.image_search_key = null;
			this.media_files = this.media_files_backup;
			if (this.media_files.length == 0) this.no_media = true;
		}
	}

	// Search Content Field
	searchContent(e) {
		if(e.target.value !== '') {
			this.media_files = this.media_files.filter(i => i.title.toLowerCase().includes(e.target.value.toLowerCase()))

			if (this.media_files.length == 0) {
				this.media_files = this.media_files_backup;
				this.no_media = true;
			}
		} else {
			if (this.show_floating_content == true) {
				this.media_files = this.media_files_backup.concat(this.floating_content);
			} else {
				this.media_files = this.media_files_backup;
			}

			this.no_media = false;
		}
	}
}