import { Component, OnInit } from '@angular/core';
import { FillerService } from 'src/app/global/services';
import { Subject } from 'rxjs';
import { DatePipe } from '@angular/common';

import { takeUntil } from 'rxjs/operators';
import { UI_TABLE_FILLER_FEED } from 'src/app/global/models/ui_table-filler-feed.model';

@Component({
	selector: 'app-filler-feeds-table',
	templateUrl: './filler-feeds-table.component.html',
	styleUrls: ['./filler-feeds-table.component.scss']
})
export class FillerFeedsTableComponent implements OnInit {
	initial_load = true;
	filtered_data = [];
	fillers_paging: any;
	searching = false;

	fillers_table_column = [
		{ name: '#', sortable: false },
		{ name: 'Name', sortable: true, column: 'Name' },
		{ name: 'Quantity', sortable: true, column: 'Quantity' },
		{ name: 'Interval (Days)', sortable: true, column: 'Interval' },
		{ name: 'Owner', sortable: true, column: 'Owner' },
		{ name: '# of Groups', sortable: true, column: 'Groups' },
		{ name: 'Created Date', sortable: true, column: 'CreatedDate' },
		{ name: 'Action', sortable: false }
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _filler: FillerService, private _date: DatePipe) {}

	ngOnInit() {
		this.getAllFillerFeeds();
	}

	getAllFillerFeeds(page?) {
		this.searching = true;
		this._filler
			.get_filler_feeds('')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response) => {
				const mappedData = this.mapToTableFormat(response.paging.entities);
				this.filtered_data = [...mappedData];
				this.fillers_paging = response.paging;
			})
			.add(() => {
				this.initial_load = false;
				this.searching = false;
			});
	}

	private mapToTableFormat(filler_feeds): UI_TABLE_FILLER_FEED[] {
		let count = 1;

		return filler_feeds.map((filler) => {
			return new UI_TABLE_FILLER_FEED(
				{ value: count++, editable: false, hidden: false },
				{ value: filler.name, editable: false, hidden: false },
				{ value: 0, editable: false, hidden: false },
				{ value: filler.interval, link: null, editable: false, hidden: false, new_tab_link: true },
				{ value: filler.createdByName, link: null, editable: false, hidden: false, new_tab_link: true },
				{ value: filler.fillerGroups.length, editable: false, hidden: false },
				{ value: this._date.transform(filler.dateCreated, 'MMM dd y'), editable: false, hidden: false }
			);
		});
	}

	reloadPage(e: boolean): void {
		if (e) this.ngOnInit();
	}
}
