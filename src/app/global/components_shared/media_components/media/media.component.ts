import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, Observable } from 'rxjs';

import { API_CONTENT } from 'src/app/global/models/api_content.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ContentService } from 'src/app/global/services/content-service/content.service';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { UI_CONTENT } from 'src/app/global/models/ui_content.model';
import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';
@Component({
	selector: 'app-media',
	templateUrl: './media.component.html',
	styleUrls: ['./media.component.scss']
})

export class MediaComponent implements OnInit, OnDestroy {
	@Input() reload: Observable<void>;
	@Input() sm_view: boolean;
	@Output() empty = new EventEmitter;
	@Output() send_stats = new EventEmitter;

	content_data: UI_CONTENT[];
	empty_search = false;
	feed_data: UI_CONTENT[];
	filter_data: any;
	filtered_content_data: UI_CONTENT[];
	is_bulk_select = false;
	is_dealer = false;
	is_zone_content = false;
	key = '';
	no_content: boolean;
	no_refresh = false;
	no_search_result = false;
	paging_data: any;
	role_id: string;
	searching = false;
	selected_content_ids: string[] = [];
	sort_order: boolean;
	stats : any;
	subscription = new Subscription;
	temp: any = [];
	type_filter_data: any;
	user_filtered_data: any;

	filters: any = {
		filetype: '',
		order: '',
		user: {
			dealer: '',
			host: '',
			advertiser: ''
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
				this.searchContent('');
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
	clearFilter(e: any): void {

		this.filters = {
			filetype: '',
			order: '',
			user: {
				dealer: '',
				host: '',
				advertiser: '',
			}
		};

		if (!this.no_refresh && e) this.getContents();

	}

	checkChecking(id: string): boolean {
		const index = this.temp.indexOf(id);

		if (index !== -1) {
			return true;
		} else {
			return false;
		}

	}

	controlToggle(event: { checked: boolean }): void {
		this.is_bulk_select = event.checked;
		if (this.is_bulk_select) this.is_zone_content = true;

		if (!this.is_bulk_select) {
			this.is_zone_content = false;
			this.selected_content_ids = [];
		}

	}

	deleteMultiple(): void {
		const ids = this.selected_content_ids;
		this.warningModal('warning', 'Delete Content', 'Are you sure you want to delete this content', '', 'delete', ids);
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
		} else if (event.dealer.id && event.host.id) {
			this.filters.user.dealer = event.dealer.name;
			this.filters.user.host = event.host.name;
			this.filters.user.dealer_label = event.dealer.id;
			this.filters.user.host_label = event.host.id;
		} else if (event.dealer.id && event.advertiser.id) {
			this.filters.user.dealer = event.dealer.name;
			this.filters.user.advertiser = event.advertiser.name;
			this.filters.user.dealer_label = event.dealer.id;
			this.filters.user.advertiser_label = event.advertiser.id;
		} else {
			this.filters.user.dealer = event.dealer.name;
			this.filters.user.dealer_label =event.dealer.id;
		}

		this.getPage(1);

	}

	// Get All Media Files
	getContents(): void {

		if (this.filters.filetype == "") {
			this.filters.filetype_label = "";
		}

		if (this.filters.order == "") {
			this.filters.order_label = "";
		}

		if (this.filters.user.dealer == "") {
			this.filters.user.dealer_label = "";
		}

		if (this.filters.user.host == "") {
			this.filters.user.host_label = "";
		}

		if (this.filters.user.advertiser == "") {
			this.filters.user.advertiser_label = "";
		}

		this.pageRequested(1, false);
	}

	getPage(e: number): void {
		this.filtered_content_data = [];
		this.pageRequested(e, true);
	}

	isDeleted(e: boolean): void {
		if (e) this.getPage(1);
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

	// Media File Viewer
	mediaViewer_open(content: UI_CONTENT, contents: UI_CONTENT[], i: number): void {

		const dialog = this._dialog.open(MediaViewerComponent, {
			panelClass: 'app-media-viewer-dialog',
			data: {
				index: i,
				content_array: contents,
				selected: content,
			}
		});

		dialog.afterClosed().subscribe(() => this.ngOnInit());
	}

	multipleDelete(e: any): void {

		if (e.toadd) {
			this.temp.push(e.id);
		} else {
			const index = this.temp.indexOf(e.id);
			if (index !== -1) this.temp.splice(index, 1);
		}

		this.checkChecking(e.id);

	}

	onSelectContent(content: UI_CONTENT, index: number): void {

		const id = content.content_id;

		if (this.is_bulk_select) {

			if (!this.selected_content_ids.includes(id)) this.selected_content_ids.push(id);
			else this.selected_content_ids.splice(this.selected_content_ids.indexOf(id), 1);
			return;
			
		}

		this.mediaViewer_open(content, this.filtered_content_data, index);

	}

	pageRequested(page: number, filter: boolean): void {

		this.no_search_result = false;
		this.searching = true;
		if (this.is_dealer) this.filters.user.dealer_label = this._auth.current_user_value.roleInfo.dealerId;

		const labels = {
			filetype: this.filters.filetype_label,
			order: this.filters.order_label,
			dealer: this.filters.user.dealer_label,
			host: this.filters.user.host_label,
			advertiser: this.filters.user.advertiser_label
		};

		this.subscription.add(
			this._content.get_contents_with_page(page, labels.filetype, labels.order, labels.dealer, labels.host, labels.advertiser, this.key)
				.subscribe(
					data => {
						this.searching = false;

						if (data.iContents && data.iContents.length > 0) {

							this.no_search_result = false;
							this.content_data = this.media_mapToUI(data.iContents);
							this.filtered_content_data = this.content_data;
							if (!filter) this.no_content = false;

						} else {

							if (!filter && this.key == '') this.no_content = true; 
							else this.no_search_result = true;

						}

						if (data.paging) this.paging_data = data.paging;

					}
				)
		);

	}

	// Search Content Field
	searchContent(e: string): void {
		this.no_refresh = false;
		this.clearFilter(false);

		if (e.length >= 3) {
			this.key = e;
			this.getContents();
		} else {
			this.key = '';
			this.no_search_result = false;
			this.getContents();
		}
		
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

	// Sort By Order Ascending
	sortAscendingOrder(e: boolean): void {
		this.sort_order = e;
		this.filters.order = 'Ascending'
		this.filters.order_label = 'asc'
		if (e) this.getPage(1);
	}

	// Sort By Filetype Dropdown
	sortByFiletype(e: string): void {

		switch (e) {
			case 'image':
				this.filters.filetype = 'Images';
				this.filters.filetype_label = 'image';
				break;
			case 'video':
				this.filters.filetype = 'Videos';
				this.filters.filetype_label = 'video';
				break;
			default:
				this.filters.filetype = 'Feeds';
				this.filters.filetype_label = 'feed';
				break;
		}

		this.getPage(1);

	}
	
	// Sort By Order Descending
	sortDescendingOrder(e: boolean): void {
		this.sort_order = e;
		this.filters.order = 'Descending';
		this.filters.order_label = 'desc';
		if (e) this.getPage(1);
	}

	warningModal(status: string, message: string, data: any, return_msg: string, action: string, array: any[]): void {

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

					array = array.map(
						id => {
							return { contentid: id };
						}
					);

					this.subscription.add(
						this._content.remove_content(array).subscribe(
							() => {
								this._dialog.closeAll();
								this.is_bulk_select = false;
								this.getPage(1);
							}
						)
					);


				}
			}
		);
	}

}
