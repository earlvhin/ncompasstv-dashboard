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
    Highcharts: typeof Highcharts = Highcharts;  
	title: string = "Reports";
    subscription: Subscription = new Subscription();

	constructor(
        private _host: HostService,
        private _uppercase: UpperCasePipe,
    ) { }

	ngOnInit() {
        this.getChartsData()
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

    formatData(data) {
        data.map (
            list => {
                this.formatted.push({'stateCode': this._uppercase.transform(list.state), 'value': list.count })
            }
        )
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
                min: 0
            },
            series: [{
                data: formatted,
                type: 'map',
                name: 'Total Hosts Licenses',
                states: {
                    hover: {
                        color: '#8EC641'
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
            }]
        });
    }  
}
