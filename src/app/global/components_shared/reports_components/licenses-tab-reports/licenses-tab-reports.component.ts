import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_LICENSE_MONTHLY_STAT } from 'src/app/global/models';
import { InformationModalComponent } from 'src/app/global/components_shared/page_components/information-modal/information-modal.component';
import { LicenseService } from 'src/app/global/services';

@Component({
	selector: 'app-licenses-tab-reports',
	templateUrl: './licenses-tab-reports.component.html',
	styleUrls: ['./licenses-tab-reports.component.scss']
})
export class LicensesTabReportsComponent implements OnInit, OnDestroy {
	subscription: Subscription = new Subscription();

	//graph
	label_graph: any = [];
	value_graph: any = [];
	month_value_graph: any = [];
	label_graph_detailed: any = [];
	value_graph_detailed: any = [];
	month_value_graph_detailed: any = [];
	total = 0;
	total_detailed = 0;
	sub_title: string;
	sub_title_detailed: string;
	start_date = '';
	end_date = '';
	selected_dealer = '';
	number_of_months = 0;
	average = 0;
	sum = 0;
	height_show = false;
	licenses_graph_data: API_LICENSE_MONTHLY_STAT[] = [];
	licenses_graph_data_detailed: API_LICENSE_MONTHLY_STAT[] = [];
	generate = false;
    current_year: any;
	total_month: number = 0;
	total_month_detailed: number = 0;
	

	protected _unsubscribe = new Subject<void>();

	constructor(private _license: LicenseService, private _dialog: MatDialog) {}

	ngOnInit() {
        this.current_year = new Date().getFullYear();
		this.getLicensesStatistics();
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	getGraphPoints(index: number): void {
		const data_formulated = {
			dealers: this.licenses_graph_data_detailed[index].dealers,
			month: this._months[index] + ' ' + new Date().getFullYear()
		};

		this.showBreakdownModal('Breakdown:', data_formulated, 'list', 500, false, true);
	}

	showBreakdownModal(title: string, contents: any, type: string, character_limit?: number, graph?: boolean, installation?: boolean): void {
		this._dialog.open(InformationModalComponent, {
			width: '600px',
			height: '350px',
			data: { title, contents, type, character_limit, graph, installation },
			panelClass: 'information-modal',
			autoFocus: false
		});
	}

	getStartDate(date: string) {
		this.start_date = date;
	}

	getEndDate(date: string) {
		this.end_date = date;
		this.getLicensesStatistics();
	}

	getDealerId(dealer: string) {
		this.selected_dealer = dealer;
		this.getLicensesStatistics();
	}

	private getLicensesStatistics(): void {
		let isNarrowedDownResult = false;
		// reset value
		this.sum = 0;
		this.licenses_graph_data = [];
		this.label_graph = [];
		this.value_graph = [];
		this.average = 0;
		this.number_of_months = 0;	
		this.total_month = 0;

		let getStatsRequest = this._license.get_licenses_statistics('', '', '');

		if (this.selected_dealer || (this.start_date && this.end_date)) {
			getStatsRequest = this._license.get_licenses_statistics(this.selected_dealer, this.start_date, this.end_date);
			isNarrowedDownResult = true;
		}

		getStatsRequest.pipe(takeUntil(this._unsubscribe)).subscribe((response) => {
			if ('message' in response) {
				this.generate = false;
				return;
			}
			const mappedResults = this.mapGraphData([...response.licenses], isNarrowedDownResult);

			if (isNarrowedDownResult) {
				this.licenses_graph_data = [...mappedResults];
				this.number_of_months = response.licenses.length;
				this.average = this.sum / this.number_of_months;
				this.sub_title_detailed = `Found ${response.licenses.length} months with record as shown in the graph.`;
				this.generate = true;
			} else {
				this.licenses_graph_data_detailed = [...mappedResults];
			}
		});

		this.sub_title = `Monthly Licenses as of  ${new Date().getFullYear()}`;
	}

	private mapGraphData(data: API_LICENSE_MONTHLY_STAT[], isNarrowedDownResult = false) {
		const cumulativeSum = (
			(sum) => (value: API_LICENSE_MONTHLY_STAT) =>
				(sum += value.totalLicenses)
		)(0);

		data.sort((a, b) => a.month - b.month);

		if (!isNarrowedDownResult) data = data.filter((item) => item.year == new Date().getFullYear());
		const totalCumulativeLicenses = data.map(cumulativeSum);

		data = data.map((license, index) => {
			this.total_month = license.totalLicenses;
			license.totalLicenses = totalCumulativeLicenses[index];
			this.month_value_graph_detailed.push(this.total_month);
			
			this.month_value_graph.push(this.total_month);
			return license;
		});

		data.forEach((license) => {
			if (isNarrowedDownResult) {
				this.total = license.totalLicenses;
				this.licenses_graph_data.push(license);
				this.label_graph.push(this._months[license.month - 1]);
				this.value_graph.push(license.totalLicenses);
				this.sum = this.sum + license.totalLicenses;
			} else {
				this.total_detailed = license.totalLicenses;
				this.label_graph_detailed.push(this._months[license.month - 1]);
				this.value_graph_detailed.push(license.totalLicenses);
			}
		});

		return data;
	}

	protected get _months() {
		return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	}
}
