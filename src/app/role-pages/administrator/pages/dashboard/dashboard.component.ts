import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { Subject, Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { HostService } from 'src/app/global/services/host-service/host.service';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { AdvertiserService } from 'src/app/global/services/advertiser-service/advertiser.service';
import * as moment from 'moment';
import { UI_ROLE_DEFINITION } from 'src/app/global/models';
import { ContentService, FeedService, UserService } from 'src/app/global/services';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
    current_user_role = this._currentUserRole;
    date: any;
    daily_content_total: number;
    daily_feed_total: number;
    daily_login_total: number;
    is_admin = this.current_user_role === 'administrator';
    is_dealeradmin = this.current_user_role === 'dealeradmin';
    subscription: Subscription = new Subscription();
    title = 'Dashboard';
    user_name: string;
    selected_date: string;
    dealer_stats: any = [];
    host_stats: any = [];
    advertiser_stats: any = [];
    license_stats: any = [];
    installation_stats: any = [];
    no_feed_total = false;
    no_content_total = false;
    no_user_total = false;

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _advertiser: AdvertiserService,
        private _content: ContentService,
        private _dealer: DealerService,
        private _feed: FeedService,
        private _host: HostService,
        private _license: LicenseService,
        private _user: UserService,
    ) {}

    ngOnInit() {
        if (this._auth.current_user_value.firstname) {
            this.user_name = this._auth.current_user_value.firstname;
        } else {
            this.user_name = 'John Doe';
        }
        let date = new Date();
        this.date = moment(date).format('LL') + ', ' + moment(date).format('dddd');

        this.selected_date = moment(date).format('MM-DD-YYYY');

        this.getDealerStatistics();
        this.getHostStatistics();
        this.getAdvertiserStatistics();
        this.getLicensesStatistics();
        this.getInstallationStats();
        this.getContentTotal();
        this.getFeedsTotal();
        this.getUserTotal();
    }

    getDealerStatistics() {
        this._dealer.api_get_dealer_total().subscribe((data: any) => {
            this.setDealerStats(data);
        });
    }

    setDealerStats(data) {
        this.dealer_stats = {
            total: data.total,
            total_label: 'Dealers',
            active: data.totalActive,
            active_label: 'Active',
            inactive: data.totalInActive,
            inactive_label: 'Inactive',
            this_week: data.newDealersThisWeek,
            last_week: data.newDealersLastWeek,
            icon: 'fas fa-briefcase',
        };
    }

    getHostStatistics() {
        this._host.get_host_total().subscribe((data: any) => {
            this.setHostStatistics(data);
        });
    }

    setHostStatistics(data) {
        this.host_stats = {
            total: data.total,
            total_label: 'Hosts',
            active: data.totalActive,
            active_label: 'Active',
            inactive: data.totalInActive,
            inactive_label: 'Inactive',
            this_week: data.newHostsThisWeek,
            last_week: data.newHostsLastWeek,
            icon: 'fas fa-map',
        };
    }

    getAdvertiserStatistics() {
        this._advertiser.get_advertisers_total().subscribe((data: any) => {
            this.setAdvertisersStats(data);
        });
    }

    setAdvertisersStats(data) {
        this.advertiser_stats = {
            total: data.total,
            total_label: 'Advertisers',
            active: data.totalActive,
            active_label: 'Active',
            inactive: data.totalInActive,
            inactive_label: 'Inactive',
            this_week: data.newAdvertisersThisWeek,
            last_week: data.newAdvertisersLastWeek,
            icon: 'fas fa-ad',
        };
    }

    getLicensesStatistics() {
        this._license.get_licenses_total().subscribe((data: any) => {
            this.setLicensesStats(data);
        });
    }

    setLicensesStats(data) {
        this.license_stats = {
            total: data.total,
            total_label: 'Licenses',
            active: data.totalAssigned,
            active_label: 'Assigned',
            inactive: data.totalUnAssigned,
            inactive_label: 'Unassigned',
            this_week: data.newLicensesThisWeek,
            last_week: data.newLicensesLastWeek,
            notes: data.totalDisabled + ' inactive licenses',
            icon: 'fas fa-barcode',
        };
    }

    getInstallationStats() {
        this._license.get_installation_statistics().subscribe((data: any) => {
            this.setInstallationStatistics(data);
        });
    }

    setInstallationStatistics(data) {
        this.installation_stats = {
            total:
                data.licenseInstallationStats.total === 0 ? 0 : data.licenseInstallationStats.total,
            total_label: 'Installations',
            icon: 'fas fa-calendar',
            this_month: data.licenseInstallationStats.currentMonth,
            last_month: data.licenseInstallationStats.previousMonth,
            next_month: data.licenseInstallationStats.nextMonth,
        };
    }

    getAverage(total) {
        let average = total / this.dealer_stats.active;
        return average ? average.toFixed(0) : 0;
    }

    getFeedsTotal() {
        let request = this._feed.get_feeds_total();

        request.pipe(takeUntil(this._unsubscribe)).subscribe((res) => {
            if (res.newFeedsThisDay === 0) this.no_feed_total = true;
            this.daily_feed_total = res.newFeedsThisDay;
        });
    }

    getContentTotal(): void {
        let request = this._content.get_contents_total();

        request.pipe(takeUntil(this._unsubscribe)).subscribe((res) => {
            if (res.newContentsThisDay === 0) this.no_content_total = true;
            this.daily_content_total = res.newContentsThisDay;
        });
    }

    getUserTotal(): void {
        let request = this._user.get_user_total();

        request.pipe(takeUntil(this._unsubscribe)).subscribe((res) => {
            if (res.loggedInUsers === 0) this.no_user_total = true;
            this.daily_login_total = res.loggedInUsers;
        });
    }

    isNumber(val): boolean {
        return typeof val === 'number';
    }

    protected get _currentUserRole() {
        return this._auth.current_role;
    }
}
