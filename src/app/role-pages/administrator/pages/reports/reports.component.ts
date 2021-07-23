import { Component, OnInit } from '@angular/core';
import { HostsTabComponent } from '../../../../global/components_shared/reports_components/hosts-tab/hosts-tab.component';


@Component({
	selector: 'app-reports',
	templateUrl: './reports.component.html',
	styleUrls: ['./reports.component.scss'],
})

export class ReportsComponent implements OnInit {
    title: string = "Reports";
    
    ngOnInit(){}
}