import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'
import { Subject } from 'rxjs';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-options',
	templateUrl: './options.component.html',
	styleUrls: ['./options.component.scss']
})

export class OptionsComponent implements OnInit {

	blocklist_changes: any = {
		status: false
	};
	content_data: any;
	disable_animation = true;
	feed_url = '';
	playlist_changes_data: any = {
		content: null,
		blocklist: null
	};
	unchanged_playlist: boolean = true;
	timeout: any;
	toggle_all: boolean;
	toggleEvent: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: any,
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<OptionsComponent>
	) { 
		localStorage.setItem('playlist_data', JSON.stringify(this._dialog_data.content));
	}

	ngOnInit() {
		this.content_data = this._dialog_data;
		console.log('#matdialog', this._dialog_data.content);
		if (this.isFeedContent()) this.setFeedUrl();
	}

	ngOnDestroy() {
		clearTimeout(this.timeout);
	}

	ngAfterViewInit(): void {
		this.timeout = setTimeout(() => this.disable_animation = false);
	}

	hasWhiteListed(e) {
		setTimeout(() => {
			console.log('#hasWhiteListed', e);
			this.toggle_all = e;
		}, 100)
	}

	onClose(): void {
		this._dialog_ref.close();
	}

	toggleFullscreen(e) {
		this.content_data.content.isFullScreen = e.checked == true ? 1 : 0;
		this.contentDataChanged();
	}

	setDuration() {
		this.content_data.content.duration = this.content_data.content.duration < 5 ? 5 : this.content_data.content.duration;
		this.contentDataChanged();
	}

	contentDataChanged() {
		if (JSON.stringify(this.content_data.content) === localStorage.getItem('playlist_data') && this.blocklist_changes.status == false) {
			this.unchanged_playlist = true;
		} else {
			this.playlist_changes_data.content = this.content_data.content;
			this.unchanged_playlist = false;
		}
	}

	removeFilenameHandle(e) {
		return e.substring(e.indexOf('_') + 1);
	}

	saveBlocklistChanges(e) {
		console.log('#saveBlocklistChanges', e);
		this.blocklist_changes = e;
		
		if (JSON.stringify(this.content_data.content) === localStorage.getItem('playlist_data') && this.blocklist_changes.status == false) {
			this.unchanged_playlist = true;
		} else {
			this.unchanged_playlist = false;
			this.playlist_changes_data.blocklist = this.blocklist_changes;
		}
	}

	undoChanges() {
		if (!this.unchanged_playlist) {
			let dialogRef = this._dialog.open(ConfirmationModalComponent, {
				width: '500px',
				height: '350px',
				data: {
					status: 'warning',
					message: 'Unsaved Changes',
					data: 'Your changes to this content will be ignored'
				}
			})
	
			dialogRef.afterClosed().subscribe(
				data => {
					if (data) {
						console.log('#undoChanges', data);
						if (this.unchanged_playlist) {
							this._dialog_ref.close();
						} else {
							this._dialog_ref.close(true);
						}
					}
				}
			)
		} else {
			this._dialog_ref.close();
		}
	}

	toggleAll(e) {
		this.toggleEvent.next(e.checked)
	}

	private isFeedContent(): boolean {
		if (this.content_data.content.fileType != 'feed') return false;
		return true;
	}

	private setFeedUrl(): void {
		const url = this.content_data.content.url;
		if (url && url.length > 60) this.feed_url = `${url.substr(0, 57)}...`;
		else this.feed_url = url;
	}
}
