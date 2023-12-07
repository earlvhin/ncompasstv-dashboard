import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { UI_CURRENT_USER, UI_HOST_SUPPORT } from 'src/app/global/models';
import { CreateEntryComponent } from 'src/app/global/components_shared/host_components/create-entry/create-entry.component';
import { HostService } from 'src/app/global/services';

@Component({
	selector: 'app-support-tab',
	templateUrl: './support-tab.component.html',
	styleUrls: ['./support-tab.component.scss']
})
export class SupportTabComponent implements OnInit {
	support_data: UI_HOST_SUPPORT[] = [];
	paging_data: any;
	initial_load = true;
	sort_column = 'DateCreated';
	sort_order = 'desc';
	no_support_data = false;
	support_tab = true;

	support_table_column = [
		{ name: '#', sortable: false },
		{ name: 'Date Added', column: 'dateCreated', sortable: true },
		{ name: 'URL', column: 'url', sortable: false },
		{ name: 'Notes', column: 'notes', sortable: false }
	];

	@Input() hostId: string;
	@Input() currentUser: UI_CURRENT_USER;

	constructor(private _date: DatePipe, private _dialog: MatDialog, private _host: HostService) {}
	protected _unsubscribe: Subject<void> = new Subject<void>();

	ngOnInit() {
		this.getSupport(1);
	}

	getColumnsAndOrder(data: { column: string; order: string }): void {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.getSupport(1);
	}

	getSupport(page: number): void {
		this.support_data = [];

		this._host
			.get_support_entries(this.hostId, page, this.sort_column, this.sort_order)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(res) => {
					if (res.paging.entities.length === 0) {
						this.no_support_data = true;
						this.support_data = [];
						return;
					}

					const mappedData = this.mapToTableFormat(res.paging.entities);
					this.support_data = [...mappedData];
					this.paging_data = res.paging;
				},
				(error) => {
					console.error(error);
				}
			)
			.add(() => (this.initial_load = false));
	}

	onCreateEntry(): void {
		this._dialog
			.open(CreateEntryComponent, {
				width: '600px',
				panelClass: 'app-media-modal',
				autoFocus: false,
				disableClose: true,
				data: { hostId: this.hostId }
			})
			.afterClosed()
			.subscribe((data) => {
				if (data) this.getSupport(1);
				this.reload_page(true);
			});
	}

	reload_page(e: boolean): void {
		if (e) this.ngOnInit();
	}

	private mapToTableFormat(support): any {
		let count = 1;

		return support.map((s: any) => {
			return new UI_HOST_SUPPORT(
				{ value: count++, editable: false },
				{ value: s.ticketId, hidden: true },
				{ value: s.hostId, hidden: true },
				{ value: this._date.transform(s.dateCreated, 'MMMM d, y'), hidden: false },
				{ value: s.url ? s.url : '--', hidden: false, globalLink: `${s.url}`, new_tab_link: true },
				{ value: s.notes ? s.notes : '--', hidden: false, notes: true },
				{ value: s.dateUpdated, hidden: true },
				{ value: s.createdBy, hidden: true }
			);
		});
	}
}
