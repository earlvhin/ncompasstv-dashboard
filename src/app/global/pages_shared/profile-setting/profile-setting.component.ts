import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription, forkJoin } from 'rxjs';

// Services
import {
    AuthService,
    AdvertiserService,
    ContentService,
    HostService,
    LicenseService,
    DealerService,
    UserService,
} from 'src/app/global/services';

// Models
import {
    ACTIVITY_URLS,
    API_DEALER,
    API_USER_DATA,
    PAGING,
    UI_ACTIVITY_LOGS,
    UI_CURRENT_USER,
    UI_ROLE_DEFINITION,
    USER_ACTIVITY,
} from 'src/app/global/models';

import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-profile-setting',
    templateUrl: './profile-setting.component.html',
    styleUrls: ['./profile-setting.component.scss'],
})
export class ProfileSettingComponent implements OnInit {
    activity_created_by: any;
    dealerActivityData: UI_ACTIVITY_LOGS[] = [];
    activityData: USER_ACTIVITY[] = [];
    activityDataLoaded = false;
    advertiser_data: any;
    advertiser_details: any = {};
    content_details: any = {};
    created_by: string;
    currentRole = this._auth.current_role;
    current_user: UI_CURRENT_USER;
    date_created: any;
    dealer_email: string;
    dealer_id: string;
    dealer: API_DEALER;
    host_details: any = {};
    initial_load_activity = true;
    isDealer: boolean = false;
    isDealerAdmin: boolean = false;
    isSubDealer: boolean = false;
    isProd: boolean = false;
    license_details: any = {};
    loading_advertiser: boolean = true;
    loading_content: boolean = true;
    loading_host: boolean = true;
    loading_license: boolean = true;
    no_activity_data = false;
    no_credit_card: boolean = false;
    no_dealer_values: boolean = false;
    pagingActivityData: PAGING;
    reload_data: boolean = false;
    show_cart_button: boolean = false;
    sortActivityColumn = 'DateCreated';
    sortActivityOrder = 'desc';
    subscription: Subscription = new Subscription();
    user: API_USER_DATA;
    userActivityTable = [
        { name: '#', sortable: false },
        { name: 'Activity Target', column: 'targetName', sortable: false },
        { name: 'Activity Description', column: 'activityDescription', sortable: false },
        { name: 'Date Created', column: 'dateCreated', sortable: false },
    ];

    protected _unsubscribe: Subject<void> = new Subject<void>();

    activity_table = [
        { name: '#', sortable: false },
        { name: 'Date Created', column: 'dateCreated', sortable: true },
        { name: 'Activity', column: 'activityCode', sortable: false },
    ];

    constructor(
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _content: ContentService,
        private _host: HostService,
        private _license: LicenseService,
        private _dealer: DealerService,
        private _date: DatePipe,
        private _user: UserService,
    ) {}

    ngOnInit() {
        this.isProd = !environment.production;

        const userRole = this._auth.current_user_value.role_id;
        const roleInfo = this._auth.current_user_value.roleInfo;
        const dealerId = roleInfo ? roleInfo.dealerId : undefined;

        switch (userRole) {
            case UI_ROLE_DEFINITION.dealer:
                this.isDealer = true;
                this.dealer_id = dealerId;
                this.current_user = this._auth.current_user_value;
                this.getTotalLicenses(dealerId);
                this.getTotalAdvertisers(dealerId);
                this.getTotalHosts(dealerId);
                this.getTotalContents(dealerId);
                this.getDealerValuesById(dealerId);
                this.checkIfEnableShop();
                this.getDealerActivity(1);
                this.getDealer();
                break;

            case UI_ROLE_DEFINITION['sub-dealer']:
                this.isSubDealer = true;
                break;

            case UI_ROLE_DEFINITION['dealeradmin']:
                this.isDealerAdmin = true;
                break;

            default:
                this.isDealer = false;
                this.getUserActivityData(1);
                break;
        }
    }

    checkIfEnableShop() {
        if (this.no_credit_card || this.no_dealer_values) {
            this.show_cart_button = false;
        } else {
            this.show_cart_button = true;
        }
    }

    getActivityColumnsAndOrder(data: { column: string; order: string }): void {
        this.sortActivityColumn = data.column;
        this.sortActivityOrder = data.order;
        this.getDealerActivity(1);
        this.getUserActivityData(1);
    }

    getDealerActivity(page: number) {
        this.dealerActivityData = [];

        this._dealer
            .get_dealer_activity(this.dealer_id, this.sortActivityColumn, this.sortActivityOrder, page)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (res) => {
                    if (res.paging.entities.length === 0) {
                        this.no_activity_data = true;
                        this.dealerActivityData = [];
                        return;
                    }

                    this.getUserByIds(res.paging.entities.map((a) => a.initiatedBy)).subscribe((responses) => {
                        this.activity_created_by = responses;
                        const mappedData = this.activityMapToUI(res.paging.entities);
                        this.pagingActivityData = res.paging;
                        this.dealerActivityData = [...mappedData];
                        this.reload_data = true;
                    });
                },
                (error) => {
                    console.error(error);
                },
            )
            .add(() => (this.initial_load_activity = false));
    }

    reload_page(e: boolean): void {
        if (e) this.ngOnInit();
    }

    private getUserByIds(ids: string[]) {
        const userObservables = ids.map((id) => this._user.get_user_by_id(id).pipe(takeUntil(this._unsubscribe)));
        return forkJoin(userObservables);
    }

    private activityMapToUI(activity: USER_ACTIVITY[]): UI_ACTIVITY_LOGS[] {
        let count = 1;

        return activity.map((a) => {
            const activityCode = a.activityCode;
            let activityMessage = 'Other Activity Detected';
            let createdBy: { firstName: string; lastName: string };

            this.activity_created_by.map((c) => {
                if (c.userId === a.initiatedBy) createdBy = c;
            });

            switch (activityCode) {
                case 'modify_dealer':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} modified the dealer`;
                    break;
                case 'modify_billing':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} modified the billing details`;
                    break;
                case 'deleted_license':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} deleted a license`;
                    break;
                case 'deleted_multiple_license':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} deleted multiple licenses`;
                    break;
                case 'updated_license':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} updated system on licenses`;
                    break;
                case 'reboot_player':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} rebooted the player software`;
                    break;
                case 'reboot_pi':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} rebooted the pi`;
                    break;
                case 'reassign_dealer':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} re-assigned the dealer`;
                    break;
                case 'modify_dealer_profile':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} (You) modified profile info`;
                    break;
                case 'change_password':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} (You) changed password`;
                    break;
                case 'added_card':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} (You) added a card`;
                    break;
                case 'update_billing_address':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} (You) updated billing address`;
                    break;
                case 'delete_card':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} (You) deleted a card`;
                    break;
                case 'update_card':
                    activityMessage = `${createdBy.firstName} ${createdBy.lastName} (You) updated card details`;
                    break;
                default:
            }

            return new UI_ACTIVITY_LOGS(
                { value: count++, editable: false },
                { value: a.ownerId, hidden: true },
                { value: a.activityLogId, hidden: true },
                { value: this._date.transform(a.dateCreated, 'MMMM d, y'), hidden: false },
                { value: activityMessage, hidden: false },
                { value: a.initiatedBy, hidden: true },
                { value: a.dateUpdated, hidden: true },
            );
        });
    }

    public getUserActivityData(page: number): void {
        this.activityDataLoaded = false;
        this._user
            .getActivitiesByCurrentUser(this.sortActivityColumn, this.sortActivityOrder, page, 15)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                const mappedData = this.newActivityMapToUI(response.paging.entities, response.nonExistentTargetIds);
                this.pagingActivityData = response.paging;
                this.activityData = [...mappedData];
                this.activityDataLoaded = true;
            });
    }

    public newActivityMapToUI(activity: USER_ACTIVITY[], nonExistentTargetIds: string[]): USER_ACTIVITY[] {
        let count = 1;
        const noBreadcrumEntities = ['tag'];

        return activity.map((a) => {
            let targetLink = '';
            let targetName = a.targetName ? a.targetName : '--';
            const activityCodePrefix = a.activityCode.split('_')[0];
            const activitytUrl = ACTIVITY_URLS.find((ac) => ac.activityCodePrefix === activityCodePrefix);

            const isExcluded = nonExistentTargetIds && nonExistentTargetIds.includes(a.targetId);
            const url = `/${this.currentRole}/${activitytUrl.activityURL}/${a.targetId}`;
            targetLink = isExcluded ? '' : url;

            return new USER_ACTIVITY(
                { value: count++, editable: false },
                { value: a.activityCode, hidden: true },
                { value: a.activityLogId, hidden: true },
                {
                    value: targetName,
                    link: targetLink,
                    new_tab_link: true,
                    hidden: false,
                    noBreadcrumb: noBreadcrumEntities.includes(activityCodePrefix),
                },
                {
                    value: `You ${a.activityDescription} ${a.ownerId === a.initiatedById ? '' : `for ${a.owner}`}`,
                    hidden: false,
                },
                { value: this._date.transform(a.dateCreated, "MMMM d, y, 'at' h:mm a"), hidden: false },
                { value: a.initiatedBy, hidden: true },
                { value: a.initiatedById, hidden: true },
                { value: a.owner, hidden: true },
                { value: a.ownerId, hidden: true },
                { value: a.targetId, hidden: true },
            );
        });
    }

    getDealer(): void {
        this._dealer
            .get_dealer_by_id(this.dealer_id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response: API_DEALER) => {
                    this.date_created = response.dateCreated;
                    this.created_by = response.createdBy;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    getDealerValuesById(id) {
        this.subscription.add(
            this._dealer
                .get_dealer_values_by_id(id)
                .pipe(takeUntil(this._unsubscribe))
                .subscribe((response: any) => {
                    if (!response.message) {
                        this.no_dealer_values = false;
                    } else {
                        this.no_dealer_values = true;
                    }
                }),
        );
    }

    getTotalLicenses(id) {
        this._license
            .get_licenses_total_by_dealer(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data: any) => {
                    this.license_details.basis = data.total;
                    this.loading_license = false;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    getTotalAdvertisers(id) {
        this._advertiser
            .get_advertisers_total_by_dealer(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    this.advertiser_details.basis = data.total;
                    this.loading_advertiser = false;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    getTotalHosts(id) {
        this._host
            .get_host_total_per_dealer(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data) => {
                    this.host_details.basis = data.total;
                    this.loading_host = false;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    getTotalContents(id) {
        this._content
            .get_contents_total_by_dealer(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (data: any) => {
                    this.content_details.basis = data.total;
                    this.content_details.images = data.totalImages;
                    this.content_details.videos = data.totalVideos;
                    this.content_details.feeds = data.totalFeeds;
                    this.loading_content = false;
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    public goToUrl(): void {
        const prodShopUrl = 'https://shop.n-compass.online';
        const devShopUrl = 'http://dev.shop.n-compass.online';
        const url = this.isProd ? prodShopUrl : devShopUrl;
        window.open(url, '_blank');
    }
}
