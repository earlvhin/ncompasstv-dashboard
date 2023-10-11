import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'app-data-quick-stats',
	templateUrl: './data-quick-stats.component.html',
	styleUrls: ['./data-quick-stats.component.scss']
})
export class DataQuickStatsComponent implements OnInit {
	@Input() total: number;
	@Input() total_label: number;
	@Input() active: number;
	@Input() active_label: string;
	@Input() inactive: number;
	@Input() inactive_label: string;
	@Input() id: string;
	@Input() icon: string;
	@Input() notes: string;
	@Input() sub_label_left: string;
	@Input() sub_label_left_value: string;
	@Input() sub_label_left_icon: string;
	@Input() sub_label_right: string;
	@Input() sub_label_right_value: string;
	@Input() sub_label_right_icon: string;

	constructor() {}

	ngOnInit() {}
}
