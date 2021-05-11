import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Subscription, Observable } from 'rxjs';

import { API_CONTENT } from 'src/app/global/models/api_content.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ContentService } from 'src/app/global/services/content-service/content.service';
import { MatDialog } from '@angular/material/dialog';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { UI_CONTENT } from 'src/app/global/models/ui_content.model';
import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';

@Component({
	selector: 'app-media',
	templateUrl: './media.component.html',
	styleUrls: ['./media.component.scss']
})

export class MediaComponent implements OnInit {
	@Input() reload: Observable<void>;
	@Input() sm_view: boolean;
	@Output() send_stats = new EventEmitter;
	@Output() empty = new EventEmitter;

	content_data: UI_CONTENT[];
	enable_multiple_delete = false;
	empty_search = false;
	feed_data: UI_CONTENT[];
	filter_data: any;
	filtered_content_data: UI_CONTENT[];
	is_dealer = false;
	key = '';
	no_content: boolean;
	no_refresh = false;
	no_search_result = false;
	paging_data: any;
	role_id: string;
	searching = false;
	sort_order: boolean;
	stats: any;
	subscription = new Subscription;
	temp = [];
	type_filter_data: any;
	user_filtered_data: any;

	filters: any = {
		filetype: "",
		order: "",
		user: {
			dealer: "",
			host: "",
			advertiser: ""
		}
	};

	private eventsSubscription: Subscription;

	constructor(
		private _auth: AuthService,
		private _content: ContentService,
		private _dialog: MatDialog,
	) { }

	ngOnInit() {

		this.role_id = this._auth.current_user_value.role_id;
		if (this.role_id === UI_ROLE_DEFINITION.dealer) this.is_dealer = true;

		this.reload.subscribe(
			() =>  {
				this.clearFilter(true);
				this.searchContent("")
				this.empty_search = true;
				this.sendStatCardsData();
			}
		);

		this.getContents();
		this.sendStatCardsData();
	}

	ngOnDestroy() {
		if (this.eventsSubscription) this.eventsSubscription.unsubscribe();
		this.subscription.unsubscribe();
	}

	// Clear Filter
	clearFilter(value: boolean): void {

		this.filters = {
			filetype: "",
			order: "",
			user: {
				dealer: "",
				host: "",
				advertiser: "",
			}
		};

		if (!this.no_refresh && value) this.getContents();
	}

	// Get All Media Files
	getContents(): void {

		if (this.filters.filetype == '') this.filters.filetype_label = '';
		
		if (this.filters.order == '') this.filters.order_label = '';

		if (this.filters.user.dealer == '') this.filters.user.dealer_label = '';

		if (this.filters.user.host == '') this.filters.user.host_label = '';

		if (this.filters.user.advertiser == '') this.filters.user.advertiser_label = '';

		this.pageRequested(1, false);

	}

	controlToggle(event: any): void {
		this.enable_multiple_delete = event.checked;
	}

	multipleDelete(event: any): void {

		if (event.toadd) {
			this.temp.push(event.id)
		} else {
			const index = this.temp.indexOf(event.id);
			if (index !== -1) this.temp.splice(index, 1);
		}

		this.checkChecking(event.id);

	}

	deleteMultiple(): void {
		this.warningModal('warning', 'Delete Content', 'Are you sure you want to delete this content','','delete', this.temp);
	}

	checkChecking(id: any): boolean {
		const index = this.temp.indexOf(id);
		if (index !== -1) return true; 
		else return false;
	}

	pageRequested(page: any, filter: any): void {

		this.no_search_result = false;
		this.searching = true;
		if (this.is_dealer) this.filters.user.dealer_label = this._auth.current_user_value.roleInfo.dealerId;

		this.subscription.add(
			this._content.get_contents_with_page(page, this.filters.filetype_label, this.filters.order_label, this.filters.user.dealer_label, this.filters.user.host_label, this.filters.user.advertiser_label, this.key).subscribe(
				data => {
					this.searching = false;

					if (data.iContents && data.iContents.length > 0) {

						this.no_search_result = false;
						this.content_data = this.media_mapToUI(data.iContents);
						this.filtered_content_data = this.content_data;
						if (!filter) this.no_content = false;

					} else {

						if (!filter && this.key == "") this.no_content = true; 
						else this.no_search_result = true;
						
					}

					if (data.paging) this.paging_data = data.paging;

				}
			)
		);

	}

	getPage(value: number): void {
		this.filtered_content_data = [];
		this.pageRequested(value, true);
	}

	isDeleted(event: any): void {
		if (event) this.getPage(1);
	}

	// Structure Stat Cards Data and Send to Parent
	sendStatCardsData(): void {

		if (this.role_id === UI_ROLE_DEFINITION.dealer) {

			this.subscription.add(
				this._content.get_contents_total_by_dealer(this._auth.current_user_value.roleInfo.dealerId).subscribe(
					data => {
						this.stats = {
							all: data.total,
							videos: data.totalVideos,
							images: data.totalImages,
							feeds: data.totalFeeds,
						}
						this.send_stats.emit(this.stats);
					}
				)
			);

		} else {

			this.subscription.add(
				this._content.get_contents_total().subscribe(
					data => {
						this.stats = {
							all: data.total,
							videos: data.totalVideos,
							images: data.totalImages,
							feeds: data.totalFeeds,
						}
						this.send_stats.emit(this.stats);
					}
				)
			);

		}

	}

	// Map Media FIles Data to UI
	media_mapToUI(data: API_CONTENT[]): UI_CONTENT[] {

		const media_content = data.map(
			(m: API_CONTENT) => {
				return new UI_CONTENT(
					m.playlistContentId,
					m.createdBy,
					m.contentId,
					m.createdByName,
					m.dealerId,
					m.duration,
					m.hostId,
					m.advertiserId,
					m.fileName,
					m.url,
					m.fileType,
					m.handlerId,
					m.dateCreated,
					m.isFullScreen,
					m.filesize,
					m.previewThumbnail || m.thumbnail,
					m.isActive,
					m.isConverted,
					m.uuid,
					m.title,
					'',
					m.createdByName
				)
			}
		);

		if (this.role_id === UI_ROLE_DEFINITION.dealer) {
			return media_content.filter(content => this._auth.current_user_value.roleInfo.dealerId == content.dealer_id);
		} else {
			return media_content;
		}

	}

	// Sort By Order Ascending
	sortAscendingOrder(event: any): void {
		this.sort_order = event;
		this.filters.order = 'Ascending';
		this.filters.order_label = 'asc';
		if (event) this.getPage(1);
	}

	// Sort By Order Descending
	sortDescendingOrder(event: any): void {
		this.sort_order = event;
		this.filters.order = 'Descending';
		this.filters.order_label = 'desc';
		if (event) this.getPage(1);
	}

	// Sort By Filetype Dropdown
	sortByFiletype(event: any): void {

		if (event === 'image') {

			this.filters.filetype = 'Images';
			this.filters.filetype_label = 'image';
			this.getPage(1);

		} else if(event === 'video'){

			this.filters.filetype = 'Videos';
			this.filters.filetype_label = 'video';
			this.getPage(1);

		} else {

			this.filters.filetype = 'Feeds';
			this.filters.filetype_label = 'feed';
			this.getPage(1);

		}

	}
	
	// Filter By User Modal Trigger
	filterByUser(event: any): void {

		if (event.dealer.id && event.host.id && event.advertiser.id) {

			this.filters.user.dealer = event.dealer.name;
			this.filters.user.host = event.host.name;
			this.filters.user.advertiser = event.advertiser.name;
			this.filters.user.dealer_label = event.dealer.id;
			this.filters.user.host_label = event.host.id;
			this.filters.user.advertiser_label = event.advertiser.id;
			this.getPage(1);

		} else if (event.dealer.id && event.host.id) {

			this.filters.user.dealer = event.dealer.name;
			this.filters.user.host = event.host.name;
			this.filters.user.dealer_label = event.dealer.id;
			this.filters.user.host_label = event.host.id;
			this.getPage(1);

		} else if (event.dealer.id && event.advertiser.id) {

			this.filters.user.dealer = event.dealer.name;
			this.filters.user.advertiser = event.advertiser.name;
			this.filters.user.dealer_label = event.dealer.id;
			this.filters.user.advertiser_label = event.advertiser.id;
			this.getPage(1);

		} else {

			this.filters.user.dealer = event.dealer.name;
			this.filters.user.dealer_label =event.dealer.id;
			this.getPage(1);

		}

	}

	// Search Content Field
	searchContent(event: any): void {

		this.no_refresh = false;
		this.clearFilter(false);
		
		if (event.length >= 3) {
			this.key = event;
			this.getContents();
		} else {
			this.key = '';
			this.no_search_result = false;
			this.getContents();
		}
		
	}

	// Media File Viewer
	mediaViewer_open(content: any, filteredContents: any[], i: number): void {

		this._dialog.open(MediaViewerComponent, {
			panelClass: 'app-media-viewer-dialog',
			data: {
				index: i,
				content_array: filteredContents,
				selected: content,
			}
		});
		
	}

	warningModal(status: string, message: string, data: any, return_msg: string, action: any, contents: any[]): void {

		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data,
				return_msg: return_msg,
				action: action
			}
		});

		dialogRef.afterClosed().subscribe(
			result => {

				if (result == 'delete') {

					contents = contents.map(content => {
						return { 'contentid': content };
					});

					this.subscription.add(
						this._content.remove_content(contents).subscribe(
							() => {
								this._dialog.closeAll();
								this.enable_multiple_delete = false;
								this.getPage(1);
							}
						)
					);
				}
			}
		);
	}

}
