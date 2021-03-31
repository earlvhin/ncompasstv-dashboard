import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { API_CONTENT_BLACKLISTED_CONTENTS } from '../../../../global/models/api_single-playlist.model';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { OptionsComponent } from '../options/options.component';

@Component({
	selector: 'app-playlist-content',
	templateUrl: './playlist-content.component.html',
	styleUrls: ['./playlist-content.component.scss']
})

export class PlaylistContentComponent implements OnInit {

	@Input() array_index: number;
	@Input() content: API_CONTENT_BLACKLISTED_CONTENTS;
	@Input() playlist_host_license: any;
	@Input() is_marking: boolean;
	@Input() dealer: string;
	@Input() schedule_status?: string;
	@Output() options_saved = new EventEmitter();
	@Output() reset_playlist_content = new EventEmitter();
	@Output() remove_playlist_content = new EventEmitter();
	subscription: Subscription = new Subscription();

	constructor(
		private _dialog: MatDialog,
	) { }

	ngOnInit() {
		if (this.playlist_host_license) {
			this.playlist_host_license = this.playlist_host_license.sort((a, b) => {
				return a.host.name.localeCompare(b.host.name)
			})
		}
	}

	optionsModal() {
		let content_data = {
			index: this.array_index,
			content: this.content.content,
			blocklist: this.content.blacklistedContents,
			host_license: this.playlist_host_license
		} 

		let option_dialog = this._dialog.open(OptionsComponent, {
			data: content_data,
			width: '1024px',
			height: '750px'
		})

		this.subscription.add(
			option_dialog.afterClosed()
			.pipe(finalize(() => console.log('Ended')))
			.subscribe(
				data => {
					console.log('#optionsModal', data)
					if (data !== undefined && data !== true) {
						this.options_saved.emit(data);
					} else if (data === true){
						this.reset_playlist_content.emit(true)
					}
				}
			)
		)
	}

	removeContentToPlaylistModal(id) {
		let delete_dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: 'warning',
				message: `Remove Playlist Content - #${this.array_index}`,
				data: `Are you sure you want to remove content #${this.array_index} in this playlist?`
			}
		})

		delete_dialog.afterClosed().subscribe(
			data => {
				console.log('#removeContentPlaylist', data);
				if (data) {
					this.remove_playlist_content.emit(id);
				}
			}
		)
	}

	removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}
}
