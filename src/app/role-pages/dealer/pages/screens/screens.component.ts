import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { ScreenService } from '../../../../global/services/screen-service/screen.service';
import { Subscription } from 'rxjs';
import { API_SINGLE_SCREEN } from 'src/app/global/models/api_single-screen.model';
import { UI_TABLE_SCREEN, UI_DEALER_TABLE_SCREEN } from 'src/app/global/models/ui_table-screens.model';
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
	filtered_data: any = [];
	initial_load: boolean = true;
	paging_data : any;
	screens: any = [];
	subscription: Subscription = new Subscription;
	title: string = "Screens";
	search_data: string = "";
	searching: boolean = false;
	screen_details: any;
	no_screen: boolean = false;

	tbl_screen_columns = [
		'#',
		'Screen Name',
		'Type',
		'Hosts',
		'Template',
		'Creation Date', 
		// 'Last Update',
		'Created By',
		'Action'
	]

	constructor(
		private _date: DatePipe,
		private _screen: ScreenService,
		private _titlecase: TitleCasePipe,
		private _auth: AuthService
	) { }

	ngOnInit() {
		this.getAllScreens(1);
		this.getTotalScreens(this._auth.current_user_value.roleInfo.dealerId)
	}

	filterData(e) {
		if (e) {
			this.search_data = e;
			this.getAllScreens(1);
		} else {
			this.search_data = "";
			this.getAllScreens(1);
		}
	}

	getTotalScreens(id) {
        this.screen_details = {};
		this.subscription.add(
			this._screen.get_screen_total_by_dealer(id).subscribe(
				(data: any) => {
					this.screen_details = {
						basis: data.total,
						basis_label: 'Screen(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInActive,
						bad_value_label: 'Inactive',
						new_this_week_value: data.newScreensThisWeek,
						new_this_week_value_label: 'Screen(s)',
						new_this_week_value_description: 'New this week',
						new_last_week_value: data.newScreensLastWeek,
						new_last_week_value_label: 'Screen(s)',
						new_last_week_value_description: 'New last week'
					}
				}
			)
		)
	}

	getAllScreens(e) {
		this.searching = true;
		this.screens = [];
		this._screen.api_get_screen_by_dealer_table(e, this._auth.current_user_value.roleInfo.dealerId, this.search_data).subscribe(
			data => {
                this.paging_data = data.paging;
				if (data.paging.entities.length > 0) {
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

	screen_mapToUI(data: any) {
		let counter = this.paging_data.pageStart;
		return data.map(
			s => {
				return new UI_DEALER_TABLE_SCREEN (
					{ value: s.screenId, link: null , editable: false, hidden: true},
					{ value: counter++, link: null , editable: false, hidden: false},
					{ value: this._titlecase.transform(s.screenName), link: '/dealer/screens/' +  s.screenId, editable: false, hidden: false, new_tab_link: true},
					{ value: s.screenTypeName ? this._titlecase.transform(s.screenTypeName) : '--', link: '/dealer/hosts/' +  s.hostId, editable: false, hidden: false},
					{ value: s.hostName ? this._titlecase.transform(s.hostName) : '--', link: '/dealer/hosts/' +  s.hostId, editable: false, hidden: false},
					{ value: s.templateId ? this._titlecase.transform(s.templateName) : null, link: null, editable: false, hidden: false},
					{ value: this._date.transform(s.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false},
					{ value: this._titlecase.transform(s.createByName), link: null, editable: false, hidden: false},
				)
			}
		)
	}
}
