import { Component, OnInit, Inject, Output, EventEmitter, Input } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material'
import { environment } from '../../../../../environments/environment';
import { VIDEO_FILETYPE, IMAGE_FILETYPE } from '../../../models/ui_filetype';
import { Subscription } from 'rxjs';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { AdvertiserService } from 'src/app/global/services/advertiser-service/advertiser.service';
import { HostService } from 'src/app/global/services/host-service/host.service';
import { UserService } from 'src/app/global/services/user-service/user.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ContentService } from '../../../services/content-service/content.service';
import { MediaModalComponent } from '../../../components_shared/media_components/media-modal/media-modal.component';
import { UI_ROLE_DEFINITION } from '../../../models/ui_role-definition.model';
import { AuthService } from '../../../services/auth-service/auth.service';
import { environment as env } from '../../../../../environments/environment';
@Component({
	selector: 'app-media-viewer',
	templateUrl: './media-viewer.component.html',
	styleUrls: ['./media-viewer.component.scss']
})

export class MediaViewerComponent implements OnInit {

	@Output() deleted: EventEmitter<boolean> = new EventEmitter();
	@Input() is_view_only = false;

	file_data: any;
    file_size_formatted: any;
	subscription: Subscription = new Subscription;
	is_advertiser = false;
    is_edit = false;
	is_dealer = false;
	feed_demo_url = `${env.third_party.filestack_screenshot}/`
	
	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _dealer: DealerService,
		private _advertiser: AdvertiserService,
		private _host: HostService,
		private _user: UserService,
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
		this.setSettings(this.file_data.selected);
		
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

	getOwner(selected): void {
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

	getDealer(id): void {
		this.subscription.add(
			this._dealer.get_dealer_by_id(id).subscribe(
				(data: any) => {
					this.file_data.selected.owner_name = data.businessName;
				}
			)
		);
	}

	getAdvertiser(id) {
		this.subscription.add(
			this._advertiser.get_advertiser_by_id(id).subscribe(
				(data: any) => {
					this.file_data.selected.owner_name = data.name;
				}
			)
		)
	}
	
	getHost(id) {
		this.subscription.add(
			this._host.get_host_by_id(id).subscribe(
				(data: any) => {
					this.file_data.selected.owner_name = data.host.name;
				}
			)
		)
	}

	removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}

	getFileSize(bytes, decimals = 2) {
		if (bytes === 0 || bytes === null) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}

	getCreatedBy(id) {
		this.subscription.add(
			this._user.get_user_by_id(id).subscribe(
				(data: any) => {
					if (data.firstName && data.lastName) {
						this.file_data.selected.created_by = data.firstName + " " + data.lastName;
					}
				}
			)
		)
	}

	setSettings(selected) {
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
				this.file_data.selected.file_url = `${environment.s3}${selected.file_name}`;
			}
		} else if (selected.file_type in IMAGE_FILETYPE) {
			this.file_data.selected.file_url = selected.thumbnail;
		}	

		// Get Owners
		this.getOwner(selected);
	}

	fetchNextMedia(i) {
		this.file_data.selected = this.file_data.content_array[i+1];
		if(this.file_data.selected.content_data) {
			this.file_data.selected = this.file_data.selected.content_data
		} else {}
		this.setSettings(this.file_data.selected);
	}

	fetchPrevMedia(i) {
		this.file_data.selected = this.file_data.content_array[i-1];
		if(this.file_data.selected.content_data) {
			this.file_data.selected = this.file_data.selected.content_data
		} else {}
		this.setSettings(this.file_data.selected);
	}

	deleteMedia(e) {
		this.warningModal('warning', 'Delete Content', 'Are you sure you want to delete this content','','delete')
		e.stopPropagation();
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
	
	deleteContentLogs() {
		this.warningModal('warning', 'Delete Content Logs', 'Do you want to delete all the logs of this content','','delete-logs')
	}

	warningModal(status, message, data, return_msg, action) {
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
				var filter = [{
					'contentid': this.file_data.selected.content_id
				}]
				
				this.subscription.add(
					this._content.remove_content(filter).subscribe(
						data => {
							this._dialog.closeAll();
						}
					)
				)
			}
		});
	}
}
