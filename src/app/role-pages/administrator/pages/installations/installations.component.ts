import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { MatDatepicker } from '@angular/material';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver';

import { AuthService, LicenseService } from 'src/app/global/services';
import { INSTALLATION, PAGING } from 'src/app/global/models';
import { InformationModalComponent } from 'src/app/global/components_shared/page_components/information-modal/information-modal.component';

@Component({
	selector: 'app-installations',
	templateUrl: './installations.component.html',
	styleUrls: ['./installations.component.scss'],
	providers: [ TitleCasePipe, DatePipe ]
})
export class InstallationsComponent implements OnInit, OnDestroy {
	@ViewChild('datePicker', { static: false }) datePicker: MatDatepicker<Date>;

    activeIndex: number;
	filtered_data = [];
	initial_load: boolean = true;
	installations: INSTALLATION[] = [];
	installation_count: any;
	loading = false;
	paging_data: any;
	searching: boolean = false;
	sort_column: string = '';
	sort_order: string = '';
    subscription: Subscription = new Subscription();
	table_columns: any[];
	workbook_generation: boolean = false;
	
	form = this._form_builder.group({ 
		date: [ '', Validators.required ],
		view: [ '' ]
	});

    licenses_table_column_for_export = [
		{ name: 'License Key', key: 'licenseKey'},
		{ name: 'Host', key: 'hostName'},
		{ name: 'Dealer Alias', key: 'dealerIdAlias'},
		{ name: 'Business Name', key: 'businessName'},
		{ name: 'License Type', key: 'screenTypeName'},
		{ name: 'Screen', key: 'screenName'},
		{ name: 'Installation Date', key: 'installDate'},
	];

    views = [ 
        { name: '', value: '', index: 0 },
		{ name: 'Day', value: 'day', index: 1 },
		{ name: 'Month', value: 'month', index: 2 },
		{ name: 'Year', value: 'year', index: 3 },
	];

    //graph
    label_graph: any = [];
    value_graph: any = [];
    label_graph_detailed: any = [];
    value_graph_detailed: any = [];
    total: number = 0;
    total_detailed: number = 0;
    sub_title: string;
    sub_title_detailed: string;
    start_date: string = '';
    end_date: string = '';
    selected_dealer: string = '';
    number_of_months: number = 0;
    average: number = 0;
    sum: number = 0;
    height_show: boolean = false;
    whole_data: any = [];
    licenses_graph_data: any = [];
    licenses_graph_data_detailed: any = [];
    generate: boolean = false;
    temp_start_date: any;
    temp_end_date: any;
    loading_graph: boolean = false;

	private current_month = '';
	private previous_month = '';
    private licenses_to_export: any = [];
	private next_month = '';
    private pageSize: number;
    private search_data = '';
	private selected_date: string;
    private type: number = 0;
	private view = '';
    private workbook: any;
	private worksheet: any;
	private _date = this.form.get('date');
	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _dates: DatePipe,
		private _form_builder: FormBuilder,
		private _license: LicenseService,
		private _titlecase: TitleCasePipe,
        private _dialog: MatDialog,
	) { }
	
	ngOnInit() {
		this.table_columns = this.installation_table_columns;
        this.date = new Date();
        this.selected_date = moment().format('MM-DD-YYYY');
        this.previous_month = moment().subtract(1, 'month').format('MMMM');
		this.current_month = moment().format('MMMM');
		this.next_month = moment().add(1, 'month').format('MMMM');

        this.getLicensesInstallationStatistics();
        this.getLicenseStatistics();
		this.getLicenses(1);
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	exportTable(): void {

		const header = [];
		this.workbook_generation = true;
		this.workbook = new Excel.Workbook();
		this.workbook.creator = 'NCompass TV';
		this.workbook.useStyles = true;
		this.workbook.created = new Date();
		this.worksheet = this.workbook.addWorksheet('Installations');
		
		Object.keys(this.licenses_table_column_for_export).forEach(key => {

			if (this.licenses_table_column_for_export[key].name && !this.licenses_table_column_for_export[key].no_export) {

				header.push(
					{ 
						header: this.licenses_table_column_for_export[key].name, 
						key: this.licenses_table_column_for_export[key].key, 
						width: 30, style: { font: { name: 'Arial', bold: true } }
					}
				);

			}

		});

        this.worksheet.columns = header;
		this.getDataForExport();		
	}

	filterData(keyword = ''): void {
		this.search_data = keyword;
		this.getLicenses(1);
	}

	filterLicensesThisMonth(data: { host, license, screen, screenType }[]): { host, license, screen, screenType }[] {
		return data.filter(response => (!moment(response.license.installDate).isBefore(this.date, 'month')));
	}

	getColumnsAndOrder(data: { column: string, order: string }): void {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.getLicenses(1);
	}
	
	getLicenses(page: number) {
        this.pageSize = 15;
		this.searching = true;
		this.installations = [];
        
		this._license.get_licenses_by_install_date(page, this.selected_date, this.sort_column, this.sort_order, this.type, this.pageSize, this.search_data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
					console.log("DD", data)
					let installations = [];
					let filtered_data = [];

					if (!data.message) {
						this.paging_data = data.paging;
						installations = this.mapToTableFormat(this.paging_data.entities);
						filtered_data = installations;
					}
					this.installations = installations;
					this.filtered_data = filtered_data;
					this.initial_load = false;
					this.searching = false; 
				}
			);
	}

	onSelectDate(value: moment.Moment): void {
		this.view = 'default';
		this.sort_column = '';
		this.sort_order = '';
		this.date = value;
		this.previous_month = moment(value).subtract(1, 'month').format('MMMM');
		this.current_month = moment(value).format('MMMM');
		this.next_month = moment(value).add(1, 'month').format('MMMM');
		this.datePicker.close();
		this.selected_date = value.format('MM-DD-YYYY');
		this.installation_count = null;
		this.getLicenseStatistics();
		this.getLicenses(1);
	}

	onSelectView(index: number): void {

		if (this.searching) return;
		
		if (index === 0) {
			const currentDate = moment();
			const longDate = currentDate.format('MM-DD-YYYY');
			this.selected_date = longDate;
			this.form.get('date').setValue(currentDate);
		}
        
		this.activeIndex = index;
        this.type = index;
		this.getLicenses(1);

	}

	private get installation_table_columns() {

		return [
			{ name: '#', sortable: false, key: 'licenseKey', hidden: true },
			{ name: 'License Key', sortable: true, column: 'LicenseKey', key: 'licenseKey' },
			{ name: 'Host', sortable: true, column: 'HostName', key: 'hostName' },
			{ name: 'Dealer Alias', sortable: true, column: 'DealerIdAlias', key: 'dealerIdAlias' },
			{ name: 'Business Name', sortable: true, column: 'BusinessName', key: 'businessName' },
			{ name: 'License Type', sortable: true, column: 'ScreenTypeName', key: 'screenTypeName' },
			{ name: 'Screen', sortable: true, column: 'ScreenName', key: 'screenName' },
			{ name: 'Installation Date', sortable: true, column: 'InstallDate', key: 'installDate' },
		];

	}

	private get date(): any {
		return this._date.value;
	}

	private set date(value: any) {
		this._date.setValue(value);
	}

	private getLicenseStatistics(): void {
		this._license.get_statistics_by_installation(this.selected_date).subscribe(
            data => {
                let datas = { total: 0, previousMonth: 0, currentMonth: 0, nextMonth: 0 }; 
				if (!data.message) datas = data.licenseInstallationStats;
				this.getTotalCount(datas);
            }
		);
	}
	
	private getTotalCount(data: { currentMonth: number, nextMonth: number, previousMonth: number, total: number }): void {
		this.installation_count = {
			scheduled: data.total,
			scheduled_label: 'Installation(s)',
			scheduled_description: 'Scheduled Installations',
			prev: data.previousMonth,
			prev_label: 'Installation(s)',
			prev_description: 'Last Month of ' + this.previous_month,
			current: data.currentMonth,
			current_label: 'Installation(s)',
			current_description: 'This Month of ' + this.current_month,
			next: data.nextMonth,
			next_label: 'Installation(s)',
			next_description: 'Next Month of ' + this.next_month,
		}
	}

    private getDataForExport(): void {
        this.pageSize = 0;
		
        this._license.get_licenses_by_install_date(1, this.selected_date, this.sort_column, this.sort_order, this.type, this.pageSize, this.search_data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { paging: PAGING, message: string }) => {

					if (response.message) {
						this.licenses_to_export = [];
						return;
					}

					const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
					
					this.licenses_to_export = response.paging.entities;
					
					this.licenses_to_export.forEach((item, i) => {
						this.modifyItem(item);
						this.worksheet.addRow(item).font = { bold: false };
					});

					let rowIndex = 1;
					
					for (rowIndex; rowIndex <= this.worksheet.rowCount; rowIndex++) {
						this.worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
					}

					this.workbook.xlsx.writeBuffer()
						.then((file: any) => {
							const blob = new Blob([file], { type: EXCEL_TYPE });
							const filename = 'Installations for ' + this.selected_date +'.xlsx';
							FileSaver.saveAs(blob, filename);
						}
					);

					this.workbook_generation = false;
				}
			);
	}

	private mapToTableFormat(data: any[]): INSTALLATION[] {
		let count = 1;

		return data.map(
			license => {
				
				const isPast = moment(license.installDate).isBefore(moment(), 'day');

				return new INSTALLATION(
					{ value: license.licenseKey, link: null , editable: false, hidden: true },
					{ value: count++, link: null , editable: false, hidden: false, past: isPast },
					{ value: license.licenseKey, link: `/${this.currentRole}/licenses/${license.licenseId}` , editable: false, hidden: false,  past: isPast },
					{ value: license.hostName != null ? license.hostName : '--', link: `/${this.currentRole}/hosts/${license.hostId}`, editable: false, hidden: false,  past: isPast },
					{ value: license.dealerIdAlias != null ? license.dealerIdAlias : '--', link: `/${this.currentRole}/dealers/${license.dealerId}`, editable: false, hidden: false,  past: isPast },
					{ value: license.businessName, link: `/${this.currentRole}/dealers/${license.dealerId}`, editable: false, hidden: false,  past: isPast},
					{ value: license.screenTypeName != null ? this._titlecase.transform(license.screenTypeName) : '--', link: null , editable: false, hidden: false,  past: isPast },
					{ value: license.screenName != null ? license.screenName : '--', link: license.screenName != null ? `/${this.currentRole}/screens/${license.screenId}` : null , editable: false, hidden: false,  past: isPast },
					{ value: this._dates.transform(license.installDate, 'MMM d, y, h:mm a'), id: license.licenseId, label: 'Install Date', link: null, editable: true, hidden: false,  past: isPast },
				);
			}
		);
	}

	private modifyItem(item: { screenTypeName: string, installDate: string }): void {
		item.screenTypeName = this._titlecase.transform(item.screenTypeName);
        item.installDate = this._dates.transform(item.installDate, 'MMM d, y, h:mm a')
	}

	protected get currentRole() {
		return this._auth.current_role;
	}

    getLicensesInstallationDetailed() {
        this.subscription.add(
			this._license.get_licenses_installation_statistics_detailed(this.selected_dealer, this.start_date, this.end_date).pipe(
				takeUntil(this._unsubscribe)
			).subscribe(data => {
                if(data) {
                    var months = [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec" ];
                    data.licenses.sort((a, b) => parseFloat(a.month) - parseFloat(b.month));
                    data.licenses.map(
                        i => {
                            this.total_detailed = this.total_detailed + i.totalLicenses;
                            this.licenses_graph_data.push(i)
                            this.label_graph_detailed.push(i.alias)
                            this.value_graph_detailed.push(this.date_format_to_time(i.installDate))
                            this.sum = this.sum + i.totalLicenses;
                            i.installDate = this.date_format_to_time(i.installDate);
                        }
                    )
                    this.licenses_graph_data_detailed = data.licenses;
                    this.number_of_months = data.licenses.length;
                    this.average = this.sum / this.number_of_months; 
                    this.sub_title_detailed = "Found " + data.licenses.length + "  Licenses Installation as per shown in the graph."
                    this.generate = true;
                }
            })
        )
    }

    date_format_to_time(date) {
        var formatted = new Date(date);
        return formatted.getTime();
    }

    getLicensesInstallationStatistics() {
        this.subscription.add(
			this._license.get_licenses_installation_statistics(this.selected_dealer, this.start_date, this.end_date).pipe(
				takeUntil(this._unsubscribe)
			)
			.subscribe(data => {
                    //reset value
                    this.total_detailed = 0;
                    this.sum = 0;
                    this.licenses_graph_data = [];
                    this.label_graph_detailed = [];
                    this.value_graph_detailed = [];

                    if(!data.message) {                        
                        var months = [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec" ];
                        data.licenses.sort((a, b) => parseFloat(a.month) - parseFloat(b.month));
                        this.whole_data = data.licenses;
                        this.generate = true;
                        if(this.selected_dealer) {
                            this.getLicensesInstallationDetailed();
                        } else {
                            this.whole_data = this.whole_data.filter(item => item.year == new Date().getFullYear());
                            this.whole_data.map(
                                i => {
                                    this.total = this.total + i.totalLicenses;
                                    this.licenses_graph_data.push(i)
                                    this.label_graph.push(months[i.month - 1] + " " + i.totalLicenses)
                                    this.value_graph.push(i.totalLicenses)
                                }
                            )
                        }
                    } else {
                        this.generate = false;
                    }

                    
                }
            )
        )
        this.sub_title = "Total Licenses Installation as per year " + new Date().getFullYear();
    }

    monthCheck(month) {
        if(month == 2) {
            return '28'
        } else if(month == 9 || month == 4 || month == 6 || month == 11) {
            return '30'
        } else {
            return '31'
        }
    }

    getGraphPoints(e) {
        this.loading_graph = true;
        var temp: any = {}
        temp = {
            year: this.whole_data[e].year,
            month: this.whole_data[e].month,
            day: 1,
            end_day: this.monthCheck(this.whole_data[e].month)
        }
        this.temp_start_date = temp.year.toString() + "-" + temp.month.toString() + "-" + temp.day.toString()
        this.temp_end_date = temp.year.toString() + "-" + temp.month.toString() + "-" + temp.end_day.toString()
       
        this.subscription.add(
			this._license.get_licenses_installation_statistics_detailed('', this.temp_start_date, this.temp_end_date).pipe(
				takeUntil(this._unsubscribe)
			).subscribe(data => {
                if(data.licenses) {
                    this.loading_graph = false;
                    this.showBreakdownModal('Breakdown:', data.licenses, 'list', 500, false, true);
                }
            })
        )
    }

    showBreakdownModal(title: string, contents: any, type: string, character_limit?: number, graph?: boolean, installation?: boolean): void {
		this._dialog.open(InformationModalComponent, {
			width:'600px',
			height: '350px',
			data:  { title, contents, type, character_limit, graph, installation },
			panelClass: 'information-modal',
			autoFocus: false
		});
	}

    toggleCharts() {
        this.height_show = !this.height_show;
    }

    getStartDate(s_date) {
        this.start_date = s_date;
    }
    
    getEndDate(e_date) {
        this.end_date = e_date;
    }
    
    getDealerId(dealer) {
        this.selected_dealer = dealer;
        this.getLicensesInstallationStatistics();
    }

}
