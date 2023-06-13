import { Component, ElementRef, Input, OnInit, ViewChild, EventEmitter, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { fromEvent, Observable, Subject } from 'rxjs';
import { Sortable } from 'sortablejs';
import * as moment from 'moment-timezone';

import { BulkOptionsComponent } from '../bulk-options/bulk-options.component';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { PlaylistContentSchedulingDialogComponent } from '../playlist-content-scheduling-dialog/playlist-content-scheduling-dialog.component';
import { PlaylistMediaComponent } from '../playlist-media/playlist-media.component';
import { ViewSchedulesComponent } from '../view-schedules/view-schedules.component';
import { AuthService, ConfirmationDialogService, ContentService, PlaylistService } from 'src/app/global/services';

import {
	API_BLOCKLIST_CONTENT,
	API_CONTENT,
	API_CONTENT_BLACKLISTED_CONTENTS,
	API_UPDATE_PLAYLIST_CONTENT,
	FREQUENCY,
	API_UPDATED_PLAYLIST_CONTENT,
	PLAYLIST_CHANGES,
	CREDITS_STATUS,
	CREDITS_TO_SUBMIT,
	API_CONTENT_HISTORY,
	API_CONTENT_HISTORY_LIST,
	API_CONTENT_DATA
} from 'src/app/global/models';

import { FEED_TYPES, IMAGE_TYPES, VIDEO_TYPES } from 'src/app/global/constants/file-types';

@Component({
	selector: 'app-playlist-content-panel',
	templateUrl: './playlist-content-panel.component.html',
	styleUrls: ['./playlist-content-panel.component.scss']
})
export class PlaylistContentPanelComponent implements OnInit, OnDestroy {
	@ViewChild('draggables', { static: false }) draggables: ElementRef<HTMLCanvasElement>;
	@Input() dealer_id: string;
	@Input() is_admin? = false;
	@Input() is_dealer? = false;
	@Input() is_view_only = false;
	@Input() page? = '';
	@Input() playlist_contents: any[];
	@Input() playlist_id: string;
	@Input() playlist_host_license: any[];
	@Output() playlist_changes_saved = new EventEmitter();
	@Output() reload_playlist = new EventEmitter<boolean>();
	@Output() reload_demo = new EventEmitter();
	@Output() playlist_demo = new EventEmitter();
	_contentsBackup: API_CONTENT[];

	active_draggable_contents: API_CONTENT[] = [];
	button_click_event: string;
	can_set_schedule = false;
	can_update_schedule = false;
	clickObservable: Observable<Event> = fromEvent(document, 'click');
	contentFileTypes = this._contentFileTypes;
	contents_with_schedules: API_CONTENT[] = [];
	contents_without_schedules: API_CONTENT[] = [];
	currentFeedCount = 0;
	currentImageCount = 0;
	currentVideoCount = 0;
	currentStatusFilter: { key: string; label: string };
	currentFileTypeFilter = 'all';
	has_selected_content_with_schedule = false;
	is_loading = false;
	is_bulk_selecting = false;
	list_view_mode = false;
	updated_playlist_content: API_UPDATED_PLAYLIST_CONTENT[];
	playlist_order: string[] = [];
	playlist_changes_data: any;
	playlist_unchanged = true;
	playlist_content_backup: API_CONTENT[];
	playlist_saving = false;
	selected_playlist_content_ids: string[];
	selected_content_count: number;
	playlist_new_content: API_CONTENT_DATA[];
	structured_updated_playlist: API_UPDATE_PLAYLIST_CONTENT;
	structured_incoming_blocklist = [];
	structured_remove_in_blocklist = [];
	structured_bulk_remove_in_blocklist = [];
	feed_count: number;
	image_count: number;
	video_count: number;
	incoming_blacklist_licenses = [];
	search_control = new FormControl();
	bulk_toggle: boolean;
	statusFilterOptions = this._statusFilterOptions;

	private selected_contents: { playlistContentId: string; contentId: string; classification: any }[];
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _confirmation_dialog: ConfirmationDialogService,
		private _content: ContentService,
		private _dialog: MatDialog,
		private _playlist: PlaylistService
	) {}

	ngOnInit() {
		this._contentsBackup = Array.from(this.playlist_contents);
		this.subscribeToSearch();
		this.playlist_content_backup = this.playlist_contents;
		this.setScheduleStatus();
		this.playlist_contents = [...this.showOnlyActiveContents(this.playlist_contents)];
		this.getAssetCount();
		this.currentStatusFilter = this.statusFilterOptions[1];
		this.playlist_saving = false;
		this.selected_playlist_content_ids = [];
		this.selected_contents = [];
		this.playlist_new_content = [];
		this.bulk_toggle = false;
		this.is_bulk_selecting = false;

		if (this.playlist_content_backup.length <= 0) return;

		this.contents_with_schedules = this.playlist_content_backup.filter((content) => {
			let schedule = null;
			schedule = content.playlistContentsSchedule || content.playlistContentsSchedule;
			if (!schedule) return;
			if (schedule.type === 3) return content;
		});

		this.contents_without_schedules = this.playlist_content_backup.filter((content) => {
			let schedule = null;
			schedule = content.playlistContentsSchedule || content.playlistContentsSchedule;
			if (!schedule) return;
			if (schedule.type !== 3) return content;
		});

		this.getCurrentAssetCount();

		// ensure that all content are initially ordered by sequence
		this.playlist_contents = [...this.fixSequences()];
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	ngAfterViewInit() {
		this.sortableJSInit();
	}

	addToBlocklist(data: any[]): void {
		if (data.length > 0) {
			this._playlist
				.blocklist_content(data)
				.pipe(takeUntil(this._unsubscribe))
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
					(error) => {
						throw new Error(error);
					}
				);
		} else {
			if (this.structured_remove_in_blocklist.length > 0) {
				this.removeToBlocklist();
			}
		}
	}

	bulkContentRemove(): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: 'warning',
				message: `You are about to remove ${this.selected_playlist_content_ids.length} playlist contents`,
				data: `Are you sure you want to remove marked contents in this playlist?`
			}
		});

		dialog.afterClosed().subscribe(
			(data) => {
				if (data) {
					this.removePlaylistContents(this.selected_playlist_content_ids);
					this.logContentHistory(this.selected_contents, false);
				}
			},
			(error) => {
				throw new Error(error);
			}
		);
	}

	bulkModify(): void {
		let content_data = [];

		this.playlist_contents.filter((content) => {
			if (this.selected_playlist_content_ids.includes(content.playlistContentId)) content_data.push(content);
		});

		let bulk_option_dialog = this._dialog.open(BulkOptionsComponent, {
			data: { contents: content_data, host_licenses: this.playlist_host_license },
			width: '1024px',
			height: '760px'
		});

		bulk_option_dialog.afterClosed().subscribe((data) => {
			if (data) {
				data.content_props.forEach((c) => {
					this.playlist_contents.filter((content) => {
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
		});
	}

	bulkWhitelist(data: any[]): void {
		this._playlist
			.bulk_whitelist(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.getPlaylistById();
					this.playlist_unchanged = true;
					this.structured_bulk_remove_in_blocklist = [];
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	filterContentByFileType(type: string) {
		this.currentFileTypeFilter = type;
		const fileTypes = (type: string) => this.getFileTypesByTypeName(type);
		const hasStatusFilter = typeof this.currentStatusFilter !== 'undefined';
		const currentStatusFilter = this.currentStatusFilter;
		const contents = Array.from(this._contentsBackup);

		if (type === 'all') {
			if (currentStatusFilter.key === 'default') {
				this.playlist_contents = Array.from(contents);
				this.getCurrentAssetCount();
				return;
			}

			this.playlist_contents = [...Array.from(contents).filter((content: API_CONTENT) => content.scheduleStatus === currentStatusFilter.key)];
			this.getCurrentAssetCount();
			return;
		}

		this.playlist_contents = [...Array.from(contents).filter((content) => fileTypes(type).includes(content.fileType.toLowerCase()))];

		if (hasStatusFilter && currentStatusFilter.key !== 'default') {
			this.playlist_contents = [...this.playlist_contents.filter((content: API_CONTENT) => content.scheduleStatus === currentStatusFilter.key)];
		}

		this.getCurrentAssetCount();
	}

	filterContentByStatus(key: string): void {
		const originalContents = this.playlist_content_backup;
		const fileTypes = (type: string) => this.getFileTypesByTypeName(type);
		this.currentStatusFilter = this.statusFilterOptions.filter((content) => content.key === key)[0];

		if (key === 'default') {
			this.playlist_content_backup = Array.from(this._contentsBackup);
			this.playlist_contents = Array.from(this._contentsBackup);
			this.setScheduleStatus();

			const fileTypeFilter = this.currentFileTypeFilter;

			if (typeof fileTypeFilter !== 'undefined' && fileTypeFilter !== 'all') {
				const currentContents = Array.from(this.playlist_contents);
				const type = this.currentFileTypeFilter;
				this.playlist_contents = currentContents.filter((content: API_CONTENT) => fileTypes(type).includes(content.fileType.toLowerCase()));
			}

			this.getCurrentAssetCount();

			return;
		}

		this.playlist_contents = [...originalContents.filter((content) => content.scheduleStatus === key)];
		const fileTypeFilter = this.currentFileTypeFilter;

		if (typeof fileTypeFilter !== 'undefined' && fileTypeFilter !== 'all') {
			const currentContents = Array.from(this.playlist_contents);
			this.playlist_contents = currentContents.filter((content: API_CONTENT) =>
				fileTypes(fileTypeFilter).includes(content.fileType.toLowerCase())
			);
		}

		this.getCurrentAssetCount();
	}

	getAssetCount(): void {
		const fileTypes = (type: string) => this.getFileTypesByTypeName(type);
		this.video_count = this._contentsBackup.filter((i) => fileTypes('video').includes(i.fileType.toLowerCase())).length;
		this.image_count = this._contentsBackup.filter((i) => fileTypes('image').includes(i.fileType.toLowerCase())).length;
		this.feed_count = this._contentsBackup.filter((i) => fileTypes('feed').includes(i.fileType.toLowerCase())).length;
	}

	getPlaylistById(): void {
		this.reload_playlist.emit(true);
	}

	isMarked(playlistContentId: string) {
		const selectedContent = this.selected_contents.find((content) => content.playlistContentId === playlistContentId);
		if (typeof selectedContent === 'undefined') return;
		return selectedContent.playlistContentId === playlistContentId;
	}

	isMarking(event: { checked: boolean }): void {
		this.is_bulk_selecting = event.checked;

		if (this.is_bulk_selecting == false) {
			this.selected_playlist_content_ids = [];
			this.selected_contents = [];
			this.can_set_schedule = false;
			this.can_update_schedule = false;
		}
	}

	logRemovedContent(data: any) {
		this.logContentHistory(data, false);
	}

	logContentHistory(data: any, isAdd: any) {
		if (isAdd) {
			data.forEach((i) => this.playlist_new_content.push(new API_CONTENT_DATA(i.playlistContentId, i.contentId)));
		} else {
			if (this.selected_contents.length > 0) {
				data.forEach((i) => this.playlist_new_content.push(new API_CONTENT_DATA(i.playlistContentId, i.contentId)));
			} else {
				this.playlist_new_content.push(new API_CONTENT_DATA(data.id, data.contentId));
			}
		}

		this._playlist
			.log_content_history(this.structureContentHistory(isAdd))
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				async () => {
					this.selected_contents = [];
					this.playlist_new_content = [];
				},
				(error) => {
					this.selected_contents = [];
					this.playlist_new_content = [];
				}
			);
	}

	mapIncomingContent(data: any[]): any[] {
		return data.map((i) => {
			return {
				content: i,
				blacklistedContents: []
			};
		});
	}

	onSetSchedule(): void {
		this.showContentScheduleDialog();
	}

	onViewContentList(): void {
		this.list_view_mode = !this.list_view_mode;
	}

	onViewSchedule(): void {
		this.showViewSchedulesDialog();
	}

	optionsSaved(data: PLAYLIST_CHANGES): void {
		let creditsData: CREDITS_TO_SUBMIT = null;
		let creditsUpdate: { playlistContentId: string; licenseId: string; credits: number } = null;
		let frequencyUpdate: FREQUENCY = null;
		let creditsStatusUpdate: CREDITS_STATUS = null;
		const { content, credits_to_submit, blocklist } = data;
		this.playlist_changes_data = data;

		if (content) {
			if (content.frequency === 1 || content.frequency === 2 || content.frequency === 3) {
				const { frequency, playlistContentId } = content;
				frequencyUpdate = { frequency, playlistContentId, playlistId: this.playlist_id };
			}

			if (credits_to_submit) {
				let { credits } = credits_to_submit;
				const maxCredits = 1000000;
				if (credits > maxCredits) credits = maxCredits;
				creditsData = credits_to_submit;
			}

			this.playlist_contents.forEach((i) => {
				if (i.playlistContentId == data.content.playlistContentId) i = data;
			});

			this.structured_updated_playlist = this.structureUpdatedPlaylist();
		}

		const dataToSubmit = this.structured_updated_playlist;
		this.structured_incoming_blocklist = blocklist && blocklist.incoming.length > 0 ? blocklist.incoming : [];
		this.structured_remove_in_blocklist = blocklist && blocklist.removing.length > 0 ? blocklist.removing : [];

		if (typeof data.credits_status !== 'undefined') creditsStatusUpdate = data.credits_status;

		this.savePlaylistChanges(dataToSubmit, frequencyUpdate, creditsData, creditsStatusUpdate);
	}

	openPlaylistDemo(): void {
		this.playlist_demo.emit(true);
	}

	openPlaylistMedia(type = 'add'): void {
		const data = { playlist_host_license: this.playlist_host_license, dealer_id: this.dealer_id };

		const playlist_content_dialog: MatDialogRef<PlaylistMediaComponent> = this._dialog.open(PlaylistMediaComponent, {
			data: data,
			width: '1100px'
		});

		playlist_content_dialog.componentInstance.type = type;

		playlist_content_dialog.afterClosed().subscribe((response) => {
			// if add content

			if (type === 'add') {
				if (!response) return localStorage.removeItem('to_blocklist');
				if (localStorage.getItem('to_blocklist')) this.incoming_blacklist_licenses = localStorage.getItem('to_blocklist').split(',');
				this.structureAddedPlaylistContent(response);
				return;
			}

			// if swap content
			if (!response || typeof response === 'undefined') return;
			const content: API_CONTENT = response[0];
			const playlistContentIdToBeReplaced = this.selected_playlist_content_ids[0];
			if (content.playlistContentId === playlistContentIdToBeReplaced)
				return this.showErrorDialog('Cannot select the same content to be swapped');

			this.swapContent({ contentId: content.contentId, playlistContentId: playlistContentIdToBeReplaced });
		});
	}

	rearrangePlaylistContents(incoming_order): void {
		const updated_playlist_content_order = [];

		// Rearrange Playlist Content
		incoming_order.forEach((i) => {
			updated_playlist_content_order.push(this.searchPlaylistContent(i));
		});

		if (JSON.stringify(this.playlist_content_backup) != JSON.stringify(updated_playlist_content_order)) {
			this.playlist_contents = updated_playlist_content_order;
			this.playlist_unchanged = false;
		} else {
			this.playlist_contents = this.playlist_content_backup;
			this.playlist_unchanged = true;
		}
	}

	removeToBlocklist(): void {
		if (this.structured_remove_in_blocklist.length > 0) {
			this._playlist
				.remove_in_blocklist(this.structured_remove_in_blocklist)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					() => {
						this.getPlaylistById();
						this.playlist_unchanged = true;
						this.structured_remove_in_blocklist = [];
					},
					(error) => {
						throw new Error(error);
					}
				);
		} else {
			this.getPlaylistById();
		}
	}

	reloadPlaylist(): void {
		this.getPlaylistById();
	}

	/** Single Content Remove */
	removePlaylistContent(contentId: string): void {
		this.playlist_saving = true;

		this._playlist
			.remove_playlist_content(this.playlist_id, contentId)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					this.playlist_contents = this.playlist_content_backup.filter((p: API_CONTENT) => p.playlistContentId != contentId);
					this.saveOrderChanges();
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	/** Bulk Content Remove */
	removePlaylistContents(contentIdsToDelete: string[]): void {
		this.playlist_saving = true;

		this._playlist
			.remove_playlist_contents(this.playlist_id, contentIdsToDelete)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => {
					const contents = [...this.playlist_content_backup];
					this.playlist_contents = contents.filter((content) => contentIdsToDelete.includes(content.contentId));
					this.saveOrderChanges();
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	selectAllContents(): void {
		this.playlist_contents.forEach((i) => {
			if (i.frequency !== 2 && i.frequency != 3) {
				this.selected_playlist_content_ids.push(i.playlistContentId);
				this.selected_contents.push({ playlistContentId: i.playlistContentId, contentId: i.contentId, classification: i.classification });
			}
		});

		this.can_set_schedule = true;
	}

	sortableJSInit(): void {
		// Sortable.mount(new MultiDrag());

		const onDeselect = (e) => {
			this.selected_content_count = e.newIndicies.length;

			setTimeout(() => {
				if (this.button_click_event == 'edit-marked' || this.button_click_event == 'delete-marked') {
				} else {
					this.selected_playlist_content_ids = [];
					this.selected_contents = [];
				}
			}, 0);
		};

		const onSelect = (e) => {
			this.selected_content_count = e.newIndicies.length;
		};

		const set = (sortable) => {
			this.rearrangePlaylistContents(sortable.toArray());
			localStorage.setItem('playlist_order', sortable.toArray());
		};

		const onStart = () => {
			if (localStorage.getItem('playlist_order')) this.rearrangePlaylistContents(localStorage.getItem('playlist_order').split(','));
		};

		const onEnd = (event) => {
			const { oldIndex, newIndex } = event;
			const draggedContent = this.playlist_contents[oldIndex];

			this.playlist_contents.splice(oldIndex, 1);
			this.playlist_contents.splice(newIndex, 0, draggedContent);
			this.playlist_contents = this.playlist_contents.map((content, index) => {
				content.seq = index + 1;
				return content;
			});
		};

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
			filter: '.undraggable',
			onSelect,
			onDeselect,
			onStart,
			onEnd
		});
	}

	selectedContent(id: string, contentId: string, contentFrequency: number, classification?): void {
		const selected = this.playlist_contents.find((content) => content.contentId === contentId) as API_CONTENT;

		if (typeof selected !== 'undefined' && selected.isProtected === 1 && this.is_dealer) return;

		let isChildFrequency = contentFrequency === 2 || contentFrequency === 3;

		if (isChildFrequency) return;

		if (!this.selected_playlist_content_ids.includes(id)) {
			this.selected_playlist_content_ids.push(id);
			this.selected_contents.push({ playlistContentId: id, contentId: contentId, classification: classification });
		} else {
			this.selected_playlist_content_ids = this.selected_playlist_content_ids.filter((i) => i !== id);
			this.selected_contents = this.selected_contents.filter((i) => i.playlistContentId !== id);
		}

		if (this.selected_playlist_content_ids.length === 0) {
			this.can_set_schedule = false;
			return;
		}

		if (this.bulk_toggle) {
			const contents = this.selected_playlist_content_ids;
			if (contents.length >= 1) this.can_set_schedule = true;
		}
	}

	structureAddedContentBlocklist(data: any[]): void {
		let to_block = [];
		data.map((i) => this.incoming_blacklist_licenses.map((j) => to_block.push(new API_BLOCKLIST_CONTENT(j, i.contentId, i.playlistContentId))));
		this.addToBlocklist(to_block);
	}

	structureBulkBlacklisting(data: any[]): void {
		let to_block = [];
		data.map((i) => this.incoming_blacklist_licenses.map((j) => to_block.push(new API_BLOCKLIST_CONTENT(j, i.contentId, i.playlistContentId))));
		this.addToBlocklist(to_block);
	}

	structureAddedPlaylistContent(incoming_playlist_content: API_CONTENT_BLACKLISTED_CONTENTS[]): void {
		this.playlist_contents = incoming_playlist_content.concat(this.playlist_contents);
		this.savePlaylistChanges(this.structureUpdatedPlaylist(), null, null, null, true);
	}

	searchPlaylistContent(id: string): any {
		return this.playlist_contents.filter((content) => {
			return id == content.playlistContentId;
		})[0];
	}

	saveOrderChanges(): void {
		this.savePlaylistChanges(this.structureUpdatedPlaylist());
	}

	/**
	 * Check if there are contents with the same sequence (seq) and then fix it by setting in ascending order
	 * e.g. from 1,1,2,3,4 to 1,2,3,4,5
	 * @returns
	 */
	private fixSequences() {
		const contents: API_CONTENT[] = Array.from(this.playlist_contents);

		return contents.map((content, index) => {
			content.seq = index + 1;
			return content;
		});
	}

	private getCurrentAssetCount() {
		const currentContents = Array.from(this.playlist_contents);
		const fileTypes = (type: string) => this.getFileTypesByTypeName(type);
		this.currentVideoCount = currentContents.filter((x: API_CONTENT) => fileTypes('video').includes(x.fileType.toLowerCase())).length;
		this.currentImageCount = currentContents.filter((x: API_CONTENT) => fileTypes('image').includes(x.fileType.toLowerCase())).length;
		this.currentFeedCount = currentContents.filter((x: API_CONTENT) => fileTypes('feed').includes(x.fileType.toLowerCase())).length;
	}

	private getFileTypesByTypeName(data: string) {
		switch (data) {
			case 'image':
				return IMAGE_TYPES;

			case 'video':
				return VIDEO_TYPES;

			default:
				return FEED_TYPES;
		}
	}

	private savePlaylistChanges(
		data: API_UPDATE_PLAYLIST_CONTENT,
		frequencyUpdate?: FREQUENCY,
		creditsToSubmit?: CREDITS_TO_SUBMIT,
		creditsStatusUpdate?: CREDITS_STATUS,
		isAdded?: true
	): void {
		this.playlist_saving = true;
		this.is_bulk_selecting = false;

		if (data) {
			this._playlist
				.update_playlist_contents(data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					async (data: any) => {
						if (isAdded) {
							if (data) {
								data.playlistContentsAdded.forEach((i) =>
									this.playlist_new_content.push(new API_CONTENT_DATA(i.playlistContentId, i.contentId))
								);

								await this._playlist.log_content_history(this.structureContentHistory(true)).toPromise();
								this.playlist_new_content = [];
							}
						}
						if (frequencyUpdate) {
							const { frequency, playlistContentId, playlistId } = frequencyUpdate;
							let request = this._content.set_frequency(frequency, playlistContentId, playlistId);

							if (frequency === 1) {
								request = this._content.revert_frequency(playlistContentId);
							}

							await request.toPromise().then(async (response: any) => {
								if (response) {
									const { contentId } = response.playlistContent;
									await this._playlist.blacklist_cloned_content(playlistContentId, playlistId, contentId).toPromise();
								}
							});
						}

						if (creditsToSubmit) {
							await this._content.update_play_credits(creditsToSubmit).toPromise();
						}

						if (creditsStatusUpdate) {
							const { playlistContentId, status } = creditsStatusUpdate;
							await this._content.toggle_credits(playlistContentId, status).toPromise();
						}

						localStorage.removeItem('playlist_order');
						localStorage.removeItem('playlist_data');
						this.playlist_content_backup = this.playlist_contents;

						if (this.incoming_blacklist_licenses.length > 0) {
							this.structureAddedContentBlocklist(data.playlistContentsAdded);
						} else if (this.structured_bulk_remove_in_blocklist.length > 0) {
							this.bulkWhitelist(this.structured_bulk_remove_in_blocklist);
						} else if (this.structured_incoming_blocklist.length > 0) {
							this.addToBlocklist(this.structured_incoming_blocklist);
						} else if (this.structured_incoming_blocklist.length == 0) {
							this.removeToBlocklist();
						} else {
							this.getPlaylistById();
						}
					},
					(error) => {
						throw new Error(error);
					}
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

	private setScheduleStatus(): void {
		const originalContents = this.playlist_content_backup;

		this.playlist_contents = originalContents.map((content) => {
			let status = 'inactive';
			const schedule = content.playlistContentsSchedule ? content.playlistContentsSchedule : null;

			// no schedule
			if (!schedule) {
				content.scheduleStatus = status;
				return content;
			}

			const type = schedule.type;
			const playlistContentCredits = content.playlistContentCredits;
			const creditsEnabled = content.creditsEnabled;

			// credits depleted to 0
			if (creditsEnabled === 1 && playlistContentCredits && playlistContentCredits.length > 0) {
				const sum = playlistContentCredits.map((content) => content.credits).reduce((previous, current) => previous + current);

				if (sum === 0) {
					content.scheduleStatus = status;
					return content;
				}
			}

			switch (type) {
				case 2:
					status = 'inactive';
					break;

				case 3:
					const currentDate = moment(new Date(), 'YYYY-MM-DD hh:mm A');
					const startDate = moment(`${schedule.from} ${schedule.playTimeStart}`, 'YYYY-MM-DD hh:mm A');
					const endDate = moment(`${schedule.to} ${schedule.playTimeEnd}`, 'YYYY-MM-DD hh:mm A');

					if (currentDate.isBefore(startDate)) status = 'future';
					if (currentDate.isBetween(startDate, endDate, undefined)) status = 'active';
					break;

				default:
					status = 'active';
			}

			content.scheduleStatus = status;
			return content;
		});
	}

	private showOnlyActiveContents(data: any[]): any[] {
		const copy = [...data];
		return copy.filter((content) => content.scheduleStatus === 'active');
	}

	private showContentScheduleDialog(): void {
		let content: any;
		let message = 'Success!';
		let mode = 'create';
		let schedules: { id: string; content_id: string; classification: string }[] = [];
		const content_ids: string[] = [];
		if (this.selected_playlist_content_ids.length === 1) mode = 'update';

		if (mode === 'update') {
			const selectedForUpdateId = this.selected_playlist_content_ids[0];
			content = this.contents_with_schedules.filter((content) => content.playlistContentId === selectedForUpdateId)[0];
		}

		if (!content) mode = 'create';

		this.selected_playlist_content_ids.forEach((id) => {
			this.playlist_contents.forEach((content) => {
				if (content.playlistContentId === id) {
					if (!content.playlistContentsSchedule) {
						content_ids.push(id);
					} else {
						const schedule = {
							id: content.playlistContentsSchedule.playlistContentsScheduleId,
							content_id: content.playlistContentId,
							classification: content.classification
						};
						schedules.push(schedule);
					}
				}
			});
		});

		const dialog = this._dialog.open(PlaylistContentSchedulingDialogComponent, {
			width: '950px',
			height: '530px',
			panelClass: 'position-relative',
			data: { mode, content_ids, content, schedules },
			autoFocus: false
		});

		dialog.afterClosed().subscribe(
			(response: string | boolean) => {
				if (typeof response === 'string') {
					if (response === 'create') message += ' Schedule has been created';
					else message += ' Schedule has been updated';
					this.showSuccessDialog(message);
				}
			},
			(error) => {
				throw new Error(error);
			}
		);
	}

	private showErrorDialog(message = ''): void {
		this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status: 'error', message }
		});
	}

	private showSuccessDialog(message: string): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status: 'success', message }
		});

		dialog.afterClosed().subscribe(
			() => this.getPlaylistById(),
			(error) => {
				throw new Error(error);
			}
		);
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

	private subscribeToSearch(): void {
		const original = Array.from(this._contentsBackup);
		const control = this.search_control;
		const fileTypes = (type: string) => this.getFileTypesByTypeName(type);

		control.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
			// if user erased the keyword
			if (typeof data === 'undefined' || !data || data.trim().length === 0) {
				this.playlist_contents = this.playlist_content_backup;

				this.playlist_contents = original.filter((content: API_CONTENT) => {
					const hasCurrentFileType = fileTypes(this.currentFileTypeFilter).includes(content.fileType.toLowerCase());
					return content.scheduleStatus === this.currentStatusFilter.key && hasCurrentFileType;
				});

				if (this.currentFileTypeFilter === 'all') {
					this.playlist_contents = original.filter((content: API_CONTENT) => content.scheduleStatus === this.currentStatusFilter.key);
					this.getAssetCount();
					return;
				}

				return;
			}

			// else if has keyword

			this.playlist_contents = this.playlist_contents.filter((i) => {
				if (i) {
					if (i.fileName) {
						return i.fileName.toLowerCase().includes(data.toLowerCase());
					} else {
						return i.title.toLowerCase().includes(data.toLowerCase());
					}
				}
			});
		});
	}

	private structureContentHistory(isAdd: any): API_CONTENT_HISTORY_LIST {
		let action = isAdd ? 'Added' : 'Removed';
		let new_contents = this.playlist_new_content.map((i) => {
			return new API_CONTENT_HISTORY(i.playlistContentId, i.contentId, this.playlist_id, action, this._auth.current_user_value.user_id);
		});

		return this.structureContentHistoryPayload(new_contents);
	}

	private structureContentHistoryPayload(new_contents): API_CONTENT_HISTORY_LIST {
		return new API_CONTENT_HISTORY_LIST(new_contents);
	}

	private structureUpdatedPlaylist(): API_UPDATE_PLAYLIST_CONTENT {
		const mappedContents = this.playlist_contents.map((content) => {
			const { contentId, isFullScreen, seq, duration, playlistContentId } = content;
			const durationValue = duration > 0 ? duration : 20;

			return new API_UPDATED_PLAYLIST_CONTENT(contentId, isFullScreen, seq, durationValue, playlistContentId);
		});

		return new API_UPDATE_PLAYLIST_CONTENT(this.playlist_id, mappedContents);
	}

	private swapContent(data: { contentId: string; playlistContentId: string }) {
		return this._playlist
			.swap_playlist_content(data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(() => {
				this._confirmation_dialog.success({ message: 'Success!', data: 'Content swapped' });
				this.bulk_toggle = false;
				this.isMarking({ checked: false });
				this.reload_playlist.emit(true);
			});
	}

	protected get _contentFileTypes() {
		return ['all', 'image', 'video', 'feeds'];
	}

	protected get _statusFilterOptions() {
		return [
			{ label: 'All', key: 'default' },
			{ label: 'Active', key: 'active' },
			{ label: 'In Queue', key: 'future' },
			{ label: 'Inactive', key: 'inactive' }
		];
	}

	protected get currentUser() {
		return this._auth.current_user_value;
	}
}
