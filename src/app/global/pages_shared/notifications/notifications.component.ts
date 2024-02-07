import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, NotificationService } from 'src/app/global/services';
import { Notification, NotificationsPaginated } from 'src/app/global/models';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
    all_unresolved = false;
    getting_notification_data: boolean = false;
    is_admin = this.currentRole === 'administrator' || this.currentRole === 'dealeradmin';
    is_dealer = this.currentRole === 'dealer';
    notifications: NotificationsPaginated;
    notification_items: Notification[] = [];
    page: number = 1;
    route = this.is_admin ? '/administrator' : '/dealer';
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _notification: NotificationService,
    ) {}

    ngOnInit() {
        this.getNotifications();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    public updateNotifStatus(id: string) {
        this._notification.updateNotificationStatus(id).subscribe(() => {
            this.notification_items.map((i) => {
                if (i.notificationId == id) {
                    i.isOpened = 1;
                }
            });
        });
    }

    public updateAllNotifStatus() {
        let request: Observable<any> = null;

        switch (this.currentRole) {
            case 'dealer':
            case 'sub-dealer':
                request = this._notification.getByDealerId(
                    this.currentUser.roleInfo.dealerId,
                    1,
                    0,
                );
                break;

            default:
                request = this._notification.getAll(1, 0);
        }

        request.pipe(takeUntil(this._unsubscribe)).subscribe((response) => {
            this.notification_items = [];
            this.notification_items.push(...response.entities);

            this.notification_items.forEach((notification) => {
                notification.isOpened = 1;
            });

            switch (this.currentRole) {
                case 'dealer':
                case 'sub-dealer':
                    this._notification
                        .updateNotificationStatusByDealerId(this.currentUser.roleInfo.dealerId)
                        .pipe(takeUntil(this._unsubscribe))
                        .subscribe(() => {
                            this.all_unresolved = false;

                            // Fire ResolveAllEvent if request is successful
                            this._notification.emitResolveAllEvent(true);
                        });
                    break;

                default:
                    this._notification
                        .updateAllNotificationStatus()
                        .pipe(takeUntil(this._unsubscribe))
                        .subscribe(() => {
                            this.all_unresolved = false;

                            // Fire ResolveAllEvent if request is successful
                            this._notification.emitResolveAllEvent(true);
                        });
            }
        });
    }

    public getNotifications(page?: boolean) {
        this.getting_notification_data = true;
        this.page = page ? this.page + 1 : this.page;

        let request: Observable<any> = null;

        switch (this.currentRole) {
            case 'dealer':
            case 'sub-dealer':
                request = this._notification.getByDealerId(
                    this.currentUser.roleInfo.dealerId,
                    1,
                    0,
                );
                break;

            default:
                request = this._notification.getAll(1, 0);
        }

        request.pipe(takeUntil(this._unsubscribe)).subscribe((response) => {
            this.notifications = response;
            this.notification_items.push(...response.entities);
            if (this.notifications.entities.length > 0) this.all_unresolved = true;
            this.getting_notification_data = false;
        });
    }

    private get currentUser() {
        return this._auth.current_user_value;
    }

    protected get currentRole() {
        return this._auth.current_role;
    }
}
