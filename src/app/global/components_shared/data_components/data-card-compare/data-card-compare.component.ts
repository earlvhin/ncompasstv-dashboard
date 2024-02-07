import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { HelperService } from 'src/app/global/services/helper-service/helper.service';

@Component({
    selector: 'app-data-card-compare',
    templateUrl: './data-card-compare.component.html',
    styleUrls: ['./data-card-compare.component.scss'],
})
export class DataCardCompareComponent implements OnInit, OnDestroy {
    @Input() compare_basis: number;
    @Input() compare_basis_label: string;
    @Input() good_value: number;
    @Input() good_value_label: string;
    @Input() bad_value: number;
    @Input() bad_value_label: string;
    @Input() additional_value: number;
    @Input() additional_value_label: string;
    @Input() online_value: number;
    @Input() online_value_label: string;
    @Input() offline_value: number;
    @Input() offline_value_label: string;
    @Input() is_green: boolean;
    @Input() assigned_value: number;
    @Input() assigned_value_label: string;
    @Input() unassigned_value: number;
    @Input() unassigned_value_label: string;
    @Input() inactive_value: number;
    @Input() inactive_value_label: string;
    @Input() license_online_value: number;
    @Input() license_online_value_label: string;
    @Input() license_offline_value: number;
    @Input() license_offline_value_label: string;

    @Input() page?: string;
    @Input() has_status_filter? = false;

    has_selected_active = false;
    has_selected_inactive = false;

    constructor(private _helper: HelperService) {}

    ngOnInit() {}

    ngOnDestroy() {}

    onFilterByStatus(status = 'active'): void {
        this.has_selected_active = status === 'active';
        this.has_selected_inactive = status === 'inactive';
        this._helper.onClickCardByStatus.next({ page: this.page, value: status });
    }

    onResetDealerStatusFilters(): void {
        if (!this.page && !this.has_status_filter) return;
        this.has_selected_active = false;
        this.has_selected_inactive = false;
        this._helper.onClickCardByStatus.next({ page: this.page, value: 'all' });
    }
}
