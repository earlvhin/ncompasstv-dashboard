import { AfterContentChecked, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import * as moment from 'moment';

import { environment as env } from 'src/environments/environment';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { API_CONTENT, API_BLOCKLIST_CONTENT, CREDITS, PLAYLIST_CHANGES, API_LICENSE } from 'src/app/global/models';
import { AuthService } from 'src/app/global/services';
@Component({
	selector: 'app-options',
	templateUrl: './options.component.html',
	styleUrls: ['./options.component.scss']
})
export class OptionsComponent implements OnInit, OnDestroy, AfterContentChecked {
	balance: number = null;
	blocklist_changes = { status: false };
	blacklist_ready = false;
	blacklist_count = 0;
	blacklisted_content: API_BLOCKLIST_CONTENT[] = [];
	can_toggle_credits = true;
	c_index: number;
	content_data: API_CONTENT;
	content_frequency: number;
	contents_list: any[] = [];
	credits: number = null;
	current_role = this._auth.current_role;
	disable_animation = true;
	feed_demo_url = `${env.third_party.filestack_screenshot}/`;
	feed_url = '';
	frequencyList = [
		{ label: '2x', value: 2 },
		{ label: '3x', value: 3 }
	];
	has_schedule = false;
	host_license: any;
	is_base_frequency = false;
	is_child_frequency = false;
	is_paging = false;
	is_livestream = false;
	initial_credits_status: number | boolean;
	licenses: API_LICENSE['license'][] = [];
	license_ids_for_credits: string[] = [];
	media_content_base_url = this.setMediaContentBaseUrl();
	playlist_changes_data: PLAYLIST_CHANGES = { content: null, blocklist: null, credits: null, credits_status: null };
	selected_data: any;
	schedule = { date: '', days: '', time: '' };
	timeout: any;
	toggle_all: boolean;
	toggle_event: Subject<void> = new Subject<void>();
	total_contents: number;
	total_whitelist = 0;
	total_licenses = 0;
	unchanged_playlist = true;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA)
		public _dialog_data: { index: number; content: API_CONTENT; host_license: any; total_contents?: number; contents_list: any },
		private _auth: AuthService,
		private _change_detector: ChangeDetectorRef,
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<OptionsComponent>
	) {}

	ngOnInit() {
		const { index, content, host_license, total_contents } = this._dialog_data;
		this.playlist_changes_data.credits = content.playlistContentCredits;
		localStorage.setItem('playlist_data', JSON.stringify(content));
		this.c_index = index;
		this.content_data = content;
		this.isLiveStream(this.content_data);
		this.content_frequency = this.setFrequency(content.frequency);
		this.credits = this.setCreditsAndBalance(content.playlistContentCredits);
		this.total_contents = total_contents;
		this.host_license = host_license;
		if (this.isFeedContent()) this.setFeedUrl();
		this.setSchedule(this._dialog_data.content);
		this.getTotalLicenses();
		this.initial_credits_status = content.creditsEnabled;
		this.contents_list = this._dialog_data.contents_list;
		this.selected_data = this._dialog_data;
		this.is_base_frequency = content.frequency === 22 || content.frequency === 33;
		this.is_child_frequency = content.frequency === 2 || content.frequency === 3;
		if (this.is_base_frequency) this.frequencyList.unshift({ label: '1x', value: 1 });
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
		clearTimeout(this.timeout);
	}

	ngAfterContentInit(): void {
		this.timeout = setTimeout(() => (this.disable_animation = false));
	}

	ngAfterContentChecked() {
		this._change_detector.detectChanges();
	}

	isLiveStream(data) {
		if (data.classification === 'live_stream') {
			this.is_livestream = true;
		} else {
			this.is_livestream = false;
		}
	}

	next() {
		this.is_paging = true;
		this.c_index = this.c_index + 1;
		this.content_data = this.contents_list[this.c_index - 1];
		this.selected_data = {
			content: this.content_data,
			host_license: this.host_license
		};
		this.content_frequency = this.setFrequency(this.content_data.frequency);
		this.credits = this.setCreditsAndBalance(this.content_data.playlistContentCredits);
		this.unchanged_playlist = true;

		setTimeout(() => {
			this.is_paging = false;
		}, 0);
	}

	prev() {
		this.is_paging = true;
		this.c_index = this.c_index - 1;
		this.content_data = this.contents_list[this.c_index - 1];
		this.selected_data = {
			content: this.content_data,
			host_license: this.host_license
		};
		this.content_frequency = this.setFrequency(this.content_data.frequency);
		this.credits = this.setCreditsAndBalance(this.content_data.playlistContentCredits);
		this.unchanged_playlist = true;

		setTimeout(() => {
			this.is_paging = false;
		}, 0);
	}

	canEditCreditsField() {
		const { credits } = this.playlist_changes_data;
		if (credits.length <= 0) return true;
		const sum = credits.map((credit) => credit.balance).reduce((previous, current) => previous + current);
		return sum === 0;
	}

	blackListDataLoaded(data: API_BLOCKLIST_CONTENT[]): void {
		this.blacklisted_content = data;
		this.blacklist_ready = true;
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
		this.host_license.forEach((host) => {
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
		this.contentDataChanged();
	}

	onSave() {
		this.setCreditsDataForSubmission();
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
		this.contentDataChanged();
	}

	removeFilenameHandle(e) {
		return e.substring(e.indexOf('_') + 1);
	}

	setDuration() {
		this.content_data.duration = this.content_data.duration < 5 ? 5 : this.content_data.duration;
		this.contentDataChanged();
	}

	saveBlocklistChanges(data: { incoming: API_BLOCKLIST_CONTENT[]; removing: API_BLOCKLIST_CONTENT[]; status: boolean }) {
		this.blocklist_changes = data;

		if (JSON.stringify(this.content_data) === localStorage.getItem('playlist_data') && this.blocklist_changes.status == false) {
			this.unchanged_playlist = true;
		} else {
			this.unchanged_playlist = false;
			this.playlist_changes_data.blocklist = this.blocklist_changes;
		}

		this.setCreditsDataForSubmission('toggle_license');
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
			});

			dialogRef.afterClosed().subscribe((data) => {
				if (data) {
					if (this.unchanged_playlist) {
						this._dialog_ref.close();
					} else {
						this._dialog_ref.close(true);
					}
				}
			});
		} else {
			this._dialog_ref.close();
		}
	}

	private setCreditsAndBalance(data: CREDITS[]) {
		if (!data || data.length <= 0) {
			this.balance = 0;
			return 0;
		}

		const balance = data.map((credit) => credit.balance).reduce((previous, current) => previous + current);
		const credits = data.map((credit) => credit.credits).reduce((previous, current) => previous + current);
		this.balance = credits;
		return balance;
	}

	private setCreditsDataForSubmission(from = null): void {
		const dataToSubmit = this.playlist_changes_data;

		if (!dataToSubmit.credits_status || dataToSubmit.credits_status.status === 0) {
			this.playlist_changes_data.credits_to_submit = null;
			return;
		}

		let licenseIds = [...this.licenses].map((license) => license.licenseId);
		let result: string[] = [];
		let incoming = [];

		const { playlistContentId } = this.content_data;

		if (this.playlist_changes_data.blocklist) {
			const { blocklist } = this.playlist_changes_data;
			incoming = blocklist.incoming;
		}

		const blackListedLicenseIds: string[] = this.blacklisted_content.map((content) => content.licenseId);
		const toRemove = blackListedLicenseIds.concat(incoming.map((content) => content.licenseId));

		result = licenseIds.filter((id) => !toRemove.includes(id));

		if (result.length <= 0) {
			this.playlist_changes_data.credits_to_submit = null;
			this.content_data.creditsEnabled = 0;

			if (from === 'toggle_license') this.can_toggle_credits = false;

			return;
		}

		if (from === 'toggle_license') this.can_toggle_credits = true;

		this.playlist_changes_data.credits_to_submit = {
			playlistContentId,
			credits: this.credits,
			licenses: result
		};
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
		if (data === '0,1,2,3,4,5,6') return 'Everyday';

		const result = [];

		const daysArr = data.split(',');

		daysArr.forEach((numeric) => {
			switch (numeric) {
				case '0':
					result.push('Sun');
					break;
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
			}
		});

		return result.join(', ');
	}

	private setFeedUrl(): void {
		const url = this.content_data.url;
		if (url && url.length > 60) this.feed_url = `${url.substring(0, 57)}...`;
		else this.feed_url = url;
	}

	private setMediaContentBaseUrl() {
		let role = this.current_role;
		if (role === 'dealeradmin') role = 'administrator';
		return `${role}/media-library`;
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
				this.schedule.time = playTimeStart == '12:00 AM' && playTimeEnd == '11:59 PM' ? 'All Day' : `${playTimeStart} - ${playTimeEnd}`;
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
