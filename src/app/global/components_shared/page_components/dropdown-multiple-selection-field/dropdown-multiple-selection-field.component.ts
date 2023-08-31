import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MatSelect } from '@angular/material';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-dropdown-multiple-selection-field',
	templateUrl: './dropdown-multiple-selection-field.component.html',
	styleUrls: ['./dropdown-multiple-selection-field.component.scss']
})
export class DropdownMultipleSelectionFieldComponent implements OnInit {
	@ViewChild('dropdownMultipleSelect', { static: false }) dropdownMultipleSelect: MatSelect;
	@Input() dropdownData = [];
	@Input() dealerAdmin: boolean = false;
	@Input() dropdownPlaceholder = '';
	@Input() fieldName = '';
	@Input() titleForSelectedValue = '';
	@Input() selectedDropdownControl: any;
	@Input() public form: FormGroup;
	dealer_admins = [];
	dealers = [];
	original_data = [];

	selected_data: any;
	dropdownFilterControl = new FormControl(null);

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor() {}

	ngOnInit() {
		this.original_data = [...this.dropdownData];
		this.subscribeToDealerSearch();
	}

	onRemoveDealer(index: number) {
		this.selectedDropdownControl.value.splice(index, 1);
		if (!this.dealerAdmin) this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
		else this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.userId === b.userId;
		this.onSubmit();
	}

	onClearDealer() {
		this.selectedDropdownControl.value.length = 0;
		if (!this.dealerAdmin) this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
		else this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.userId === b.userId;
		this.onSubmit();
	}

	onSubmit() {
		let data_selected = this.selectedDropdownControl.value;
		data_selected.map((data) => {
			if (!this.dealerAdmin) return data;
			else return data.userId;
		});
	}

	private subscribeToDealerSearch(): void {
		const control = this.dropdownFilterControl;
		control.valueChanges
			.pipe(
				takeUntil(this._unsubscribe),
				debounceTime(500),
				map((keyword) => {
					this.dropdownData = this.original_data;
					if (control.invalid) return;

					if (keyword && keyword.trim().length > 0) {
						let filtered = [];
						this.dropdownData.map((dealer) => {
							if (!this.dealerAdmin) {
								if (dealer.businessName.toLowerCase().indexOf(keyword.toLowerCase()) > -1) filtered.push(dealer);
							} else {
								if (
									dealer.firstName.toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
									dealer.lastName.toLowerCase().indexOf(keyword.toLowerCase()) > -1
								)
									filtered.push(dealer);
							}
						});
						this.dropdownData = filtered;
					}
				})
			)
			.subscribe(() => {
				if (!this.dealerAdmin) this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
				else this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.userId === b.userId;
			});
	}
}
