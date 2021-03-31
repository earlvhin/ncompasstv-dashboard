import { Component, OnInit, Input, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Chart } from 'chart.js';
import { Observable } from 'rxjs';

@Component({
	selector: 'app-data-graph',
	templateUrl: './data-graph.component.html',
	styleUrls: ['./data-graph.component.scss'],
	providers: [DatePipe]
})
export class DataGraphComponent implements OnInit {

	@Input() data_labels: any = [];
	@Input() data_values: any = [];
	@Input() data_set: any;
	@Input() graph_title: string;
	@Input() graph_description: string;
	@Input() graph_id: string;
	@Input() realtime_data_per_license: EventEmitter<boolean>;
	@Input() realtime_data_per_content: EventEmitter<boolean>;
	@Input() update_chart: EventEmitter<boolean>;
	@Input() date_format: string;
	@Input() date_queried: string;
	@Input() reload: Observable<void>;
	chart_initiated: boolean = false;
	chart;

	constructor(
		private _date: DatePipe
	) { }

	ngOnInit() {
		if (this.reload) {
			this.reload.subscribe(() => {
				if (!this.chart_initiated) {
					this.initGraph()
				}
			});
		}
	}

	ngAfterViewInit() {
		require('chartjs-plugin-datalabels');
		this.initGraph();
	}
	
	initGraph() {
		let canvas = <HTMLCanvasElement> document.getElementById(this.graph_id);

		if (this.data_set) {
			this.data_set.map(
				i => {
					if (i.count > 0) {
						if (this.date_format === 'yearly') {
							if (Date.parse(i.dateTime)) {
								this.data_labels.push(this._date.transform(i.dateTime, 'MMM'));
							} else {
								this.data_labels.push(i.dateTime);
							}
						} else if (this.date_format === 'monthly') {
							this.data_labels.push(this._date.transform(i.dateTime, 'MMM d'));
						} else {
							this.data_labels.push(this._date.transform(i.dateTime, 'h a'));
						}
						this.data_values.push(i.count);
					}
				}
			)
		}

		Chart.defaults.global.defaultFontFamily = 'Poppins';
		Chart.defaults.global.defaultFontSize = 12;
		Chart.defaults.global.defaultFontStyle = '600';

		if (canvas) {
			this.chart_initiated = true;
			let ctx = canvas.getContext('2d');
			this.chart = new Chart(ctx, {
				// The type of chart we want to create
				type: 'line',
		
				// The data for our dataset
				data: {
					labels: this.data_labels || [],
					datasets: [{
						label: '',
						backgroundColor: 'rgb(142, 198, 65)',
						borderColor: 'rgb(64, 109, 2)',
						data: this.data_values || []
					}]
				},
		
				// Configuration options go here
				options: {   
					legend: { display: false },
					responsive: true,
					maintainAspectRatio: false,
					showAllTooltips: true,
					title: {
						display: false,
						text: 'Stats Summary',
						fontSize: 16,
						fontStyle: '500'
					},
					layout: {
						padding: {
							top: 40
						}
					},
					scales: {
						xAxes: [{
							ticks: {
								fontSize: 10
							}
						}],
						yAxes: [{
							ticks: {
								precision: 0,
								fontSize: 10
							}
						}]
					},
					plugins: {
						datalabels: {
							backgroundColor:  'rgb(72, 116, 15)',
							borderRadius: 100,
							color: '#ffff',
							anchor: 'end',
							align: 'center',
							formatter: Math.round,
							padding: {
								left: 7,
								right: 7,
								top: 5,
								bottom: 2
							},
							font: {
								size: 9
							}
						}
					}
				}
			});
		}
	}

	setNewData() {
		this.chart.update();
	}

	realtimeData_perLicense(data) {
		if (this.date_format == "monthly") {
			if(this._date.transform(this.date_queried, 'y-MM') == this._date.transform(data.logDate, 'y-MM')) {
				if (this.graph_id.split('_')[0] === data.contentId) {
					this.chart.data.datasets[0].data[this.data_values.length - 1] = parseInt(this.chart.data.datasets[0].data[this.data_values.length - 1]) + 1;
					this.chart.update();
				}
			}
		} else if(this.date_format == "daily") {
			if(this._date.transform(this.date_queried, 'y-MM-dd') == this._date.transform(data.logDate, 'y-MM-dd')) {
				if (this.graph_id.split('_')[0] === data.contentId) {
					this.chart.data.datasets[0].data[this.data_values.length - 1] = parseInt(this.chart.data.datasets[0].data[this.data_values.length - 1]) + 1;
					this.chart.update();
				}
			}
		} else {
			if (this.graph_id.split('_')[0] === data.contentId) {
				this.chart.data.datasets[0].data[this.data_values.length - 1] = parseInt(this.chart.data.datasets[0].data[this.data_values.length - 1]) + 1;
				this.chart.update();
			}
		}
	}

	realtimeData_perContent(data) {
		if (this._date.transform(this.date_queried, 'y-MM-dd') == this._date.transform(data.logDate, 'y-MM-dd')) {
			this.chart.data.datasets[0].data[this.data_values.length - 1] = parseInt(this.chart.data.datasets[0].data[this.data_values.length - 1]) + 1;
			this.chart.update();
		}
	}
}
