import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { ContentService } from 'src/app/global/services/content-service/content.service';
import { API_CONTENT } from 'src/app/global/models/api_content.model';
import { UI_CONTENT } from 'src/app/global/models/ui_content.model';
import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { MatDialog } from '@angular/material/dialog';
import { Socket } from 'ngx-socket-io'
import { environment } from '../../../../../environments/environment';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';

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
	private eventsSubscription: Subscription;

	content_data: UI_CONTENT[];
	feed_data: UI_CONTENT[];
	filter_data: any;
	filtered_content_data: UI_CONTENT[];
	role_id: string;
	sort_order: boolean;
	subscription = new Subscription;
	type_filter_data: any;
	user_filtered_data: any;
	no_content: boolean;
	stats : any;
	paging_data: any;
	// pages: any;
	key: string = "";
	is_dealer: boolean = false;
	enable_multiple_delete: boolean = false;
	searching: boolean = false;
	empty_search: boolean = false;

	no_refresh: boolean = false;
	temp: any = [];

	filters: any = {
		filetype: "",
		order: "",
		user: {
			dealer: "",
			host: "",
			advertiser: ""
		}
	}

	no_search_result: boolean = false;

	constructor(
		private _auth: AuthService,
		private _content: ContentService,
		private _dialog: MatDialog,
	) { }

	ngOnInit() {
		this.role_id = this._auth.current_user_value.role_id;
		if (this.role_id === UI_ROLE_DEFINITION.dealer) {
			this.is_dealer = true;
		}
		this.reload.subscribe(
			i =>  {
				// this.clearFilter(true);
				// this.searchContent("")
				this.empty_search = true;
				this.sendStatCardsData();
			}
		);
		this.getContents();
		// this.clearFilter(true);
		this.sendStatCardsData();
	}

	ngOnDestroy() {
		if (this.eventsSubscription) {
			this.eventsSubscription.unsubscribe();
		}
		this.subscription.unsubscribe();
	}

	// Clear Filter
	clearFilter(e) {
		console.log("upload done 1")
		this.filters = {
			filetype: "",
			order: "",
			user: {
				dealer: "",
				host: "",
				advertiser: "",
			}
		}
		console.log(this.no_refresh,e)
		if(!this.no_refresh && e) {
			console.log("upload done 2")
			this.getContents();
		}
	}

	// Get All Media Files
	getContents() {
		if(this.filters.filetype == "") {
			this.filters.filetype_label ="";
		}
		if(this.filters.order == "") {
			this.filters.order_label = "";
		}
		if(this.filters.user.dealer == "") {
			this.filters.user.dealer_label = "";
		}
		if(this.filters.user.host == "") {
			this.filters.user.host_label = "";
		}
		if(this.filters.user.advertiser == "") {
			this.filters.user.advertiser_label = "";
		}
		this.pageRequested(1, false);
	}

	controlToggle(e) {
		this.enable_multiple_delete = e.checked;
	}

	multipleDelete(e) {
		if(e.toadd) {
			this.temp.push(e.id)
		} else {
			var index = this.temp.indexOf(e.id);
			if (index !== -1) {
				this.temp.splice(index, 1);
			}
		}
		// this.temp.push(e);
		console.log("temp", this.temp)
		this.checkChecking(e.id);
	}

	deleteMultiple() {
		this.warningModal('warning', 'Delete Content', 'Are you sure you want to delete this content','','delete', this.temp);
	}

	checkChecking(id) {
		var index = this.temp.indexOf(id);
		// console.log("INDEX", index)
		if (index !== -1) {
			return true;
		} else {
			return false;
		}
	}

	pageRequested(page, filter) {
		console.log("FILTERS", this.filters)
		this.no_search_result = false;
		this.searching = true;
		if(this.is_dealer) {
			this.filters.user.dealer_label = this._auth.current_user_value.roleInfo.dealerId;
		}
		this.subscription.add(
			this._content.get_contents_with_page(page, this.filters.filetype_label, this.filters.order_label, this.filters.user.dealer_label, this.filters.user.host_label, this.filters.user.advertiser_label, this.key).subscribe(
				data => {
					this.searching = false;
					if (data.iContents && data.iContents.length > 0) {
						this.no_search_result = false;
						this.content_data = this.media_mapToUI(data.iContents);
						this.filtered_content_data = this.content_data;
						if(!filter) {
							this.no_content = false;
						}
					} else {
						if(!filter && this.key == "") {
							this.no_content = true;

						} else {
							this.no_search_result = true;
						}
						
					}

					if (data.paging) {
						this.paging_data = data.paging;
						// this.pages = Array(this.paging_data.pages)
					}

					console.log("PD 1", this.paging_data)
				}
			)
		)
	}

	ngOnChanges() {
		// if(this.paging_data) {
		// 	this.paginate(this.paging_data.page, this.paging_data.pages)
		// }
	}

	getPage(e) {
		this.filtered_content_data = [];
		this.pageRequested(e, true)
	}

	isDeleted(e) {
		if(e) {
			// this.ngOnInit();
			this.getPage(1);
		}
	}

	// Structure Stat Cards Data and Send to Parent
	sendStatCardsData() {
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
			)
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
			)
		}
	}

	// Map Media FIles Data to UI
	media_mapToUI(data: API_CONTENT[]): UI_CONTENT[] {
		let dealer_content;
		let media_content = data.map(
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
					m.createdByName
				)
			}
		)

		if (this.role_id === UI_ROLE_DEFINITION.dealer) {
			return media_content.filter(
				m => {
					return this._auth.current_user_value.roleInfo.dealerId == m.dealer_id
				}
			)
		} else {
			return media_content;
		}
	}

	// Sort By Order Ascending
	sortAscendingOrder(e) {
		this.sort_order = e;
		this.filters.order = 'Ascending'
		this.filters.order_label = 'asc'

		if (e) {
			this.getPage(1);
		}
	}

	// Sort By Order Descending
	sortDescendingOrder(e) {
		this.sort_order = e;
		this.filters.order = 'Descending'
		this.filters.order_label = 'desc'
		if (e) {
			this.getPage(1)
		}
	}

	// Sort By Filetype Dropdown
	sortByFiletype(e) {
		if (e === 'image') {
			this.filters.filetype = 'Images';
			this.filters.filetype_label = 'image';
			this.getPage(1)
		} else if(e === 'video'){
			this.filters.filetype = 'Videos';
			this.filters.filetype_label = 'video';
			this.getPage(1)
		} else {
			this.filters.filetype = 'Feeds';
			this.filters.filetype_label = 'feed';
			this.getPage(1)
		}
	}
	
	// Filter By User Modal Trigger
	filterByUser(e) {
		if (e.dealer.id && e.host.id && e.advertiser.id) {
			this.filters.user.dealer = e.dealer.name;
			this.filters.user.host = e.host.name;
			this.filters.user.advertiser = e.advertiser.name;
			
			this.filters.user.dealer_label =e.dealer.id;
			this.filters.user.host_label =e.host.id;
			this.filters.user.advertiser_label =e.advertiser.id;
			this.getPage(1)
		} else if (e.dealer.id && e.host.id) {
			this.filters.user.dealer = e.dealer.name;
			this.filters.user.host = e.host.name;
			this.filters.user.dealer_label =e.dealer.id;
			this.filters.user.host_label =e.host.id;
			this.getPage(1)
		} else if (e.dealer.id && e.advertiser.id) {
			this.filters.user.dealer = e.dealer.name;
			this.filters.user.advertiser = e.advertiser.name;
			this.filters.user.dealer_label =e.dealer.id;
			this.filters.user.advertiser_label =e.advertiser.id;
			this.getPage(1)
		} else {
			this.filters.user.dealer = e.dealer.name;
			this.filters.user.dealer_label =e.dealer.id;
			this.getPage(1)
		}
	}

	// Search Content Field
	searchContent(e) {
		console.log("E", e)
		this.no_refresh = false;
		this.clearFilter(false);
		if(e.length >= 3) {
			this.key = e;
			this.getContents();
		} else {
			this.key = "";
			this.no_search_result = false;
			this.getContents();
		}
		
	}

	// Media File Viewer
	mediaViewer_open(a, content, i) {
		let dialog = this._dialog.open(MediaViewerComponent, {
			panelClass: 'app-media-viewer-dialog',
			data: {
				index: i,
				content_array: content,
				selected: a,
			}
		})

		dialog.afterClosed().subscribe(result => {
			this.ngOnInit();
		});
	}

	warningModal(status, message, data, return_msg, action, arr) {
		let dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: status,
				message: message,
				data: data,
				return_msg: return_msg,
				action: action
			}
		})

		dialogRef.afterClosed().subscribe(result => {
			if(result == 'delete') {
				arr = arr.map(
					i => {
						return {'contentid':i};
					}
				)

				this.subscription.add(
					this._content.remove_content(arr).subscribe(
						data => {
							this._dialog.closeAll();
							this.enable_multiple_delete = false;
							this.getPage(1);
						}
					)
				)
			}
		});
	}
}
