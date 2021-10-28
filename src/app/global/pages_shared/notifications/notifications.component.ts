import { Component, OnInit } from '@angular/core';
import { UI_ROLE_DEFINITION } from '../../models';
import { NotificationsPaginated, Notification } from '../../models/api_notification.model';
import { AuthService } from '../../services';
import { NotificationService } from '../../services/notification-service/notification.service';

@Component({
	selector: 'app-notifications',
	templateUrl: './notifications.component.html',
	styleUrls: ['./notifications.component.scss']
})

export class NotificationsComponent implements OnInit {
	getting_notification_data: boolean = false;
	notifications: NotificationsPaginated;
	notification_items: Notification[] = [];
	is_admin: boolean;
	is_dealer: boolean;
	route: string;
	page: number = 1;
	all_unresolved: boolean = false;

	constructor(
		private _auth: AuthService,
		private _notification: NotificationService
	) { }

	ngOnInit() {
		if (this.currentUser) {
			const { firstname, user_id, role_id } = this.currentUser

			if(role_id === UI_ROLE_DEFINITION.administrator) {
				this.is_admin = true
				this.route = '/administrator'
			};

			if (role_id === UI_ROLE_DEFINITION.dealer) {
				this.is_dealer = true;
				this.route = '/dealer'
			};
			
			this.getNotifications();
		}
	}

	public updateNotifStatus(id: string) {
		this._notification.updateNotificationStatus(id).subscribe(
			() => {
				this.notification_items.map(
					i => {
						if (i.notificationId == id) {
							i.isOpened = 1;
						}
					}
				)
			}
		)
	}

	public updateAllNotifStatus() {
		if (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer') {
		this._notification.getByDealerId(this.currentUser.roleInfo.dealerId, 1, 0).subscribe(
				(data: any) => {
					this.notification_items = [];
					this.notification_items.push(...data.entities);
					this.notification_items.forEach(notif => {
						notif.isOpened = 1;
					});
					this._notification.updateNotificationStatusByDealerId(this.currentUser.roleInfo.dealerId).subscribe(
					() => {
						this.all_unresolved = false;
					});					
				}
			);
		}

		if (this.currentRole === 'administrator') {
			this._notification.getAll(1, 0).subscribe(
				(data: any) => {
					this.notification_items = [];
					this.notification_items.push(...data.entities);
					this.notification_items.forEach(notif => {
						notif.isOpened = 1;
					});
					this._notification.updateAllNotificationStatus().subscribe(
					() => {
						this.all_unresolved = false;
					});	
				}
			)
		}
	}

	public getNotifications(page?: boolean) {
		this.getting_notification_data = true;
		
		if (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer') {
			this.page = page ? this.page + 1 : this.page;
			this._notification.getByDealerId(this.currentUser.roleInfo.dealerId, page ? this.page : null).subscribe(
				(data: any) => {
					this.getting_notification_data = false;
					this.notifications = data;
					this.notification_items.push(...data.entities);
					if(this.notifications.entities.length > 0){
						this.all_unresolved = true;
					}
				}
			);
		}

		if (this.currentRole === 'administrator') {
			this.page = page ? this.page + 1 : this.page;
			this._notification.getAll(page ? this.page : null).subscribe(
				(data: any) => {
					this.getting_notification_data = false;
					this.notifications = data;
					this.notification_items.push(...data.entities);
					if(this.notifications.entities.length > 0){
						this.all_unresolved = true;
					}
				}
			)
		}
	}

	private get currentUser() {
		return this._auth.current_user_value;
	}

	protected get currentRole() {
		return this._auth.current_role;
	}
}
