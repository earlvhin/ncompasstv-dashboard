import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MatSelect } from '@angular/material';
import { FormControl, FormGroup } from '@angular/forms';

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

	selected_data: any;
	dropdownFilterControl = new FormControl(null);

	constructor() {}

	ngOnInit() {}

	onRemoveDealer(index: number) {
		this.selectedDropdownControl.value.splice(index, 1);
		if (!this.dealerAdmin) {
			this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
		} else {
			this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.userId === b.userId;
		}

		this.onSubmit();
	}

	onClearDealer() {
		this.selectedDropdownControl.value.length = 0;
		if (!this.dealerAdmin) {
			this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId;
		} else {
			this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.userId === b.userId;
		}
		this.onSubmit();
	}

	onSubmit() {
		const data_selected = this.selectedDropdownControl.value;
		const selectedData = data_selected.map((data) => {
			if (!this.dealerAdmin) {
				const { dealerId } = data;
				return dealerId;
			} else {
				const { userId } = data;
				return data.userId;
			}
		});
	}

	private subscribeToDealerSearch(): void {
		const control = this.dropdownFilterControl;

		control.valueChanges
			.pipe
			// takeUntil(this._unsubscribe),
			// debounceTime(1000),
			// map((keyword) => {
			// 	if (control.invalid) return;

			// 	if (keyword && keyword.trim().length > 0) {
			// 		// this.searchData(keyword);
			// 		let filtered = [];
			// 		console.log('DEALER', this.dealers_list);
			// 		this.dealers_list.map((dealer) => {
			// 			if (dealer.businessName.toLowerCase().indexOf(keyword.toLowerCase()) > -1) {
			// 				filtered.push(dealer);
			// 			}
			// 		});
			// 		this.dealers_list = filtered;
			// 	} else {
			// 		this.dealers_list = this.original_dealers;
			// 	}
			// })
			()
			.subscribe(() => (this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId));
	}
}
