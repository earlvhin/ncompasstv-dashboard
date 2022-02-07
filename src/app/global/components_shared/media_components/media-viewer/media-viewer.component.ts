import { Component, OnInit, Inject, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { MatSlideToggleChange, MAT_DIALOG_DATA } from '@angular/material'
import { MatDialog } from '@angular/material/dialog';
import { VIDEO_FILETYPE, IMAGE_FILETYPE } from '../../../models/ui_filetype';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { MediaModalComponent } from '../../../components_shared/media_components/media-modal/media-modal.component';
import { AdvertiserService, AuthService, ContentService, HostService } from 'src/app/global/services';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service'
import { environment as env } from 'src/environments/environment';
import { UI_CONTENT, UI_ROLE_DEFINITION } from 'src/app/global/models';
@Component({
	selector: 'app-media-viewer',
	templateUrl: './media-viewer.component.html',
	styleUrls: ['./media-viewer.component.scss']
})

export class MediaViewerComponent implements OnInit, OnDestroy {

	@Output() deleted: EventEmitter<boolean> = new EventEmitter();
	@Input() is_view_only = false;
	@Input() page = 'media-library';

	// file_data: any;
	file_data: { content_array: UI_CONTENT[], index: number, selected: UI_CONTENT, is_advertiser?: boolean, zoneContent?: boolean };
    file_size_formatted: any;
	is_advertiser = false;
    is_edit = false;
	is_dealer = false;
	feed_demo_url = `${env.third_party.filestack_screenshot}/`;

	protected _unsubscribe = new Subject<void>();
	
	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _dealer: DealerService,
		private _advertiser: AdvertiserService,
		private _host: HostService,
		private _dialog: MatDialog,
		private _content: ContentService,
		private _auth: AuthService,
	) { }

	ngOnInit() {

		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];
		
		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
		}
		
		this.file_data = this._dialog_data;
		this.configureSelectedContent(this.file_data.selected);

		
		// for cycling through content within the media viewer
		this.file_data.content_array.map(
			(data, index) => {

				if (data.content_data) {
					data.content_data.index = index
					data = data.content_data
				} else {
					data.index = index; 
				}
				
			}
		);

	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	deleteMedia(event: { stopPropagation() }) {
		this.openWarningModal('warning', 'Delete Content', 'Are you sure you want to delete this content','','delete')
		event.stopPropagation();
	}

	fetchNextMedia(index: number) {
		this.file_data.selected = this.file_data.content_array[index + 1];
		if (this.file_data.selected.content_data) this.file_data.selected = this.file_data.selected.content_data;
		this.configureSelectedContent(this.file_data.selected);
	}

	fetchPrevMedia(index: number) {
		this.file_data.selected = this.file_data.content_array[index - 1];
		if (this.file_data.selected.content_data) this.file_data.selected = this.file_data.selected.content_data;
		this.configureSelectedContent(this.file_data.selected);
	}

	onSetContentAsFiller(event: MatSlideToggleChange) {
		const contentId = this.file_data.selected.content_id;

		this._content.update_content_to_filler({ contentId, isFiller: event.checked })
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {},
				error => console.log('Error updating content to filler', error)
			);
	}


	reassignMedia(e) {
		var temp = [];
		temp.push({'is_edit': true})
		temp.push({'id': this.file_data.selected.content_id})
		this.is_edit = true;
		let dialogRef = this._dialog.open(MediaModalComponent, {
			width: '600px',
			panelClass: 'app-media-modal',
			disableClose: true,
			data: temp,  
		})
	}
	
	private configureSelectedContent(selected: UI_CONTENT) {
		var datetime = new Date(selected.date_uploaded);
		var  time = datetime.getHours() + ':' + datetime.getMinutes() + " " + (datetime.getHours() < 12 ? 'AM' : 'PM' );
		this.file_data.selected.time_uploaded = time;
		this.file_size_formatted = this.getFileSize(selected.file_size);
		this.file_data.selected.index = selected.index;

		// File URL Base on Filetype
		if (selected.file_type in VIDEO_FILETYPE) {
			if (this.file_data.zoneContent) {
				this.file_data.selected.file_url = `${selected.file_url}`;
			} else {
				this.file_data.selected.file_url = `${env.s3}${selected.file_name}`;
			}
		} else if (selected.file_type in IMAGE_FILETYPE) {
			this.file_data.selected.file_url = selected.thumbnail;
		}	

		// Get Owners
		this.getOwner(selected);
	}

	private getAdvertiser(id: string) {
		this._advertiser.get_advertiser_by_id(id).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => this.file_data.selected.owner_name = data.name,
				error => console.log('Error retrieving advertiser by ID', error)
			);
	}

	private getDealer(id: string): void {
		this._dealer.get_dealer_by_id(id).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => this.file_data.selected.owner_name = data.businessName,
				error => console.log('Error retrieving dealer by id', error)
			);
	}

	private getFileSize(bytes: number, decimals = 2) {
		if (bytes === 0 || bytes === null) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}
	
	private getHost(id: string) {
		this._host.get_host_by_id(id).subscribe(
			data => this.file_data.selected.owner_name = data.host.name,
			error => console.log('Error retrieving host by ID', error)
		);
	}

	private getOwner(selected): void {
		if(selected.advertiser_id != "" && selected.advertiser_id != null) {
			selected.owner_type = 'Advertiser';
			this.getAdvertiser(selected.advertiser_id);
		} else if (selected.host_id != "" && selected.host_id != null) {
			selected.owner_type = 'Host';
			this.getHost(selected.host_id);
		} else if (selected.dealer_id != "" && selected.dealer_id != null) {
			selected.owner_type = 'Dealer';
			this.getDealer(selected.dealer_id);
		} else {
			selected.owner_type = 'Administrator';
			selected.owner_name = 'Administrator';
		}
	}

	private openWarningModal(status: string, message: string, data: string, return_msg: string, action: string) {
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

			if (result == 'delete') {

				const filter = [{ 'contentid': this.file_data.selected.content_id }];

				this._content.remove_content(filter).subscribe(
					() => this._dialog.closeAll(),
					error => console.log('Error removing content', error)
				);
			}

		});
	}

}
