import { Component, OnInit} from '@angular/core';
import { MatDialog } from '@angular/material';
import { StatisticsService } from '../../../../global/services/statistics-service/statistics.service';
import { Subscription } from 'rxjs';
import { LicenseModalComponent } from '../../../../global/components_shared/license_components/license-modal/license-modal.component';

@Component({
	selector: 'app-dealers',
	templateUrl: './dealers.component.html',
	styleUrls: ['./dealers.component.scss']
})

export class DealersComponent implements OnInit {
	subscription: Subscription = new Subscription();
	title: string = "Dealers";
	dealer_stats: any;
	update_info: boolean = false;

	constructor(
		private _stats: StatisticsService,
		private _dialog: MatDialog,
	) { }

	ngOnInit() {
		this.getAdminStatistics();
	}

	getAdminStatistics() {
		this.subscription.add(
			this._stats.api_get_dealer_total().subscribe(
				(data: any) => {
					this.dealer_stats = {
						basis: data.total,
						basis_label: 'Dealer(s)',
						good_value: data.totalActive,
						good_value_label: 'Active',
						bad_value: data.totalInactive,
						bad_value_label: 'Inactive',
						this_week_value: data.newDealersThisWeek,
						this_week_value_label: 'Dealer(s)',
						this_week_value_description: 'New this week',
						last_week_value: data.newDealersLastWeek,
						last_week_value_label: 'Dealer(s)',
						last_week_value_description: 'New Last Week'
					}					
				}
			)
		)
	}

	openGenerateLicenseModal(): void {
		let dialogRef = this._dialog.open(LicenseModalComponent, {
			height: '400px',
			width: '500px'
		});

		dialogRef.afterClosed().subscribe(result => {
			this.update_info = true;
		});
	}
}
