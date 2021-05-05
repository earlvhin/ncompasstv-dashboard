import { Component, ElementRef, Input, OnInit, ViewChild, EventEmitter, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs/internal/Subscription';
import { fromEvent, Observable } from 'rxjs';
import { Sortable } from "sortablejs";
import * as moment from 'moment-timezone';

import { API_BLOCKLIST_CONTENT } from 'src/app/global/models/api_blocklist-content.model';
import { API_CONTENT } from 'src/app/global/models/api_content.model';
import { API_CONTENT_BLACKLISTED_CONTENTS } from '../../../../global/models/api_single-playlist.model';
import { API_UPDATED_PLAYLIST_CONTENT, API_UPDATE_PLAYLIST_CONTENT } from 'src/app/global/models/api_update-playlist-content.model';
import { BulkOptionsComponent } from '../bulk-options/bulk-options.component';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
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

export class PlaylistContentPanelComponent implements OnInit {

	@ViewChild('draggables', { static: false }) draggables: ElementRef<HTMLCanvasElement>;
	@Input() dealer_id: string;
	@Input() playlist_content: API_CONTENT_BLACKLISTED_CONTENTS[];
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
	subscription: Subscription = new Subscription();
	updated_playlist_content: API_UPDATED_PLAYLIST_CONTENT[];
	playlist_order: string[] = [];
	playlist_changes_data: any;
	playlist_unchanged: boolean = true;
	playlist_content_backup: API_CONTENT_BLACKLISTED_CONTENTS[];
	playlist_saving: boolean = false;
	selected_contents: string[];
	selected_content_count: number;
	structured_updated_playlist: any;
	structured_incoming_blocklist = [];
	structured_remove_in_blocklist = [];
	feed_count: number;
	image_count: number;
	video_count: number;
	incoming_blacklist_licenses = [];
	search_control = new FormControl();
	bulk_toggle: boolean;

	private playlist_contents: API_CONTENT[] = [];
	
	constructor(
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
		
		if (localStorage.getItem('playlist_order')) {
			console.log('Has Existing Order');
			this.rearrangePlaylistContents(localStorage.getItem('playlist_order').split(','))
		}

		this.search_control.valueChanges.subscribe(
			data => {
				if (data !== '') {
					this.playlist_content = this.playlist_content_backup.filter(
						i => {
							if (i.content) {
								if (i.content.fileName) {
									return i.content.fileName.toLowerCase().includes(data.toLowerCase())
								} else {
									return i.content.title.toLowerCase().includes(data.toLowerCase())
								}
							}
						}
					)
				} else {
					this.playlist_content = this.playlist_content_backup;
					if (localStorage.getItem('playlist_order')) {
						console.log('Has Existing Order');
						this.rearrangePlaylistContents(localStorage.getItem('playlist_order').split(','))
					}
				}
			}
		);

		this.playlist_contents = this.playlist_content.map(content => content.content);
		const contents = this.playlist_contents;

		this.contents_with_schedules = contents.filter(content => {
			const schedule = content.playlistContentsSchedule;
			if (typeof schedule !== 'undefined' && schedule) return content; 
		});

		this.contents_without_schedules = contents.filter(content => {
			const schedule = content.playlistContentsSchedule;
			if (typeof schedule === 'undefined' || !schedule) return content;
		});

		this.setScheduleStatus();
	}

	ngAfterViewInit() {
		this.sortableJSInit();
	}

	isMarking(e) {
		this.is_marking = e.checked;

		if (this.is_marking == false) {
			this.selected_contents = [];
			this.can_set_schedule = false;
			this.can_update_schedule = false;
		}

	}

	openPlaylistDemo() {
		this.playlist_demo.emit(true)
	}

	addToBlocklist(data) {
		console.log('#ADDTOBLOCKLIST', data)
		if (data.length > 0) {
			this.subscription.add(
				this._playlist.blocklist_content(data).subscribe(
					data => {
						console.log('#addToBlocklist_result', data);
						localStorage.removeItem('to_blocklist');
						this.structured_incoming_blocklist = [];
						if (this.structured_remove_in_blocklist.length > 0) {
							console.log('has structured_remove_in_blocklist')
							this.removeToBlocklist();
						} else if (this.incoming_blacklist_licenses.length > 0) {
							console.log('has incoming_blacklist_licenses')
							this.incoming_blacklist_licenses = [];
							this.getPlaylistById();
						} else {
							console.log('no incoming_blacklist_licenses')
							this.getPlaylistById();
							this.playlist_unchanged = true;
						}
					}, 
					error => {
						console.log('#addToBlocklist', error)
					}
				)
			)
		} else {
			if (this.structured_remove_in_blocklist.length > 0) {
				console.log('1')
				this.removeToBlocklist();
			}
		}
	}

	bulkContentRemove() {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width:'500px',
			height: '350px',
			data:  {
				status: 'warning',
				message: `You are about to remove ${this.selected_contents.length} playlist contents`,
				data: `Are you sure you want to remove marked contents in this playlist?`
			}
		});

		const close = dialog.afterClosed().subscribe(
			data => {
				close.unsubscribe();
				console.log('#removeContentPlaylist', data);
				if (data) {
					this.removePlaylistContents(this.selected_contents);
				}
			}
		);
	}

	bulkModify() {
		let content_data = []
		
		this.playlist_content.filter(
			i => {
				if (this.selected_contents.includes(i.content.playlistContentId)) {
					content_data.push(i)
				}
			}
		)

		let bulk_option_dialog = this._dialog.open(BulkOptionsComponent, {
			data: {contents: content_data, host_licenses: this.playlist_host_license},
			width: '1024px',
			height: '760px'
		})

		bulk_option_dialog.afterClosed().subscribe(
			data => {
				console.log(data);

				if (data) {
					data.content_props.forEach(c => {
						this.playlist_content.filter(i => {
							if (i.content.playlistContentId == c.content.playlistContentId) {
								i = c;
							}
						})
					});

					if (data.blacklist.length > 0) {
						this.incoming_blacklist_licenses = data.blacklist
						this.structureBulkBlacklisting(data.content_props)
					}

					if (data.whitelist.length > 0) {
						data.whitelist.map(
							i => {
								this.structured_remove_in_blocklist.push(
									{
										blacklistedContentId: i
									}
								)
							}
						)
					}

					this.savePlaylistChanges(this.structureUpdatedPlaylist());
				} else {
					this.getPlaylistById();
				}
			}
		)
	}

	selectAllContents(): void {
		this.playlist_content.forEach(i => this.selected_contents.push(i.content.playlistContentId));
		this.can_set_schedule = true;
	}

	getAssetCount() {
		this.video_count = this.playlist_content.filter(
			i => {
				return i.content.fileType === 'webm';
			}
		).length;

		this.image_count = this.playlist_content.filter(
			i => {
				return i.content.fileType !== 'webm' && i.content.fileType != 'feed';
			}
		).length;

		this.feed_count = this.playlist_content.filter(
			i => {
				return i.content.fileType === 'feed';
			}
		).length;
	}

	getPlaylistById() {
		console.log('#getPlaylistById Triggered <<<===================================================')
		this.reload_playlist.emit(true);	
	}

	hasSelectedContent(playlistContentId: string): boolean {
		return this.selected_contents.includes(playlistContentId);
	}

	mapIncomingContent(data) {
		return data.map(
			i => {
				return {
					content: i,
					blacklistedContents: []
				}
			}
		)
	}

	onSetSchedule(): void {
		this.showContentScheduleDialog();
	}

	onViewContentList(): void {
		this.showViewContentListDialog();
	}

	onViewSchedule(): void {
		this.showViewSchedulesDialog();
	}

	optionsSaved(e) {
		console.log('#optionsSaved', e);
		this.playlist_changes_data = e;

		if (this.playlist_changes_data.content) {
			this.playlist_content.forEach(
				i => {
					if (i.content.playlistContentId == e.playlistContentId) {
						i.content = e;
					}
				}
			)
			
			this.structured_updated_playlist = this.structureUpdatedPlaylist();
		}

		this.structured_incoming_blocklist = this.playlist_changes_data.blocklist && this.playlist_changes_data.blocklist.incoming.length > 0 ? this.playlist_changes_data.blocklist.incoming : [];
		this.structured_remove_in_blocklist = this.playlist_changes_data.blocklist && this.playlist_changes_data.blocklist.removing.length > 0 ? this.playlist_changes_data.blocklist.removing : [];

		this.savePlaylistChanges(this.structured_updated_playlist);
	}

	openPlaylistMedia() {
		const data = {
			playlist_host_license: this.playlist_host_license,
			dealer_id: this.dealer_id
		}

		let playlist_content_dialog = this._dialog.open(PlaylistMediaComponent, {
			data: data,
			width: '1100px'
		});

		playlist_content_dialog.afterClosed().subscribe(
			data => {
				if (data) {
					console.log('#openPlaylistMedia_afterClosed', data);
					if (localStorage.getItem('to_blocklist')) {
						this.incoming_blacklist_licenses = localStorage.getItem('to_blocklist').split(',');
						console.log('#incoming blocklist from media: ', this.incoming_blacklist_licenses);
						this.structureAddedPlaylistContent(this.mapIncomingContent(data));
					} else {
						this.structureAddedPlaylistContent(this.mapIncomingContent(data));
					}
				} else {
					localStorage.removeItem('to_blocklist');
				}
			}
		)
	}

	rearrangePlaylistContents(incoming_order) {
		let updated_playlist_content_order = [];
		
		// Rearrange Playlist Content
		incoming_order.forEach(
			i => {
				updated_playlist_content_order.push(this.searchPlaylistContent(i))
			}
		)

		if (JSON.stringify(this.playlist_content_backup) != JSON.stringify(updated_playlist_content_order)) {
			this.playlist_content = updated_playlist_content_order;
			this.playlist_unchanged = false;
		} else {
			this.playlist_content = this.playlist_content_backup;
			this.playlist_unchanged = true;
		}
	}
	
	removeToBlocklist() {
		console.log('removeToBlocklist_data', this.structured_remove_in_blocklist);
		if (this.structured_remove_in_blocklist.length > 0) {
			this.subscription.add(
				this._playlist.remove_in_blocklist(this.structured_remove_in_blocklist).subscribe(
					data => {
						console.log('#removeToBlocklist_result', data);
						this.getPlaylistById();
						this.playlist_unchanged = true;
						this.structured_remove_in_blocklist = [];
					},
					error => {
						console.log('#removeToBlocklist', error)
					}
				)
			)
		} 
		// else {
		// 	console.log('I AM THE ONE CALLING YOU')
		// 	this.playlist_changes_saved.emit(true);
		// 	this.playlist_unchanged = true;
		// 	this.playlist_saving = false;
		// }
	}

	reloadPlaylist(e) {
		console.log('#reloadPlaylist', e);
		this.getPlaylistById();
	}

	removePlaylistContent(e) {
		console.log('#removePlaylistContent', e);
		this.playlist_saving = true;
		this.subscription.add(
			this._playlist.remove_playlist_content(this.playlist_id, e).subscribe(
				data => {
					this.getPlaylistById();
					console.log('#removePlaylistContent', data);
				}
			)
		)
	}

	removePlaylistContents(e) {
		console.log('#removePlaylistContents', e);
		this.playlist_saving = true;
		this.subscription.add(
			this._playlist.remove_playlist_contents(this.playlist_id, e).subscribe(
				data => {
					this.getPlaylistById();
					console.log('#removePlaylistContents', data);
				}
			)
		)
	}

	sortableJSInit() {
		const onDeselect = (e) => {
			this.selected_content_count = e.newIndicies.length
			setTimeout(() => {
				console.log('ONDESELECT', this.button_click_event)
				if (this.button_click_event == "edit-marked" || this.button_click_event == "delete-marked") {
					console.log('Valid')
				} else {
					this.selected_contents = [];
				}
			}, 0)
		}

		const onSelect = (e) => {
			console.log('selected content!', e.target);
			this.selected_content_count = e.newIndicies.length
			
		}

		const set = (sortable) => {
			this.rearrangePlaylistContents(sortable.toArray());
			localStorage.setItem('playlist_order', sortable.toArray())
		}

		const onStart = () => {
			if (this.playlist_content.length < this.playlist_content_backup.length) {
				this.playlist_content = this.playlist_content_backup;
			}

			if (localStorage.getItem('playlist_order')) {
				console.log('Has Existing Order');
				this.rearrangePlaylistContents(localStorage.getItem('playlist_order').split(','))
			}
		}

		const onEnd = () => {
			this.search_control.setValue('');
		}
		
		new Sortable(this.draggables.nativeElement, {
			swapThreshold: 1,
			sort: true,
			animation: 700,
			ghostClass: 'dragging',
			scrollSensitivity: 200,
			multiDrag: true,
			selectedClass: 'selected',
			fallbackOnBody: true,
			forceFallback: true,
			group: 'playlist_content',
			fallbackTolerance: 2,
			store: {
				set
			},
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

	structureAddedContentBlocklist(data) {
		let to_block = [];
		data.map(i => this.incoming_blacklist_licenses.map(j => to_block.push(new API_BLOCKLIST_CONTENT(j, i.contentId, i.playlistContentId))))
		console.log('#structureAddedContentBlocklist', to_block);
		this.addToBlocklist(to_block);
	}

	structureBulkBlacklisting(data) {
		let to_block = [];
		data.map(i => this.incoming_blacklist_licenses.map(j => to_block.push(new API_BLOCKLIST_CONTENT(j, i.content.contentId, i.content.playlistContentId))))
		console.log('#structureBulkBlacklisting', to_block);
		this.addToBlocklist(to_block);
	}

	savePlaylistChanges(data) {
		this.playlist_saving = true;
		this.is_marking = false;
		if (data) {
			this.subscription.add(
				this._playlist.update_playlist_contents(data).subscribe(
					(data: any) => {
						localStorage.removeItem('playlist_order');
						localStorage.removeItem('playlist_data');
						console.log('#savePlaylistChanges_result', data);
						this.playlist_content_backup = this.playlist_content;

						if (this.incoming_blacklist_licenses.length > 0) {
							console.log('Has Blocklist Items')
							this.structureAddedContentBlocklist(data.playlistContentsAdded);
						} else {
							console.log('No Blocklist Items')
							this.getPlaylistById();
						}
						
						if (this.structured_incoming_blocklist.length > 0) {
							console.log('has structured_incoming_blocklist')
							this.addToBlocklist(this.structured_incoming_blocklist);
						} else {
							console.log('no structured_incoming_blocklist')
							this.removeToBlocklist();
						}
					},
					error => {
						console.log('#savePlaylistChanges', error);
					}
				)
			)
		} else {
			if (this.structured_incoming_blocklist.length > 0) {
				this.addToBlocklist(this.structured_incoming_blocklist);
			} else {
				this.removeToBlocklist();
			}
		}

		this.search_control.setValue('');
	}

	structureAddedPlaylistContent(incoming_playlist_content: API_CONTENT_BLACKLISTED_CONTENTS[]) {
		// Merge incoming playlist content to current playlist content
		this.playlist_content = incoming_playlist_content.concat(this.playlist_content);
		this.savePlaylistChanges(this.structureUpdatedPlaylist());
	}

	searchPlaylistContent(id) {
		return this.playlist_content.filter(
			i => {
				return id == i.content.playlistContentId;
			}
		)[0];
	}

	saveOrderChanges() {
		this.savePlaylistChanges(this.structureUpdatedPlaylist());
	}

	structureUpdatedPlaylist(): API_UPDATE_PLAYLIST_CONTENT {

		let index = 1;

		let updated_playlist = this.playlist_content.map(
			i => {
				return new API_UPDATED_PLAYLIST_CONTENT(
					i.content.contentId,
					i.content.isFullScreen,
					index++,
					i.content.duration > 0 ? i.content.duration : 20,
					i.content.playlistContentId,
				)
			}
		);

		return this.structurePlaylistUpdatePayload(updated_playlist);

	}

	structurePlaylistUpdatePayload(updated_playlist_content): API_UPDATE_PLAYLIST_CONTENT {
		return new API_UPDATE_PLAYLIST_CONTENT(this.playlist_id, updated_playlist_content);
	}

	private setScheduleStatus(): void {
		const contents = this.playlist_contents;

		this.playlist_contents = contents.map(content => {
			let status = 'inactive';

			if (content.playlistContentsSchedule) {
				const schedule = content.playlistContentsSchedule;
				const currentDate = moment();
				const startDate = moment(schedule.from);
				const endDate = moment(schedule.to);
				if (currentDate.isBefore(startDate)) status = 'future';
				if (currentDate.isBetween(startDate, endDate) || schedule.type === 1) status = 'active';
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

		const close = dialog.afterClosed().subscribe(
			(response: string | boolean) => {
				close.unsubscribe();

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

		const close = dialog.afterClosed().subscribe(
			() => {
				close.unsubscribe();
				this.getPlaylistById();
			},
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
