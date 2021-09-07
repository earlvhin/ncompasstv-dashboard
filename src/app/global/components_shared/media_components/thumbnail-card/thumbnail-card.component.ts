import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as io from 'socket.io-client';

import { UI_ROLE_DEFINITION } from '../../../../global/models';
import { AuthService, ContentService } from '../../../../global/services';
import { ConfirmationModalComponent } from '../../../components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-thumbnail-card',
	templateUrl: './thumbnail-card.component.html',
	styleUrls: ['./thumbnail-card.component.scss']
})

export class ThumbnailCardComponent implements OnInit {
	@Input() image_uri: string;
	@Input() classification: string;
	@Input() filename: string;
	@Input() content_id: string;
	@Input() is_converted: number;
	@Input() filetype: string;
	@Input() file_url: string;
	@Input() is_checked: boolean;
	@Input() uuid: string;
	@Input() dealer: string;
	@Input() zone_content: boolean;
	@Input() is_fullscreen: number;
	@Input() multiple_delete: boolean;
	@Input() disconnect_to_socket: boolean;
	@Input() sequence: number;
	@Output() converted: EventEmitter<boolean> = new EventEmitter();
	@Output() deleted: EventEmitter<boolean> = new EventEmitter();
	@Output() content_to_delete = new EventEmitter;

	fs_screenshot: string = `${environment.third_party.filestack_screenshot}`
	route: string;
	
	private return_mes: string;
	private role: string;
	
	protected _socket: any;
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _dialog: MatDialog,
		private _content: ContentService
	) { }

	ngOnInit() {
		this.role = Object.keys(UI_ROLE_DEFINITION).find(key => UI_ROLE_DEFINITION[key] === this._auth.current_user_value.role_id);
		this.route = `/${this.role}/media-library/${this.content_id}`;

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
		if (this._socket) this._socket.disconnect();
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}
	
	deleteContentArray(event: { checked: boolean }, content_id: string): void {
		if (event.checked) this.is_checked = true;
		this.content_to_delete.emit({ toadd: event.checked, id: content_id });
	}

	deleteMedia(event): void {
		this.warningModal('warning', 'Delete Content', 'Are you sure you want to delete this content?', this.return_mes, 'delete')
		event.stopPropagation();
	}
	
	private deleteContentLogs() {
		this.warningModal('warning', 'Delete Content Logs', 'Do you want to delete all the logs of this content','','delete-logs')
	}

	private warningModal(status: string, message: string, data: string, return_msg: string, action: string): void {
		this._dialog.closeAll();
		
		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data, return_msg, action }
		});
		
		dialogRef.afterClosed()
			.subscribe(
				result => {

					const filter = [{ 'contentid': this.content_id }];

					if (result == 'delete') {
						
						this._content.remove_content(filter).pipe(takeUntil(this._unsubscribe))
							.subscribe(
								data => {
									this.return_mes = data.message
									this.deleted.emit(true)
								},
								error => console.log('Error removing content', error)
							);
						
					}
				} 
			);
    }
}
