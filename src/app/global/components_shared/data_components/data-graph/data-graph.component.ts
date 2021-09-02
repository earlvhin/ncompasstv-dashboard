import { Component, OnInit, Input, EventEmitter, OnDestroy, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { Chart } from 'chart.js';

@Component({
	selector: 'app-data-graph',
	templateUrl: './data-graph.component.html',
	styleUrls: ['./data-graph.component.scss'],
	providers: [DatePipe]
})
export class DataGraphComponent implements OnInit, OnDestroy {

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
	@Input() analytics_reload: Observable<void>;
	@Input() page?: string;
	
	canvas: any;
	chart_initiated: boolean = false;
	chart: Chart;

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _date: DatePipe,
		private host: ElementRef<HTMLElement>
	) { }

	ngOnInit() {

		if (this.reload && !this.page) {

			this.reload.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					() => {
						if (this.chart_initiated) return;
						this.initGraph();
					}
				);

		}

		if (this.analytics_reload) {
			this.analytics_reload.pipe(takeUntil(this._unsubscribe)).subscribe(() => this.initGraph());
			return;
		}

		setTimeout(() => this.initGraph(), 1000);
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
		if (this.chart) this.chart.destroy();
		this.host.nativeElement.remove();
	}

	ngAfterViewInit() {
		require('chartjs-plugin-datalabels');
	}
	
	private initGraph(): void {

		this.canvas = <HTMLCanvasElement> document.getElementById(this.graph_id);

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

		if (this.canvas) {
			this.chart_initiated = true;
			let ctx = this.canvas.getContext('2d');
			
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

}

