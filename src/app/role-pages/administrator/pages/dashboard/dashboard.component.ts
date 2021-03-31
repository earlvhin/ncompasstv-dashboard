import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { HostService } from 'src/app/global/services/host-service/host.service';
import { LicenseService } from 'src/app/global/services/license-service/license.service';
import { AdvertiserService } from 'src/app/global/services/advertiser-service/advertiser.service';
import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { UI_TABLE_DEALERS_REPORT } from '../../../../global/models/ui_table_dealers.model';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
	providers: [DatePipe]
})

export class DashboardComponent implements OnInit {

	title: string = "Dashboard";

	// Dealer Chart
	dealer_report_chart: any;
	loading_dealer_report_chart: boolean = true;

	// Host Chart
	host_report_chart: any;
	loading_host_report_chart: boolean = true;

	// Advertiser Chart
	advertiser_report_chart: any;
	loading_advertiser_report_chart: boolean = true;
	
	// License Chart
	license_report_chart: any;
	loading_license_report_chart: boolean = true;

	// Latest Added Dealers
	latest_dealers: API_DEALER[];
	no_dealers: boolean;
	latest_dealer_col = [
		'#',
		'Business Name', 
		'Owner',
		'Contact Person',
		'Region',
		'State', 
		'Date Created'
	]

	subscription: Subscription = new Subscription;

	constructor(
		private _auth: AuthService,
		private _advertiser: AdvertiserService,
		private _dealer: DealerService,
		private _host: HostService,
		private _license: LicenseService,
		private _date: DatePipe
	) { }

	ngOnInit() {
		this.title = `Hello ${this._auth.current_user_value.firstname}!`;
		this.getDealerReport();
		this.getHostReport();
		this.getAdvertiserReport();
		this.getLicenseReport();
		this.getDealers();
	}

	getDealerReport() {
		let filter =  {
			type: 3,
			date: this._date.transform(new Date(), 'medium')
		}

		this.subscription.add(
			this._dealer.get_dealer_report(filter).subscribe(
				data => {
					let dealer_report = data.list[0].monthly.filter(i => i.total > 0);

					if (dealer_report.length >  0) {
						let latest_added = dealer_report[dealer_report.length - 1];
						let latest_date = latest_added.month.split(" ")
	
						this.dealer_report_chart = {
							title: 'Dealers',
							stats: `${latest_added.total} latest added dealers on ${this._date.transform(latest_date[0], 'MMMM y')}`,
							expand: true,
							chart_id: 'dealer_report',
							chart_label: [],
							chart_data: []
						}
	
						 dealer_report.map(
							i => {
								let month = i.month.split(" ");
								this.dealer_report_chart.chart_data.push(i.total),
								this.dealer_report_chart.chart_label.push(this._date.transform(month[0], 'MMM'))
							}
						)
					} else {
						this.dealer_report_chart = false;
					}

					this.loading_dealer_report_chart = false;
				}
			)
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
					console.log('getHostReport', data);
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
		let filter =  {
			type: 3,
			date: this._date.transform(new Date(), 'medium')
		}

		this.subscription.add(
			this._advertiser.get_advertiser_report(filter).subscribe(
				data => {
					let advertiser_report = data.list[0].monthly.filter(i => i.total > 0);

					if (advertiser_report.length > 0) {
						let latest_added = advertiser_report[advertiser_report.length - 1];
						let latest_date = latest_added.month.split(" ")
	
						this.advertiser_report_chart = {
							title: 'Advertisers',
							stats: `${latest_added.total} latest added advertisers on ${this._date.transform(latest_date[0], 'MMMM y')}`,
							expand: true,
							chart_id: 'advertiser_report',
							chart_label: [],
							chart_data: []
						}
	
						 advertiser_report.map(
							i => {
								let month = i.month.split(" ");
								this.advertiser_report_chart.chart_data.push(i.total),
								this.advertiser_report_chart.chart_label.push(this._date.transform(month[0], 'MMM'))
							}
						)
	
						this.loading_advertiser_report_chart = false;
					} else {
						this.advertiser_report_chart = false;
					}
				}, 
				error => {
					console.log(error);
				}
			)
		)
	}

	getLicenseReport() {
		let filter =  {
			type: 3,
			date: this._date.transform(new Date(), 'medium')
		}

		this.subscription.add(
			this._license.get_license_report(filter).subscribe(
				data => {
					let license_report = data.list[0].monthly.filter(i => i.total > 0);

					if (license_report.length > 0) {
						let latest_added = license_report[license_report.length - 1];
						let latest_date = latest_added.month.split(" ")
	
						this.license_report_chart = {
							title: 'Licenses',
							stats: `${latest_added.total} latest added licenses on ${this._date.transform(latest_date[0], 'MMMM y')}`,
							expand: true,
							chart_id: 'license_report',
							chart_label: [],
							chart_data: []
						}
	
						license_report.map(
							i => {
								let month = i.month.split(" ");
								this.license_report_chart.chart_data.push(i.total),
								this.license_report_chart.chart_label.push(this._date.transform(month[0], 'MMM'))
							}
						)
	
						this.loading_license_report_chart = false;
					} else {
						this.license_report_chart = false;
					}
				}, 
				error => {
					console.log(error);
				}
			)
		)
	}

	getDealers() {
		this.subscription.add(
			this._dealer.get_dealers().subscribe(
				(data: API_DEALER[]) => {
					if (data) {
						this.latest_dealers = this.dealers_mapToUI(data).slice(0,5);
					} else {
						this.no_dealers = true;
					}
				}
			)
		)
	}

	dealers_mapToUI(data) {
		let count = 1;
		if (data) {
			return data.map(
				dealer => {
					return new UI_TABLE_DEALERS_REPORT(
						dealer.dealerId,
						count++,
						dealer.businessName,
						dealer.owner,
						dealer.contactPerson,
						dealer.region,
						dealer.state,
						this._date.transform(dealer.dateCreated, 'MMM dd, y')
					)
				}
			)
		}
	}
}
