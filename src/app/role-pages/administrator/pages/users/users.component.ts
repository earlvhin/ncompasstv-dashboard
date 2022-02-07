import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common'
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { HelperService, RoleService, UserService } from 'src/app/global/services';
import { API_FILTERS, UI_TABLE_USERS, UI_USER_STATS, USER, USER_ROLE } from 'src/app/global/models';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-users',
	templateUrl: './users.component.html',
	styleUrls: ['./users.component.scss'],
	providers: [DatePipe]
})

export class UsersComponent implements OnInit, OnDestroy {

	current_filters: API_FILTERS = { page: 1 };
	current_role_selected: string;
	filtered_data = [];
	initial_load = true;
	no_user: boolean = false;
	paging_data: any;
	roles: USER_ROLE[] = [];
	searching = false;
	title: string = 'Users';
	users: UI_TABLE_USERS[] = [];
	user_details: UI_USER_STATS;

	users_table_columns = [
		{ name: '#', },
		{ name: 'Name', },
		{ name: 'Email Address', },
		{ name: 'Contact Number', },
		{ name: 'Role', },
		{ name: 'Affiliation', },
		{ name: 'Email Notification', type: 'toggle' },
		{ name: 'Creation Date', },
		{ name: 'Created By', }
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _date: DatePipe,
		private _dialog: MatDialog,
		private _helper: HelperService,
		private _role: RoleService,
		private _user: UserService,
	) { }

	ngOnInit() {
		this.getUserTotal();
		this.getAllusers();
		this.getAllUserRoles();
		this.subscribeToToggleEmailNotification();
		this.subscribeToPageRefresh();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getAllusers() {
		this.pageRequested();
	}

	filterData(event: string): void {
		let keyword = '';
		if (event) keyword = event;
		this.current_filters.search = keyword;
		this.pageRequested();
	}

	onClearSelectedRole() {
		delete this.current_filters.roleId;
		this.pageRequested();
	}
	
	onFilterByRole(data: USER_ROLE) {
		this.current_filters.roleId = data.roleId;
		this.current_role_selected = data.roleName;
		this.pageRequested();
	}

	pageRequested(page: number = 1): void {
		this.current_filters.page = page;
		this.searching = true;
		this.users = [];

		this._user.get_users_by_filters(this.current_filters).pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {

					if (!response.users) {
						this.filtered_data = [];
						if (this.current_filters.search === '') this.no_user = true;
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

	private confirmEmailNotificationToggle(userId: string, value: boolean, tableDataIndex: number, currentEmail: string): void {

		let type = 'Enable';
		if (!value) type = 'Disable';
		const status = 'warning';
		const message = `${type} email notifications`;
		const data = `Proceed update for ${currentEmail}?`;

		const dialog = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});	

		dialog.afterClosed()
			.subscribe(
				(response: boolean) => {

					if (!response) {
						this._helper.onResultToggleEmailNotification.emit({ updated: false, tableDataIndex });
						return;
					}

					this.updateEmailNotification(userId, value);
				}
			);
	}

	private getAllUserRoles() {
		this._role.get_roles().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => this.roles = response,
				error => console.log('Error retrieving user roles', error)
			);
	}
	
	private getUserTotal(): void {

		this._user.get_user_total().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					this.user_details = {
						basis: response.totalUsers,
						basis_label: 'User(s)',
						super_admin_count: response.totalSuperAdmin,
						super_admin_label: 'Super Admin(s)',
						total_dealer: response.totalDealer,
						total_dealer_label: 'Dealer(s)',
						total_host: response.totalHost,
						total_host_label: 'Host(s)',
						total_advertiser: response.totalAdvertisers,
						total_advertiser_label: 'Advertiser(s)',
						total_tech: response.totalTech,
						total_tech_label: 'Tech(s)',
						admin_count: response.totalAdmin,
						admin_label: 'Admin(s)',
						sub_dealer_count: response.totalSubdealers,
						sub_dealer_label: 'Sub-dealer (s)'
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
				const allowEmail = user.allowEmail === 1 ? true : false;
				if (role.roleName === 'Sub Dealer') permission = role.permission;

				const result = new UI_TABLE_USERS(
					{ value: user.userId, link: null , editable: false, hidden: true },
					{ value: count++, link: null , editable: false, hidden: false },
					{ value: `${user.firstName} ${user.lastName}`, permission, link: `/administrator/users/${user.userId}` },
					{ value: user.email, link: null, editable: false, hidden: false },
					{ value: user.contactNumber, link: null, editable: false, hidden: false },
					{ value: role.roleName, link: null, editable: false, hidden: false },
					{ value: this._date.transform(user.dateCreated), link: null, editable: false, hidden: false },
					{ value: user.creatorName, link: `/administrator/users/${user.createdBy}`, editable: false, hidden: false },
					{ value: user.organization ? user.organization : '--', link: null, editable: false, hidden: false },
					{ value: allowEmail, type: 'toggle' },
				);

				return result;
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

	private subscribeToToggleEmailNotification(): void {

		this._helper.onToggleEmailNotification
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { userId: string, value: boolean, tableDataIndex: number, currentEmail: string }) => {
					const { userId, value, tableDataIndex, currentEmail } = response;
					this.confirmEmailNotificationToggle(userId, value, tableDataIndex, currentEmail);
				},
				error => console.log('Error on email notification toggle ', error)
			);

	}

	private updateEmailNotification(userId: string, value: boolean): void {
		this._user.update_email_notifications(userId, value)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				() => console.log('Email setting updated'),
				error => console.log('Error updating email notification ', error)
			);
	}

}
