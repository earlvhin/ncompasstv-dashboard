import { Component, OnInit, Input, Output, EventEmitter  } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdvertiserService } from '../../../../global/services/advertiser-service/advertiser.service';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { ContentService } from 'src/app/global/services/content-service/content.service';
import { DeletePlaylistComponent } from '../../../components_shared/playlist_components/delete-playlist/delete-playlist.component';
import { EditableFieldModalComponent } from '../../page_components/editable-field-modal/editable-field-modal.component';
import { EditFeedComponent } from '../../feed_components/edit-feed/edit-feed.component';
import { LicenseService } from '../../../../global/services/license-service/license.service';
import { MediaViewerComponent } from '../../../components_shared/media_components/media-viewer/media-viewer.component';
import { PlaylistService } from '../../../../global/services/playlist-service/playlist.service';
import { ScreenService } from '../../../../global/services/screen-service/screen.service';
import { UserService } from 'src/app/global/services/user-service/user.service';
import { HelperService } from 'src/app/global/services/helper-service/helper.service';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})

export class DataTableComponent implements OnInit {

	@Input() active_tab: string;
	@Input() advertiser_delete: boolean;
	@Input() ctrl_column_label: string;
	@Input() ctrl_column: boolean;
	@Input() ctrl_toggle: boolean;
	@Input() can_toggle_email_notifications = false;
	@Input() is_dealer: boolean;
	@Input() license_delete: boolean;
	@Input() license_status_column: boolean;
	@Input() multiple_delete: boolean;
	@Input() media_array: any;
	@Input() new_table: boolean;
	@Input() paging_details: any;
	@Input() playlist_delete: boolean;
	@Input() preview_column: boolean;
	@Input() preview_column_label: string;
	@Input() query_params: string;
	@Input() screen_delete: boolean;
	@Input() sort_column: string;
	@Input() sort_order: string;
	@Input() is_user_delete_enabled = false;
	@Input() table_columns: any;
	@Input() table_data: any;
	
	// Feed Controls
	@Input() feed_controls: boolean;
	@Input() feed_preview: boolean;
	@Input() feed_delete: boolean;
	@Input() feed_edit: boolean;
	@Output() delete_feed = new EventEmitter;
	@Output() edit_feed = new EventEmitter;

	@Output() delete_license = new EventEmitter;
	@Output() delete_screen = new EventEmitter;
	@Output() export_playlist = new EventEmitter;
	@Output() page_triggered = new EventEmitter;
	@Output() reload_page = new EventEmitter;
	@Output() toggle_triggered = new EventEmitter;
	@Output() update_info = new EventEmitter;
	@Output() delete_selected = new EventEmitter;
	@Output() to_sort_column = new EventEmitter;

	
	active_table: string;
	selected_array: any = [];
	pagination: number;
	selectAll: boolean = false;
	subscription: Subscription = new Subscription();

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _advertiser: AdvertiserService,
		private _content: ContentService,
		private _dialog: MatDialog,
		private _helper: HelperService,
		private _license: LicenseService,
		private _playlist: PlaylistService,
		private _screen: ScreenService,
		private _user: UserService,
	) { }

	ngOnInit() {

		this.table_data.map (
			data => {
				Object.keys(data).forEach(key => {
					if (data[key].table) {
						this.active_table = data[key].table;
					}
				});
			}
		);

		this.subscribeToEmailNotificationToggleResult();

	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	canDelete(userRole: string): boolean {

		const restrictedRoles = [
			'Administrator',
			'Super Admin',
			'Technical Support',
			'Dealer'
		];

		return !restrictedRoles.includes(userRole);

	}

	onPageChange(page: number): void {
		this.pagination = page;
		window.scrollTo(0, 0);
	}

	getPage(page: any): void {
		this.selected_array = [];
		this.page_triggered.emit(page);
		this.delete_selected.emit(this.selected_array);
		this.ngOnInit();
	}

	controlToggle(data, e) {
		const license_status = { id: data, status: e.checked }
		this.toggle_triggered.emit(license_status);
	}

	mediaViewer_open(i): void {
		//prepare data to comply to media viewer component (because json structure is not the same as media library)
		this.media_array[i].file_name === this.media_array.fileName;
		this.media_array.map(
			i => {
				i.file_name = i.fileName;
				i.file_type = i.fileType;
				i.created_by = i.createdBy;
				i.date_uploaded = i.dateCreated;
				i.file_size = i.filesize;
			}
		);

		const dialog = this._dialog.open(MediaViewerComponent, {
			panelClass: 'app-media-viewer-dialog',
			data: {
				index: i,
				content_array: this.media_array,
				selected: this.media_array[i],
			}
		});
	}
	
	feedPreview_open(i): void {
		let top = window.screen.height - 500;
		top = top > 0 ? top/2 : 0;		
		let left = window.screen.width - 800;
		left = left > 0 ? left/2 : 0;
		let uploadWin = window.open(i.link, "_blank", "width=800, height=500" + ",top=" + top + ",left=30%" + left);
		uploadWin.moveTo(left, top);
    	uploadWin.focus();
	}

	editFeed(e): void {
		let dialogRef = this._dialog.open(EditFeedComponent, { width: '600px', data: e });

		dialogRef.afterClosed().subscribe(
			() => this.reload_page.emit(true),
			error => console.log('Error on edit feed dialog', error)
		);
	}

	deleteFeed(id): void {
		this.warningModal('warning', 'Delete Feed', 'Are you sure you want to delete this feed?','','feed_delete', id)
	}

	deleteAdvertiser(id) {
		this._content.get_content_by_advertiser_id(id).subscribe(
			data => {
				this.warningModal('warning', 'Delete Advertiser', data.message ? 'Are you sure you want to delete this advertiser?' : 'This advertiser has assigned contents. If you wish to continue, the contents of the advertiser will be unassigned.','', data.message ? 'advertiser_delete' : 'advertiser_delete_force', id)
			}
		)
		
	}
	
	deleteScreen(id) {
		this.warningModal('warning', 'Delete Screen', 'Are you sure you want to delete this screen?','','screen_delete', id)
	}

	deletePlaylist(id): void {
		this._playlist.get_playlist_by_id(id).subscribe(
			data => {
				this.warningModal('warning', 'Delete Playlist', 'Are you sure you want to delete this playlist?','', data.screens.length ? 'playlist_delete' : 'playlist_delete_normal', id)
			},
			error => console.log('Error retrieving playlist by ID', error)
		);
	}

	exportPlaylist(data): void {
		this.export_playlist.emit(data)
	}

	deleteLicense(id): void {
		this.warningModal('warning', 'Delete License', 'Are you sure you want to delete this license','','license_delete', id)
	}

	warningModal(status, message, data, return_msg, action, id): void {
		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data, return_msg, action }
		});

		dialogRef.afterClosed().subscribe(result => {
			switch(result) {
				case 'screen_delete': 
					var array_to_delete = [];
					array_to_delete.push(id);
					this.postDeleteScreen(array_to_delete);
					break;
				case 'feed_delete':
					this.postDeleteFeed(id)
					break;
				case 'license_delete':
					var array_to_delete = [];
					array_to_delete.push(id);
					this.licenseDelete(array_to_delete);
					break;
				case 'playlist_delete':
					this.playlistDelete(id);
					break;
				case 'playlist_delete_normal':
					this.playlistDelete(id);
					break;
				case 'advertiser_delete':
					this.advertiserDelete(id, 0);
					break;
				case 'advertiser_delete_force':
					this.advertiserDelete(id, 1);
					break;
				case 'user_delete':
					this.deleteUser(id);
					break;
				default:
			}
		});
	}

	licenseDelete(data): void {
		this.subscription.add(
			this._license.delete_license(data).subscribe(
				() => this.update_info.emit(true), 
				error => console.log('Error deleting license', error)
			)
		);
	}

	advertiserDelete(id, force) {
		this.subscription.add(
			this._advertiser.remove_advertiser(id, force).subscribe(
				data => {
					this.update_info.emit(true);
				}, 
				error => {
					// console.log('error', error);
				}
			)
		)
	}

	playlistDelete(id) {
		this.subscription.add(
			this._playlist.remove_playlist(id, 0).subscribe(
				data => {
					if (!data.screens) {
						this.update_info.emit(true);
					} else {
						this.deletePlaylistModal({screens: data.screens, playlist_id: id});
					}
				}, 
				error => console.log('Error removing playlist', error)
			)
		);
	}

	postDeleteFeed(data): void {
		this.subscription.add(
			this._content.remove_content([{'contentid': data}]).subscribe(
				() => this.reload_page.emit(true), 
				error => console.log('Error removing content', error)
			)
		);
	}

	postDeleteScreen(data): void {
		this.subscription.add(
			this._screen.delete_screen(data).subscribe(
				() => this.update_info.emit(true), 
				error => console.log('Error deleting screen', error)
			)
		);
	}

	editField (fields: any, label: string, value: any): void {
		let width = '500px';
		const dialogParams: any = { 
			width, 
			data: { status: fields, message: label, data: value } 
		};
		if (fields.dropdown_edit) {
			dialogParams.height = '220px';
		}
		const dialog = this._dialog.open(EditableFieldModalComponent, dialogParams);
		const close = dialog.afterClosed().subscribe(
			(response: string) => {
				close.unsubscribe();
				if (!response || response === '--') return;

				switch (label) {
					case 'License Alias':
						this.subscription.add ( 
							this._license.update_alias({ licenseId: fields.id, alias: response }).subscribe(
								() => 
									this.openConfirmationModal('success', 'Success!', 'License Alias changed succesfully'), 
									error => console.log('Error updating license alias', error)
							)
						);
						break;
					case 'Install Date':
						this.subscription.add (
							this._license.update_install_date(fields.id, response).subscribe(
								() => 
									this.openConfirmationModal('success', 'Success!', 'License Installation Date Updated!'),
									error => console.log('Error updating license installation date ', error)
							)
						);
						break;
					case 'Screen Type':
						const filter_screen = { 
							screen: { 
								screentypeid: response, 
								screenid: fields.id, 
								screenname: fields.name 
							}
						}
						this.subscription.add (
							this._screen.edit_screen(filter_screen).subscribe(
								() => 
									this.openConfirmationModal('success', 'Success!', 'Screen Type changed succesfully'),
									error => console.log('Error editing screen', error)
							)
						);
					default:		
				}
			},
			error => console.log('Error on dialog after closing', error)
		);	
	}

	deletePlaylistModal(value) {
		let dialogRef = this._dialog.open(DeletePlaylistComponent, {
			width: '600px',
			panelClass: 'app-media-modal',
			data: value,
			disableClose: true,
		})

		dialogRef.afterClosed().subscribe(
			data => {
				if (data != false) {
					this.update_info.emit(true);
				}
			}
		)
	}

	openConfirmationModal(status, message, data): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  { status, message, data }
		})

		dialog.afterClosed().subscribe(() => this.update_info.emit(true));
	}

	onCheckboxSelect(id, event, data) {
		if(!event) {
			var index = this.selected_array.indexOf(id);
			if (index !== -1) {
				this.selected_array.splice(index, 1);
			}
		} else {
			this.selected_array.push(id);
		}
		this.delete_selected.emit(this.selected_array);
	}

	updateCheck(){
		if(this.selectAll === true){
			this.table_data.map(
				data => {
					if(!this.checkIfDisabled(data)) {
						data.checked=true;
						Object.keys(data).forEach(key => {
							if(data[key].key) {
								var d = data[key];
								this.selected_array.push(d.value)
							}
						})
					}
		  		}
			);
		}else {
			this.table_data.map(
				data => {
					data.checked=false;
					this.selected_array = [];
		  		}
			);
		}
		this.delete_selected.emit(this.selected_array);
	}

	checkIfDisabled(data){
		switch(this.active_table) {
			case 'license':
				if(data.pi_status.value == 1 || data.is_assigned.value) {
					return true;
				} else {
					return false;
				}
				break;
			default:
		}
	}

	sortByColumnName(column: string, order: string): void {

		const filter = {
			column: column,
			order: order
		};

		this.to_sort_column.emit(filter);
	}

	onDeleteUser(userId: string, email: string): void {
		this.warningModal('warning', 'Delete User', `Are you sure you want to delete ${email}?`,'','user_delete', userId);
	}

	onToggleEmailNotification(event: MouseEvent, tableDataIndex: number): void {
		event.preventDefault();
		const currentData: { allow_email: { value: string }, user_id: { value: string }, email: { value: string } } = this.table_data[tableDataIndex];
		const { allow_email, user_id, email } = currentData;
		const currentValue = allow_email.value;
		const userId = user_id.value;
		const currentEmail = email.value;
		this.table_data[tableDataIndex]['allow_email'].value = !currentValue;
		this._helper.onToggleEmailNotification.emit({ userId, value: !currentValue, tableDataIndex, currentEmail });
	}

	private deleteUser(userId: string): void {
	    
		this._user.deleteUser(userId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this._helper.onRefreshUsersPage.emit(),
				error => console.log('Error deleting user', error)
			);

	}

	private subscribeToEmailNotificationToggleResult(): void {

		this._helper.onResultToggleEmailNotification
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { tableDataIndex: number, updated: boolean }) => {
					
					const { updated, tableDataIndex } = response;

					if (updated) return;

					const currentValue = this.table_data[tableDataIndex]['allow_email'].value;
					this.table_data[tableDataIndex]['allow_email'].value = !currentValue;

				},
				error => console.log('Error on email notification toggle result subscription ', error)
			);
	}

	
}
