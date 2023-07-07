import { Component, OnInit } from '@angular/core';
import { FillerService } from 'src/app/global/services';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material';
import { AddFillerContentComponent } from '../add-filler-content/add-filler-content.component';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-view-fillers-group',
	templateUrl: './view-fillers-group.component.html',
	styleUrls: ['./view-fillers-group.component.scss']
})
export class ViewFillersGroupComponent implements OnInit {
	filler_group_contents: [];
	filler_group_data: any;
	filler_group_id: string;
	is_loading = true;
	selected_filler: string;
	title = 'Fillers Library';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _filler: FillerService, private _params: ActivatedRoute, private _dialog: MatDialog) {}

	ngOnInit() {
		console.log('CALLED');
		this._params.paramMap.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
			this.filler_group_id = this._params.snapshot.params.data;
		});
		this.getFillerGroupContents(this.filler_group_id);
		this.getFillerGroupDetails(this.filler_group_id);
	}

	getFillerGroupDetails(id) {
		this._filler
			.get_filler_group_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				this.filler_group_data = response.data[0];
			});
	}

	getFillerGroupContents(id) {
		this._filler
			.get_filler_group_contents(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				if (!data.message) {
					this.filler_group_contents = data.paging.entities;
				} else {
					this.filler_group_contents = [];
				}
			})
			.add(() => {
				this.is_loading = false;
			});
	}

	gotoFileURL(url) {
		window.open(url, '_blank');
	}

	addFillerContent(group) {
		let dialog = this._dialog.open(AddFillerContentComponent, {
			width: '500px',
			data: {
				group: group,
				all_media: this.filler_group_contents
			}
		});

		dialog.afterClosed().subscribe(() => {
			console.log('HERE');
			this.ngOnInit();
		});
	}

	splitOriginalFilename(name) {
		return name.substring(name.indexOf('_') + 1);
	}

	openGenerateLicenseModal() {}

	deleteContent(id) {
		this.selected_filler = id;
		this.warningModal('warning', 'Delete Filler', 'Are you sure you want to delete this filler?', '', 'delete', true);
	}

	private warningModal(status: string, message: string, data: string, return_msg: string, action: string, todelete?: boolean): void {
		this._dialog.closeAll();

		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status,
				message,
				data,
				return_msg,
				action,
				delete: todelete
			}
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result == 'delete') {
				this._filler
					.delete_filler_contents(this.selected_filler)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe((data: any) => {
						this.warningModal('success', 'Delete Filler', 'Filler Content ' + data.message, '', '', false);
						this.ngOnInit();
					});
			} else {
				this.ngOnInit();
			}
		});
	}
}
