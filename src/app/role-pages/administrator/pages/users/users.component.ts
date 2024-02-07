import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { HelperService, RoleService, UserService, AuthService } from 'src/app/global/services';
import {
    API_FILTERS,
    UI_TABLE_USERS,
    UI_USER_STATS,
    USER_ROLE,
    UI_ROLE_DEFINITION,
    UI_ROLE_DEFINITION_TEXT,
    DEALERADMIN_UI_TABLE_USERS,
    API_USER_DATA,
} from 'src/app/global/models';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss'],
    providers: [DatePipe],
})
export class UsersComponent implements OnInit, OnDestroy {
    current_filters: API_FILTERS = { page: 1 };
    current_role_selected: string;
    filtered_data: UI_TABLE_USERS[] = [];
    initial_load = true;
    is_dealer_admin: boolean = false;
    no_user: boolean = false;
    paging_data: any;
    roles: any = [];
    searching = false;
    title: string = 'Users';
    users: UI_TABLE_USERS[] = [];
    user_details: UI_USER_STATS;

    users_table_columns = [
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

    dealeradmin_users_table_columns = [
        { name: '#' },
        { name: 'Name' },
        { name: 'Email Address' },
        { name: 'Contact Number' },
        { name: 'Role' },
        { name: 'Affiliation' },
        { name: 'Creation Date' },
        { name: 'Created By' },
    ];

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _helper: HelperService,
        private _role: RoleService,
        private _user: UserService,
        private _auth: AuthService,
    ) {}

    ngOnInit() {
        if (this._auth.current_role === UI_ROLE_DEFINITION_TEXT.dealeradmin) {
            this.is_dealer_admin = true;
        }
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
        this.current_filters.pageSize = 15;
        this.searching = true;
        this.users = [];

        this._user
            .get_users_by_filters(this.current_filters)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    if (response.message) {
                        this.filtered_data = [];
                        if (this.current_filters.search === '') this.no_user = true;
                        return;
                    }

                    this.paging_data = response.paging;

                    const mappedData = this.mapToUIFormat(response.paging.entities);
                    this.users = mappedData;
                    this.filtered_data = mappedData;
                },
                (error) => {
                    console.error(error);
                },
            )
            .add(() => {
                this.initial_load = false;
                this.searching = false;
            });
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

    private getAllUserRoles() {
        this._role
            .get_roles()
            .pipe(
                takeUntil(this._unsubscribe),
                map((roles) => roles.filter((role) => role.roleName.toLowerCase() !== 'admin')),
            )
            .subscribe(
                (response) => {
                    if (this.is_dealer_admin) {
                        this.roles = response.filter(function (user) {
                            return (
                                user.roleId !== UI_ROLE_DEFINITION.tech &&
                                user.roleId !== UI_ROLE_DEFINITION.dealeradmin &&
                                user.roleId !== UI_ROLE_DEFINITION.administrator &&
                                user.roleId !== UI_ROLE_DEFINITION.guest
                            );
                        });
                    } else {
                        this.roles = response;
                    }
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private getUserTotal(): void {
        this._user
            .get_user_total()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    this.user_details = {
                        basis: response.totalUsers,
                        basis_label: 'User(s)',
                        super_admin_count: response.totalSuperAdmin,
                        super_admin_label: 'Super Admin(s)',
                        dealer_admin_count: response.totalDealerAdmin,
                        dealer_admin_label: 'Dealer Admin(s)',
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
                        sub_dealer_count: response.totalSubDealer,
                        sub_dealer_label: 'Sub-dealer (s)',
                    };
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private mapToUIFormat(data) {
        let count = this.paging_data.pageStart;

        return data.map((user) => {
            let permission = null;
            const role = user.userRoles[0];
            const allowEmail = user.allowEmail === 1 ? true : false;
            if (role.roleName === 'Sub Dealer') permission = role.permission;

            if (this.is_dealer_admin) {
                const result = new DEALERADMIN_UI_TABLE_USERS(
                    { value: user.userId, link: null, editable: false, hidden: true },
                    { value: count++, link: null, editable: false, hidden: false },
                    {
                        value: `${user.firstName} ${user.lastName}`,
                        permission,
                        link: `/administrator/users/${user.userId}`,
                        new_tab_link: true,
                    },
                    { value: user.email, link: null, editable: false, hidden: false },
                    { value: user.contactNumber, link: null, editable: false, hidden: false },
                    { value: role.roleName, link: null, editable: false, hidden: false },
                    {
                        value: user.organization ? user.organization : '--',
                        link: null,
                        editable: false,
                        hidden: false,
                    },
                    {
                        value: this._date.transform(user.dateCreated),
                        link: null,
                        editable: false,
                        hidden: false,
                    },
                    {
                        value: user.creatorName,
                        link: `/administrator/users/${user.createdBy}`,
                        editable: false,
                        hidden: false,
                        new_tab_link: true,
                    },
                );
                return result;
            } else {
                const result = new UI_TABLE_USERS(
                    { value: user.userId, link: null, editable: false, hidden: true },
                    { value: count++, link: null, editable: false, hidden: false },
                    {
                        value: `${user.firstName} ${user.lastName}`,
                        permission,
                        link: `/administrator/users/${user.userId}`,
                        new_tab_link: true,
                    },
                    { value: user.email, link: null, editable: false, hidden: false },
                    { value: user.contactNumber, link: null, editable: false, hidden: false },
                    { value: role.roleName, link: null, editable: false, hidden: false },
                    {
                        value: user.organization ? user.organization : '--',
                        link: null,
                        editable: false,
                        hidden: false,
                    },
                    { value: allowEmail, type: 'toggle' },
                    {
                        value: this._date.transform(user.dateCreated),
                        link: null,
                        editable: false,
                        hidden: false,
                    },
                    {
                        value: user.creatorName,
                        link: `/administrator/users/${user.createdBy}`,
                        editable: false,
                        hidden: false,
                        new_tab_link: true,
                    },
                );
                return result;
            }
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
            .subscribe(
                (response: { user: API_USER_DATA }) => {
                    // const updatedIndex = this.filtered_data.findIndex((user) => user.user_id.value === response.user.userId);
                    // this.filtered_data[updatedIndex].allow_email.value = response.user.allowEmail === 1;
                },
                (error) => {
                    console.error(error);
                },
            );
    }
}
