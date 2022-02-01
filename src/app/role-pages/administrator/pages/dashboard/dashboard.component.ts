import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { HostService } from 'src/app/global/services/host-service/host.service';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { AdvertiserService } from 'src/app/global/services/advertiser-service/advertiser.service';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import * as moment from 'moment';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
	providers: [DatePipe]
})

export class DashboardComponent implements OnInit {
    date: any;
    subscription: Subscription = new Subscription;
	title = 'Dashboard';
    user_name: string;
    selected_date: string;

    dealer_stats: any = [];
    host_stats: any = [];
    advertiser_stats: any = [];
    license_stats: any = [];
    installation_stats: any = [];

	constructor(
		private _auth: AuthService,
		private _advertiser: AdvertiserService,
		private _dealer: DealerService,
		private _host: HostService,
		private _license: LicenseService,
		private _date: DatePipe,
	) { }

	ngOnInit() {
        if(this._auth.current_user_value.firstname) {
            this.user_name = this._auth.current_user_value.firstname;
        } else {
            this.user_name = "John Doe";
        }

        var date = new Date();
        this.date = moment(date).format('LL') + ', ' +  moment(date).format('dddd');

        this.selected_date = moment(date).format('MM-DD-YYYY');

        this.getDealerStatistics();
        this.getHostStatistics();
        this.getAdvertiserStatistics();
        this.getLicensesStatistics();
        this.getInstallationStats();
	}

    getDealerStatistics() {
		this._dealer.api_get_dealer_total().subscribe(
			(data: any)  => {
                this.dealer_stats = {
                    total: data.total,
                    total_label: 'DEALERS',
                    active: data.totalActive,
                    active_label: 'ACTIVE',
                    inactive: data.totalInActive,
                    inactive_label: 'INACTIVE',
                    this_week: data.newDealersThisWeek,
                    last_week: data.newDealersLastWeek,
                    icon: 'fas fa-briefcase'
                }
			}
		);
	}

    getHostStatistics() {
		this._host.get_host_total().subscribe(
			(data: any) => {
                this.host_stats = {
                    total: data.total,
                    total_label: 'HOSTS',
                    active: data.totalActive,
                    active_label: 'ACTIVE',
                    inactive: data.totalInActive,
                    inactive_label: 'INACTIVE',
                    this_week: data.newHostsThisWeek,
                    last_week: data.newHostsLastWeek,
                    icon: 'fas fa-map'
                }
            }
        );
    }

    getAdvertiserStatistics() {
		this._advertiser.get_advertisers_total().subscribe(
            (data: any) => {
                this.advertiser_stats = {
                    total: data.total,
                    total_label: 'ADVERTISERS',
                    active: data.totalActive,
                    active_label: 'ACTIVE',
                    inactive: data.totalInActive,
                    inactive_label: 'INACTIVE',
                    this_week: data.newAdvertisersThisWeek,
                    last_week: data.newAdvertisersLastWeek,
                    icon: 'fas fa-ad'
                }
            }   
        )
    }

    getLicensesStatistics() {
        this._license.get_licenses_total().subscribe(
            (data: any) => {
                this.license_stats = {
                    total: data.total,
                    total_label: 'LICENSES',
                    active: data.totalAssigned,
                    active_label: 'ASSIGNED',
                    inactive: data.totalUnAssigned,
                    inactive_label: 'UNASSIGNED',
                    this_week: data.newLicensesThisWeek,
                    last_week: data.newLicensesLastWeek,
                    icon: 'fas fa-barcode'
                }
            }
        )
    }

    getInstallationStats() {
        this._license.get_installation_statistics().subscribe(
            (data:any) => {
                this.installation_stats = {
                   total: data.licenseInstallationStats.total === 0 ? '0' :
                          data.licenseInstallationStats.total,
                    total_label: 'INSTALLATIONS',
                    icon: 'fas fa-calendar',
                    this_month: data.licenseInstallationStats.currentMonth,
                    last_month: data.licenseInstallationStats.previousMonth,
                    next_month: data.licenseInstallationStats.nextMonth,
                }
            }
        )
    }

    getAverage(total){
        var average = total/this.dealer_stats.active;
        return average.toFixed(2);
    }
}
