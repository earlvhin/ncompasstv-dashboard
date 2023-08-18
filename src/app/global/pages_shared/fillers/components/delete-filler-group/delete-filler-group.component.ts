import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { MatDialog, MatDialogRef } from '@angular/material';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

import { FillerService, AuthService } from 'src/app/global/services';

@Component({
	selector: 'app-delete-filler-group',
	templateUrl: './delete-filler-group.component.html',
	styleUrls: ['./delete-filler-group.component.scss']
})
export class DeleteFillerGroupComponent implements OnInit {
	to_delete: any = [];
	filler_groups = this.page_data.filler_feeds;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public page_data: { filler_feeds: any; filler_group_id: string },
		private _dialog: MatDialog,
		private _filler: FillerService,
		private _router: Router,
		private _auth: AuthService
	) {}

	ngOnInit() {}

	selectUnselectAll(event) {
		this.filler_groups.map((filler_feeds) => {
			filler_feeds.checked = event;
			if (event) {
				this.to_delete.push(filler_feeds.fillerPlaylistId);
			} else {
				const index = this.to_delete.indexOf(filler_feeds.fillerPlaylistId);
				if (index > -1) {
					this.to_delete.splice(index, 1);
				}
			}
		});
	}

	uncheckCheckItem(event, data) {
		this.filler_groups.filter((groups) => {
			if (groups.fillerPlaylistId === data.fillerPlaylistId) {
				groups.checked = event;
				if (event) {
					this.to_delete.push(groups.fillerPlaylistId);
				} else {
					const index = this.to_delete.indexOf(groups.fillerPlaylistId);
					if (index > -1) {
						this.to_delete.splice(index, 1);
					}
				}
			}
		});
	}

	deleteSelection() {
		this.continueToDeleteProcess();
	}

	deleteFillerFeedSolo(id) {
		this.openConfirmationModal('warning', 'Delete Filler Feed', 'Are you sure you want to delete this feed?', 'filler_delete', id);
	}

	openConfirmationModal(status, message, data, action?, id?): void {
		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data, delete: true, id }
		});

		dialog.afterClosed().subscribe((result) => {
			switch (result) {
				case 'delete':
					this.continueToDeleteProcess();
					break;
				default:
					this._dialog.closeAll();
			}
		});
	}

	continueToDeleteProcess() {
		// this._filler
		// 	.delete_filler_feeds(id)
		// 	.pipe(takeUntil(this._unsubscribe))
		// 	.subscribe((data: any) => {
		// 		this.openConfirmationModal('success', 'Success!', 'Filler Playlist ' + data.message);
		// 		this.filler_groups = this.filler_groups.filter((groups) => {
		// 			return groups.fillerPlaylistId != id;
		// 		});
		// 	});

		this._filler
			.delete_filler_group(this.page_data.filler_group_id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				this.openConfirmationModal('success', 'Success!', 'Filler Group ' + data.message);
				this.ngOnInit();
			});
	}

	onClickPlaylistName(id) {
		const url = this._router.serializeUrl(this._router.createUrlTree([`/${this.roleRoute}/playlists/${id}`], {}));
		window.open(url, '_blank');
	}

	protected get roleRoute() {
		return this._auth.roleRoute;
	}
}
