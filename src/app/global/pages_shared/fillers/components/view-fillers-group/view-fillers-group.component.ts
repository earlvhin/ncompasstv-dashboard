import { Component, OnInit } from '@angular/core';
import { FillerService } from 'src/app/global/services';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material';
import { AddFillerContentComponent } from '../add-filler-content/add-filler-content.component';

@Component({
	selector: 'app-view-fillers-group',
	templateUrl: './view-fillers-group.component.html',
	styleUrls: ['./view-fillers-group.component.scss']
})
export class ViewFillersGroupComponent implements OnInit {
	filler_group_contents: [];
	filler_group_data: [];
	filler_group_id: string;
	is_loading = true;
	title = 'Fillers Library';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _filler: FillerService, private _params: ActivatedRoute, private _dialog: MatDialog) {}

	ngOnInit() {
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
				group: group
			}
		});

		dialog.afterClosed().subscribe(() => {
			this.ngOnInit();
		});
	}

	splitOriginalFilename(name) {
		return name.substring(name.indexOf('_') + 1);
	}

	openGenerateLicenseModal() {}
}
