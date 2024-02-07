import { Component, OnInit, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { HostsTabComponent } from '../../../../global/components_shared/reports_components/hosts-tab/hosts-tab.component';

@Component({
    selector: 'app-reports',
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
    title: string = 'Reports';

    constructor(private cdr: ChangeDetectorRef) {}
    ngOnInit() {}

    ngAfterContentChecked(): void {
        this.cdr.detectChanges();
    }
}
