import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UI_TABLE_USERS } from 'src/app/global/models/ui_table-users.model';
import { UserService } from 'src/app/global/services/user-service/user.service';
import { DatePipe } from '@angular/common';
import { USER } from 'src/app/global/models/api_user.model';
import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { UI_ROLE_DEFINITION } from '../../../../global/models/ui_role-definition.model';

@Component({
	selector: 'app-users',
	templateUrl: './users.component.html',
	styleUrls: ['./users.component.scss'],
	providers: [DatePipe]
})
export class UsersComponent implements OnInit {
	title: string = 'Users';
	filtered_data: any = [];
	subscription: Subscription = new Subscription();
	row_url: string = '/sub-dealer/users/';
	row_slug: string = 'user_id';
	users: UI_TABLE_USERS[] = [];
	loading_data: boolean = true;
	no_user: boolean = false;
	user_details: any;
	users_table_column = ['#', 'Name', 'Email Address', 'Contact Number', 'Role', 'Creation Date', 'Created By'];

	constructor(private _user: UserService, private _date: DatePipe, private _auth: AuthService) {}

	ngOnInit() {
		this.getAllusers();
	}

	filterData(data) {
		this.filtered_data = data;
	}

	getAllusers() {
		var new_data = [];
		var count_host = 0;
		var count_advertiser = 0;
		this.subscription.add(
			this._user.get_users().subscribe(
				(data) => {
					if (data.users.length > 0) {
						data = data.users.filter((i) => {
							return i.createdBy == this._auth.current_user_value.user_id;
						});
						data.map((user) => {
							user.userRoles.map((roles) => {
								if (roles.roleId === UI_ROLE_DEFINITION.host) {
									count_host = count_host + 1;
								} else if (roles.roleId === UI_ROLE_DEFINITION.advertiser) {
									count_advertiser = count_advertiser + 1;
								} else {
								}
							});
						});

						if (data.length > 0) {
							this.users = this.mapToUIFormat(data);
							this.filtered_data = this.mapToUIFormat(data);
						} else {
							this.no_user = true;
							this.filtered_data = [];
						}
					} else {
						this.no_user = true;
						this.filtered_data = [];
					}

					this.user_details = {
						basis: data.length,
						basis_label: 'Total User(s)',
						hosts: count_host,
						hosts_label: 'Host(s)',
						advertiser: count_advertiser,
						advertiser_label: 'Advertiser(s)'
					};

					this.loading_data = false;
				},
				(error) => {
					console.error(error);
				}
			)
		);
	}

	mapToUIFormat(data: USER[]): UI_TABLE_USERS[] {
		let count = 1;

		return data.map((u: USER) => {
			return new UI_TABLE_USERS(
				{ value: u.userId, link: null, editable: false, hidden: true },
				{ value: count++, link: null, editable: false, hidden: false },
				{ value: u.firstName + ' ' + u.lastName, link: '/sub-dealer/users/' + u.userId, editable: false, hidden: false },
				{ value: u.email, link: null, editable: false, hidden: false },
				{ value: u.contactNumber, link: null, editable: false, hidden: false },
				{ value: u.userRoles[0].roleName, link: null, editable: false, hidden: false },
				{ value: this._date.transform(u.dateCreated), link: null, editable: false, hidden: false },
				{ value: u.creatorName, link: null, editable: false, hidden: false },
				{ value: u.organization ? u.organization : '--', link: null, editable: false, hidden: false },
				{ value: u.allowEmail, type: 'toggle' }
			);
		});
	}
}
