import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LicenseService } from 'src/app/global/services';
import { MatDialog } from '@angular/material/dialog';
import { InformationModalComponent } from 'src/app/global/components_shared/page_components/information-modal/information-modal.component';

@Component({
    selector: 'app-licenses-tab-reports',
    templateUrl: './licenses-tab-reports.component.html',
    styleUrls: ['./licenses-tab-reports.component.scss']
})

export class LicensesTabReportsComponent implements OnInit {

    subscription: Subscription = new Subscription();

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
    licenses_graph_data: any = [];
    licenses_graph_data_detailed: any = [];
    generate: boolean = false;

    constructor(
        private _license: LicenseService,
        private _dialog: MatDialog,
    ) { }

    ngOnInit() {
        this.getLicensesStatistics();
    }

    getGraphPoints(e) {
        var months = [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec" ];
        var data_formulated = {
            dealers: this.licenses_graph_data_detailed[e].dealers,
            month: months[e] + " " + new Date().getFullYear()
        }
        this.showBreakdownModal('Breakdown:', data_formulated, 'list', 500, false, true);
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

    getLicensesStatistics() {

        //reset value
        this.total_detailed = 0;
        this.sum = 0;
        this.licenses_graph_data = [];
        this.label_graph = [];
        this.value_graph = [];
        this.average = 0;
        this.number_of_months = 0;


        if(this.selected_dealer || this.start_date && this.end_date) {
            this.subscription.add(
                this._license.get_licenses_statistics(this.selected_dealer, this.start_date, this.end_date).subscribe(
                    data => {
                        if(!data.message) {                        
                            var months = [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec" ];
                            data.licenses.sort((a, b) => parseFloat(a.month) - parseFloat(b.month));
                            this.licenses_graph_data = [...data.licenses];
                            data.licenses.map(
                                i => {
                                    this.total_detailed = this.total_detailed + i.totalLicenses;
                                    this.licenses_graph_data.push(i)
                                    this.label_graph.push(months[i.month - 1] + " " + i.totalLicenses)
                                    this.value_graph.push(i.totalLicenses)
                                    this.sum = this.sum + i.totalLicenses;
                                }
                            )  
                            this.number_of_months = data.licenses.length;
                            this.average = this.sum / this.number_of_months; 
                            this.sub_title_detailed = "Found " + data.licenses.length + " months with record as per shown in the graph."
                            this.generate = true;
                        } else {
                            this.generate = false;
                        }
                    }
                )
            )
        } else {
            this.subscription.add(
                this._license.get_licenses_statistics('','','').subscribe(
                    data => {
                        if(!data.message) {                        
                            var months = [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec" ];
                            data.licenses.sort((a, b) => parseFloat(a.month) - parseFloat(b.month));
                            this.licenses_graph_data_detailed = [...data.licenses];
                            this.licenses_graph_data_detailed = this.licenses_graph_data_detailed.filter(item => item.year == new Date().getFullYear());
                            this.licenses_graph_data_detailed.map(
                                i => {
                                    this.total = this.total + i.totalLicenses;
                                    this.label_graph_detailed.push(months[i.month - 1] + " " + i.totalLicenses)
                                    this.value_graph_detailed.push(i.totalLicenses)    
                                }
                            )
                        } else {
                            this.generate = false;
                        }
                    }
                )
            )
        }
        this.sub_title = "Total Licenses as per year " + new Date().getFullYear();
    }

    getStartDate(s_date) {
        this.start_date = s_date;
    }
    
    getEndDate(e_date) {
        this.end_date = e_date;
        this.getLicensesStatistics();
    }
    
    getDealerId(dealer) {
        this.selected_dealer = dealer;
        this.getLicensesStatistics();
    }
}
