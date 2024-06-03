import { Component, OnInit } from '@angular/core';
import { MatTab } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription, forkJoin } from 'rxjs';
import {
    AuthService,
    AdvertiserService,
    ContentService,
    HostService,
    LicenseService,
    DealerService,
    UserService,
} from 'src/app/global/services';
import {
    ACTIVITY_URLS,
    API_ACTIVITY,
    API_DEALER,
    API_USER_DATA,
    PAGING,
    UI_ACTIVITY_LOGS,
    UI_CURRENT_USER,
    UI_ROLE_DEFINITION,
    USER_ACTIVITY,
} from 'src/app/global/models';
import { environment } from 'src/environments/environment';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-profile-setting',
    templateUrl: './profile-setting.component.html',
    styleUrls: ['./profile-setting.component.scss'],
})
export class ProfileSettingComponent implements OnInit {
    activity_created_by: any;
    activity_data: UI_ACTIVITY_LOGS[] = [];
    activityData: API_ACTIVITY[] = [];
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
    is_prod: boolean = false;
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
    tab_selected: string = 'Dealer';
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
        if (!environment.production) {
            this.is_prod = false;
        } else {
            this.is_prod = true;
        }
        if (this._auth.current_user_value.role_id === UI_ROLE_DEFINITION.dealer) {
            this.isDealer = true;
            this.dealer_id = this._auth.current_user_value.roleInfo.dealerId;
            this.current_user = this._auth.current_user_value;
            this.getTotalLicenses(this._auth.current_user_value.roleInfo.dealerId);
            this.getTotalAdvertisers(this._auth.current_user_value.roleInfo.dealerId);
            this.getTotalHosts(this._auth.current_user_value.roleInfo.dealerId);
            this.getTotalContents(this._auth.current_user_value.roleInfo.dealerId);
            this.getDealerValuesById(this._auth.current_user_value.roleInfo.dealerId);
            // this.getCreditCardsId(this._auth.current_user_value.roleInfo.dealerId);
            this.checkIfEnableShop();
            this.getDealerActivity(1);
            this.getDealer();
        } else {
            this.isDealer = false;
            this.getUserActivityData(1);
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
        this.activity_data = [];

        this._dealer
            .get_dealer_activity(this.dealer_id, this.sortActivityColumn, this.sortActivityOrder, page)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (res) => {
                    if (res.paging.entities.length === 0) {
                        this.no_activity_data = true;
                        this.activity_data = [];
                        return;
                    }

                    this.getUserByIds(res.paging.entities.map((a) => a.initiatedBy)).subscribe((responses) => {
                        this.activity_created_by = responses;

                        const mappedData = this.activity_mapToUI(res.paging.entities);
                        this.pagingActivityData = res.paging;
                        this.activity_data = [...mappedData];
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
    getUserByIds(ids: any[]) {
        const userObservables = ids.map((id) => this._user.get_user_by_id(id).pipe(takeUntil(this._unsubscribe)));

        return forkJoin(userObservables);
    }

    activity_mapToUI(activity): any {
        let count = 1;

        return activity.map((a: any) => {
            const activityCode = a.activityCode;
            let activityMessage = 'Other Activity Detected';
            let createdBy;

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
                    return activityMessage;
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
        this._user
            .getActivitiesByCurrentUser(this.sortActivityColumn, this.sortActivityOrder, page, 15)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                const mappedData = this.new_activity_mapToUI(response.paging.entities, response.nonExistentTargetIds);
                this.pagingActivityData = response.paging;
                this.activityData = [...mappedData];
            });
    }

    public new_activity_mapToUI(activity: USER_ACTIVITY[], nonExistentTargetIds: string[]): any {
        let count = 1;

        return activity.map((a) => {
            let targetLink = '';
            const activityCodePrefix = a.activityCode.split('_')[0];
            const activitytUrl = ACTIVITY_URLS.find((ac) => ac.activityCodePrefix === activityCodePrefix);
            const targetName = a.targetName ? a.targetName : '--';

            if (nonExistentTargetIds.includes(a.targetId)) {
                /**
                 * This switch case block handles targets that don't have single pages available.
                 * This will setup override links for them if need be.
                 * @default targetLink = ''
                 */
                switch (activityCodePrefix) {
                    case 'tag':
                        targetLink = `/${this.currentRole}/${activitytUrl.activityURL}`;
                        break;
                    default:
                        targetLink = '';
                        break;
                }
            } else {
                targetLink = `/${this.currentRole}/${activitytUrl.activityURL}/${a.targetId}`;
            }

            return new USER_ACTIVITY(
                { value: count++, editable: false },
                { value: a.activityCode, hidden: true },
                { value: a.activityLogId, hidden: true },
                { value: a.initiatedBy, hidden: true },
                { value: targetName, link: targetLink, new_tab_link: true, hidden: false },
                {
                    value: `You ${a.activityDescription} ${a.ownerId === a.initiatedById ? '' : `for ${a.owner}`} `,
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

    // getCreditCardsId(id) {
    // 	this.subscription.add(
    //         this._dealer.get_credit_cards(id).pipe(takeUntil(this._unsubscribe)).subscribe(
    // 			(response:any) => {
    //                 if(!response.message) {
    //                     this.no_credit_card = false;
    //                     this.dealer_email = response.email;
    //                 } else {
    //                     this.no_credit_card = true;
    //                 }
    //             }
    //         )
    //     )
    // };

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

    tabSelected(event: { index: number }) {
        this.getDealerActivity(1);
        this.getUserActivityData(1);

        return event;
    }

    goToUrl(): void {
        if (this.is_prod) {
            window.open('https://shop.n-compass.online', '_blank');
        } else {
            window.open('http://dev.shop.n-compass.online', '_blank');
        }
    }
}
