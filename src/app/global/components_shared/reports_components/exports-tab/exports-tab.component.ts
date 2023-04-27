import { Component, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import { LicenseService } from 'src/app/global/services';
import { API_LICENSE_PROPS } from 'src/app/global/models';

@Component({
	selector: 'app-exports-tab',
	templateUrl: './exports-tab.component.html',
	styleUrls: ['./exports-tab.component.scss'],
	providers: [DatePipe, TitleCasePipe]
})
export class ExportsTabComponent implements OnInit {
	hosts_table_column = [
		{ name: '#', sortable: false, no_export: true },
		{ name: 'Host ID', sortable: true, key: 'hostId', hidden: true, no_show: true },
		{ name: 'Host Name', sortable: true, column: 'HostName', key: 'hostName' },
		{ name: 'Category', hidden: true, no_show: true, key: 'category' },
		{ name: 'Dealer Name', sortable: true, column: 'BusinessName', key: 'businessName' },
		{ name: 'License Key', hidden: true, no_show: true, key: 'licenseKey' },
		{ name: 'Alias', hidden: true, no_show: true, key: 'alias' },
		{ name: 'Type', hidden: true, no_show: true, key: 'screenType' },
		{ name: 'Last Startup', hidden: true, no_show: true, key: 'timeIn' },
		{ name: 'Pi Version', hidden: true, no_show: true, key: 'piVersion' },
		{ name: 'Installation Date', hidden: true, no_show: true, key: 'installDate' },
		{ name: 'Creation Date', hidden: true, no_show: true, key: 'dateCreated' },
		{ name: 'Background', sortable: false, hidden: true, key: 'background_zone', no_show: true },
		{ name: 'Horizontal', sortable: false, hidden: true, key: 'horizontal_zone', no_show: true },
		{ name: 'Main', sortable: false, hidden: true, key: 'main_zone', no_show: true },
		{ name: 'Vertical', sortable: false, hidden: true, key: 'vertical_zone', no_show: true },
		{ name: 'Address', sortable: true, column: 'Address', key: 'hostAddress' },
		{ name: 'City', sortable: true, column: 'City', key: 'city' },
		{ name: 'State', sortable: true, column: 'State', key: 'state' },
		{ name: 'Postal Code', sortable: true, column: 'PostalCode', key: 'postalCode' },
		{ name: 'Timezone', sortable: true, column: 'TimezoneName', key: 'timezoneName' },
		// { name: 'Total Licenses', sortable: true, column:'TotalLicenses', key:'totalLicenses' },
		{ name: 'Tags', hidden: true, no_show: true, key: 'tagsToString' },
		{ name: 'Total Business Hours', sortable: false, key: 'storeHours', hidden: true, no_show: true }
	];

	diff_hours: any;
	hour_diff: number;
	hour_diff_temp: any;
	licenses_to_export: API_LICENSE_PROPS[] = [];
	splitted_text: any;
	workbook: any;
	workbook_generation: boolean = false;
	worksheet: any;

	protected _unsubscribe = new Subject<void>();

	constructor(private _license: LicenseService, private _title: TitleCasePipe, private _date: DatePipe) {}

	ngOnInit() {}

	exportHostsTable(tab) {
		this.workbook_generation = true;
		const header = [];
		this.workbook = new Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
		switch (tab) {
			case 'licenses':
				this.worksheet = this.workbook.addWorksheet('Host View');
				Object.keys(this.hosts_table_column).forEach((key) => {
					if (this.hosts_table_column[key].name && !this.hosts_table_column[key].no_export) {
						header.push({
							header: this.hosts_table_column[key].name,
							key: this.hosts_table_column[key].key,
							width: 30,
							style: { font: { name: 'Arial', bold: true } }
						});
					}
				});
				break;
			default:
		}
		const first_column = [
			'Host ID',
			'Host Name',
			'Category',
			'Dealer Name',
			'License Key',
			'Alias',
			'Type',
			'Last Startup',
			'Pi Version',
			'Installation Date',
			'Creation Date',
			'Zone & Duration',
			'',
			'',
			'',
			'Address',
			'City',
			'State',
			'Postal Code',
			'Timezone',
			'Tags',
			'Total Business Hours'
		];
		this.worksheet.columns = header;
		this.worksheet.duplicateRow(1, true);
		this.worksheet.getRow(1).values = [];
		this.worksheet.getRow(1).values = first_column;
		this.worksheet.getRow(1).height = 25;
		this.worksheet.getRow(2).height = 20;
		this.worksheet.mergeCells('A1:A2');
		this.worksheet.mergeCells('B1:B2');
		this.worksheet.mergeCells('C1:C2');
		this.worksheet.mergeCells('D1:D2');
		this.worksheet.mergeCells('E1:E2');
		this.worksheet.mergeCells('F1:F2');
		this.worksheet.mergeCells('G1:G2');
		this.worksheet.mergeCells('H1:H2');
		this.worksheet.mergeCells('I1:I2');
		this.worksheet.mergeCells('J1:J2');
		this.worksheet.mergeCells('K1:K2');
		this.worksheet.mergeCells('L1:O1');
		this.worksheet.mergeCells('P1:P2');
		this.worksheet.mergeCells('Q1:Q2');
		this.worksheet.mergeCells('R1:R2');
		this.worksheet.mergeCells('S1:S2');
		this.worksheet.mergeCells('T1:T2');
		this.worksheet.mergeCells('U1:U2');
		this.worksheet.mergeCells('V1:V2');

		this.worksheet.getRow(1).font = {
			bold: true,
			name: 'Arial',
			size: 11
		};

		this.getDataForExport(tab);
	}

	getDataForExport(tab: string): void {
		const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
		switch (tab) {
			case 'licenses':
				this._license
					.get_all_licenses_duration_clone(0, '', 'PiStatus', 'desc', 0, false, '', '', '', '', '', '', '')
					.pipe(takeUntil(this._unsubscribe))
					.subscribe((data) => {
						if (data.message) {
							this.licenses_to_export = [];
							return;
						}

						data.licenses.map((license) => {
							if (license.appVersion) license.apps = JSON.parse(license.appVersion);
							else license.apps = null;
						});
						this.licenses_to_export = data.licenses;

						this.licenses_to_export.forEach((item) => {
							item.storeHours = this.getTotalHours(item);
							this.mapLicensesForExport(item);
							this.worksheet.addRow(item).font = { bold: false };
						});

						let rowIndex = 1;
						for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
							this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
						}

						this.workbook.xlsx.writeBuffer().then((file: any) => {
							const blob = new Blob([file], { type: EXCEL_TYPE });
							const filename = 'Licenses' + '.xlsx';
							saveAs(blob, filename);
						});

						this.workbook_generation = false;
					});

				break;
			default:
		}
	}

	private mapLicensesForExport(item) {
		const isBlank = (data: string) => !data || data.trim().length === 0;
		item.main_zone = item.templateMain != 'NO DATA' ? this.msToTime(item.templateMain) : '';
		item.background_zone = item.templateBackground != 'NO DATA' ? this.msToTime(item.templateBackground) : '';
		item.horizontal_zone = item.templateHorizontal != 'NO DATA' ? this.msToTime(item.templateHorizontal) : '';
		item.vertical_zone = item.templateVertical != 'NO DATA' ? this.msToTime(item.templateVertical) : '';
		item.piVersion = item.apps ? item.apps.rpi_model : '';
		item.displayStatus = item.displayStatus == 1 ? 'ON' : '';
		item.password = item.anydeskId ? this.splitKey(item.licenseId) : '';
		item.piStatus = item.piStatus == 0 ? 'Offline' : 'Online';
		item.screenType = this._title.transform(item.screenType);
		item.contentsUpdated = this._date.transform(item.contentsUpdated, 'MMM dd, yyyy h:mm a');
		item.timeIn = item.timeIn ? this._date.transform(item.timeIn, 'MMM dd, yyyy h:mm a') : '';
		item.installDate = this._date.transform(item.installDate, 'MMM dd, yyyy');
		item.dateCreated = this._date.transform(item.dateCreated, 'MMM dd, yyyy');
		item.internetType = this.getInternetType(item.internetType);
		item.internetSpeed = item.internetSpeed == 'Fast' ? 'Good' : item.internetSpeed;
		item.isActivated = item.isActivated == 0 ? 'No' : 'Yes';
		const parse_version = isBlank(item.appVersion) ? { ui: 'N/A', server: 'N/A' } : JSON.parse(item.appVersion);
		item.ui = parse_version && parse_version.ui ? parse_version.ui : '1.0.0';
		item.server = parse_version && parse_version.server ? parse_version.server : '1.0.0';
		item.tagsToString = item.tags.join(',');
	}

	getTotalHours(data) {
		if (data.storeHours) {
			data.storeHours = JSON.parse(data.storeHours);
			this.hour_diff_temp = [];
			data.storeHours.map((hours) => {
				if (hours.status) {
					hours.periods.map((period) => {
						this.diff_hours = 0;
						if (period.open && period.close) {
							var close = moment(period.close, 'H:mm A');
							var open = moment(period.open, 'H:mm A');

							var time_start = new Date('01/01/2007 ' + open.format('HH:mm:ss'));
							var time_end = new Date('01/01/2007 ' + close.format('HH:mm:ss'));

							if (time_start.getTime() > time_end.getTime()) {
								time_end = new Date(time_end.getTime() + 60 * 60 * 24 * 1000);
								this.diff_hours = (time_end.getTime() - time_start.getTime()) / 1000;
							} else {
								this.diff_hours = (time_end.getTime() - time_start.getTime()) / 1000;
							}
						} else {
							this.diff_hours = 86400;
						}
						this.hour_diff_temp.push(this.diff_hours);
					});
				} else {
				}
			});
			this.hour_diff = 0;
			this.hour_diff_temp.map((hour) => {
				this.hour_diff += hour;
			});
		} else {
		}
		return this.msToTime(this.hour_diff);
	}

	splitKey(key) {
		this.splitted_text = key.split('-');
		return this.splitted_text[this.splitted_text.length - 1];
	}

	private getInternetType(value: string): string {
		if (value) {
			value = value.toLowerCase();
			if (value.includes('w')) {
				return 'WiFi';
			}
			if (value.includes('eth')) {
				return 'LAN';
			}
		}
	}

	// getZoneHours(data) {
	//     if(data.templateName == 'Fullscreen') {
	//         data.main_zone = "Main: " + this.msToTime(data.templateMain)
	//     } else {
	//         var data_to_return: any = '';
	//         if(data.templateBackground != 'NO DATA') {
	//             data."Background: " + this.msToTime(data.templateBackground);
	//         }
	//         if (data.templateBottom != 'NO DATA') {
	//             data_to_return = data_to_return + "\n" + "Bottom: " + this.msToTime(data.templateBottom);
	//         }
	//         if (data.templateHorizontal != 'NO DATA') {
	//             data_to_return = data_to_return + "\n" + "Horizontal: " + this.msToTime(data.templateHorizontal);
	//         }
	//         if (data.templateHorizontalSmall != 'NO DATA') {
	//             data_to_return = data_to_return + "\n" + "Horizontal Small: " + this.msToTime(data.templateHorizontalSmall)
	//         }
	//         if (data.templateLowerLeft != 'NO DATA') {
	//             data_to_return = data_to_return + "\n" + "Lower Left: " + this.msToTime(data.templateLowerLeft)
	//         }
	//         if (data.templateMain != 'NO DATA') {
	//             data_to_return = data_to_return + "\n" + "Main: " + this.msToTime(data.templateMain)
	//         }
	//         if (data.templateUpperLeft != 'NO DATA') {
	//             data_to_return = data_to_return + "\n" + "Upper Left: " + this.msToTime(data.templateUpperLeft)
	//         }
	//         if (data.templateVertical != 'NO DATA') {
	//             data_to_return = data_to_return + "\n" + "Vertical: " + this.msToTime(data.templateVertical)
	//         }
	//         return data_to_return;
	//     }
	// }

	msToTime(input) {
		let totalSeconds = input;
		let hours = Math.floor(totalSeconds / 3600);
		totalSeconds %= 3600;
		let minutes = Math.floor(totalSeconds / 60);
		let seconds = Math.floor(totalSeconds % 60);
		return hours + 'h ' + minutes + 'm ' + seconds + 's ';
	}
}
