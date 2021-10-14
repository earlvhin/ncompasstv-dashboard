import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HostService } from '../../../../global/services/host-service/host.service';
import { UpperCasePipe } from '@angular/common';

var Highcharts = require("highcharts/highmaps.js");  
var usMap = require("@highcharts/map-collection/countries/us/us-all.geo.json");  

@Component({
  selector: 'app-hosts-tab',
  templateUrl: './hosts-tab.component.html',
  styleUrls: ['./hosts-tab.component.scss'],
  providers: [
        UpperCasePipe 
    ],
})

export class HostsTabComponent implements OnInit {
    chartsData : any;
    formatted: any = [];
    has_data : boolean = false;
    has_state_details : boolean = false;
    Highcharts: typeof Highcharts = Highcharts;
    loading_details: boolean = false; 
    panelOpenState = false;
    raw_details : any = [];
    state_details: any = []; 
    state_selected: string; 
	title: string = "Reports";
    subscription: Subscription = new Subscription();

	constructor(
        private _host: HostService,
        private _uppercase: UpperCasePipe,
    ) { }

	ngOnInit() {
        this.getChartsData();
        this.raw_details = {
            totalLicenses: 0
        }
	}
   
    getChartsData() {
        this.subscription.add(
            this._host.get_licenses_per_state().subscribe(
                data => {
                    this.formatData(data.states);
                }
            )
        )
    }
    
    getChartsDataDetails(state) {
        this.loading_details = true;
        this.subscription.add(
            this._host.get_licenses_per_state_details(state).subscribe(
                data => {
                    this.raw_details = data;
                    console.log("DATA",  this.raw_details)
                    this.loading_details = false;
                    this.has_state_details = true;
                    this.state_details = data.dealerHostsStates;
                    console.log("DD",this.state_details)
                }
            )
        )
    }

    formatData(data) {
        data.map (
            list => {
                this.formatted.push({'stateCode': this._uppercase.transform(list.state), 'value': list.count })
            }
        )
        this.has_data = true;
        this.generateCharts(this.formatted);
    }

    generateCharts(formatted) {
        Highcharts.mapChart('host-map', {
            chart: {
                map: usMap
            },
            title: {
                text: 'Licenses Population per State',
                style: {
                    'font-weight': 'bold',
                    'font-size': '20px',
                }
            },        
            mapNavigation: {
                enabled: false,
                buttonOptions: {
                    verticalAlign: 'bottom' 
                }
            },
            colorAxis: {
                min: 1,
                type: 'logarithmic',
                minColor: '#e1fdbc',
                maxColor: '#8EC641',
                stops: [
                    [0, '#e1fdbc'],
                    [0.67, '#bceb7d'],
                    [1, '#8EC641 ']
                ]
            },
            series: [{
                data: formatted,
                type: 'map',
                name: 'Total Hosts Licenses',
                states: {
                    hover: {
                        color: '#2c3e50'
                    }
                },
                dataLabels: {
                    enabled: true,
                    format: '{point.properties.postal-code}',
                    allowOverlap: true
                },
                joinBy: ['postal-code', 'stateCode'],
            }, {
                name: 'Separators',
                type: 'mapline',
                data: Highcharts.geojson(usMap, 'mapline'),
                color: 'silver',
                nullColor: 'silver',
                showInLegend: false,
                enableMouseTracking: false
            }],
            plotOptions: {
                series: {
                    point: {
                        events: {
                            click: function (state) {
                                console.log(state)
                                var text = '<b>Clicked point</b><br>Series: ' + state.point.series.name +
                                        '<br>Point: ' + state.point.name + ' (' + state.point.value + '/km²)',
                                    chart = state.point.series.chart;
                                if (!chart.clickLabel) {
                                    chart.clickLabel = chart.renderer.label(text, 550, 450)
                                        .css({
                                            width: '180px'
                                        })
                                        .add();
                                } else {
                                    chart.clickLabel.attr({
                                        text: text
                                    });
                                }
                                this.state_selected = this._uppercase.transform(state.point.name);
                                this.getChartsDataDetails(state.point.stateCode);
                            }.bind(this)
                        }
                    }
                }
            }
        });
    }  
}
