import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'app-data-card-count',
	templateUrl: './data-card-count.component.html',
	styleUrls: ['./data-card-count.component.scss']
})

export class DataCardCountComponent implements OnInit {

	@Input() data_value: number;
	@Input() data_label: string;
	@Input() data_description: string;

	constructor() { }

	ngOnInit() {
	}

}
