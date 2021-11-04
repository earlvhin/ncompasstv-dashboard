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
	advertiser_report_chart: any;
    date: any;
	dealer_report_chart: any;
	host_report_chart: any;
	latest_dealers: API_DEALER[];
	license_report_chart: any;
	loading_advertiser_report_chart: boolean = true;
	loading_dealer_report_chart: boolean = true;
	loading_host_report_chart: boolean = true;
	loading_license_report_chart: boolean = true;
	no_dealers: boolean;
	
    subscription: Subscription = new Subscription;
	title = 'Dashboard';
    licenses_details: any;
    dealer_stats: any;
    playlists_details: any;
    advertiser_stats: any;
    screen_details: any;
    temp_label: any = [];
    temp_array: any = [];
    user_name: string;

    status_graph_label: any = [];
    status_graph_value: any = [];

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
            this.user_name = 'John Doe';
        }

        var date = new Date();
        this.date = moment(date).format('LL') + ', ' +  moment(date).format('dddd');
		this.getLicenseReport();
		this.getAdvertiserReport();
	}

    getLicenseReport() {
        this._license.get_licenses_total().subscribe(
            (data: any) => {
                this.licenses_details = {
                    basis: data.total,
                    basis_label: 'License(s)',
                    basis_sub_label: 'Current Count',
                    good_value: data.totalActive,
                    good_value_label: 'Active',
                    bad_value: data.totalInActive,
                    bad_value_label: 'Inactive',
                    ad_value: data.totalAd,
                    ad_value_label: 'Ad',
                    menu_value: data.totalMenu,
                    menu_value_label: 'Menu',
                    closed_value: data.totalClosed,
                    closed_value_label: 'Closed',
                    unassigned_value: data.totalUnassignedScreenCount,
                    unassigned_value_label: 'Unassigned',
                    new_this_week_value: data.newLicensesThisWeek,
                    this_week_ad_value: data.thisWeekTotalAd,
                    this_week_menu_value: data.thisWeekTotalMenu,
                    this_week_closed_value: data.thisWeekTotalClosed,
                    this_week_unassigned_value: data.thisWeekUnassignedCount,
                    last_week_ad_value: data.lastWeekTotalAd,
                    last_week_menu_value: data.lastWeekTotalMenu,
                    last_week_closed_value: data.lastWeekTotalClosed,
                    last_week_unassigned_value: data.lastWeekUnassignedCount,
                }

                this.status_graph_label.push('Online: ' + data.totalOnline)
                this.status_graph_label.push('Offline: ' + data.totalOffline)
                this.status_graph_value.push(data.totalOnline)
                this.status_graph_value.push(data.totalOffline)

                if (this.licenses_details) {
                    this.temp_label.push(this.licenses_details.ad_value_label + ": " + this.licenses_details.ad_value);
                    this.temp_label.push(this.licenses_details.menu_value_label+ ": " + this.licenses_details.menu_value);
                    this.temp_label.push(this.licenses_details.closed_value_label+ ": " + this.licenses_details.closed_value);
                    this.temp_label.push(this.licenses_details.unassigned_value_label+ ": " + this.licenses_details.unassigned_value);
                    this.temp_array.push(this.licenses_details.ad_value);
                    this.temp_array.push(this.licenses_details.menu_value);
                    this.temp_array.push(this.licenses_details.closed_value);
                    this.temp_array.push(this.licenses_details.unassigned_value);
                }
            }
        )
	}

	getHostReport() {
		let filter =  {
			type: 3,
			date: this._date.transform(new Date(), 'medium')
		}

		this.subscription.add(
			this._host.get_host_report(filter).subscribe(
				data => {
					let host_report = data.list[0].monthly.filter(i => i.total > 0);

					if (host_report.length > 0) {
						let latest_added = host_report[host_report.length - 1];
						let latest_date = latest_added.month.split(" ")
	
						this.host_report_chart = {
							title: 'Hosts',
							stats: `${latest_added.total} latest added hosts on ${this._date.transform(latest_date[0], 'MMMM y')}`,
							expand: true,
							chart_id: 'host_report',
							chart_label: [],
							chart_data: []
						}
	
						 host_report.map(
							i => {
								let month = i.month.split(" ");
								this.host_report_chart.chart_data.push(i.total),
								this.host_report_chart.chart_label.push(this._date.transform(month[0], 'MMM'))
							}
						)
					} else {
						this.host_report_chart = false;
					}

					this.loading_host_report_chart = false;
				}, 
				error => {
					console.log(error);
				}
			)
		)

	}

	getAdvertiserReport() {
		this.subscription.add(
			this._advertiser.get_advertisers_total().subscribe(
				data => {
					this.advertiser_stats = {
						basis: data.total,
					}
				}
			)
		);
	}
}
