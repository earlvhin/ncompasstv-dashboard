import { Component, OnInit } from '@angular/core';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { ScreenService } from '../../../../global/services/screen-service/screen.service';
import { UI_DEALER_TABLE_SCREEN } from 'src/app/global/models/ui_table-screens.model';

@Component({
	selector: 'app-screens',
	templateUrl: './screens.component.html',
	styleUrls: ['./screens.component.scss'],
	providers: [TitleCasePipe, DatePipe]
})
export class ScreensComponent implements OnInit {
	filtered_data: any = [];
	initial_load: boolean = true;
	paging_data: any;
	screens: any = [];
	title: string = 'Screens';
	search_data: string = '';
	searching: boolean = false;
	screen_details: any;
	no_screen: boolean = false;
	is_view_only = false;

	tbl_screen_columns = ['#', 'Screen Name', 'Type', 'Hosts', 'Template', 'Creation Date', 'Created By'];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(private _auth: AuthService, private _date: DatePipe, private _screen: ScreenService, private _titlecase: TitleCasePipe) {}

	ngOnInit() {
		this.getAllScreens(1);
		this.getTotalScreens(this.currentUser.roleInfo.dealerId);
		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
		if (!this.is_view_only) this.tbl_screen_columns.push('Action');
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	filterData(e) {
		if (e) {
			this.search_data = e;
			this.getAllScreens(1);
		} else {
			this.search_data = '';
			this.getAllScreens(1);
		}
	}

	getTotalScreens(id: string): void {
		this.screen_details = {};
		this._screen
			.get_screen_total_by_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: any) => {
					this.screen_details = {
						basis: response.total,
						basis_label: 'Screen(s)',
						good_value: response.totalActive,
						good_value_label: 'Active',
						bad_value: response.totalInActive,
						bad_value_label: 'Inactive',
						new_this_week_value: response.newScreensThisWeek,
						new_this_week_value_label: 'Screen(s)',
						new_this_week_value_description: 'New this week',
						new_last_week_value: response.newScreensLastWeek,
						new_last_week_value_label: 'Screen(s)',
						new_last_week_value_description: 'New last week'
					};
				},
				(error) => {
					console.error(error);
				}
			);
	}

	getAllScreens(page: number): void {
		this.searching = true;
		this.screens = [];

		this._screen
			.api_get_screen_by_dealer_table(page, this.currentUser.roleInfo.dealerId, this.search_data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					this.paging_data = response.paging;

					if (response.paging.entities.length > 0) {
						this.screens = this.mapScreenToUI(response.paging.entities);
						this.filtered_data = this.mapScreenToUI(response.paging.entities);
					} else {
						if (this.search_data == '') {
							this.no_screen = true;
						}

						this.filtered_data = [];
					}

					this.initial_load = false;
					this.searching = false;
				},
				(error) => {
					console.error(error);
				}
			);
	}

	private get currentUser() {
		return this._auth.current_user_value;
	}

	private mapScreenToUI(data: any[]): UI_DEALER_TABLE_SCREEN[] {
		let counter = this.paging_data.pageStart;

		return data.map((screen) => {
			return new UI_DEALER_TABLE_SCREEN(
				{ value: screen.screenId, link: null, editable: false, hidden: true },
				{ value: counter++, link: null, editable: false, hidden: false },
				{
					value: this._titlecase.transform(screen.screenName),
					link: '/sub-dealer/screens/' + screen.screenId,
					editable: false,
					hidden: false
				},
				{
					value: screen.screenTypeName ? this._titlecase.transform(screen.screenTypeName) : '--',
					link: '/sub-dealer/hosts/' + screen.hostId,
					editable: false,
					hidden: false
				},
				{ value: screen.hostName ? this._titlecase.transform(screen.hostName) : '--', link: '/sub-dealer/hosts/' + screen.hostId, editable: false, hidden: false },
				{ value: screen.templateId ? this._titlecase.transform(screen.templateName) : null, link: null, editable: false, hidden: false },
				{ value: this._date.transform(screen.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false },
				{ value: this._titlecase.transform(screen.createByName), link: null, editable: false, hidden: false }
			);
		});
	}
}
