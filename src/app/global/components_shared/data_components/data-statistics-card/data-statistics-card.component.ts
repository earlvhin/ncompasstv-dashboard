import { Component, OnInit, Input, ChangeDetectorRef, Output, EventEmitter  } from '@angular/core';
import Chart from 'chart.js/auto';
import { Subject } from 'rxjs';
import { InformationModalComponent } from '../../page_components/information-modal/information-modal.component';
import { MatDialog } from '@angular/material/dialog';
import 'chartjs-adapter-moment';
import * as moment from 'moment';

@Component({
  selector: 'app-data-statistics-card',
  templateUrl: './data-statistics-card.component.html',
  styleUrls: ['./data-statistics-card.component.scss']
})
export class DataStatisticsCardComponent implements OnInit {

	@Input() id: string;
	@Input() sub_title: string;
	@Input() total: string;
    @Input() label_array: [];
    @Input() value_array: [];
    @Input() whole_data: [];
    @Input() no_click: boolean = false;
    @Input() num_of_months: string;
    @Input() average: string;
    @Input() installation: boolean = false;
    @Input() installation_average: boolean = false;
    @Input() total_dealer: string;
    @Input() s_date: any;
    @Input() e_date: any;
    @Input() dealer_selected: any;

    start: any;
    end:any;

    @Output() click_graph: EventEmitter<any> = new EventEmitter;

    averaging: string;
    generated: boolean = false;

	private chart: Chart;
	protected _unsubscribe = new Subject<void>();

    

	constructor(
        private _dialog: MatDialog,
        private _changeDetector: ChangeDetectorRef
	) { }

	ngOnInit() {
        this.averaging = this.average;
        this.start = moment(this.s_date).format("MMM Do YY");
        this.end = moment(this.e_date).format("MMM Do YY");
        this._changeDetector.markForCheck();
	}

    ngOnChanges() {
        this.value_array = this.value_array;
        this.label_array = this.label_array;
        this.averaging = this.average;
        if(this.chart) {
            this.chart.destroy();
            this.generateChart();
        }
    }

	ngAfterViewInit() {
		this.generateChart();
	}

	ngOnDestroy() {
		this.chart.destroy();
	}

    time_conversion() {
        this.s_date = new Date(this.s_date)
        return this.s_date.getTime()
    }
    
    time_conversion_end() {
        this.e_date = new Date(this.e_date)
        return this.e_date.getTime()
    }

	generateChart() {
        const canvas =  <HTMLCanvasElement> document.getElementById(`stat-${this.id}`) as HTMLCanvasElement;
        const labels = this.label_array;
		const data = this.value_array;
        const whole : any = this.whole_data;

        if(this.installation) {
            var min_value = this.time_conversion();
            var max_value = this.time_conversion_end();

            this.chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '',
                        backgroundColor: 'rgb(142, 198, 65)',
                        borderColor: 'rgb(64, 109, 2)',
                        data,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                            labels: {
                                boxWidth: 10,
                            }
                        },
                        tooltip: {
                            callbacks: {
                                afterTitle: function(val) {
                                    return "Host: " + whole[val[0].dataIndex].hostName;
                                }
                            }
                        }
                   },
                    animations: {
                        tension: {
                            duration: 1000,
                            easing: 'linear',
                            from: 1,
                            to: 0,
                            loop: false
                        }
                    },
                    scales: {
                        y: {
                            type: 'time',
                            time: {
                                unit: 'month'
                            },
                            min: min_value,
                            max: max_value,
                            ticks: {
                                autoSkip: false
                            }
                        },
                    }       
                },
            });
        } else {
            this.chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '',
                        backgroundColor: 'rgb(142, 198, 65)',
                        borderColor: 'rgb(64, 109, 2)',
                        data,
                    }]
                },
                options: {
                    onClick: (e: any) => {
                        if(this.no_click) {
    
                        } else {
                            if(this.installation_average) {
                                this.click_graph.emit(e.chart.tooltip.dataPoints[0].dataIndex);
                            } else {
                                this.showBreakdownModal('Breakdown:', this.whole_data[e.chart.tooltip.dataPoints[0].dataIndex], 'list', 500, true);
                            }   
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                            labels: {
                                boxWidth: 10,
                            }
                        },
                   },
                    animations: {
                        tension: {
                            duration: 1000,
                            easing: 'linear',
                            from: 1,
                            to: 0,
                            loop: false
                        }
                    },
                },
            });
        }
    }

    showBreakdownModal(title: string, contents: any, type: string, character_limit?: number, graph?: boolean): void {
		this._dialog.open(InformationModalComponent, {
			width:'600px',
			height: '350px',
			data:  { title, contents, type, character_limit, graph },
			panelClass: 'information-modal',
			autoFocus: false
		});
	}
}
