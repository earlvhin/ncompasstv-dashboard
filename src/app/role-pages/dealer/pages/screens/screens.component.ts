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
	screens: any = [];
	subscription: Subscription = new Subscription;
	title: string = "Screens";
	screen_details: any;
	no_screen: boolean = false;

	tbl_screen_columns = [
		'#',
		'Screen Name',
		'Type',
		'Hosts',
		'Template',
		'Date Created', 
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
		this.getAllScreens();
		this.getTotalScreens(this._auth.current_user_value.roleInfo.dealerId)
	}

	filterData(data) {
		this.filtered_data = data;
	}

	getTotalScreens(id) {
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


	getAllScreens() {
		this._screen.get_screen_by_dealer_id(this._auth.current_user_value.roleInfo.dealerId).subscribe(
			(data: API_SINGLE_SCREEN[]) => {
				if (data.length > 0) {
					this.screens = this.screen_mapToUI(data);
					this.filtered_data = this.screen_mapToUI(data);
				} else {
					this.screens = { message: 'no record found'}
					this.no_screen = true;
					this.filtered_data = [];
				}
			}
		)
	}

	screen_mapToUI(data: any) {
		let counter = 1;
		console.log(data)
		return data.map(
			s => {
				return new UI_DEALER_TABLE_SCREEN (
					{ value: s.screen.screenId, link: null , editable: false, hidden: true},
					{ value: counter++, link: null , editable: false, hidden: false},
					{ value: this._titlecase.transform(s.screen.screenName), link: '/dealer/screens/' +  s.screen.screenId, editable: false, hidden: false},
					{ value: s.screenType ? this._titlecase.transform(s.screenType.name) : '--', link: '/dealer/hosts/' +  s.host.hostId, editable: false, hidden: false},
					{ value: this._titlecase.transform(s.host.name), link: '/dealer/hosts/' +  s.host.hostId, editable: false, hidden: false},
					{ value: s.template ? this._titlecase.transform(s.template.name) : null, link: null, editable: false, hidden: false},
					{ value: this._date.transform(s.screen.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false},
					{ value: this._titlecase.transform(`${s.createdBy.firstName} ${s.createdBy.lastName}`), link: null, editable: false, hidden: false},
				)
			}
		)
	}
}
