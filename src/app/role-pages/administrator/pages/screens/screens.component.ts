import { Component, OnInit } from '@angular/core';
import { ScreenService } from '../../../../global/services/screen-service/screen.service';
import { Subscription } from 'rxjs';
import { API_SINGLE_SCREEN } from 'src/app/global/models/api_single-screen.model';
import { UI_TABLE_SCREEN } from 'src/app/global/models/ui_table-screens.model';
import { TitleCasePipe, DatePipe } from '@angular/common'

@Component({
	selector: 'app-screens',
	templateUrl: './screens.component.html',
	styleUrls: ['./screens.component.scss'],
	providers: [
		TitleCasePipe, 
		DatePipe
	],
})

export class ScreensComponent implements OnInit {

	screens: UI_TABLE_SCREEN[] = [];
	screen_data: any = [];
	subscription: Subscription = new Subscription;
	title: string = "Screens";
	filtered_data: UI_TABLE_SCREEN[] = [];
	no_screen: boolean = false;
	screen_details: any = {};
	paging_data : any;
	searching: boolean = false;
	sort_column: string = "";
	sort_order: string = "";

	//Documentation for columns:
	//Name = Column Name, Sortable: If Sortable, Column: For BE Key to sort, Key: Column to be exported as per API, No_export: Dont Include to Export
	tbl_screen_columns = [ 
		{ name: '#', sortable: false, no_export: true},
		{ name: 'Screeen Name', sortable: true, column:'ScreenName', no_export: true},
		{ name: 'Dealer', sortable: true, column:'BusinessName', no_export: true},
		{ name: 'Hosts', sortable: true, column:'HostName', no_export: true},
		{ name: 'Type', sortable: true, column:'ScreenTypeName', no_export: true},
		{ name: 'Template', sortable: true, column:'TemplateName', no_export: true},
		{ name: 'Creation Date', sortable: true, column:'DateCreated', no_export: true},
		{ name: 'Last Update', sortable: true, column:'DateUpdated', no_export: true},
		{ name: 'Created By', sortable: true, column:'CreatedBy',  no_export: true},
		{ name: 'Action', sortable: false, no_export: true},
	];

	initial_load: boolean = true;
	search_data: string = "";

	constructor(
		private _screen: ScreenService,
		private _titlecase: TitleCasePipe,
		private _date: DatePipe,
	) { }

	ngOnInit() {
		this.pageRequested(1);
		this.getTotalScreens();
	}

	fromDelete() {
		this.ngOnInit();
	}

	getTotalScreens() {
        this.screen_details = {};
		this.subscription.add(
			this._screen.get_screen_total().subscribe(
				(data: any) => {
					this.screen_details.basis = data.total;
					this.screen_details.basis_label = 'Screen(s)';
					this.screen_details.good_value = data.totalActive;
					this.screen_details.good_value_label = 'Active';
					this.screen_details.bad_value = data.totalInActive;
					this.screen_details.bad_value_label = 'Inactive';

					this.screen_details.new_this_week_value = data.newScreensThisWeek;
					this.screen_details.new_this_week_value_label = 'Screen(s)';
					this.screen_details.new_this_week_value_description = 'New this week';
					
					this.screen_details.new_last_week_value = data.newScreensLastWeek;
					this.screen_details.new_last_week_value_label = 'Screen(s)';
					this.screen_details.new_last_week_value_description = 'New last week';
				}
			)
		)
	}

	pageRequested(e) {
		this.searching = true;
		this.screens = [];
		this._screen.get_screens(e, this.search_data,  this.sort_column, this.sort_order).subscribe(
			data => {
                this.paging_data = data.paging;
				if (data.paging.entities) {
					this.screens = this.screen_mapToUI(data.paging.entities);
					this.filtered_data = this.screen_mapToUI(data.paging.entities);
				} else {
					if(this.search_data == "") {
						this.no_screen = true;
					}
					this.filtered_data = []
				}
				this.initial_load = false;
				this.searching = false;
			}
		)
	}

	getColumnsAndOrder(data) {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.pageRequested(1);
	}

	screen_mapToUI(data) {
		let counter = this.paging_data.pageStart;
		return data.map(
			s => {
				return new UI_TABLE_SCREEN (
					{ value: s.screenId, link: null , editable: false, hidden: true},
					{ value: counter++, link: null , editable: false, hidden: false},
					{ value: this._titlecase.transform(s.screenName), link: '/administrator/screens/' +  s.screenId, editable: false, hidden: false, new_tab_link: true},
					{ value: this._titlecase.transform(s.businessName), link: '/administrator/dealers/' + s.dealerId, editable: false, hidden: false, new_tab_link: true},
					{ value: s.hostName != null ? this._titlecase.transform(s.hostName) : '--', link: s.hostName ? '/administrator/hosts/' + s.hostId : null, editable: false, hidden: false, new_tab_link: true},
					{ value: s.screenTypeName != '' ? this._titlecase.transform(s.screenTypeName) : '--', link: null, editable: true, dropdown_edit: true, label:'Screen Type', id: s.screenId, name: s.screenName, hidden: false},
					{ value: s.templateName != '' ? this._titlecase.transform(s.templateName) : null, link: null, editable: false, hidden: false},
					{ value: this._date.transform(s.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false},
					{ value: this._date.transform(s.dateUpdated, 'MMM d, y, h:mm a') || '--', link: null, editable: false, hidden: false},
					{ value: s.createdBy ? this._titlecase.transform(s.createdBy) : '--', link: '/administrator/users/' + s.createdById, editable: false, hidden: false, new_tab_link: true},	
				)
			}
		)
	}

	filterData(e) {
		if (e) {
			this.search_data = e;
			this.pageRequested(1);
		} else {
			this.search_data = "";
			this.pageRequested(1);
		}
	}
}
