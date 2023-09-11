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
	@Input() ad_value: number;
	@Input() ad_value_label: string;
	@Input() menu_value: number;
	@Input() menu_value_label: string;
	@Input() closed_value: number;
	@Input() closed_value_label: string;
	@Input() filler_data: any = {};
	@Input() unassigned_value_label: string;
	@Input() has_screen_type: boolean;
	@Input() is_filler: boolean;
	@Input() this_week_ad_value: number;
	@Input() this_week_menu_value: number;
	@Input() this_week_closed_value: number;
	@Input() this_week_unassigned_value: number;
	@Input() last_week_ad_value: number;
	@Input() last_week_menu_value: number;
	@Input() last_week_closed_value: number;
	@Input() last_week_unassigned_value: number;
	@Input() is_this_week: boolean;
	@Input() is_last_week: boolean;
	@Input() sub_data?: { value: number; label: string };

	constructor() {}

	ngOnInit() {}
}
