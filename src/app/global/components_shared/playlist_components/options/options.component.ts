import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'
import { Subject } from 'rxjs';
import * as moment from 'moment';

import { API_CONTENT } from 'src/app/global/models/api_content.model';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-options',
	templateUrl: './options.component.html',
	styleUrls: ['./options.component.scss']
})

export class OptionsComponent implements OnInit {

	blocklist_changes = { status: false };
	content_data: any;
	disable_animation = true;
	feed_url = '';
	has_schedule = false;
	playlist_changes_data = { content: null, blocklist: null };
	schedule = { date: '', days: '', time: '' };
	timeout: any;
	toggle_all: boolean;
	toggleEvent: Subject<void> = new Subject<void>();
	unchanged_playlist: boolean = true;

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: { content: API_CONTENT },
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<OptionsComponent>
	) { }
	
	ngOnInit() {
		localStorage.setItem('playlist_data', JSON.stringify(this._dialog_data.content));
		this.content_data = this._dialog_data;
		console.log('#matdialog', this._dialog_data.content);
		if (this.isFeedContent()) this.setFeedUrl();
		this.setSchedule(this._dialog_data.content);
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

	private setDays(data: string): string {

		const sum = data.split(',').reduce((a, b) => {
			const result = parseInt(a) + parseInt(b);
			return `${result}`;
		});

		if (data === '1,2,3,4,5,6,7' || sum === '28') return 'Everyday';

		const result = [];

		const daysArr = data.split(',');

		daysArr.forEach(numeric => {

			switch (numeric) {
				case '1':
					result.push('Mon');
					break;
				case '2':
					result.push('Tue');
					break;
				case '3':
					result.push('Wed');
					break;
				case '4':
					result.push('Thu');
					break;
				case '5':
					result.push('Fri');
					break;
				case '6':
					result.push('Sat');
					break;
				default:
					result.push('Sun');
			}

		});

		return result.join(', ');

	}

	private setFeedUrl(): void {
		const url = this.content_data.content.url;
		if (url && url.length > 60) this.feed_url = `${url.substr(0, 57)}...`;
		else this.feed_url = url;
	}

	private setSchedule(content: API_CONTENT): void {

		if (!content.playlistContentsSchedule) return;

		let { from, to, days, playTimeStart, playTimeEnd, type } = content.playlistContentsSchedule;


		switch (type) {
			case 2:
				const NO_PLAY = 'Do Not Play';
				this.schedule.date = NO_PLAY;
				this.schedule.days = NO_PLAY;
				this.schedule.time = NO_PLAY;
				break;

			case 3:
				this.schedule.date = `${moment(from).format('MMM DD, YYYY')} - ${moment(to).format('MMM DD, YYYY')}`;
				this.schedule.days = this.setDays(days);
				this.schedule.time = (playTimeStart == '12:00 AM' && playTimeEnd == '11:59 PM') ? 'All Day' : `${playTimeStart} - ${playTimeEnd}`;
				break;

			default:
				const DEFAULT = 'Default';
				this.schedule.date = DEFAULT;
				this.schedule.days = DEFAULT;
				this.schedule.time = DEFAULT;

		}

		this.has_schedule = true;		

	}
}
