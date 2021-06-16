import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Observable, Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { UI_ROLE_DEFINITION } from 'src/app/global/models/ui_role-definition.model';
import * as io from 'socket.io-client';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { ContentService } from '../../../services/content-service/content.service';

@Component({
	selector: 'app-thumbnail-card',
	templateUrl: './thumbnail-card.component.html',
	styleUrls: ['./thumbnail-card.component.scss']
})

export class ThumbnailCardComponent implements OnInit {
	@Input() image_uri: string;
	@Input() filename: string;
	@Input() content_id: string;
	@Input() is_converted: number;
	@Input() filetype: string;
	@Input() is_checked: boolean;
	@Input() uuid: string;
	@Input() dealer: string;
	@Input() zone_content: boolean;
	@Input() is_fullscreen: number;
	@Input() multiple_delete: boolean;
	@Input() disconnect_to_socket: boolean;
	@Output() converted: EventEmitter<boolean> = new EventEmitter();
	@Output() deleted: EventEmitter<boolean> = new EventEmitter();
	@Output() content_to_delete = new EventEmitter;

	subscription: Subscription = new Subscription;
	role: string;
	route: string;
	return_mes: string;
	
	_socket: any;

	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _content: ContentService
	) { 
		
	}

	ngOnInit() {
		this.role = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this.route = `/${this.role}/media-library/`

		if (!this.disconnect_to_socket && this.filetype == 'webm' && this.is_converted == 0) {
			this._socket = io(environment.socket_server, {
				transports: ['websocket'],
				query: 'client=Dashboard__ThumbnailCardComponent',
			});

			this._socket.on('connect', () => {
				console.log('#ThumbnailCardComponent - Connected to Socket Server');
			})

			this._socket.on('disconnect', () => {
				console.log('#ThumbnailCardComponent - Disconnnected to Socket Server');
			})

			this._socket.on('video_converted', data => {
				if (data == this.uuid) {
					this.is_converted = 1;
					this.converted.emit(true)
				}
			})
		}
	}

	ngOnDestroy() {
		if (this._socket) {
			this._socket.disconnect();
		}
	}
	
	removeFilenameHandle(e) {
		// if (this.filetype !== 'feed') {
		// 	return e.substring(e.indexOf('_') + 1);
		// }
		return e;
	}

	deleteContentArray(e, y) {
		if(e.checked) {
			this.is_checked = true;
		}
		this.content_to_delete.emit({toadd: e.checked, id: y});
	}

	deleteMedia(e) {
		this.warningModal('warning', 'Delete Content', 'Are you sure you want to delete this content?', this.return_mes, 'delete')
		e.stopPropagation();
	}
	
	deleteContentLogs() {
		this.warningModal('warning', 'Delete Content Logs', 'Do you want to delete all the logs of this content','','delete-logs')
	}

	warningModal(status, message, data, return_msg, action) {
		this._dialog.closeAll();
		
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
			var filter = [{
				'contentid': this.content_id
			}]
			if(result == 'delete') {
				this.subscription.add(
					this._content.remove_content(filter).subscribe(
						data => {
							this.return_mes = data.message
							this.deleted.emit(true)
						}
					)
				)
				
			} else {}
		} );
	}
}
