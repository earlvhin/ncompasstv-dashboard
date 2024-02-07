import { Component, OnInit } from '@angular/core';
import { LicenseService } from 'src/app/global/services';
import { InformationModalComponent } from 'src/app/global/components_shared/page_components/information-modal/information-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-installations-tab',
    templateUrl: './installations-tab.component.html',
    styleUrls: ['./installations-tab.component.scss'],
})
export class InstallationsTabComponent implements OnInit {
    //graph
    label_graph: any = [];
    value_graph: any = [];
    month_value_graph: any = [];
    label_graph_detailed: any = [];
    value_graph_detailed: any = [];
    month_value_graph_detailed: any = [];
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
    current_year: any;
    total_month: number = 0;
    total_month_detailed: number = 0;

    constructor(
        private _license: LicenseService,
        private _dialog: MatDialog,
    ) {}

    ngOnInit() {
        this.current_year = new Date().getFullYear();
        this.getLicensesInstallationStatistics();
    }

    getLicensesInstallationStatistics() {
        //reset value
        this.total_detailed = 0;
        this.sum = 0;
        this.licenses_graph_data = [];
        this.label_graph_detailed = [];
        this.value_graph_detailed = [];

        if (this.selected_dealer || (this.start_date && this.end_date)) {
            this._license
                .get_licenses_installation_statistics_detailed(
                    this.selected_dealer,
                    this.start_date,
                    this.end_date,
                )
                .subscribe((data) => {
                    if (!data.message) {
                        this.generate = true;
                        var months = [
                            'Jan',
                            'Feb',
                            'Mar',
                            'Apr',
                            'May',
                            'June',
                            'July',
                            'Aug',
                            'Sep',
                            'Oct',
                            'Nov',
                            'Dec',
                        ];
                        data.licenses.sort((a, b) => {
                            const dateA = new Date(a.installDate).getTime();
                            const dateB = new Date(b.installDate).getTime();
                            return dateA - dateB;
                        });

                        data.licenses.map((i) => {
                            const shortened_alias =
                                i.alias && i.alias.length > 17
                                    ? i.alias.slice(0, 17) + '...'
                                    : i.alias;
                            const shortened_licenseKey =
                                i.licenseKey && i.licenseKey.length > 17
                                    ? i.licenseKey.slice(0, 17) + '...'
                                    : i.licenseKey;

                            this.total_detailed = this.total_detailed + 1;
                            this.label_graph_detailed.push(
                                i.alias === null ? shortened_licenseKey : shortened_alias,
                            );
                            this.value_graph_detailed.push(this.date_format_to_time(i.installDate));
                            this.sum = this.sum + i.totalLicenses;
                            i.installDate = this.date_format_to_time(i.installDate);
                        });

                        this.licenses_graph_data_detailed = data.licenses;
                        this.number_of_months = data.licenses.length;
                        this.average = this.sum / this.number_of_months;
                        this.sub_title_detailed =
                            'Found ' +
                            data.licenses.length +
                            '  Licenses Installation as per shown in the graph.';
                        this.generate = true;
                    } else {
                        this.generate = false;
                    }
                });
        } else {
            this._license.get_licenses_installation_statistics('', '', '').subscribe((data) => {
                if (!data.message) {
                    var months = [
                        'Jan',
                        'Feb',
                        'Mar',
                        'Apr',
                        'May',
                        'June',
                        'July',
                        'Aug',
                        'Sep',
                        'Oct',
                        'Nov',
                        'Dec',
                    ];
                    data.licenses.sort((a, b) => parseFloat(a.month) - parseFloat(b.month));
                    this.whole_data = data.licenses;
                    this.whole_data = this.whole_data.filter(
                        (item) => item.year == new Date().getFullYear(),
                    );

                    let cumulativeTotalInstallations = 0;

                    this.whole_data.map((i) => {
                        this.total = this.total + i.totalLicenses;
                        cumulativeTotalInstallations += i.totalLicenses;

                        this.licenses_graph_data.push(i);
                        this.label_graph.push(months[i.month - 1]);
                        this.value_graph.push(cumulativeTotalInstallations);
                        this.month_value_graph.push(i.totalLicenses);
                    });
                } else {
                    this.generate = false;
                }
            });
        }
        this.sub_title = 'Total Licenses Installation as per year ' + new Date().getFullYear();
    }

    date_format_to_time(date) {
        var formatted = new Date(date);
        return formatted.getTime();
    }

    getGraphPoints(e) {
        this.loading_graph = true;
        var temp: any = {};
        temp = {
            year: this.whole_data[e].year,
            month: this.whole_data[e].month,
            day: 1,
            end_day: this.monthCheck(this.whole_data[e].month),
        };
        this.temp_start_date =
            temp.year.toString() + '-' + temp.month.toString() + '-' + temp.day.toString();
        this.temp_end_date =
            temp.year.toString() + '-' + temp.month.toString() + '-' + temp.end_day.toString();

        this._license
            .get_licenses_installation_statistics_detailed(
                '',
                this.temp_start_date,
                this.temp_end_date,
            )
            .subscribe((data) => {
                if (data.licenses) {
                    this.loading_graph = false;
                    var months = [
                        'Jan',
                        'Feb',
                        'Mar',
                        'Apr',
                        'May',
                        'June',
                        'July',
                        'Aug',
                        'Sep',
                        'Oct',
                        'Nov',
                        'Dec',
                    ];
                    var filter = {
                        dealers: data.licenses,
                        month: months[e] + ' ' + new Date().getFullYear(),
                    };
                    this.showBreakdownModal('Breakdown:', filter, 'list', 500, false, true);
                }
            });
    }

    showBreakdownModal(
        title: string,
        contents: any,
        type: string,
        character_limit?: number,
        graph?: boolean,
        installation?: boolean,
    ): void {
        this._dialog.open(InformationModalComponent, {
            width: '600px',
            height: '350px',
            data: { title, contents, type, character_limit, graph, installation },
            panelClass: 'information-modal',
            autoFocus: false,
        });
    }

    monthCheck(month) {
        if (month == 2) {
            return '28';
        } else if (month == 9 || month == 4 || month == 6 || month == 11) {
            return '30';
        } else {
            return '31';
        }
    }

    getStartDate(s_date) {
        this.start_date = s_date;
    }

    getEndDate(e_date) {
        this.end_date = e_date;
        this.getLicensesInstallationStatistics();
    }

    getDealerId(dealer) {
        this.selected_dealer = dealer;
        this.getLicensesInstallationStatistics();
    }
}
