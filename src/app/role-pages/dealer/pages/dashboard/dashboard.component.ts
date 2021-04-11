import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { Observable, Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { HostService } from '../../../../global/services/host-service/host.service';
import { LicenseService } from '../../../../global/services/license-service/license.service';
import { AdvertiserService } from 'src/app/global/services/advertiser-service/advertiser.service';
import { UI_TABLE_HOSTS } from '../../../../global/models/ui_table_hosts_report.model';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
	providers: [DatePipe]
})

export class DashboardComponent implements OnInit {
	title = "";
	statTable: any = {};
	nc: boolean= false;
	now = new Date().getMonth();

	// Advertiser Chart
	advertiser_report_chart: any;
	loading_advertiser_report_chart: boolean = true;

	// Host Chart
	host_report_chart: any;
	loading_host_report_chart: boolean = true;
	
	// License Chart
	license_report_chart: any;
	loading_license_report_chart: boolean = true;

	// Latest Added Hosts
	latest_hosts: any;
	no_hosts: boolean;
	latest_hosts_col = [
		'#',
		'Business Name', 
		'Address',
		'Region',
		'City',
		'State', 
		'Date Created'
	]

	subscription: Subscription = new Subscription();
	displayedColumns_2: string[] = ['position', 'name'];
	no_chart_to_show: boolean = true;
	
	constructor(
		private _auth: AuthService,
		private _host: HostService,
		private _license: LicenseService,
		private _date: DatePipe,
		private _advertiser: AdvertiserService,
	) { }

	ngOnInit() {
		this.title = `Hello Dealer ${this._auth.current_user_value.firstname}!`;
		this.getStatTable(this._auth.current_user_value.roleInfo.dealerId);
		this.getAdvertiserReport();
		this.getHostReport();
		this.getLicenseReport();
		this.getHosts(this._auth.current_user_value.roleInfo.dealerId);
	}

	generateChart(lan, wifi) {
		var canvas = <HTMLCanvasElement> document.getElementById('connectionChart');
		if (canvas) {
			var chart = new Chart(canvas, {
				type: 'doughnut',
				data: {
					labels: ['LAN', 'WIFI'],
					datasets: [{
						data: [lan, wifi],
						backgroundColor: [
							'rgba(91, 155, 213, 0.8)',
							'rgba(237, 125, 49, 0.8)',
						  ],
						borderColor: [
							'rgba(91, 155, 213, 1)',
							'rgba(237, 125, 49, 1)',
						],
					}],
				}
			})
		} else {
			// setTimeout(() => {
			// 	this.generateChart(lan, wifi);
			// }, 1000)
		}
	}
	
	getAdvertiserReport() {
		let filter =  {
			type: 3,
			date: this._date.transform(new Date(), 'medium'),
			dealerId: this._auth.current_user_value.roleInfo.dealerId
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

					// console.log(this.advertiser_report_chart);
				}, 
				error => {
					// console.log(error);
				}
			)
		)
	}

	getHostReport() {
		let filter =  {
			type: 3,
			date: this._date.transform(new Date(), 'medium'),
			dealerId: this._auth.current_user_value.roleInfo.dealerId
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
					// console.log(error);
				}
			)
		)

	}
	
	getLicenseReport() {
		let filter =  {
			type: 3,
			date: this._date.transform(new Date(), 'medium'),
			dealerId: this._auth.current_user_value.roleInfo.dealerId
		}

		this.subscription.add(
			this._license.get_license_report(filter).subscribe(
				data => {
					// console.log('getLicenseReport', data);
					let license_report = data.list[0].monthly.filter(i => i.total > 0);

					if (license_report.length > 0) {
						let latest_added = license_report[license_report.length - 1];
						let latest_date = latest_added.month.split(" ")
	
						this.license_report_chart = {
							title: 'Licenses',
							stats: `${latest_added.total} latest added licenses on ${this._date.transform(latest_date[0], 'MMMM y')}`,
							expand: true,
							chart_id: 'licenses_report',
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
					} else {
						this.license_report_chart = false;
					}
					this.loading_license_report_chart = false;
				}, 
				error => {
					// console.log(error);
				}
			)
		)

	}

	getStatTable(id) {
		var monthNames = ["January", "February", "March", "April", "May","June","July", "August", "September", "October", "November","December"];
		let hostdata: any;
		this.subscription.add(
			this._host.get_host_total_per_dealer(id).subscribe(
				(data: any) => {
					this.statTable = {
						title: 'Month of ' +monthNames[this.now],
						hosts: data.total,
						active_hosts: data.totalActive,
						inactive_hosts: data.totalInActive,
					}
				}
			)
		)

		this.subscription.add(
			this._license.get_license_total_per_dealer(id).subscribe(
				(data: any) => {
					this.statTable.licenses =  data.total;
					this.statTable.unassigned =  data.totalUnAssigned;
					this.statTable.assigned =  data.totalAssigned;
					this.generateChart(data.totalLan, data.totalWifi);
				}
			)
		)
	}

	getHosts(id) {
		this.subscription.add(
			this._host.get_host_by_dealer_id(id, 1, "").subscribe(
				(data: any) => {
					if (!data.message) {
						var x = [];
						data.hosts.map (
							i => {
								x.push(i.host);
							}
						)
						this.latest_hosts = this.hosts_mapToUI(x).slice(0,5);
					} else {
						this.no_hosts = true;
					}
				}
			)
		)
	}

	hosts_mapToUI(data) {
		let count = 1;
		if (data) {
			return data.map(
				host => {
					return new UI_TABLE_HOSTS(
						{ value: host.hostId, link: null , editable: false, hidden: true},
						{ value: count++, link: null , editable: false, hidden: false},
						{ value: host.name, link: '/dealer/hosts/' + host.hostId , editable: false, hidden: false},
						{ value: host.address, link: null , editable: false, hidden: false},
						{ value: host.region != null ? host.region : '--', link: null , editable: false, hidden: false},
						{ value: host.city, link: null , editable: false, hidden: false},
						{ value: host.state, link: null , editable: false, hidden: false},
						{ value: this._date.transform(host.dateCreated, 'MMM dd, y'), link: null , editable: false, hidden: false},	
					)
				}
			)
		}
	}
}
