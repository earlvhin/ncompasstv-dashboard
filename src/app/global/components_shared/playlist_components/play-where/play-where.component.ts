import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { API_BLOCKLIST_CONTENT } from 'src/app/global/models/api_blocklist-content.model';
import { UI_PLAYLIST_BLOCKLIST_HOST_LICENSE } from '../../../../global/models/ui_content.model';

@Component({
	selector: 'app-play-where',
	templateUrl: './play-where.component.html',
	styleUrls: ['./play-where.component.scss']
})

export class PlayWhereComponent implements OnInit {

	@Input() content_data: UI_PLAYLIST_BLOCKLIST_HOST_LICENSE;
	@Input() toggleEvent: Observable<void>;
	@Output() blocklist_changes_saved = new EventEmitter;
	@Output() whitelisted = new EventEmitter;
	toggleEvent_child: Subject<void> = new Subject<void>();
	incoming_blocklist = [];
	remove_in_blocklist = [];
	license_count: number = 0;
	
	constructor() {}

	ngOnInit() {
		console.log('#PlayWhereComponent', this.content_data);
		
		this.toggleEvent.subscribe(
			data => {
				this.toggleEvent_child.next(data);
			}
		)

		if (this.content_data.host_license.length > 0) {
			this.content_data.host_license.forEach(i => {
				if (i.licenses) {
					i.licenses.forEach(j => {
						if (this.inBlockList(new API_BLOCKLIST_CONTENT(j.licenseId, this.content_data.content.contentId, this.content_data.content.playlistContentId)).length == 0) {
							this.license_count += 1;
						}
					})
				}
			})
	
			console.log('LICENSE_COUNT', this.license_count)
		}
	}

	hasWhiteListed(e) {
		if (!e && this.incoming_blocklist.length == this.license_count && this.remove_in_blocklist.length == 0) {
			this.whitelisted.emit(false);
		} else {
			this.whitelisted.emit(true);
		}
	}

	blockListing(e) {
		if (e.status == false) {
			// Adding to blocklist
			if (this.inBlockList(e.blocklist_data).length == 0 && this.inIncomingBlocklist(e.blocklist_data) == 0) {
				this.incoming_blocklist.push(e.blocklist_data);
			} else if (this.inBlockList(e.blocklist_data).length > 0 && this.inToRemoveBlocklist(this.getBlocklistId(e.blocklist_data)) > 0) {
				this.removeInRemoveToBlocklist(this.getBlocklistId(e.blocklist_data));
			}
		} else {
			// Removing from blocklist
			if (this.inBlockList(e.blocklist_data).length > 0 && this.inToRemoveBlocklist(this.getBlocklistId(e.blocklist_data)) == 0) {
				this.remove_in_blocklist.push({blacklistedContentId: this.getBlocklistId(e.blocklist_data)});
			} else if (this.inBlockList(e.blocklist_data).length == 0 && this.inToRemoveBlocklist(this.getBlocklistId(e.blocklist_data)) == 0) {
				this.removeInAddToBlocklist(e.blocklist_data);
			}
		}

		this.checkBlocklistData();
	}

	inIncomingBlocklist(e) {
		return this.incoming_blocklist.filter(i => { 
			return i.licenseId == e.licenseId 
		}).length
	}

	inToRemoveBlocklist(e) {
		return this.remove_in_blocklist.filter(i => {
			return i.blacklistedContentId == e
		}).length
	}

	getBlocklistId(e) {
		if (this.content_data.blocklist) {
			const bli =  this.content_data.blocklist.filter(
				i => {
					return e.licenseId == i.licenseId && e.contentId == i.contentId
				}
			)
	
			if (bli.length > 0) {
				return bli[0].blacklistedContentId
			} else {
				return [];
			}
		}
	}

	inBlockList(blocklist_data: API_BLOCKLIST_CONTENT) {
		if (this.content_data.blocklist) {
			return this.content_data.blocklist.filter(
				i => {
					if (i.licenseId == blocklist_data.licenseId && blocklist_data.contentId) {
						return i
					}
				}
			)
		} else {
			return [];
		}
	}
	
	removeInRemoveToBlocklist(e) {
		this.remove_in_blocklist = this.remove_in_blocklist.filter(i => {
			return i.blacklistedContentId != e
		})
	}
	
	removeInAddToBlocklist(e) {
		this.incoming_blocklist = this.incoming_blocklist.filter(i => {
			return i.licenseId != e.licenseId && i.contentId == e.contentId
		})
	}

	checkBlocklistData() {
		let blocklist_data = {
			incoming: this.incoming_blocklist,
			removing: this.remove_in_blocklist,
			status: this.incoming_blocklist.length > 0 || this.remove_in_blocklist.length > 0 ? true : false
		}

		this.blocklist_changes_saved.emit(blocklist_data);
	}
}
