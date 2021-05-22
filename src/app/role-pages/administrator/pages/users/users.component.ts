import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common'
import { Observable, Subscription } from 'rxjs';
import { UserService } from '../../../../global/services/user-service/user.service';
import { USER } from '../../../../global/models/api_user.model';
import { UI_TABLE_USERS } from '../../../../global/models/ui_table-users.model';
import { UI_ROLE_DEFINITION } from '../../../../global/models/ui_role-definition.model';

@Component({
	selector: 'app-users',
	templateUrl: './users.component.html',
	styleUrls: ['./users.component.scss'],
	providers: [DatePipe]
})

export class UsersComponent implements OnInit {

	title: string = "Users"
	subscription: Subscription = new Subscription;
	users: UI_TABLE_USERS[] = [];
	user_details: any;
	no_user: boolean = false;
	filtered_data: any = [];
	paging_data: any;
	searching: boolean = false;
	users_table_column = [
		'#',
		'Name',
		'Email Address',
		'Contact Number',
		'Role',
		'Creation Date',
		'Created By'
	]
	initial_load: boolean = true;
	search_data: string = "";

	constructor(
		private _user: UserService,
		private _date: DatePipe
	) { }

	ngOnInit() {
		this.getUserTotal();
		this.getAllusers();
	}

	getAllusers() {
		console.log("CALLED")
		this.pageRequested(1);
	}

	pageRequested(e) {
		this.searching = true;
		this.users = [];
		this.subscription.add(
			this._user.get_users_by_page(e, this.search_data).subscribe(
				data => {
					if(data.users) {
						this.users = this.mapToUIFormat(data.users);
						this.filtered_data = this.mapToUIFormat(data.users);
						this.paging_data = data.paging;
					} else {
						if(this.search_data == "") {
							this.no_user = true;
						}
						this.filtered_data = []
					}
					this.initial_load = false;
					this.searching = false;
				},
				error => {
					console.log('#getAllUsers', error);
				}
			)
		)
	}
	
	getUserTotal() {
		this.subscription.add(
			this._user.get_user_total().subscribe(
				data => {
					console.log("TOTAL", data)
					this.user_details = {
						basis: data.totalUsers,
						basis_label: 'User(s)',
						total_administrator: data.totalSuperAdmin,
						total_administrator_label: 'Admin(s)',
						total_dealer: data.totalDealer,
						total_dealer_label: 'Dealer(s)',
						total_host: data.totalHost,
						total_host_label: 'Host(s)',
						total_advertiser: data.totalAdvertisers,
						total_advertiser_label: 'Advertiser(s)',
						total_tech: data.totalTech,
						total_tech_label: 'Tech(s)'
					}
					console.log("UTOTAL", data)
				}
			)
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

	mapToUIFormat(data) {
		console.log('users', data);
		let count = 1;
		return data.map(
			u => {
				return new UI_TABLE_USERS(
					{ value: u.userId, link: null , editable: false, hidden: true},
					{ value: count++, link: null , editable: false, hidden: false},
					{ value: u.firstName+" " +u.lastName, link: '/administrator/users/' +  u.userId, editable: false, hidden: false},
					{ value: u.email, link: null, editable: false, hidden: false},
					{ value: u.contactNumber, link: null, editable: false, hidden: false},
					{ value: u.userRoles[0].roleName, link: null, editable: false, hidden: false},
					{ value: this._date.transform(u.dateCreated), link: null, editable: false, hidden: false},
					{ value: u.creatorName, link: '/administrator/users/' +  u.createdBy, editable: false, hidden: false},
				)
			}
		)
	}
}
