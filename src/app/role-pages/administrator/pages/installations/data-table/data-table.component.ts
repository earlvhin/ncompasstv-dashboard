import { Component, OnDestroy, OnInit, Input } from '@angular/core';

@Component({
	selector: 'app-installations-table',
	templateUrl: './data-table.component.html',
	styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnInit, OnDestroy {

	@Input() table_data: { columns: { name: string }[], rows: any[] };

	constructor() { }

	ngOnInit() {
	}

	ngOnDestroy() {
	}
}