import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Subject } from 'rxjs';
import { API_CONTENT } from 'src/app/global/models/api_content.model';

import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { OptionsComponent } from '../options/options.component';

@Component({
	selector: 'app-playlist-content',
	templateUrl: './playlist-content.component.html',
	styleUrls: ['./playlist-content.component.scss']
})

export class PlaylistContentComponent implements OnInit {

	@Input() array_index: number;
	@Input() content: any;
	@Input() playlist_host_license: any;
	@Input() is_marking: boolean;
	@Input() is_list: boolean;
	@Input() dealer: string;
	@Input() schedule_status?: string;
	@Input() page? = '';
	@Input() total_contents? = 0;
	@Output() options_saved = new EventEmitter();
	@Output() reset_playlist_content = new EventEmitter();
	@Output() remove_playlist_content = new EventEmitter();

	contentTitle: string;
	frequency: number;
	isBaseFrequency = false;

	protected _unsubscribe: Subject<void> = new Subject();

	constructor(
		private _dialog: MatDialog,
	) { }

	ngOnInit() {
		if (this.content.fileType === 'webm') {
			this.content.thumbnail = `${this.content.url}${this.content.fileName.substr(0, this.content.fileName.lastIndexOf(".") + 1)}jpg`
		}

		if (this.playlist_host_license) {
			this.playlist_host_license = this.playlist_host_license.sort((a, b) => {
				return a.host.name.localeCompare(b.host.name)
			});
		}

		if (this.page === 'single-playlist') {
			this.isBaseFrequency = this.content.frequency === 22 || this.content.frequency === 33;
			this.frequency = this.setFrequency(this.content.frequency);
		}

		this.contentTitle = this.content.title;

		if (this.contentTitle.length >= 15) {
			this.contentTitle = `${this.contentTitle.substr(0, 12)}...`;
		}
	}

	optionsModal(): void {

		const data = {
			index: this.array_index,
			content: this.content,
			host_license: this.playlist_host_license,
			total_contents: this.total_contents			
		};

		const dialog = this._dialog.open(OptionsComponent, {
			data,
			width: '1200px',
			height: '750px'
		});

		dialog.afterClosed()
			.subscribe(
				response => {
					if (typeof response === 'undefined') return;
					if (typeof response === 'object') return this.options_saved.emit(response);
					return this.reset_playlist_content.emit(true); 
				}
			);
	}

	removeContentToPlaylistModal(id): void {

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: 'warning',
				message: `Remove Playlist Content - #${this.array_index}`,
				data: `Are you sure you want to remove content #${this.array_index} in this playlist?`
			}
		})

		dialog.afterClosed()
			.subscribe(
				response => {
					if (!response) return;
					this.remove_playlist_content.emit(id); 
				}
			);
	}

	removeFilenameHandle(file_name) {
		return file_name.substring(file_name.indexOf('_') + 1);
	}

	private setFrequency(value: number): number {

		let result: number;

		switch (value) {

			case 2:
			case 22:
				result = 2;
				break;

			case 3:
			case 33:
				result = 3;
				break;

			default:
				result = 0;
				
		}

		return result;

	}

}
