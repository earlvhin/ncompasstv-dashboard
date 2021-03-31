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
	tbl_screen_columns = [
		'#',
		'Screen Name',
		// 'Description',
		'Dealer',
		'Hosts',
		'Type',
		'Template',
		'Date Created', 
		'Last Update',
		'Created By',
		'Action'
	]
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
		// this.searching = true;
		this.ngOnInit();
	}

	getTotalScreens() {
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
		this._screen.get_screens(e, this.search_data).subscribe(
			data => {
				if (data.piContents.length > 0) {
					this.screens = this.screen_mapToUI(data.piContents);
					this.filtered_data = this.screen_mapToUI(data.piContents);
				} else {
					if(this.search_data == "") {
						this.no_screen = true;
					}
					this.filtered_data = []
				}
				this.initial_load = false;
				this.paging_data = data.paging;
				this.searching = false;
			}
		)
	}

	screen_mapToUI(data) {
		let counter = 1;
		return data.map(
			s => {
				return new UI_TABLE_SCREEN (
					{ value: s.screen.screenId, link: null , editable: false, hidden: true},
					{ value: counter++, link: null , editable: false, hidden: false},
					{ value: this._titlecase.transform(s.screen.screenName), link: '/administrator/screens/' +  s.screen.screenId, editable: false, hidden: false},
					// { value: this._titlecase.transform(s.screen.description) || 'No Description', link: null, editable: false, hidden: false},
					{ value: this._titlecase.transform(s.dealer.businessName), link: '/administrator/dealers/' + s.dealer.dealerId, editable: false, hidden: false},
					{ value: s.host ? this._titlecase.transform(s.host.name) : '--', link: s.host ? '/administrator/hosts/' + s.host.hostId : null, editable: false, hidden: false},
					{ value: s.screenType.screenTypeId ? this._titlecase.transform(s.screenType.name) : '--', link: null, editable: true, dropdown_edit: true, label:'Screen Type', id: s.screen.screenId, name: s.screen.screenName, hidden: false},
					{ value: s.template ? this._titlecase.transform(s.template.name) : null, link: null, editable: false, hidden: false},
					{ value: this._date.transform(s.screen.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false},
					{ value: this._date.transform(s.screen.dateUpdated, 'MMM d, y, h:mm a') || '--', link: null, editable: false, hidden: false},
					{ value: s.createdBy ? this._titlecase.transform(`${s.createdBy.firstName} ${s.createdBy.lastName}`) : '--', link: '/administrator/users/' + s.createdBy.userId, editable: false, hidden: false},	
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
