import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'app-data-card-compare',
	templateUrl: './data-card-compare.component.html',
	styleUrls: ['./data-card-compare.component.scss']
})
export class DataCardCompareComponent implements OnInit {

	@Input() compare_basis: number;
	@Input() compare_basis_label: string;
	@Input() good_value: number;
	@Input() good_value_label: string;
	@Input() bad_value: number;
	@Input() bad_value_label: string; 
	@Input() additional_value: number;
	@Input() additional_value_label: string;
	@Input() is_green: boolean;

	constructor() { }

	ngOnInit() {
	}

}
