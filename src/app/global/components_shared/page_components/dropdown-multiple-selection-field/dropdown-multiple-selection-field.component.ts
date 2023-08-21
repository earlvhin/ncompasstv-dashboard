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
			if (!this.dealerAdmin) {
				return data;
			} else {
				return data.userId;
			}
		});
	}

	private subscribeToDealerSearch(): void {
		const control = this.dropdownFilterControl;
		control.valueChanges.pipe().subscribe(() => (this.dropdownMultipleSelect.compareWith = (a, b) => a && b && a.dealerId === b.dealerId));
	}
}
