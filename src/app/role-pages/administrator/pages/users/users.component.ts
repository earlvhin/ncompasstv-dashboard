import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common'
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { HelperService } from 'src/app/global/services/helper-service/helper.service';
import { UserService } from '../../../../global/services/user-service/user.service';
import { UI_TABLE_USERS } from '../../../../global/models/ui_table-users.model';
import { USER } from 'src/app/global/models/api_user.model';

@Component({
	selector: 'app-users',
	templateUrl: './users.component.html',
	styleUrls: ['./users.component.scss'],
	providers: [DatePipe]
})

export class UsersComponent implements OnInit, OnDestroy {

	filtered_data = [];
	initial_load = true;
	no_user: boolean = false;
	paging_data: any;
	searching = false;
	search_data = '';
	title: string = 'Users';
	users: UI_TABLE_USERS[] = [];
	user_details: any;

	users_table_columns = [
		'#',
		'Name',
		'Email Address',
		'Contact Number',
		'Role',
		'Affiliation',
		'Creation Date',
		'Created By'
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _date: DatePipe,
		private _helper: HelperService,
		private _user: UserService,
	) { }

	ngOnInit() {
		this.getUserTotal();
		this.getAllusers();
		this.subscribeToPageRefresh();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getAllusers() {
		this.pageRequested(1);
	}

	filterData(event: string): void {
		let keyword = '';
		if (event) keyword = event;
		this.search_data = keyword;
		this.pageRequested(1);
	}

	pageRequested(page: number): void {
		this.searching = true;
		this.users = [];

		this._user.get_users_by_page(page, this.search_data).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {

					if (!response.users) {
						this.filtered_data = [];
						if (this.search_data == '') this.no_user = true;
						return;
					}

					this.paging_data = response.paging;

					const mappedData = this.mapToUIFormat(response.users);
					this.users = mappedData;
					this.filtered_data = mappedData;

				},
				error => console.log('Error retrieving users by page', error)
			)
			.add(
				() => {
					this.initial_load = false;
					this.searching = false;
				}
			);

	}
	
	private getUserTotal(): void {

		this._user.get_user_total().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					this.user_details = {
						basis: response.totalUsers,
						basis_label: 'User(s)',
						total_administrator: response.totalSuperAdmin,
						total_administrator_label: 'Admin(s)',
						total_dealer: response.totalDealer,
						total_dealer_label: 'Dealer(s)',
						total_host: response.totalHost,
						total_host_label: 'Host(s)',
						total_advertiser: response.totalAdvertisers,
						total_advertiser_label: 'Advertiser(s)',
						total_tech: response.totalTech,
						total_tech_label: 'Tech(s)'
					}
				},
				error => console.log('Error retrieving user total', error)
			);

	}

	private mapToUIFormat(data: USER[]): UI_TABLE_USERS[] {
		let count = this.paging_data.pageStart;
		
		return data.map(
			user => {

				let permission = null;
				const role = user.userRoles[0];
				if (role.roleName === 'Sub Dealer') permission = role.permission;

				return new UI_TABLE_USERS(
					{ value: user.userId, link: null , editable: false, hidden: true },
					{ value: count++, link: null , editable: false, hidden: false },
					{ value: `${user.firstName} ${user.lastName}`, permission, link: `/administrator/users/${user.userId}` },
					{ value: user.email, link: null, editable: false, hidden: false },
					{ value: user.contactNumber, link: null, editable: false, hidden: false },
					{ value: role.roleName, link: null, editable: false, hidden: false },
					{ value: this._date.transform(user.dateCreated), link: null, editable: false, hidden: false },
					{ value: user.creatorName, link: `/administrator/users/${user.createdBy}`, editable: false, hidden: false },
					{ value: user.organization ? user.organization : '--', link: null, editable: false, hidden: false },
				);
			}
		);

	}

	private subscribeToPageRefresh(): void {

		this._helper.onRefreshUsersPage.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => this.ngOnInit(),
				error => console.log('Error on users page refresh subscription ', error)
			);

	}
}
