import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, Host } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, Observable } from 'rxjs';

import { API_CONTENT } from 'src/app/global/models/api_content.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ContentService } from 'src/app/global/services/content-service/content.service';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { UI_CONTENT } from 'src/app/global/models/ui_content.model';
import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';
import { SelectOwnerComponent } from '../../user_components/select-owner/select-owner.component';
import { FeedService } from 'src/app/global/services';
import { IsimagePipe } from 'src/app/global/pipes';
@Component({
	selector: 'app-media',
	templateUrl: './media.component.html',
	styleUrls: ['./media.component.scss'],
	providers: [IsimagePipe]
})
export class MediaComponent implements OnInit, OnDestroy {
	@Output() empty = new EventEmitter();
	@Output() send_stats = new EventEmitter();

	@Input() is_dealer = false;
	@Input() is_view_only = false;
	@Input() reload: Observable<void>;
	@Input() sm_view: boolean;
	@Input() show_filler_search: boolean;

	can_reassign = false;
	empty_search = false;
	fillers: Observable<{ feedId: string; feedTitle: string }[]>;
	filtered_content_data: UI_CONTENT[];
	// is_dealer = false;
	is_bulk_select = false;
	is_zone_content = false;
	no_content: boolean;
	no_search_result = false;
	paging_data: any;
	searching = false;
	selected_content_ids: string[] = [];

	filters: any = {
		filetype: '',
		order: '',
		feedId: '',
		user: {
			dealer: '',
			host: '',
			advertiser: ''
		}
	};

	private content_data: UI_CONTENT[];
	private eventsSubscription: Subscription;
	private key = '';
	private no_refresh = false;
	private role_id: string;
	private sort_order: boolean;
	private stats: any;
	private subscription = new Subscription();
	private temp: any = [];

	constructor(
		private _auth: AuthService,
		private _content: ContentService,
		private _dialog: MatDialog,
		private _feed: FeedService,
		private _isImage: IsimagePipe
	) {}

	ngOnInit() {
		this.reload.subscribe(() => {
			this.clearFilter(true);
			this.searchContent('');
			this.empty_search = true;
			this.sendStatCardsData();
		});

		this.role_id = this._auth.current_user_value.role_id;
		this.getContents();
		this.getFillers();
		this.sendStatCardsData();
	}

	ngOnDestroy() {
		if (this.eventsSubscription) this.eventsSubscription.unsubscribe();
		this.subscription.unsubscribe();
	}

	clearFilter(e: any): void {
		this.filters = {
			filetype: '',
			order: '',
			feedId: '',
			feedTitle: '',
			user: {
				dealer: '',
				host: '',
				advertiser: ''
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
		this.showWarningModal('warning', 'Delete Content', 'Are you sure you want to delete this content', '', 'delete', ids);
	}

	filterByUser(event: any): void {
		if (event.dealer.id && event.host.id && event.advertiser.id) {
			// by dealer, host, and advertiser
			this.filters.user.dealer = event.dealer.name;
			this.filters.user.host = event.host.name;
			this.filters.user.advertiser = event.advertiser.name;
			this.filters.user.dealer_label = event.dealer.id;
			this.filters.user.host_label = event.host.id;
			this.filters.user.advertiser_label = event.advertiser.id;
			this.can_reassign = false;
		} else if (event.dealer.id && event.host.id) {
			// by host
			this.filters.user.dealer = event.dealer.name;
			this.filters.user.host = event.host.name;
			this.filters.user.dealer_label = event.dealer.id;
			this.filters.user.host_label = event.host.id;
			this.can_reassign = false;
		} else if (event.dealer.id && event.advertiser.id) {
			// by advertiser
			this.filters.user.dealer = event.dealer.name;
			this.filters.user.advertiser = event.advertiser.name;
			this.filters.user.dealer_label = event.dealer.id;
			this.filters.user.advertiser_label = event.advertiser.id;
			this.can_reassign = false;
		} else {
			// by dealer
			this.filters.user.dealer = event.dealer.name;
			this.filters.user.dealer_label = event.dealer.id;
			this.can_reassign = true;
		}

		this.getPage(1);
	}

	getContents(): void {
		if (this.filters.filetype == '') {
			this.filters.filetype_label = '';
		}

		if (this.filters.order == '') {
			this.filters.order_label = '';
		}

		if (this.filters.user.dealer == '') {
			this.filters.user.dealer_label = '';
		}

		if (this.filters.user.host == '') {
			this.filters.user.host_label = '';
		}

		if (this.filters.user.advertiser == '') {
			this.filters.user.advertiser_label = '';
		}

		if (this.filters.feedId == '') {
			this.filters.feedTitle = '';
		}

		this.pageRequested(1, false);
	}

	getPage(page: number): void {
		this.filtered_content_data = [];
		this.pageRequested(page, true);
	}

	getFillers() {
		this.fillers = this._feed.get_fillers();
	}

	isDeleted(value: boolean): void {
		if (value) this.getPage(1);
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
		if (this.is_dealer && this.is_bulk_select && content.is_protected) return;

		const id = content.content_id;

		if (this.is_bulk_select) {
			if (!this.selected_content_ids.includes(id)) this.selected_content_ids.push(id);
			else this.selected_content_ids.splice(this.selected_content_ids.indexOf(id), 1);
			return;
		}

		this.openMediaViewer(content, this.filtered_content_data, index);
	}

	onSelectReassign(): void {
		const dealerId = this.filters.user.dealer_label;
		const dealerName = this.filters.user.dealer;
		const data = { dealerId, dealerName };
		const dialog = this._dialog.open(SelectOwnerComponent, { width: '500px', data });

		dialog.afterClosed().subscribe(
			(response: { dealer: { id; name }; host: { id; name }; advertiser: { id; name }; type: number }) => {
				if (typeof response === 'undefined' || !response) return;

				let toId = '';
				const { host, advertiser } = response;

				switch (response.type) {
					case 2:
						toId = host.id;
						break;
					case 3:
						toId = advertiser.id;
						break;
					default:
						toId = '0';
				}

				const data = { type: response.type, toId, contentIds: this.selected_content_ids };
				this.reassignContent(data);
			},
			(error) => {
				console.error(error);
			}
		);
	}

	openMediaViewer(content: UI_CONTENT, contents: UI_CONTENT[], i: number): void {
		const dialog = this._dialog.open(MediaViewerComponent, {
			panelClass: 'app-media-viewer-dialog',
			disableClose: true,
			data: {
				index: i,
				content_array: contents,
				selected: content
			}
		});

		dialog.componentInstance.is_view_only = this.is_view_only;

		dialog.afterClosed().subscribe((response) => {
			if (response !== false) {
				this.getPage(1);
			}
			// else {
			//     if (typeof response === 'boolean') {
			//         if (!response) return;
			//         return this.getPage(1);
			//     }

			// const data = response as UI_CONTENT;
			// const index = this.content_data.findIndex(
			//     content => {
			//         content.content_id === data.content_id
			//     }
			// );
			// this.content_data[index] = data;
			// }
		});
	}

	pageRequested(page: number, filter: boolean): void {
		this.no_search_result = false;
		this.searching = true;
		if (this.is_dealer) this.filters.user.dealer_label = this._auth.current_user_value.roleInfo.dealerId;

		const labels = {
			feedId: this.filters.feedId,
			feedTitle: this.filters.feedTitle,
			filetype: this.filters.filetype_label,
			order: this.filters.order_label,
			dealer: this.filters.user.dealer_label,
			host: this.filters.user.host_label,
			advertiser: this.filters.user.advertiser_label
		};

		this.subscription.add(
			this._content
				.get_contents_with_page(
					page,
					labels.filetype,
					labels.order,
					labels.dealer,
					labels.host,
					labels.advertiser,
					this.key,
					this.filters.feedId
				)
				.subscribe((data) => {
					this.searching = false;

					if (data.iContents && data.iContents.length > 0) {
						this.no_search_result = false;
						this.content_data = this.mapContentsToUI(data.iContents);
						this.filtered_content_data = this.content_data;
						if (!filter) this.no_content = false;
					} else {
						if (!filter && this.key == '') this.no_content = true;
						else this.no_search_result = true;
					}

					if (data.paging) this.paging_data = data.paging;
				})
		);
	}

	searchContent(keyword: string): void {
		this.no_refresh = false;
		this.clearFilter(false);

		if (keyword.length >= 3) {
			this.key = keyword;
			this.getContents();
		} else {
			this.key = '';
			this.no_search_result = false;
			this.getContents();
		}
	}

	filterByFiller(data: { feedId: string; feedTitle: string }) {
		this.filters.feedId = '';
		this.filters.feedTitle = '';

		if (data) {
			this.filters.feedId = data.feedId;
			this.filters.feedTitle = data.feedTitle;
			this.getPage(1);
		}
	}

	sortAscendingOrder(value: boolean): void {
		this.sort_order = value;
		this.filters.order = 'Ascending';
		this.filters.order_label = 'asc';
		if (value) this.getPage(1);
	}

	sortByFiletype(type: string): void {
		switch (type) {
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

	sortDescendingOrder(value: boolean): void {
		this.sort_order = value;
		this.filters.order = 'Descending';
		this.filters.order_label = 'desc';
		if (value) this.getPage(1);
	}

	private mapContentsToUI(data: API_CONTENT[]): UI_CONTENT[] {
		const media_content = data.map((m: API_CONTENT) => {
			let fileThumbnailUrl = '';

			if (m.fileType === 'webm' || m.fileType === 'mp4') fileThumbnailUrl = this.renameWebmThumb(m.fileName, m.url);
			else if (this._isImage.transform(m.fileType)) fileThumbnailUrl = `${m.url}${m.fileName}`;
			else fileThumbnailUrl = m.previewThumbnail || m.thumbnail;

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
				fileThumbnailUrl,
				m.isActive,
				m.isConverted,
				m.isProtected,
				m.uuid,
				m.title,
				'',
				m.createdByName,
				m.ownerRoleId,
				m.classification
			);
		});

		if (this.role_id === UI_ROLE_DEFINITION.dealer) {
			return media_content.filter((content) => this._auth.current_user_value.roleInfo.dealerId == content.dealer_id);
		} else {
			return media_content;
		}
	}

	private renameWebmThumb(filename: string, source: string) {
		return `${source}${filename.substr(0, filename.lastIndexOf('.') + 1)}jpg`;
	}

	private reassignContent(data: { type: number; toId: string; contentIds: string[] }): void {
		this.subscription.add(
			this._content.reassignContent(data).subscribe(
				() => {
					this.controlToggle({ checked: false });
					this.ngOnInit();
				},
				(error) => {
					console.error(error);
				}
			)
		);
	}

	private sendStatCardsData(): void {
		if (this.role_id === UI_ROLE_DEFINITION.dealer || this.role_id === UI_ROLE_DEFINITION['sub-dealer']) {
			this.subscription.add(
				this._content.get_contents_total_by_dealer(this._auth.current_user_value.roleInfo.dealerId).subscribe((data) => {
					this.stats = {
						all: data.total,
						videos: data.totalVideos,
						images: data.totalImages,
						feeds: data.totalFeeds
					};
					this.send_stats.emit(this.stats);
				})
			);
		} else {
			this.subscription.add(
				this._content.get_contents_total().subscribe((data) => {
					this.stats = {
						all: data.total,
						videos: data.totalVideos,
						images: data.totalImages,
						feeds: data.totalFeeds
					};
					this.send_stats.emit(this.stats);
				})
			);
		}
	}

	private showWarningModal(status: string, message: string, data: any, return_msg: string, action: string, array: any[]): void {
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

		dialogRef.afterClosed().subscribe((result) => {
			if (result == 'delete') {
				array = array.map((id) => {
					return { contentid: id };
				});

				this.subscription.add(
					this._content.remove_content(array).subscribe(() => {
						this._dialog.closeAll();
						this.is_bulk_select = false;
						this.getPage(1);
					})
				);
			}
		});
	}
}
