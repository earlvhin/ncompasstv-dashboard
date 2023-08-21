import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject, pipe } from 'rxjs';

import { API_LICENSE, PAGING, UI_CURRENT_USER, UI_HOST_LICENSE, UI_ROLE_DEFINITION_TEXT } from 'src/app/global/models';
import { CreateEntryComponent } from 'src/app/global/components_shared/host_components/create-entry/create-entry.component';
import { UI_HOST_SUPPORT } from 'src/app/global/models/ui_host_support';
import { AuthService, HostService } from 'src/app/global/services';


@Component({
	selector: 'app-support-tab',
	templateUrl: './support-tab.component.html',
	styleUrls: ['./support-tab.component.scss']
})
export class SupportTabComponent implements OnInit {
	isViewOnly = false;
	support_data: UI_HOST_SUPPORT[] = [];
	sort_column = 'DateCreated';
	searching = false;
	paging_data: any;
	initial_load = true;

	support_table_column = [
		{ name: '#', sortable: false },
		{ name: 'Date Added', column: 'dateCreated' },
		{ name: 'URL', column: 'url' },
		{ name: 'Notes', column: 'notes' }
	];

	@Input() hostId: string;
	@Input() currentUser: UI_CURRENT_USER;

	constructor(private _auth: AuthService, private _date: DatePipe, private _dialog: MatDialog, private _host: HostService) {}
	protected _unsubscribe: Subject<void> = new Subject<void>();

	ngOnInit() {
		this.isViewOnly = this.currentUser.roleInfo.permission === 'V';
		this.getSupport(1);
	}


	getSupport(page: number): void {
		this.searching = true;
		this.support_data = [];

		this._host
			.get_support_entries(page)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((res) => {
				const mappedData = this.mapToTableFormat(res.paging.entities);
				this.support_data = [...mappedData];
				this.paging_data = res.paging;

				console.log(this.paging_data, 'sd');
			},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => {
				this.initial_load = false;
			});
	}

	onCreateEntry(): void {
		const dialog = this._dialog.open(CreateEntryComponent, {
			width: '600px',
			panelClass: 'app-media-modal',
			autoFocus: false,
			disableClose: true,
			data: { hostId: this.hostId }
		});

		dialog.afterClosed().subscribe((data) => {
			if (data) this.getSupport(1);
			this.reload_page(true);
			console.log(data, 'data');
		});
	}

	reload_page(e: boolean):void {
		if (e) this.ngOnInit();
	}

	private mapToTableFormat(support): any {
		let count = 1;

		return support.map((s: any) => {
			console.log(s, 'support');
				return new UI_HOST_SUPPORT(
					{value: count++, editable: false},
					{ value: s.ticketId, hidden: true },
					{ value: s.hostId, hidden: true  },
					{ value: this._date.transform(s.dateCreated, "MMMM d, y"), hidden: false },
					{ value: s.url, hidden: false },
					{ value: s.notes, hidden: false  },
					{ value: s.dateUpdated, hidden: true  },
					{ value: s.createdBy, hidden: true  }
				);
		});
	}
}
