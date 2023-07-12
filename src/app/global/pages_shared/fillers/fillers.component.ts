import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { AddFillerGroupComponent } from './components/add-filler-group/add-filler-group.component';
import { EditFillerGroupComponent } from './components/edit-filler-group/edit-filler-group.component';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs';

import { FillerService } from 'src/app/global/services';
import { AddFillerContentComponent } from './components/add-filler-content/add-filler-content.component';

@Component({
	selector: 'app-fillers',
	templateUrl: './fillers.component.html',
	styleUrls: ['./fillers.component.scss']
})
export class FillersComponent implements OnInit {
	filler_group: any;
	filler_group_cache = [];
	is_loading = true;
	search_keyword: string;
	title = 'Fillers Library';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _dialog: MatDialog, private _router: Router, private _filler: FillerService) {}

	ngOnInit() {
		this.getAllFillers(1);
	}

	onTabChanged(e: { index: number }) {
		switch (e.index) {
			case 1:
				// this.pageRequested(1);
				break;
			case 0:
				// this.getLicenses(1);
				break;
			case 3:
				// this.getHosts(1);
				break;
			default:
		}
	}

	onSearchFiller(keyword) {
		this.is_loading = true;
		if (keyword) {
			this.search_keyword = keyword;
			this.is_loading = true;
		} else {
			this.search_keyword = '';
		}
		this.getAllFillers(1);
	}

	onAddFillerGroup() {
		let dialog = this._dialog.open(AddFillerGroupComponent, {
			width: '500px',
			data: {}
		});

		dialog.afterClosed().subscribe(() => {
			this.ngOnInit();
		});
	}

	onEditFillerGroup(id) {
		let dialog = this._dialog.open(EditFillerGroupComponent, {
			width: '500px',
			data: {
				filler_group_id: id
			}
		});
		dialog.afterClosed().subscribe(() => {
			this.ngOnInit();
		});
	}

	navigateToFillerGroup(id) {
		this._router.navigate([]).then(() => {
			window.open(`/administrator/fillers/view-fillers-group/` + id, '_blank');
		});
	}

	addFillerContent(group) {
		let dialog = this._dialog.open(AddFillerContentComponent, {
			width: '500px',
			data: {
				group: group
			}
		});

		dialog.afterClosed().subscribe(() => {
			console.log('CLOSED');
			this.ngOnInit();
		});
	}

	getAllFillers(page, size?) {
		if (page === 1) {
			size = 11;
		}

		this._filler
			.get_filler_groups(page, this.search_keyword, size)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				if (!data.message) {
					if (page > 1) {
						data.paging.entities.map((group) => {
							this.filler_group_cache.push(group);
						});
					} else {
						this.filler_group_cache = data.paging.entities;
						console.log('FGC', this.filler_group_cache);
					}
					this.filler_group = data.paging;
				} else {
					this.filler_group = [];
				}
			})
			.add(() => {
				this.is_loading = false;
			});
	}
}
