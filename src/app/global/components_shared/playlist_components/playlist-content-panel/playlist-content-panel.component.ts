import { Component, ElementRef, Input, OnInit, ViewChild, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { forkJoin, fromEvent, Observable, Subject } from 'rxjs';
import { Sortable } from 'sortablejs';
import * as moment from 'moment-timezone';

import { API_BLOCKLIST_CONTENT } from 'src/app/global/models/api_blocklist-content.model';
import { API_CONTENT } from 'src/app/global/models/api_content.model';
import { API_CONTENT_BLACKLISTED_CONTENTS } from '../../../../global/models/api_single-playlist.model';
import { API_UPDATED_PLAYLIST_CONTENT, API_UPDATE_PLAYLIST_CONTENT } from 'src/app/global/models/api_update-playlist-content.model';
import { BulkOptionsComponent } from '../bulk-options/bulk-options.component';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { ContentService } from 'src/app/global/services/content-service/content.service';
import { PlaylistContentSchedulingDialogComponent } from '../playlist-content-scheduling-dialog/playlist-content-scheduling-dialog.component';
import { PlaylistMediaComponent } from '../playlist-media/playlist-media.component';
import { PlaylistService } from '../../../../global/services/playlist-service/playlist.service';
import { ViewSchedulesComponent } from '../view-schedules/view-schedules.component';
import { ViewContentListComponent } from '../view-content-list/view-content-list.component';
@Component({
	selector: 'app-playlist-content-panel',
	templateUrl: './playlist-content-panel.component.html',
	styleUrls: ['./playlist-content-panel.component.scss']
})

export class PlaylistContentPanelComponent implements OnInit, OnDestroy {

	@ViewChild('draggables', { static: false }) draggables: ElementRef<HTMLCanvasElement>;
	@Input() dealer_id: string;
	@Input() page? = '';
	@Input() playlist_content: any[];
	@Input() playlist_id: string;
	@Input() playlist_host_license: any[];
	@Output() playlist_changes_saved = new EventEmitter;
	@Output() reload_playlist = new EventEmitter;
	@Output() reload_demo = new EventEmitter;
	@Output() playlist_demo = new EventEmitter;
	can_set_schedule = false;
	can_update_schedule = false;
	clickObservable: Observable<Event> = fromEvent(document,'click');
	contents_with_schedules: API_CONTENT[] = [];
	contents_without_schedules: API_CONTENT[] = [];
	button_click_event: string;
	has_selected_content_with_schedule = false;
	is_marking: boolean = false;
    list_view_mode: boolean = false;
	updated_playlist_content: API_UPDATED_PLAYLIST_CONTENT[];
	playlist_order: string[] = [];
	playlist_changes_data: any;
	playlist_unchanged: boolean = true;
	playlist_content_backup: any[];
	playlist_saving: boolean = false;
	selected_contents: string[];
	selected_content_count: number;
	structured_updated_playlist: any;
	structured_incoming_blocklist = [];
	structured_remove_in_blocklist = [];
	structured_bulk_remove_in_blocklist = [];
	feed_count: number;
	image_count: number;
	video_count: number;
	incoming_blacklist_licenses = [];
	search_control = new FormControl();
	bulk_toggle: boolean;

	private playlist_contents: API_CONTENT[] = [];
	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _content: ContentService,
		private _dialog: MatDialog,
		private _playlist: PlaylistService
	) { }

	ngOnInit() {
		this.getAssetCount();
		this.playlist_content_backup = this.playlist_content;
		this.playlist_saving = false;
		this.selected_contents = [];
		this.bulk_toggle = false;
		this.is_marking = false;

		this.search_control.valueChanges.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
					if (data !== '') {
						this.playlist_content = this.playlist_content_backup.filter(
							i => {
								if (i) {
									if (i.fileName) {
										return i.fileName.toLowerCase().includes(data.toLowerCase())
									} else {
										return i.title.toLowerCase().includes(data.toLowerCase())
									}
								}
							}
						)
					} else {
						this.playlist_content = this.playlist_content_backup;

						if (localStorage.getItem('playlist_order')) {
							this.rearrangePlaylistContents(localStorage.getItem('playlist_order').split(','))
						}
					}
				}
			);

		this.playlist_contents = this.playlist_content;

		this.contents_with_schedules = this.playlist_content.filter(content => {
			const schedule = content.playlistContentsSchedule;
			if (typeof schedule !== 'undefined' && schedule) return content; 
		});

		this.contents_without_schedules = this.playlist_content.filter(content => {
			const schedule = content.playlistContentsSchedule;
			if (typeof schedule === 'undefined' || !schedule) return content;
		});

		this.setScheduleStatus();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
        this._unsubscribe.complete();
	}

	ngAfterViewInit() {
		this.sortableJSInit();
	}

	isMarking(event: { checked: boolean }): void {

		this.is_marking = event.checked;

		if (this.is_marking == false) {
			this.selected_contents = [];
			this.can_set_schedule = false;
			this.can_update_schedule = false;
		}

	}

	openPlaylistDemo(): void {
		this.playlist_demo.emit(true);
	}

	addToBlocklist(data: any[]): void {

		if (data.length > 0) {

			this._playlist.blocklist_content(data).pipe(takeUntil(this._unsubscribe))
				.subscribe(
					() => {
						localStorage.removeItem('to_blocklist');
						this.structured_incoming_blocklist = [];

						if (this.structured_bulk_remove_in_blocklist.length > 0) {
							this.bulkWhitelist(this.structured_bulk_remove_in_blocklist);

						} else {

							if (this.structured_remove_in_blocklist.length > 0) {
								this.removeToBlocklist();

							} else if (this.incoming_blacklist_licenses.length > 0) {

								this.incoming_blacklist_licenses = [];
								this.getPlaylistById();

							} else {

								this.getPlaylistById();
								this.playlist_unchanged = true;

							}

						}
					}, 
					error => console.log('Error blocklisting content', error)
				);

		} else {

			if (this.structured_remove_in_blocklist.length > 0) {
				this.removeToBlocklist();
			}

		}
	}

	bulkContentRemove(): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: 'warning',
				message: `You are about to remove ${this.selected_contents.length} playlist contents`,
				data: `Are you sure you want to remove marked contents in this playlist?`
			}
		});

		dialog.afterClosed()
			.subscribe(
				data => {
					if (data) this.removePlaylistContents(this.selected_contents);
				},
				error => console.log('Error closing remove content dialog', error)
			);
	}

	bulkModify(): void {
		let content_data = [];
		
		this.playlist_content.filter(
			content => {
				if (this.selected_contents.includes(content.playlistContentId)) content_data.push(content);
			}
		);

		let bulk_option_dialog = this._dialog.open(BulkOptionsComponent, {
			data: {contents: content_data, host_licenses: this.playlist_host_license},
			width: '1024px',
			height: '760px'
		});

		bulk_option_dialog.afterClosed()
			.subscribe(
				data => {

					if (data) {
						data.content_props.forEach(c => {

							this.playlist_content.filter(content => {
								if (content.playlistContentId == c.playlistContentId) content = c;
							});

						});

						if (data.blacklist.length > 0) {
							this.incoming_blacklist_licenses = data.blacklist;
							this.structureBulkBlacklisting(data.content_props);
						}

						if (data.whitelist.length > 0) {
							this.structured_bulk_remove_in_blocklist = data.whitelist;
						}

						this.savePlaylistChanges(this.structureUpdatedPlaylist());

					} else {
						this.getPlaylistById();
					}

				}
			);

	}

	selectAllContents(): void {
		this.playlist_content.forEach(i => this.selected_contents.push(i.playlistContentId));
		this.can_set_schedule = true;
	}

	getAssetCount(): void {

		this.video_count = this.playlist_content.filter(
			i => {
				return i.fileType === 'webm';
			}
		).length;

		this.image_count = this.playlist_content.filter(
			i => {
				return i.fileType !== 'webm' && i.fileType != 'feed';
			}
		).length;

		this.feed_count = this.playlist_content.filter(
			i => {
				return i.fileType === 'feed';
			}
		).length;

	}

	getPlaylistById(): void {
		this.reload_playlist.emit(true);	
	}

	hasSelectedContent(playlistContentId: string): boolean {
		return this.selected_contents.includes(playlistContentId);
	}

	mapIncomingContent(data: any[]): any[] {
		return data.map(
			i => {
				return {
					content: i,
					blacklistedContents: []
				}
			}
		);
	}

	onSetSchedule(): void {
		this.showContentScheduleDialog();
	}

	onViewContentList(): void {
		// this.showViewContentListDialog();
        this.list_view_mode = !this.list_view_mode;
	}

	onViewSchedule(): void {
		this.showViewSchedulesDialog();
	}

	optionsSaved(e: any): void {
		let frequencyUpdate = null;
		this.playlist_changes_data = e;

		if (e.content && (e.content.frequency === 2 || e.content.frequency === 3)) {
			const { frequency, playlistContentId } = e.content;
			frequencyUpdate = { frequency, playlistContentId, playlistId: this.playlist_id };
		}

		if (this.playlist_changes_data.content) {

			this.playlist_content.forEach(
				i => {
					if (i.playlistContentId == e.playlistContentId) i = e;
				}
			);
			
			this.structured_updated_playlist = this.structureUpdatedPlaylist();
		}

		this.structured_incoming_blocklist = this.playlist_changes_data.blocklist && this.playlist_changes_data.blocklist.incoming.length > 0 ? this.playlist_changes_data.blocklist.incoming : [];
		this.structured_remove_in_blocklist = this.playlist_changes_data.blocklist && this.playlist_changes_data.blocklist.removing.length > 0 ? this.playlist_changes_data.blocklist.removing : [];

		this.savePlaylistChanges(this.structured_updated_playlist, frequencyUpdate);
	}

	openPlaylistMedia(): void {

		const data = {
			playlist_host_license: this.playlist_host_license,
			dealer_id: this.dealer_id
		};

		const playlist_content_dialog = this._dialog.open(PlaylistMediaComponent, {
			data: data,
			width: '1100px'
		});

		playlist_content_dialog.afterClosed()
			.subscribe(
				data => {
					if (data) {
						if (localStorage.getItem('to_blocklist')) {
							this.incoming_blacklist_licenses = localStorage.getItem('to_blocklist').split(',');
							this.structureAddedPlaylistContent(data);
						} else {
							this.structureAddedPlaylistContent(data);
						}
					} else {
						localStorage.removeItem('to_blocklist');
					}
				},
				error => console.log('Error closing playlist content dialog', error)
			);
	}

	rearrangePlaylistContents(incoming_order): void {
		const updated_playlist_content_order = [];
		
		// Rearrange Playlist Content
		incoming_order.forEach(
			i => {
				updated_playlist_content_order.push(this.searchPlaylistContent(i));
			}
		);

		if (JSON.stringify(this.playlist_content_backup) != JSON.stringify(updated_playlist_content_order)) {
			this.playlist_content = updated_playlist_content_order;
			this.playlist_unchanged = false;
		} else {
			this.playlist_content = this.playlist_content_backup;
			this.playlist_unchanged = true;
		}
	}
	
	removeToBlocklist(): void {

		if (this.structured_remove_in_blocklist.length > 0) {

			this._playlist.remove_in_blocklist(this.structured_remove_in_blocklist).pipe(takeUntil(this._unsubscribe))
				.subscribe(
					() => {
						this.getPlaylistById();
						this.playlist_unchanged = true;
						this.structured_remove_in_blocklist = [];
					},
					error => console.log('Error removing in blocklist', error)
				);

		}

	}

	reloadPlaylist(): void {
		this.getPlaylistById();
	}

	removePlaylistContent(data: any): void {
		this.playlist_saving = true;

		this._playlist.remove_playlist_content(this.playlist_id, data).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.getPlaylistById(),
				error => console.log('Error removing playlist content', error)
			);

	}

	removePlaylistContents(data: any): void {
		this.playlist_saving = true;

		this._playlist.remove_playlist_contents(this.playlist_id, data).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.getPlaylistById(),
				error => console.log('Error removing playlist contents', error)
			);

	}

	sortableJSInit(): void {

		const onDeselect = (e) => {
			this.selected_content_count = e.newIndicies.length

			setTimeout(() => {
				if (this.button_click_event == "edit-marked" || this.button_click_event == "delete-marked") {
					console.log('Valid');
				} else {
					this.selected_contents = [];
				}
			}, 0);
		}

		const onSelect = (e) => {
			this.selected_content_count = e.newIndicies.length;
		}

		const set = (sortable) => {
			this.rearrangePlaylistContents(sortable.toArray());
			localStorage.setItem('playlist_order', sortable.toArray());
		}

		const onStart = () => {
			if (this.playlist_content.length < this.playlist_content_backup.length) {
				this.playlist_content = this.playlist_content_backup;
			}

			if (localStorage.getItem('playlist_order')) {
				this.rearrangePlaylistContents(localStorage.getItem('playlist_order').split(','));
			}
		}

		const onEnd = () => {
			this.search_control.setValue('');
		}
		
		new Sortable(this.draggables.nativeElement, {
			swapThreshold: 1,
			sort: true,
			animation: 500,
			ghostClass: 'dragging',
			scrollSensitivity: 200,
			multiDrag: true,
			selectedClass: 'selected',
			fallbackOnBody: true,
			forceFallback: true,
			group: 'playlist_content',
			fallbackTolerance: 10,
			store: { set },
			onSelect,
			onDeselect,
			onStart,
			onEnd
		});
	}

	selectedContent(id: string): void {
		
		if (!this.selected_contents.includes(id)) {
			this.selected_contents.push(id)
		} else {
			this.selected_contents = this.selected_contents.filter(i => i !== id)
		}
		
		if (this.selected_contents.length === 0) {
			this.can_set_schedule = false;
			return;
		}

		if (this.bulk_toggle) {
			const contents = this.selected_contents;			
			if (contents.length >= 1) this.can_set_schedule = true;
		}

	}

	structureAddedContentBlocklist(data: any[]): void {
		let to_block = [];
		data.map(i => this.incoming_blacklist_licenses.map(j => to_block.push(new API_BLOCKLIST_CONTENT(j, i.contentId, i.playlistContentId))));
		this.addToBlocklist(to_block);
	}

	structureBulkBlacklisting(data: any[]): void {
		let to_block = [];
		data.map(i => this.incoming_blacklist_licenses.map(j => to_block.push(new API_BLOCKLIST_CONTENT(j, i.contentId, i.playlistContentId))));
		this.addToBlocklist(to_block);
	}

	savePlaylistChanges(data: any, frequencyUpdate?: { frequency: number, playlistContentId: string, playlistId: string }): void {
		this.playlist_saving = true;
		this.is_marking = false;

		if (data) {

			this._playlist.update_playlist_contents(data).pipe(takeUntil(this._unsubscribe))
				.subscribe(
					async (data: any) => {

						if (frequencyUpdate) {
							const { frequency, playlistContentId, playlistId } = frequencyUpdate;
							await this._content.set_frequency(frequency, playlistContentId, playlistId).toPromise();
						}

						localStorage.removeItem('playlist_order');
						localStorage.removeItem('playlist_data');
						this.playlist_content_backup = this.playlist_content;

						if (this.incoming_blacklist_licenses.length > 0) {
							this.structureAddedContentBlocklist(data.playlistContentsAdded);
						} else if (this.structured_bulk_remove_in_blocklist.length > 0) {
							this.bulkWhitelist(this.structured_bulk_remove_in_blocklist);
						} else {
							this.getPlaylistById();
						}
						
						if (this.structured_incoming_blocklist.length > 0) {
							this.addToBlocklist(this.structured_incoming_blocklist);
						} else {
							this.removeToBlocklist();
						}

					},
					error => console.log('Error updating playlist contents', error)
				);

		} else {

			if (this.structured_incoming_blocklist.length > 0) {
				this.addToBlocklist(this.structured_incoming_blocklist);
			} else {
				this.removeToBlocklist();
			}
		}

		this.search_control.setValue('');
	}

	bulkWhitelist(data: any[]): void {

		this._playlist.bulk_whitelist(data).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.getPlaylistById();
					this.playlist_unchanged = true;
					this.structured_bulk_remove_in_blocklist = [];
				}, 
				error => console.log('Error whitelisting by bulk', error)
			);

	}

	structureAddedPlaylistContent(incoming_playlist_content: API_CONTENT_BLACKLISTED_CONTENTS[]): void {
		this.playlist_content = incoming_playlist_content.concat(this.playlist_content);
		this.savePlaylistChanges(this.structureUpdatedPlaylist());
	}

	searchPlaylistContent(id: string): any {
		return this.playlist_content.filter(
			content => {
				return id == content.playlistContentId;
			}
		)[0];
	}

	saveOrderChanges(): void {
		this.savePlaylistChanges(this.structureUpdatedPlaylist());
	}

	structureUpdatedPlaylist(): API_UPDATE_PLAYLIST_CONTENT {

		let index = 1;

		let updated_playlist = this.playlist_content.map(
			i => {
				return new API_UPDATED_PLAYLIST_CONTENT(
					i.contentId,
					i.isFullScreen,
					index++,
					i.duration > 0 ? i.duration : 20,
					i.playlistContentId,
				)
			}
		);

		return this.structurePlaylistUpdatePayload(updated_playlist);

	}

	structurePlaylistUpdatePayload(updated_playlist_content): API_UPDATE_PLAYLIST_CONTENT {
		return new API_UPDATE_PLAYLIST_CONTENT(this.playlist_id, updated_playlist_content);
	}

	private setScheduleStatus(): void {
		this.playlist_contents = this.playlist_contents.map(content => {
			let status = 'inactive';

			if (content.playlistContentsSchedule) {
				const schedule = content.playlistContentsSchedule ? content.playlistContentsSchedule : null
				const currentDate = moment();
				const startDate = moment(schedule.from);
				const endDate = moment(schedule.to);
				if (currentDate.isBefore(startDate)) status = 'future';
				if (currentDate.isBetween(startDate, endDate, undefined, '[]') || schedule.type === 1) status = 'active';
			}

			content.scheduleStatus = status;
			return content;
		});
	}

	private showContentScheduleDialog(): void {

		let content: any;
		let message = 'Success!';
		let mode = 'create';
		let schedules: { id: string, content_id: string }[] = [];
		const content_ids: string[] = []

		if (this.selected_contents.length === 1) mode = 'update';

		if (mode === 'update') {
			const selectedForUpdateId = this.selected_contents[0];
			content = this.contents_with_schedules.filter(content => content.playlistContentId === selectedForUpdateId)[0];
		}

		if (!content) mode = 'create';

		this.selected_contents.forEach(id => {

			this.playlist_contents.forEach(content => {

				if (content.playlistContentId === id) {

					if (!content.playlistContentsSchedule) {
						content_ids.push(id);
					} else {
						const schedule = { 
							id: content.playlistContentsSchedule.playlistContentsScheduleId, 
							content_id: content.playlistContentId
						};
						schedules.push(schedule);
					};

				}

			});

		});

		const dialog = this._dialog.open(PlaylistContentSchedulingDialogComponent, {
			width: '950px',
			height: '470px',
			panelClass: 'position-relative',
			data: { mode, content_ids, content, schedules },
			autoFocus: false
		});

		dialog.afterClosed()
			.subscribe(
				(response: string | boolean) => {

					if (typeof response === 'string') {
						if (response === 'create') message += ' Schedule has been created';
						else message += ' Schedule has been updated'
						this.showSuccessDialog(message);
					}

				},
				error => console.log('Error after closing content schedule dialog', error)
			);

	}

	private showSuccessDialog(message: string): void {

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  { status: 'success', message }
		});	

		dialog.afterClosed()
			.subscribe(
				() => this.getPlaylistById(),
				error => console.log('Error on success dialog close', error)
			);
	}

	private showViewContentListDialog(): void {

		const width = '1180px';
		const contents = this.playlist_contents;

		this._dialog.open(ViewContentListComponent, {
			width,
			panelClass: 'position-relative',
			data: { contents },
			autoFocus: false
		});

	}

	private showViewSchedulesDialog(): void {

		const width = '1180px';
		const contents = this.playlist_contents;

		this._dialog.open(ViewSchedulesComponent, {
			width,
			panelClass: 'position-relative',
			data: { contents },
			autoFocus: false
		});

	}

}
