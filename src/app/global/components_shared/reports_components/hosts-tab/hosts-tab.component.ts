import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HostService } from 'src/app/global/services/host-service/host.service';
import { UpperCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { geojson, mapChart } from 'highcharts/highmaps';
const usMap = require('@highcharts/map-collection/countries/us/us-all.geo.json');

import { InformationModalComponent } from 'src/app/global/components_shared/page_components/information-modal/information-modal.component';

@Component({
    selector: 'app-hosts-tab',
    templateUrl: './hosts-tab.component.html',
    styleUrls: ['./hosts-tab.component.scss'],
    providers: [UpperCasePipe],
})
export class HostsTabComponent implements OnInit {
    chartsData: any;
    formatted: any = [];
    has_data: boolean = false;
    has_state_details: boolean = false;
    loading_details: boolean = false;
    panelOpenState = false;
    raw_details: any = [];
    state_details: any = [];
    state_selected: string;
    title: string = 'Reports';
    subscription: Subscription = new Subscription();
    current_year: any;

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
    hosts_graph_data: any = [];
    hosts_graph_data_detailed: any = [];
    generate: boolean = false;
    total_month: number = 0;
    total_month_detailed: number = 0;

    constructor(
        private _host: HostService,
        private _uppercase: UpperCasePipe,
        private _dialog: MatDialog,
    ) {}

    ngOnInit() {
        this.current_year = new Date().getFullYear();
        this.getHostsStatistics();
        this.getChartsData();
        this.raw_details = {
            totalLicenses: 0,
        };
    }

    getChartsData() {
        this.subscription.add(
            this._host.get_licenses_per_state().subscribe((data) => {
                this.formatData(data.states);
            }),
        );
    }

    getChartsDataDetails(state) {
        this.loading_details = true;
        this.subscription.add(
            this._host.get_licenses_per_state_details(state).subscribe((data) => {
                this.raw_details = data;
                this.loading_details = false;
                this.has_state_details = true;
                this.state_details = data.dealerHostsStates;
            }),
        );
    }

    formatData(data) {
        data.map((list) => {
            this.formatted.push({
                stateCode: this._uppercase.transform(list.state),
                value: list.count,
            });
        });
        this.has_data = true;
        this.generateCharts(this.formatted);
    }

    generateCharts(formatted) {
        mapChart('host-map', {
            chart: {
                map: usMap,
            },
            title: {
                text: 'Licenses Population per State',
                style: {
                    'font-weight': 'bold',
                    'font-size': '20px',
                },
            },
            mapNavigation: {
                enabled: false,
                buttonOptions: {
                    verticalAlign: 'bottom',
                },
            },
            colorAxis: {
                min: 1,
                type: 'logarithmic',
                minColor: '#e1fdbc',
                maxColor: '#8EC641',
                stops: [
                    [0, '#e1fdbc'],
                    [0.67, '#bceb7d'],
                    [1, '#8EC641 '],
                ],
            },
            series: [
                {
                    data: formatted,
                    type: 'map',
                    name: 'Total Hosts Licenses',
                    states: {
                        hover: {
                            color: '#2c3e50',
                        },
                    },
                    dataLabels: {
                        enabled: true,
                        format: '{point.properties.postal-code}',
                        allowOverlap: true,
                    },
                    joinBy: ['postal-code', 'stateCode'],
                },
                {
                    name: 'Separators',
                    type: 'mapline',
                    data: geojson(usMap, 'mapline'),
                    color: 'silver',
                    nullColor: 'silver',
                    showInLegend: false,
                    enableMouseTracking: false,
                },
            ],
            plotOptions: {
                series: {
                    point: {
                        events: {
                            click: function (state) {
                                var text =
                                        '<b>Clicked point</b><br>Series: ' +
                                        state.point.series.name +
                                        '<br>Point: ' +
                                        state.point.name +
                                        ' (' +
                                        state.point.value +
                                        '/km²)',
                                    chart = state.point.series.chart;
                                if (!chart.clickLabel) {
                                    chart.clickLabel = chart.renderer
                                        .label(text, 550, 450)
                                        .css({
                                            width: '180px',
                                        })
                                        .add();
                                } else {
                                    chart.clickLabel.attr({
                                        text: text,
                                    });
                                }
                                this.state_selected = this._uppercase.transform(state.point.name);
                                this.getChartsDataDetails(state.point.stateCode);
                            }.bind(this),
                        },
                    },
                },
            },
        });
    }

    getGraphPoints(e) {
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

        var data_formulated = {
            dealers: this.hosts_graph_data_detailed[e].dealers,
            month: months[e] + ' ' + new Date().getFullYear(),
        };
        this.showBreakdownModal('Breakdown:', data_formulated, 'list', 500, false, true);
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

    getHostsStatistics() {
        // Reset values
        this.sum = 0;
        this.hosts_graph_data = [];
        this.label_graph = [];
        this.value_graph = [];
        this.average = 0;
        this.number_of_months = 0;
        this.total_month = 0;

        if (this.selected_dealer || (this.start_date && this.end_date)) {
            this.subscription.add(
                this._host
                    .get_host_statistics(this.selected_dealer, this.start_date, this.end_date)
                    .subscribe((data) => {
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
                            data.hosts.sort((a, b) => parseFloat(a.month) - parseFloat(b.month));

                            let cumulativeTotalHosts = 0;

                            data.hosts.forEach((host) => {
                                this.total_month = host.totalHosts;
                                cumulativeTotalHosts += host.totalHosts;

                                host.totalHosts = cumulativeTotalHosts;

                                this.total = host.totalHosts;
                                this.hosts_graph_data.push(host);
                                this.label_graph.push(
                                    months[host.month - 1] + ' ' + host.totalHosts,
                                );
                                this.value_graph.push(host.totalHosts);
                                this.month_value_graph.push(this.total_month);
                                this.sum += host.totalHosts;
                            });

                            this.number_of_months = data.hosts.length;
                            this.average = this.sum / this.number_of_months;
                            this.sub_title_detailed =
                                'Found ' +
                                data.hosts.length +
                                ' months with record as per shown in the graph.';
                            this.generate = true;
                        } else {
                            this.generate = false;
                        }
                    }),
            );
        } else {
            this.subscription.add(
                this._host.get_host_statistics('', '', '').subscribe((data) => {
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
                        data.hosts.sort((a, b) => parseFloat(a.month) - parseFloat(b.month));

                        this.hosts_graph_data_detailed = [...data.hosts];
                        this.hosts_graph_data_detailed = this.hosts_graph_data_detailed.filter(
                            (item) => item.year == new Date().getFullYear(),
                        );

                        let cumulativeTotalHosts = 0;

                        this.hosts_graph_data_detailed.forEach((host) => {
                            this.total_month_detailed = host.totalHosts;
                            cumulativeTotalHosts += host.totalHosts;
                            host.totalHosts = cumulativeTotalHosts;

                            this.total_detailed = host.totalHosts;
                            this.label_graph_detailed.push(months[host.month - 1]);
                            this.value_graph_detailed.push(host.totalHosts);
                            this.month_value_graph_detailed.push(this.total_month_detailed);
                        });
                    } else {
                        this.generate = false;
                    }
                }),
            );
        }

        this.sub_title = 'Total Hosts as per year ' + new Date().getFullYear();
    }

    getStartDate(s_date) {
        this.start_date = s_date;
    }

    getEndDate(e_date) {
        this.end_date = e_date;
        this.getHostsStatistics();
    }

    getDealerId(dealer) {
        this.selected_dealer = dealer;
        this.getHostsStatistics();
    }
}
