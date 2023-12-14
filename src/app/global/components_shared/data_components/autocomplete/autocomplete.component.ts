import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
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
        data: []
    };
    @Output() value_selected: EventEmitter<{ id: string; value: string }> = new EventEmitter();

    autoCompleteControl = new FormControl();
    filteredOptions!: Observable<any[]>;

    constructor() {}

    ngOnInit() {
        this.filteredOptions = this.autoCompleteControl.valueChanges.pipe(
            startWith(''),
            map((keyword) => this._filter(keyword))
        );
    }

    displayOption(option: any): string {
        return option ? option.value : '';
    }

    private _filter(keyword: any) {
        const filterValue = keyword.hasOwnProperty('value') ? keyword.value.toLowerCase() : keyword.toLowerCase();
        return this.field_data.data.filter((option) => option.value.toLowerCase().includes(filterValue));
    }

    valueSelected(e) {
        this.value_selected.emit(e.option.value.id);
    }
}
