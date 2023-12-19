import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { UI_AUTOCOMPLETE } from 'src/app/global/models';

@Component({
	selector: 'app-autocomplete',
	templateUrl: './autocomplete.component.html',
	styleUrls: ['./autocomplete.component.scss']
})
export class AutocompleteComponent implements OnInit {
	@Input() field_data: UI_AUTOCOMPLETE = {
		label: 'Label',
		placeholder: 'Type anything',
		data: [],
		initialValue: []
	};
	@Output() value_selected: EventEmitter<{ id: string; value: string }> = new EventEmitter();
	@Output() no_data_found: EventEmitter<string> = new EventEmitter();
	@ViewChild('autoCompleteInputField', { static: false }) autoCompleteInputField: ElementRef;

	autoCompleteControl = new FormControl();
	filteredOptions!: Observable<any[]>;
	keyword = '';

	ngOnInit() {
		console.log('====>', this.field_data.initialValue);
		this.filteredOptions = this.autoCompleteControl.valueChanges.pipe(
			startWith(this.field_data.initialValue && this.field_data.initialValue.length ? this.field_data.initialValue[0].value : ''),
			debounceTime(1000),
			distinctUntilChanged(),
			map((keyword) => this._filter(keyword))
		);
	}

	ngAfterViewInit() {
		this.setupDefaults();
	}

	ngOnChanges() {
		this.setupDefaults();
	}

	setupDefaults() {
		if (this.field_data.initialValue && this.field_data.initialValue.length) {
			this.autoCompleteControl.setValue(this.field_data.initialValue[0]);

			setTimeout(() => {
				this.autoCompleteInputField.nativeElement.focus();
			}, 0);
		}
	}

	displayOption(option: any): string {
		if (option && option.display) {
			return option.display;
		}

		console.log('options', option, 'display', option.display, 'value', option.value);

		return option ? option.value : '';
	}

	private _filter(keyword: any) {
		const filterValue = keyword.hasOwnProperty('value') ? keyword.value.toLowerCase() : keyword.toLowerCase();
		let filterResult = this.field_data.data.filter((option) => option.value.toLowerCase().includes(filterValue));

		// In an event that the keyword search returned does not have a result
		// then we trigger no_data_found event back so the parent can do something about it.
		const noDataFound = !filterResult.length;
		const newKeyword = keyword.length && this.keyword !== keyword;

		if (noDataFound) {
			if (newKeyword) {
				this.no_data_found.emit(keyword);
			}

			// This means that the field_data.data source has been changed by the parent
			// and we need to fire it again for the existing search.
			if (this.field_data.allowSearchTrigger) {
				filterResult = this.field_data.data.filter((option) => option.value.toLowerCase().includes(filterValue));

				if (!filterResult.length && this.field_data.data.length) {
					filterResult = this.field_data.data;
				}
			}
		} else if (!noDataFound && newKeyword) {
			this.no_data_found.emit(keyword);

			if (this.field_data.allowSearchTrigger) {
				filterResult = this.field_data.data.filter((option) => option.value.toLowerCase().includes(filterValue));

				if (!filterResult.length && this.field_data.data.length) {
					filterResult = this.field_data.data;
				}
			}
		}

		this.keyword = keyword;
		return filterResult;
	}

	valueSelected(e) {
		this.value_selected.emit(e.option.value);
	}
}
