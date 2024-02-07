import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { HelperService } from 'src/app/global/services/helper-service/helper.service';
import { UI_TABLE_USERS } from 'src/app/global/models/ui_table-users.model';
import { UI_ROLE_DEFINITION } from '../../../../global/models/ui_role-definition.model';
import { USER } from 'src/app/global/models/api_user.model';
import { UserService } from 'src/app/global/services/user-service/user.service';
import { UI_USER_STATS } from 'src/app/global/models';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss'],
    providers: [DatePipe],
})
export class UsersComponent implements OnInit, OnDestroy {
    filtered_data: any = [];
    loading_data = true;
    no_user = false;
    row_slug = 'user_id';
    row_url = '/dealer/users/';
    title: string = 'Users';
    user_details: UI_USER_STATS;
    users: UI_TABLE_USERS[] = [];

    users_table_column = [
        { name: '#' },
        { name: 'Name' },
        { name: 'Email Address' },
        { name: 'Contact Number' },
        { name: 'Role' },
        { name: 'Affiliation' },
        { name: 'Email Notification', type: 'toggle' },
        { name: 'Creation Date' },
        { name: 'Created By' },
    ];

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _helper: HelperService,
        private _user: UserService,
    ) {}

    ngOnInit() {
        this.getAllusers();
        this.subscribeToToggleEmailNotification();
        this.subscribeToPageRefresh();
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

    private confirmEmailNotificationToggle(
        userId: string,
        value: boolean,
        tableDataIndex: number,
        currentEmail: string,
    ): void {
        let type = 'Enable';
        if (!value) type = 'Disable';
        const status = 'warning';
        const message = `${type} email notifications`;
        const data = `Proceed update for ${currentEmail}?`;

        const dialog = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status, message, data },
        });

        dialog.afterClosed().subscribe((response: boolean) => {
            if (!response) {
                this._helper.onResultToggleEmailNotification.next({
                    updated: false,
                    tableDataIndex,
                });
                return;
            }

            this.updateEmailNotification(userId, value);
        });
    }

    private countUserRoles(data: USER[]): void {
        let advertiser_count = 0;
        let host_count = 0;
        let sub_dealer_count = 0;

        data.forEach((user) => {
            user.userRoles.forEach((role) => {
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
            });
        });

        this.user_details = {
            basis: data.length,
            basis_label: 'Total User(s)',
            hosts: host_count,
            hosts_label: 'Host(s)',
            advertiser: advertiser_count,
            advertiser_label: 'Advertiser(s)',
            sub_dealer_count,
            sub_dealer_label: 'Sub Dealer(s)',
        };
    }

    private getAllusers(): void {
        this.loading_data = true;

        this._user
            .get_users_by_owner(this.currentUser.roleInfo.dealerId)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response: { ownerId: string; users: USER[] }) => {
                    if (response.users.length <= 0) {
                        this.no_user = true;
                        this.filtered_data = [];

                        const details = {
                            basis: 0,
                            basis_label: 'Total User(s)',
                            hosts: 0,
                            hosts_label: 'Host(s)',
                            advertiser: 0,
                            advertiser_label: 'Advertiser(s)',
                            sub_dealer_count: 0,
                            sub_dealer_label: 'Sub Dealer(s)',
                        };

                        this.user_details = details;

                        return;
                    }

                    const { users } = response;
                    this.countUserRoles(users);
                    const mappedUsers = this.mapToUIFormat(users);
                    this.users = mappedUsers;
                    this.filtered_data = mappedUsers;
                },
                (error) => {
                    console.error(error);
                },
            )
            .add(() => (this.loading_data = false));
    }

    private mapToUIFormat(data: USER[]): UI_TABLE_USERS[] {
        let count = 1;

        return data.map((u: USER) => {
            let permission = null;
            const role = u.userRoles[0];
            const allowEmail = u.allowEmail === 1 ? true : false;
            if (role.roleName === 'Sub Dealer') permission = role.permission;

            return new UI_TABLE_USERS(
                { value: u.userId, link: null, editable: false, hidden: true },
                { value: count++, link: null, editable: false, hidden: false },
                {
                    value: `${u.firstName} ${u.lastName}`,
                    permission,
                    link: `/dealer/users/${u.userId}`,
                    editable: false,
                    hidden: false,
                    new_tab_link: true,
                },
                { value: u.email, link: null, editable: false, hidden: false },
                { value: u.contactNumber, link: null, editable: false, hidden: false },
                { value: u.userRoles[0].roleName, link: null, editable: false, hidden: false },
                {
                    value: u.organization ? u.organization : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                { value: allowEmail, type: 'toggle' },
                {
                    value: this._date.transform(u.dateCreated),
                    link: null,
                    editable: false,
                    hidden: false,
                },
                { value: u.creatorName, link: null, editable: false, hidden: false },
            );
        });
    }

    private subscribeToPageRefresh(): void {
        this._helper.onRefreshUsersPage.pipe(takeUntil(this._unsubscribe)).subscribe(
            () => this.ngOnInit(),
            (error) => {
                console.error(error);
            },
        );
    }

    private subscribeToToggleEmailNotification(): void {
        this._helper.onToggleEmailNotification.pipe(takeUntil(this._unsubscribe)).subscribe(
            (response: {
                userId: string;
                value: boolean;
                tableDataIndex: number;
                currentEmail: string;
            }) => {
                const { userId, value, tableDataIndex, currentEmail } = response;
                this.confirmEmailNotificationToggle(userId, value, tableDataIndex, currentEmail);
            },
            (error) => {
                console.error(error);
            },
        );
    }

    private updateEmailNotification(userId: string, value: boolean): void {
        this._user
            .update_email_notifications(userId, value)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(() => (error) => {
                console.error(error);
            });
    }
}
