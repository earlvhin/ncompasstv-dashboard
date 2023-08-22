import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { AddFillerGroupComponent } from './components/add-filler-group/add-filler-group.component';
import { EditFillerGroupComponent } from './components/edit-filler-group/edit-filler-group.component';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs';

import { FillerService } from 'src/app/global/services';
import { AddFillerContentComponent } from './components/add-filler-content/add-filler-content.component';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { DeleteFillerGroupComponent } from './components/delete-filler-group/delete-filler-group.component';

@Component({
	selector: 'app-fillers',
	templateUrl: './fillers.component.html',
	styleUrls: ['./fillers.component.scss']
})
export class FillersComponent implements OnInit {
	current_filer: any;
	fillers_count: any;
	filler_group: any;
	filler_group_cache = [];
	is_loading = true;
	no_search_result = false;
	search_keyword: string;
	sorting_order: string = '';
	sorting_column: string = '';
	title = 'Fillers Library';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _dialog: MatDialog, private _router: Router, private _filler: FillerService) {}

	ngOnInit() {
		this.getFillersTotal();
		this.getAllFillers(1);
	}

	onTabChanged(e: { index: number }) {
		switch (e.index) {
			case 1:
				break;
			case 0:
				break;
			case 3:
				break;
			default:
		}
	}

	onSearchFiller(keyword) {
		this.is_loading = true;
		if (keyword) {
			this.search_keyword = keyword;
			this.is_loading = true;
		} else this.search_keyword = '';
		this.getAllFillers(1);
	}

	onAddFillerGroup() {
		this._dialog
			.open(AddFillerGroupComponent, {
				width: '500px',
				data: {}
			})
			.afterClosed()
			.subscribe(() => {
				this.ngOnInit();
			});
	}

	onEditFillerGroup(id) {
		this._dialog
			.open(EditFillerGroupComponent, {
				width: '500px',
				data: {
					filler_group_id: id
				}
			})
			.afterClosed()
			.subscribe(() => {
				this.ngOnInit();
			});
	}

	onDeleteFillerGroup(id) {
		//check first if any content is in used
		this._filler
			.validate_delete_filler_group(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				if (data.message) {
					this.openConfirmationModal('warning', 'Delete Filler Group', 'Are you sure you want to delete this filler group?', 'delete', id);
				} else {
					const delete_dialog = this._dialog.open(DeleteFillerGroupComponent, {
						width: '500px',
						height: '450px',
						data: {
							filler_feeds: data.fillerPlaylistGroups,
							filler_group_id: id
						}
					});

					delete_dialog.afterClosed().subscribe((result) => {
						if (!result) this.ngOnInit();
					});
				}
			});
	}

	continueToDeleteProcess(id) {
		this._filler
			.delete_filler_group(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				this.openConfirmationModal('success', 'Success!', 'Filler Group ' + data.message);
				this.ngOnInit();
			});
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
					this.continueToDeleteProcess(id);
					break;
				default:
			}
		});
	}

	navigateToFillerGroup(id) {
		this._router.navigate([]).then(() => {
			window.open(`/administrator/fillers/view-fillers-group/` + id, '_blank');
		});
	}

	addFillerContent(group) {
		this._dialog
			.open(AddFillerContentComponent, {
				width: '500px',
				data: {
					group: group
				}
			})
			.afterClosed()
			.subscribe(() => {
				this.ngOnInit();
			});
	}

	getFillersTotal() {
		this._filler
			.get_filler_totals()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				this.fillers_count = {
					label: 'Fillers',
					admin_label: 'Admin',
					admin_count: data.totalSuperAdmin,
					dealer_label: 'Dealer',
					dealer_count: data.totalDealer,
					dealer_admin_label: 'Dealer Admin',
					dealer_admin_count: data.totalDealerAdmin,
					host_label: 'Host',
					host_count: data.totalHost
				};
			});
	}

	getAllFillers(page, size?) {
		if (page === 1) size = 11;
		this.current_filer = {
			page: 1,
			key: this.search_keyword,
			size: size,
			sort_col: this.sorting_column,
			sort_ord: this.sorting_order
		};
		this._filler
			.get_filler_groups(page, this.search_keyword, size, this.sorting_column, this.sorting_order)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				if (!data.message) {
					this.no_search_result = false;
					if (page > 1) {
						data.paging.entities.map((group) => {
							this.filler_group_cache.push(group);
						});
					} else this.filler_group_cache = data.paging.entities;
					this.filler_group = data.paging;
				} else {
					if (this.search_keyword != '') this.no_search_result = true;
					else {
						this.filler_group = [];
						this.no_search_result = false;
					}
				}
			})
			.add(() => {
				this.is_loading = false;
			});
	}

	sortFillerGroup(col, order) {
		this.is_loading = true;
		this.sorting_column = col;
		this.sorting_order = order;
		this.getAllFillers(1);
	}

	clearFilter() {
		this.is_loading = true;
		this.sorting_column = '';
		this.sorting_order = '';
		this.getAllFillers(1);
	}
}
