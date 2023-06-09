import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import Chart from 'chart.js/auto';
import { takeUntil } from 'rxjs/operators';

import { AdvertiserService } from 'src/app/global/services/advertiser-service/advertiser.service';
import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { HostService } from '../../../../global/services/host-service/host.service';
import { LicenseService } from '../../../../global/services/license-service/license.service';
import { UI_TABLE_HOSTS } from '../../../../global/models/ui_table_hosts_report.model';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
	providers: [DatePipe]
})
export class DashboardComponent implements OnInit, OnDestroy {
	advertiser_report_chart: any;
	displayedColumns_2: string[] = ['position', 'name'];
	host_report_chart: any;
	is_view_only = false;
	latest_hosts: any;
	license_report_chart: any;
	loading_advertiser_report_chart: boolean = true;
	loading_host_report_chart: boolean = true;
	loading_license_report_chart: boolean = true;
	nc = false;
	no_chart_to_show: boolean = true;
	no_hosts: boolean;
	now = new Date().getMonth();
	statTable: any = {};
	title = '';

	latest_hosts_col = ['#', 'Business Name', 'Address', 'Region', 'City', 'State', 'Creation Date'];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _host: HostService,
		private _license: LicenseService,
		private _date: DatePipe,
		private _advertiser: AdvertiserService
	) {}

	ngOnInit() {
		this.title = `Hello Sub-Dealer ${this.currentUser.firstname}!`;
		this.getStatTable(this.currentUser.roleInfo.dealerId);
		this.getAdvertiserReport();
		this.getHostReport();
		this.getLicenseReport();
		this.getHosts(this.currentUser.roleInfo.dealerId);
		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	private generateChart(lan: any, wifi: any): void {
		const canvas = <HTMLCanvasElement>document.getElementById('connectionChart');

		if (canvas) {
			new Chart(canvas, {
				type: 'doughnut',
				data: {
					labels: ['LAN', 'WIFI'],
					datasets: [
						{
							data: [lan, wifi],
							backgroundColor: ['rgba(91, 155, 213, 0.8)', 'rgba(237, 125, 49, 0.8)'],
							borderColor: ['rgba(91, 155, 213, 1)', 'rgba(237, 125, 49, 1)']
						}
					]
				}
			});
		}
	}

	private getAdvertiserReport(): void {
		const filter = {
			type: 3,
			date: this._date.transform(new Date(), 'medium'),
			dealerId: this._auth.current_user_value.roleInfo.dealerId
		};

		this._advertiser
			.get_advertiser_report(filter)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { list: any[] }) => {
					const advertiser_report = response.list[0].monthly.filter((i) => i.total > 0);

					if (advertiser_report.length <= 0) {
						this.advertiser_report_chart = false;
						return;
					}

					const latest_added = advertiser_report[advertiser_report.length - 1];
					const latest_date = latest_added.month.split(' ');

					this.advertiser_report_chart = {
						title: 'Advertisers',
						stats: `${latest_added.total} latest added advertisers on ${this._date.transform(latest_date[0], 'MMMM y')}`,
						expand: true,
						chart_id: 'advertiser_report',
						chart_label: [],
						chart_data: []
					};

					advertiser_report.map((report) => {
						const month = report.month.split(' ');
						this.advertiser_report_chart.chart_data.push(report.total),
							this.advertiser_report_chart.chart_label.push(this._date.transform(month[0], 'MMM'));
					});

					this.loading_advertiser_report_chart = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private getHosts(id: string): void {
		this._host
			.get_host_by_dealer_id(id, 1, '')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					if (response.message) {
						this.no_hosts = true;
						return;
					}
					const hosts = [];
					response.paging.entities.map((i) => hosts.push(i));
					this.latest_hosts = this.hosts_mapToUI(hosts).slice(0, 5);
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private getHostReport(): void {
		const filter = {
			type: 3,
			date: this._date.transform(new Date(), 'medium'),
			dealerId: this._auth.current_user_value.roleInfo.dealerId
		};

		this._host
			.get_host_report(filter)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { list: any[] }) => {
					const host_report = response.list[0].monthly.filter((i) => i.total > 0);

					if (host_report.length <= 0) {
						this.host_report_chart = false;
						return;
					}

					const latest_added = host_report[host_report.length - 1];
					const latest_date = latest_added.month.split(' ');

					this.host_report_chart = {
						title: 'Hosts',
						stats: `${latest_added.total} latest added hosts on ${this._date.transform(latest_date[0], 'MMMM y')}`,
						expand: true,
						chart_id: 'host_report',
						chart_label: [],
						chart_data: []
					};

					host_report.map((report: { total: any; month: any }) => {
						const month = report.month.split(' ');
						this.host_report_chart.chart_data.push(report.total),
							this.host_report_chart.chart_label.push(this._date.transform(month[0], 'MMM'));
					});

					this.loading_host_report_chart = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private getLicenseReport(): void {
		const filter = {
			type: 3,
			date: this._date.transform(new Date(), 'medium'),
			dealerId: this._auth.current_user_value.roleInfo.dealerId
		};
		this._license
			.get_license_report(filter)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					const license_report = response.list[0].monthly.filter((i) => i.total > 0);

					if (license_report.length <= 0) {
						this.license_report_chart = false;
						return;
					}

					const latest_added = license_report[license_report.length - 1];
					const latest_date = latest_added.month.split(' ');

					this.license_report_chart = {
						title: 'Licenses',
						stats: `${latest_added.total} latest added licenses on ${this._date.transform(latest_date[0], 'MMMM y')}`,
						expand: true,
						chart_id: 'licenses_report',
						chart_label: [],
						chart_data: []
					};

					license_report.map((i) => {
						let month = i.month.split(' ');
						this.license_report_chart.chart_data.push(i.total),
							this.license_report_chart.chart_label.push(this._date.transform(month[0], 'MMM'));
					});

					this.loading_license_report_chart = false;
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private getStatTable(id: string): void {
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

		this._host
			.get_host_total_per_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: any) => {
					this.statTable = {
						title: 'Month of ' + months[this.now],
						hosts: response.total,
						active_hosts: response.totalActive,
						inactive_hosts: response.totalInActive
					};
				},
				(error) => {
					throw new Error(error);
				}
			);

		this._license
			.get_licenses_total_by_dealer(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: any) => {
					this.statTable.licenses = response.total;
					this.statTable.unassigned = response.totalUnAssigned;
					this.statTable.assigned = response.totalAssigned;
					this.generateChart(response.totalLan, response.totalWifi);
				},
				(error) => {
					throw new Error(error);
				}
			);
	}

	private hosts_mapToUI(data: any[]): UI_TABLE_HOSTS[] {
		let count = 1;

		if (data) {
			return data.map((host) => {
				return new UI_TABLE_HOSTS(
					{ value: host.hostId, link: null, editable: false, hidden: true },
					{ value: count++, link: null, editable: false, hidden: false },
					{ value: host.name, link: '/sub-dealer/hosts/' + host.hostId, editable: false, hidden: false },
					{ value: host.address, link: null, editable: false, hidden: false },
					{ value: host.region != null ? host.region : '--', link: null, editable: false, hidden: false },
					{ value: host.city, link: null, editable: false, hidden: false },
					{ value: host.state, link: null, editable: false, hidden: false },
					{ value: this._date.transform(host.dateCreated, 'MMM dd, y'), link: null, editable: false, hidden: false }
				);
			});
		}
	}

	private get currentUser() {
		return this._auth.current_user_value;
	}
}
