import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { UI_TABLE_USERS } from 'src/app/global/models/ui_table-users.model';
import { UI_ROLE_DEFINITION } from '../../../../global/models/ui_role-definition.model';
import { USER } from 'src/app/global/models/api_user.model';
import { UserService } from 'src/app/global/services/user-service/user.service';

@Component({
	selector: 'app-users',
	templateUrl: './users.component.html',
	styleUrls: ['./users.component.scss'],
	providers: [DatePipe]
})

export class UsersComponent implements OnInit, OnDestroy {

	filtered_data: any = [];
	loading_data = true;
	no_user = false;
	row_slug = 'user_id';
	row_url = '/dealer/users/';
	title: string = 'Users';
	user_details: any;
	users: UI_TABLE_USERS[] = [];

	users_table_column = [
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
		private _auth: AuthService,
		private _date: DatePipe,
		private _user: UserService,
	) { }

	ngOnInit() {
		this.getAllusers();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	filterData(data): void {
		this.filtered_data = data;
	}

	private get currentUser() {
		return this._auth.current_user_value;
	}

	private countUserRoles(data: USER[]): void {

		let advertiser_count = 0;
		let host_count = 0;
		let sub_dealer_count = 0;

		data.forEach(
			user => {
				user.userRoles.forEach(
					role => {

						switch (role.roleId) {
							case UI_ROLE_DEFINITION.host:
								host_count++;
								break;
							case UI_ROLE_DEFINITION.advertiser:
								advertiser_count++;
								break;
							default:
								sub_dealer_count++;

						}
					}
				);
			}
		);

		this.user_details = {
			basis: data.length,
			basis_label: 'Total User(s)',
			hosts: host_count,
			hosts_label: 'Host(s)',
			advertiser: advertiser_count,
			advertiser_label: 'Advertiser(s)',
			sub_dealer_count,
			sub_dealer_label: 'Sub Dealer(s)'
		};

	}

	private getAllusers(): void {
		let users: USER[] = [];
		
		this._user.get_users().pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { paging, users: USER[] }) => {

					if (!response.users || response.users.length <= 0) {
						this.no_user = true;
						this.filtered_data = [];
						return;
					}

					users = response.users.filter(user => user.organization === this.currentUser.roleInfo.businessName);

					if (users.length <= 0) {
						this.no_user = true;
						this.filtered_data = [];
						return;
					}

					this.countUserRoles(users);
					const mappedUsers = this.mapToUIFormat(users);
					this.users = mappedUsers;
					this.filtered_data = mappedUsers;

				}, 
				error => console.log('Error retrieving users', error)
			)
			.add(() => this.loading_data = false);
	}

	private mapToUIFormat(data: USER[]): UI_TABLE_USERS[] {
		let count = 1;

		return data.map(
			(u: USER) => {

				let permission = null;
				const role = u.userRoles[0];
				if (role.roleName === 'Sub Dealer') permission = role.permission;

				return new UI_TABLE_USERS(
					{ value: u.userId, link: null , editable: false, hidden: true },
					{ value: count++, link: null , editable: false, hidden: false },
					{ value: `${u.firstName} ${u.lastName}`, permission, link: `/dealer/users/${u.userId}`, editable: false, hidden: false },
					{ value: u.email, link: null, editable: false, hidden: false },
					{ value: u.contactNumber, link: null, editable: false, hidden: false },
					{ value: u.userRoles[0].roleName, link: null, editable: false, hidden: false },
					{ value: this._date.transform(u.dateCreated), link: null, editable: false, hidden: false },
					{ value: u.creatorName, link: null, editable: false, hidden: false },
					{ value: u.organization ? u.organization : '--', link: null, editable: false, hidden: false },
				);

			}
		);
	}
}
