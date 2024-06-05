import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatSelect, MatSnackBar } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { forkJoin, Subject, Subscription } from 'rxjs';

import {
    API_USER_DATA,
    UI_ROLE_DEFINITION,
    API_DEALER,
    USER_ACTIVITY,
    PAGING,
    ACTIVITY_URLS,
} from 'src/app/global/models';
import { AuthService, HelperService, UserService, DealerService } from 'src/app/global/services';
import { ConfirmationModalComponent } from '../../components_shared/page_components/confirmation-modal/confirmation-modal.component';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-single-user',
    templateUrl: './single-user.component.html',
    styleUrls: ['./single-user.component.scss'],
})
export class SingleUserComponent implements OnInit, OnDestroy {
    @ViewChild('dealerMultiSelect', { static: false }) dealerMultiSelect: MatSelect;
    activityData: USER_ACTIVITY[] = [];
    activityLoaded = false;
    advertiser_id: string;
    bg_role: any;
    dealers_form = this._form.group({ dealers: [[], Validators.required] });
    dealer_filter_control = new FormControl(null);
    dealer_id: string = '';
    dealers_list: API_DEALER[] = [];
    forms_ready: boolean = false;
    has_loaded_dealers_list = false;
    has_loaded_assigned_dealers = false;
    host_id: string;
    info_form: FormGroup;
    info_form_disabled = false;
    info_form_fields = this._formFields;
    isAdmin = this._auth.current_role === 'administrator';
    is_dealer_admin = false;
    is_initial_load = true;
    is_loading = true;
    is_password_field_type = true;
    is_retype_password_field_type = true;
    is_sub_dealer = false;
    is_searching_dealer = false;
    initial_assigned_dealer_ids: string[] = [];
    original_dealers: API_DEALER[] = [];
    pagingActivityData: PAGING;
    password_form: FormGroup;
    password_form_disabled = false;
    password_is_match: string;
    password_invalid: boolean;
    password_match: boolean;
    password_validation_message: string;
    user: API_USER_DATA;
    selected_dealers_control = this.dealers_form.get('dealers');
    sortActivityColumn = 'DateCreated';
    sortActivityOrder = 'desc';
    // selected_dealer: any;
    subscription = new Subscription();
    userId: string;

    activityTable = [
        { name: '#', sortable: false },
        { name: 'Activity Target', column: 'targetName', sortable: false },
        { name: 'Activity Description', column: 'activityDescription', sortable: false },
        { name: 'Date Created', column: 'dateCreated', sortable: false },
    ];

    permissions = [
        { label: 'View', value: 'V' },
        { label: 'Edit', value: 'E' },
    ];

    private current_permission: string;
    private dealer_admin_user_id: string;
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dealer: DealerService,
        private _date: DatePipe,
        private _dialog: MatDialog,
        private _form: FormBuilder,
        private _helper: HelperService,
        private _params: ActivatedRoute,
        private _router: Router,
        private _snackbar: MatSnackBar,
        private _user: UserService,
    ) {}

    ngOnInit() {
        this.dealers_list = [];
        this.getDealers();
        this.getUserData();
        this.subscribeToDealerSearch();
    }

    private getUserData() {
        // For Dealer or SubDealer Accounts
        if (this.is_initial_load && (this.currentRole === 'dealer' || this.currentRole === 'sub-dealer')) {
            this.setPageData(this._helper.singleUserData);
            this.getUserSelectedRole(this._helper.singleUserData);
            this.initializeForms();
            this.is_initial_load = false;
            this.is_loading = false;
            return;
        }

        // For Admin
        this.getUserById(this._params.snapshot.params.data);
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    get infoFormControls() {
        return this.info_form.controls;
    }

    get passwordFormControls() {
        return this.password_form.controls;
    }

    get can_delete_sub_dealer() {
        return this.currentRole === 'administrator' || this.currentRole === 'dealer';
    }

    changeUserPassword() {
        this.password_form_disabled = true;

        this._user
            .update_user(this.mapPasswordChanges())
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                () => {
                    this.openConfirmationModal('success', 'Success!', 'Password changed succesfully');
                    this.ngOnInit();
                },
                (error) => {
                    this.password_form_disabled = false;
                },
            );
    }

    clearSelectedDealers() {
        if (!this.has_loaded_dealers_list) {
            return;
        }

        this.selected_dealers_control.value.length = 0;
        if (this.dealerMultiSelect) this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
    }

    onDelete(userId: string): void {
        const dialog = this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: {
                status: 'warning',
                message: 'Delete User',
                data: 'Proceed deleting this user?',
            },
        });

        dialog.afterClosed().subscribe((response) => {
            if (!response) return;

            this._user
                .deleteUser(userId)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(
                    () => this._router.navigate([`/${this.roleRoute}/users`]),
                    (error) => {
                        console.error(error);
                    },
                );
        });
    }

    removeSelectedDealer(index: number): void {
        if (!this.has_loaded_dealers_list) {
            return;
        }

        let dealers_to_delete = this.selected_dealers_control.value[index].dealerId;
        this.selected_dealers_control.value.splice(index, 1);
        this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
    }

    selectDealer(dealerId: string): void {
        const selected = this.dealers_list.filter((dealer) => dealerId === dealer.dealerId)[0];
        this.selected_dealers_control.value.push(selected);
    }

    togglePasswordFieldType(): void {
        this.is_password_field_type = !this.is_password_field_type;
    }

    toggleRetypePasswordFieldType(): void {
        this.is_retype_password_field_type = !this.is_retype_password_field_type;
    }

    updateAssignedDealers() {
        const config = {
            width: '500px',
            height: '350px',
            data: {
                status: 'warning',
                message: 'Update Dealers',
                data: 'Are you sure you want to update dealer assignees?',
                return_msg: 'Dealer Assigness successfully updated',
                action: 'update',
            },
        };

        const dialogRef = this._dialog.open(ConfirmationModalComponent, config);

        dialogRef.afterClosed().subscribe((result) => {
            if (result !== 'update') return;

            const selectedDealers = Array.from(this.selected_dealers_control.value as API_DEALER[]);
            const initialIds = Array.from(this.initial_assigned_dealer_ids);

            const toAddIds = Array.from(selectedDealers)
                .filter((dealer) => !initialIds.includes(dealer.dealerId))
                .map((dealer) => dealer.dealerId);

            const intersection = Array.from(selectedDealers)
                .filter((dealer) => initialIds.includes(dealer.dealerId))
                .map((dealer) => dealer.dealerId);

            const toDeleteIds = initialIds.filter((id) => !intersection.includes(id));

            let requests = [];

            if (toAddIds.length > 0) {
                const dataToAdd = {
                    userid: this.dealer_admin_user_id,
                    createdBy: this._auth.current_user_value.user_id,
                    dealers: toAddIds,
                };

                requests.push(this._dealer.add_dealers_of_dealer_admin(dataToAdd));
            }

            if (toDeleteIds.length > 0) {
                const dataToDelete = {
                    userid: this.dealer_admin_user_id,
                    dealers: toDeleteIds,
                };

                requests.push(this._dealer.delete_dealer_admin_assignee(dataToDelete));
            }

            if (requests.length <= 0) return;

            this.has_loaded_assigned_dealers = false;
            this.has_loaded_dealers_list = false;

            forkJoin(requests)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe(() => {
                    this._dialog.closeAll();
                    this.getDealers();
                    this.getUserData();
                });
        });
    }

    updateUserInfo(): void {
        this.info_form_disabled = true;

        const observables = [this._user.update_user(this.mapUserInfoChanges())];

        if (this.infoFormControls.permission.value !== this.current_permission) {
            const { userId } = this.user;
            const permission = this.infoFormControls.permission.value;
            observables.push(this._user.update_permission(userId, permission));
        }

        forkJoin(observables)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                () => {
                    this.openConfirmationModal('success', 'Success!', 'User info changed succesfully');
                    this.ngOnInit();
                },
                (error) => {
                    this.password_form_disabled = false;
                },
            );
    }

    private get currentUser() {
        return this._auth.current_user_value;
    }

    private getAssignedDealers(id: string): void {
        this._user
            .get_dealeradmin_dealers(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    this.initial_assigned_dealer_ids = Array.from(response.dealers.map((dealer) => dealer.dealerId));
                    this.dealers_form.patchValue({ dealers: response.dealers });
                    this.selected_dealers_control.patchValue([...response.dealers], {
                        emitEvent: false,
                    });
                    this.has_loaded_assigned_dealers = true;
                },
                (error) => {
                    this.has_loaded_assigned_dealers = true;
                    console.error(error);
                },
            );
    }

    private getDealers(): void {
        this._dealer
            .get_dealers_with_page(1, '', 0)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    this.dealers_list = data.dealers;
                    this.original_dealers = Array.from(data.dealers);
                    const assignedDealers = this.original_dealers.filter((dealer) =>
                        this.initial_assigned_dealer_ids.includes(dealer.dealerId),
                    );
                    this.selected_dealers_control.patchValue([...assignedDealers]);

                    setTimeout(() => {
                        this.dealerMultiSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
                    }, 2000);

                    this.has_loaded_dealers_list = true;
                },
                (error) => {
                    this.has_loaded_dealers_list = true;
                    console.error(error);
                },
            );
    }

    private getUserById(id: string) {
        this.is_loading = false;

        return this._user
            .get_user_by_id(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response: any) => {
                    if ('message' in response) return;
                    if (response.userRoles[0].roleId === UI_ROLE_DEFINITION.dealer)
                        this.dealer_id = response.dealer.dealerId;
                    if (response.userRoles[0].roleId === UI_ROLE_DEFINITION.advertiser)
                        this.advertiser_id = response.advertiser.id;
                    if (response.userRoles[0].roleId === UI_ROLE_DEFINITION.host) this.host_id = response.host.hostId;

                    const userData = response as API_USER_DATA;
                    this.user = userData;
                    this.is_dealer_admin = userData.userRoles[0].roleId === UI_ROLE_DEFINITION.dealeradmin;
                    this.dealer_admin_user_id = userData.userId;
                    this.userId = response.userId;

                    this.setPageData(userData);
                    this.getUserSelectedRole(userData);
                    this.initializeForms();
                    this.getUserActivityData(1);
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    getUserSelectedRole(data) {
        switch (data.userRoles[0].roleId) {
            case UI_ROLE_DEFINITION.dealer:
                this.bg_role = '#8ec641';
                break;
            case UI_ROLE_DEFINITION.dealeradmin:
                this.bg_role = '#1abc9c';
                break;
            case UI_ROLE_DEFINITION.host:
                this.bg_role = '#17a2b8';
                break;
            case UI_ROLE_DEFINITION.advertiser:
                this.bg_role = '#fd7e14';
                break;
            default:
                this.bg_role = '#1c2731';
        }
    }

    copyPassword(val) {
        const selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = val;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);

        // Snackbar
        this._snackbar.open(`Copied to clipboard!`, '', {
            duration: 1500,
        });
    }

    goToProfile() {
        if (this.dealer_id) {
            const url = this._router.serializeUrl(
                this._router.createUrlTree([`/${this.roleRoute}/dealers/${this.dealer_id}`], {}),
            );
            window.open(url, '_blank');
        } else if (this.advertiser_id) {
            const url = this._router.serializeUrl(
                this._router.createUrlTree([`/${this.roleRoute}/advertisers/${this.advertiser_id}`], {}),
            );
            window.open(url, '_blank');
        } else {
            const url = this._router.serializeUrl(
                this._router.createUrlTree([`/${this.roleRoute}/hosts/${this.host_id}`], {}),
            );
            window.open(url, '_blank');
        }
    }

    private initializeForms(): void {
        this.initializeInfoForm();
        this.initializePasswordForm();
        this.subscribeToUpdateFormChanges();
        this.subscribeToPasswordFormChanges();
    }

    private initializePasswordForm(): void {
        this.password_form = this._form.group({
            new_password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
            re_password: ['', Validators.required],
        });
    }

    private initializeInfoForm(): void {
        let data: any;
        const config: any = {};
        const { userRoles } = this.user;
        const { permission } = userRoles[0];
        const controls = this.info_form_fields.map((field) => field.control);

        controls.forEach((control) => {
            let controlValue = [];

            switch (control) {
                case 'allowEmail':
                    data = this.user[control] === 1 ? true : false;
                    break;

                case 'permission':
                    data = permission;
                    break;

                default:
                    data = this.user[control];
            }

            controlValue.push(data);
            config[control] = controlValue;
        });

        // initialize update user form
        this.info_form = this._form.group(config);
        this.forms_ready = true;
    }

    private mapPasswordChanges() {
        const { userId } = this.user;
        const password = this.passwordFormControls.new_password.value;
        const updatedBy = this.currentUser.user_id;
        return { userId, password, updatedBy };
    }

    private mapUserInfoChanges() {
        const { firstName, middleName, lastName, email, permission } = this.info_form.value;
        const allowEmailNotifications = this.info_form.value.allowEmail ? 1 : 0;
        const { userId } = this.user;
        const updatedBy = this.currentUser.user_id;

        return {
            userId,
            firstName,
            middleName,
            lastName,
            email,
            allowEmailNotifications,
            permission,
            updatedBy,
        };
    }

    private setPageData(data: API_USER_DATA) {
        const { userRoles } = data;
        const { permission, roleName } = userRoles[0];
        this.getAssignedDealers(data.userId);
        this.user = data;
        this.user.permission = permission;
        this.current_permission = permission;
        this.is_sub_dealer = roleName === 'Sub Dealer';

        // Setting up ids for dealer account redirects
        if (data.userRoles[0].roleId === UI_ROLE_DEFINITION.dealer) this.dealer_id = data.dealer.dealerId;
        if (data.userRoles[0].roleId === UI_ROLE_DEFINITION.advertiser) this.advertiser_id = data.advertiser.id;
        if (data.userRoles[0].roleId === UI_ROLE_DEFINITION.host) this.host_id = data.host.hostId;
    }

    private subscribeToUpdateFormChanges(): void {
        this.info_form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            if (this.info_form.valid) this.info_form_disabled = false;
            else this.info_form_disabled = true;
        });
    }

    private subscribeToPasswordFormChanges(): void {
        this.password_form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
            const isValidForm = this.password_form.valid;
            const newPassword = this.password_form.value.new_password;
            const reTypePassword = this.password_form.value.re_password;

            if (this.passwordFormControls.new_password.invalid) {
                this.password_invalid = true;
                this.password_validation_message = 'Must be atleast 8 characters';
            } else {
                this.password_invalid = false;
                this.password_validation_message = 'Password Passed';
            }

            if (isValidForm && newPassword === reTypePassword) {
                this.password_match = true;
                this.password_is_match = 'Password Match';
                this.password_form_disabled = false;
            } else {
                this.password_match = false;
                this.password_is_match = 'Password Does Not Match';
                this.password_form_disabled = true;
            }
        });
    }

    private openConfirmationModal(status: string, message: string, data: string): void {
        this._dialog.open(ConfirmationModalComponent, {
            width: '500px',
            height: '350px',
            data: { status, message, data },
        });
    }

    public getActivityColumnsAndOrder(data: { column: string; order: string }): void {
        this.sortActivityColumn = data.column;
        this.sortActivityOrder = data.order;
        this.getUserActivityData(1);
    }

    public async getUserActivityData(page: number) {
        let response;
        if (this.is_dealer_admin) {
            response = await this._user
                .getActivitiesByOwnerIdDealerAdmin(this.userId, this.sortActivityColumn, this.sortActivityOrder, page)
                .toPromise();
        } else {
            response = await this._user
                .getActivitiesByOwnerId(this.userId, this.sortActivityColumn, this.sortActivityOrder, page)
                .toPromise();
        }

        const mappedData = this.activity_mapToUI(response.paging.entities, response.nonExistentTargetIds);
        this.pagingActivityData = response.paging;
        this.activityData = [...mappedData];
        this.activityLoaded = true;
    }

    public activity_mapToUI(activity: USER_ACTIVITY[], nonExistentTargetIds: string[]): any {
        let count = 1;
        const noBreadcrumEntities = ['tag'];

        return activity.map((a) => {
            let targetLink = '';
            const activityCodePrefix = a.activityCode.split('_')[0];
            const activitytUrl = ACTIVITY_URLS.find((ac) => ac.activityCodePrefix === activityCodePrefix);
            const targetName = a.targetName ? a.targetName : '--';

            /** Tag owner check for unclickable un-owned tags */
            if (activityCodePrefix == 'tag' && this.userId !== this.currentUser.user_id) {
                nonExistentTargetIds.push(a.targetId);
            }

            if (nonExistentTargetIds && nonExistentTargetIds.includes(a.targetId)) {
                targetLink = '';
            } else {
                targetLink = `/${this.currentRole}/${activitytUrl.activityURL}/${a.targetId}`;
            }

            const activityDoneBy =
                this.currentUser.user_id === a.initiatedById ? `${a.initiatedBy}(You)` : ` ${a.initiatedBy}`;
            const userActivityDescription =
                a.ownerId === a.initiatedById
                    ? `${activityDoneBy} ${a.activityDescription}`
                    : `${activityDoneBy} ${a.activityDescription} for ${a.owner}`;

            return new USER_ACTIVITY(
                { value: count++, editable: false },
                { value: a.activityCode, hidden: true },
                { value: a.activityLogId, hidden: true },
                { value: a.initiatedBy, hidden: true },
                {
                    value: targetName,
                    link: targetLink,
                    new_tab_link: true,
                    hidden: false,
                    noBreadcrumb: noBreadcrumEntities.includes(activityCodePrefix),
                },
                {
                    value: userActivityDescription,
                    hidden: false,
                },
                { value: this._date.transform(a.dateCreated, "MMMM d, y, 'at' h:mm a"), hidden: false },
                { value: a.initiatedById, hidden: true },
                { value: a.owner, hidden: true },
                { value: a.ownerId, hidden: true },
                { value: a.targetId, hidden: true },
            );
        });
    }

    protected get currentRole() {
        return this._auth.current_role;
    }

    protected get _formFields() {
        const fields = [
            {
                label: 'Firstname',
                control: 'firstName',
                placeholder: 'Ex: John',
                type: 'text',
                width: 'col-lg-6',
                required: true,
            },
            {
                label: 'Middlename',
                control: 'middleName',
                placeholder: 'Ex: Cruz',
                type: 'text',
                width: 'col-lg-6',
                required: false,
            },
            {
                label: 'Lastname',
                control: 'lastName',
                placeholder: 'Ex: Doe',
                type: 'text',
                width: 'col-lg-6',
                required: true,
            },
            {
                label: 'Email Address',
                control: 'email',
                placeholder: 'Ex: admin@blueiguana.com',
                type: 'email',
                width: 'col-lg-6',
                required: true,
            },
            {
                label: 'Email Notification',
                control: 'allowEmail',
                type: 'toggle',
                required: true,
            },
            {
                label: 'Permission',
                control: 'permission',
                type: 'radio',
                width: 'col-lg-6',
                name: 'permissionList',
                required: false,
            },
            {
                label: 'Dealers',
                control: 'dealers',
                type: 'radio',
                width: 'col-lg-12',
                required: true,
            },
        ];

        return fields;
    }

    private subscribeToDealerSearch(): void {
        const control = this.dealer_filter_control;

        control.valueChanges.pipe(takeUntil(this._unsubscribe), debounceTime(1000)).subscribe(
            (keyword: string) => {
                if (control.invalid) {
                    this.is_searching_dealer = false;
                    return;
                }

                this.is_searching_dealer = true;
                const originalDealersList = Array.from(this.original_dealers);

                if (keyword && keyword.trim().length > 0) {
                    this.dealers_list = originalDealersList.filter(
                        (dealer) => dealer.businessName.toLowerCase().search(keyword.toLowerCase()) > -1,
                    );
                } else {
                    this.dealers_list = this.original_dealers;
                }

                this.is_searching_dealer = false;
            },
            (error) => {
                this.is_searching_dealer = false;
            },
        );
    }

    protected get roleRoute() {
        return this._auth.roleRoute;
    }
}
