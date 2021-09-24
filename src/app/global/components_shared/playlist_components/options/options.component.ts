import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'
import { Subject } from 'rxjs';
import * as moment from 'moment';

import { API_CONTENT } from '../../../../global/models/api_content.model';
import { CREDITS, PLAYLIST_CHANGES } from '../../../../global/models';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { environment as env } from '../../../../../environments/environment';

@Component({
	selector: 'app-options',
	templateUrl: './options.component.html',
	styleUrls: ['./options.component.scss']
})

export class OptionsComponent implements OnInit {

	balance: number = null;
	blocklist_changes = { status: false };
	blacklist_ready: boolean = false;
    blacklist_count: number = 0;
	c_index: number;
	content_data: API_CONTENT;
	content_frequency: number;
    contents_list: any[] = [];
	credits: number = null;
	disable_animation = true;
	feed_demo_url = `${env.third_party.filestack_screenshot}/`
	has_schedule = false;
	host_license: any;
	is_base_frequency = false;
	initial_credits_status: number | boolean;
	licenses: any[] = [];
	feed_url = '';
	playlist_changes_data: PLAYLIST_CHANGES = { content: null, blocklist: null, original_credits: null };
    selected_data: any;
	schedule = { date: '', days: '', time: '' };
	timeout: any;
	toggle_all: boolean;
	toggle_event: Subject<void> = new Subject<void>();
	total_contents: number;
    total_whitelist: number = 0;
    total_licenses : number =0;
	unchanged_playlist: boolean = true;

	frequencyList = [ 
		{ label: '2x', value: 2 },
		{ label: '3x', value: 3 },
	];

	constructor(
		@Inject(MAT_DIALOG_DATA) public _dialog_data: { index: number, content: API_CONTENT, host_license: any, total_contents?: number, contents_list: any },
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<OptionsComponent>
	) { }
	
	ngOnInit() {
		const { index, content, host_license, total_contents } = this._dialog_data;
		this.playlist_changes_data.original_credits = content.playlistContentCredits;
		localStorage.setItem('playlist_data', JSON.stringify(content));
		this.c_index = index;
		this.content_data = content;
		this.content_frequency = this.setFrequency(content.frequency);
		this.credits = this.setCreditsAndBalance(content.playlistContentCredits);
		this.total_contents = total_contents;
		this.host_license = host_license;	
		if (this.isFeedContent()) this.setFeedUrl();
		this.setSchedule(this._dialog_data.content);
        this.getTotalLicenses();
		this.initial_credits_status = content.creditsEnabled;
		this.contents_list = this._dialog_data.contents_list;
        this.selected_data = this._dialog_data		this.is_base_frequency = content.frequency === 22 || content.frequency === 33;

		if (this.is_base_frequency) this.frequencyList.unshift({ label: '1x', value: 1 });
	}

    next() {
        this.c_index = this.c_index + 1;
        this.content_data = this.contents_list[this.c_index - 1];
        this.selected_data = {
            content: this.content_data,
            host_license: this.host_license
        }
        this.content_frequency = this.setFrequency(this.content_data.frequency);
		this.credits = this.setCreditsAndBalance(this.content_data.playlistContentCredits);
        this.unchanged_playlist = true;
    }

    prev() {
        this.c_index = this.c_index - 1;
        this.content_data = this.contents_list[this.c_index];
        this.content_frequency = this.setFrequency(this.content_data.frequency);
		this.credits = this.setCreditsAndBalance(this.content_data.playlistContentCredits);
        this.unchanged_playlist = true;
    }

	ngOnDestroy() {
		clearTimeout(this.timeout);
	}

	ngAfterContentInit (): void {
        this.timeout = setTimeout(() => this.disable_animation = false);
	}
    
	canEditCreditsField() {
		if (!this.playlist_changes_data.original_credits) return true;
		return this.playlist_changes_data.original_credits.balance === 0;
	}

	contentDataChanged() {
		if (JSON.stringify(this.content_data) === localStorage.getItem('playlist_data') && this.blocklist_changes.status == false) {
			this.unchanged_playlist = true;
		} else {
			this.playlist_changes_data.content = this.content_data;
			this.unchanged_playlist = false;
		}
	}
    
    getTotalLicenses() {
		this.host_license.forEach(host => {
			if (host.licenses.length > 0) {
				this.licenses = this.licenses.concat(host.licenses);
			}
		});

		this.total_licenses = this.licenses.length;
    }
	
    getCount(e) {
        this.blacklist_count = e;
        this.getWhitelistTotal();
    }

    getWhitelistTotal() {
        this.total_whitelist = this.total_licenses - this.blacklist_count;
    }

	onClose(): void {
		this._dialog_ref.close();
	}

	onInputCredits(): void {

		this.content_data.playlistContentCredits = {
			playlistContentId: this.content_data.playlistContentId,
			credits: this.credits,
			balance: this.credits,
			licenseId: this.host_license[0].licenses[0].licenseId
		};

		this.contentDataChanged();

	}

	onSave(): any {
		return this.playlist_changes_data;
	}

	onSelectFrequency(): void {
		this.content_data.frequency = this.content_frequency;
		this.contentDataChanged();
	}

	onToggleCredits(): void {
		this.contentDataChanged();

		const { creditsEnabled, playlistContentId } = this.content_data;
		const initialStatus = this.initial_credits_status;
		const enabled = creditsEnabled ? 1 : 0;
		const licenseId = this.host_license[0].licenses[0].licenseId;

		if (enabled !== initialStatus) this.playlist_changes_data.credits_status = { playlistContentId, licenseId, status: enabled };
		if (enabled === initialStatus && 'credits_status' in this.playlist_changes_data) delete this.playlist_changes_data.credits_status;

	}

	removeFilenameHandle(e) {
		return e.substring(e.indexOf('_') + 1);
	}

	setDuration() {
		this.content_data.duration = this.content_data.duration < 5 ? 5 : this.content_data.duration;
		this.contentDataChanged();
	}

	saveBlocklistChanges(e) {
		this.blocklist_changes = e;
		
		if (JSON.stringify(this.content_data) === localStorage.getItem('playlist_data') && this.blocklist_changes.status == false) {
			this.unchanged_playlist = true;
		} else {
			this.unchanged_playlist = false;
			this.playlist_changes_data.blocklist = this.blocklist_changes;
		}
	}

	toggleAll(event) {
		this.toggle_event.next(event.checked);
	}

	toggleFullscreen(e) {
		this.content_data.isFullScreen = e.checked == true ? 1 : 0;
		this.contentDataChanged();
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

	private setCreditsAndBalance(data: CREDITS) {
		
		if (!data) {
			this.balance = 0;
			return 0;
		}

		const { balance, credits } = data;
		this.balance = credits;
		return balance;

	}

	private setFrequency(value: number): number {
		if (value === 22) return 2;
		if (value === 33) return 3; 
		return value;
	}

	private isFeedContent(): boolean {
		if (this.content_data.fileType != 'feed') return false;
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
		const url = this.content_data.url;
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
