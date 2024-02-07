import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import {
    AdvertiserService,
    AuthService,
    HostService,
    LicenseService,
    ContentService,
} from 'src/app/global/services';
import * as moment from 'moment';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    providers: [DatePipe],
})
export class DashboardComponent implements OnInit {
    advertiser_report_chart: any;
    contents_total: number = 0;
    date: any;
    dealer_report_chart: any;
    host_report_chart: any;
    license_report_chart: any;
    loading_advertiser_report_chart: boolean = true;
    loading_dealer_report_chart: boolean = true;
    loading_host_report_chart: boolean = true;
    loading_license_report_chart: boolean = true;
    no_dealers: boolean;
    no_ad_license: boolean = true;

    subscription: Subscription = new Subscription();
    title = 'Dashboard';
    licenses_details: any;
    hosts_details: any;
    ad_licenses_details: any;
    dealer_stats: any;
    playlists_details: any;
    advertiser_stats: any;
    screen_details: any;
    temp_label: any = [];
    temp_array: any = [];
    host_label: any = [];
    host_array: any = [];
    ad_license_label: any = [];
    ad_license_array: any = [];
    user_name: string;

    status_graph_label: any = [];
    status_graph_value: any = [];

    dealerId: any;

    constructor(
        private _auth: AuthService,
        private _advertiser: AdvertiserService,
        private _host: HostService,
        private _license: LicenseService,
        private _content: ContentService,
        private _date: DatePipe,
    ) {}

    ngOnInit() {
        if (this._auth.current_user_value.firstname) {
            this.user_name = this._auth.current_user_value.firstname;
        } else {
            this.user_name = 'John Doe';
        }

        var date = new Date();
        this.date = moment(date).format('LL') + ', ' + moment(date).format('dddd');
        this.dealerId = this._auth.current_user_value.roleInfo.dealerId;
        this.getLicenseReport();
        this.getAdvertiserReport();
        this.getHostReport();
        this.getAdLicenseReport();
        this.getAllContents();
    }

    getAllContents() {
        this._content.get_unused_contents(this.dealerId, '', '').subscribe((data) => {
            this.contents_total = data.paging.totalEntities;
        });
    }

    getLicenseReport() {
        this._license.get_licenses_total_by_dealer(this.dealerId).subscribe((data: any) => {
            this.licenses_details = {
                basis: data.total,
                basis_label: 'License(s)',
                basis_sub_label: 'Current Count',
                good_value: data.totalAssigned,
                good_value_label: 'Assigned',
                bad_value: data.totalUnAssigned,
                bad_value_label: 'Unassigned',
                ad_value: data.totalAd,
                ad_value_label: 'Ad',
                menu_value: data.totalMenu,
                menu_value_label: 'Menu',
                closed_value: data.totalClosed,
                closed_value_label: 'Closed',
                unassigned_value: data.totalUnassignedScreenCount,
                unassigned_value_label: 'Unassigned',
                breakdown1_value: data.totalOnline,
                breakdown1_label: 'Online',
                breakdown2_value: data.totalOffline,
                breakdown2_label: 'Offline',
                breakdown3_value: data.totalPending,
                breakdown3_label: 'Pending',
                breakdown4_sub_label: 'Connection Status Breakdown :',
                breakdown4_value: data.totalLan,
                breakdown4_label: 'LAN',
                breakdown5_value: data.totalWifi,
                breakdown5_label: 'WIFI',
                third_value: data.totalDisabled,
                third_value_label: 'Disabled',
            };

            this.status_graph_label.push('Online: ' + data.totalOnline);
            this.status_graph_label.push('Offline: ' + data.totalOffline);
            this.status_graph_label.push('Pending: ' + data.totalPending);
            this.status_graph_value.push(data.totalOnline);
            this.status_graph_value.push(data.totalOffline);
            this.status_graph_value.push(data.totalPending);

            if (this.licenses_details) {
                this.temp_label.push(
                    this.licenses_details.ad_value_label + ': ' + this.licenses_details.ad_value,
                );
                this.temp_label.push(
                    this.licenses_details.menu_value_label +
                        ': ' +
                        this.licenses_details.menu_value,
                );
                this.temp_label.push(
                    this.licenses_details.closed_value_label +
                        ': ' +
                        this.licenses_details.closed_value,
                );
                this.temp_label.push(
                    this.licenses_details.unassigned_value_label +
                        ': ' +
                        this.licenses_details.unassigned_value,
                );
                this.temp_array.push(this.licenses_details.ad_value);
                this.temp_array.push(this.licenses_details.menu_value);
                this.temp_array.push(this.licenses_details.closed_value);
                this.temp_array.push(this.licenses_details.unassigned_value);
            }
        });
    }

    getHostReport() {
        this.subscription.add(
            this._host.get_host_total_per_dealer(this.dealerId).subscribe(
                (data) => {
                    this.hosts_details = {
                        active_value: data.totalActive,
                        active_label: 'Active',
                        inactive_value: data.totalInActive,
                        inactive_label: 'Inactive',
                        for_installation_value: data.forInstallationScheduled,
                        for_installation_label: 'Install Schedule',
                    };

                    if (this.hosts_details) {
                        this.host_label.push(
                            this.hosts_details.active_label +
                                ': ' +
                                this.hosts_details.active_value,
                        );
                        this.host_label.push(
                            this.hosts_details.inactive_label +
                                ': ' +
                                this.hosts_details.inactive_value,
                        );
                        this.host_label.push(
                            this.hosts_details.for_installation_label +
                                ': ' +
                                this.hosts_details.for_installation_value,
                        );
                        this.host_array.push(this.hosts_details.active_value);
                        this.host_array.push(this.hosts_details.inactive_value);
                        this.host_array.push(this.hosts_details.for_installation_value);
                    }
                },
                (error) => {
                    console.error(error);
                },
            ),
        );
    }

    getAdLicenseReport() {
        this.subscription.add(
            this._license.get_ad_licenses_total_by_dealer(this.dealerId).subscribe(
                (data) => {
                    this.no_ad_license = false;
                    this.ad_licenses_details = {
                        basis: data.mainAverageAsset,
                        basis_label: 'Average Content Per Ad License',
                        basis_sub_label: 'Total',
                        hosts_value: data.mainAverageHost,
                        hosts_label: 'Hosts',
                        advertisers_value: data.mainAverageAdvertiser,
                        advertisers_label: 'Advertisers',
                        fillers_value: data.mainAverageFiller,
                        fillers_label: 'Fillers',
                        feeds_value: data.mainAverageFeed,
                        feeds_label: 'Feeds',
                        others_value: data.mainAverageOther,
                        others_label: 'Others',
                        average_duration: this.calculateTime(data.mainAverageDuration),
                    };
                    if (this.ad_licenses_details) {
                        this.ad_license_label.push(
                            this.ad_licenses_details.hosts_label +
                                ': ' +
                                this.ad_licenses_details.hosts_value,
                        );
                        this.ad_license_label.push(
                            this.ad_licenses_details.advertisers_label +
                                ': ' +
                                this.ad_licenses_details.advertisers_value,
                        );
                        this.ad_license_label.push(
                            this.ad_licenses_details.fillers_label +
                                ': ' +
                                this.ad_licenses_details.fillers_value,
                        );
                        this.ad_license_label.push(
                            this.ad_licenses_details.feeds_label +
                                ': ' +
                                this.ad_licenses_details.feeds_value,
                        );
                        this.ad_license_label.push(
                            this.ad_licenses_details.others_label +
                                ': ' +
                                this.ad_licenses_details.others_value,
                        );
                        this.ad_license_array.push(this.ad_licenses_details.hosts_value);
                        this.ad_license_array.push(this.ad_licenses_details.advertisers_value);
                        this.ad_license_array.push(this.ad_licenses_details.fillers_value);
                        this.ad_license_array.push(this.ad_licenses_details.feeds_value);
                        this.ad_license_array.push(this.ad_licenses_details.others_value);
                    }
                },
                (error) => {
                    this.no_ad_license = false;
                    this.ad_licenses_details = {
                        basis: 0,
                        basis_label: 'Average Content Per Ad License',
                        basis_sub_label: 'Total',
                        hosts_value: 0,
                        hosts_label: 'Hosts',
                        advertisers_value: 0,
                        advertisers_label: 'Advertisers',
                        fillers_value: 0,
                        fillers_label: 'Fillers',
                        feeds_value: 0,
                        feeds_label: 'Feeds',
                        others_value: 0,
                        others_label: 'Others',
                        average_duration: this.calculateTime(0),
                    };
                },
            ),
        );
    }

    private calculateTime(duration: number): string {
        if (duration < 60) {
            return `${Math.round(duration)}s`;
        }

        if (duration === 60) {
            return '1m';
        }

        const minutes = Math.floor(duration / 60);
        const seconds = Math.round(duration - minutes * 60);

        return `${minutes}m ${seconds}s`;
    }

    getAdvertiserReport() {
        this.subscription.add(
            this._advertiser.get_advertisers_total_by_dealer(this.dealerId).subscribe((data) => {
                this.advertiser_stats = {
                    basis: data.total,
                };
            }),
        );
    }
}
