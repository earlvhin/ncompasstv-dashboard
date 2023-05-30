import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-fillers',
	templateUrl: './fillers.component.html',
	styleUrls: ['./fillers.component.scss']
})
export class FillersComponent implements OnInit {
	title = 'Fillers Library';

	constructor() {}

	ngOnInit() {}

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
}
