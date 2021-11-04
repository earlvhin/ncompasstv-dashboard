import { Component, OnInit, Input, ChangeDetectorRef  } from '@angular/core';
import Chart from 'chart.js/auto';
import { Subject } from 'rxjs';
import { InformationModalComponent } from '../../page_components/information-modal/information-modal.component';
import { MatDialog } from '@angular/material/dialog';

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

	generateChart() {
        const canvas =  <HTMLCanvasElement> document.getElementById(`stat-${this.id}`) as HTMLCanvasElement;
        const labels = this.label_array;
		const data = this.value_array;
        var progress = document.getElementById('animationProgress');

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
                        console.log(e.chart.tooltip.dataPoints[0].dataIndex)
                        this.showBreakdownModal('Breakdown:', this.whole_data[e.chart.tooltip.dataPoints[0].dataIndex], 'list', 500, true);
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
