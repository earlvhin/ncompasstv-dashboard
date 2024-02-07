import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { AUTOCOMPLETE_ACTIONS } from 'src/app/global/constants/autocomplete';
import { UI_AUTOCOMPLETE } from 'src/app/global/models';

@Component({
    selector: 'app-autocomplete',
    templateUrl: './autocomplete.component.html',
    styleUrls: ['./autocomplete.component.scss'],
})
export class AutocompleteComponent implements OnInit {
    @Input() field_data: UI_AUTOCOMPLETE = {
        label: 'Label',
        placeholder: 'Type anything',
        data: [],
        initialValue: [],
        noData: null,
    };
    @Output() value_selected: EventEmitter<{ id: string; value: string }> = new EventEmitter();
    @Output() no_data_found: EventEmitter<string> = new EventEmitter();
    @ViewChild('autoCompleteInputField', { static: false })
    autoCompleteInputField: ElementRef;
    autoCompleteControl = new FormControl();
    filteredOptions!: Observable<any[]>;
    keyword = '';
    staticVal: boolean = false;

    ngOnInit() {
        this.filteredOptions = this.autoCompleteControl.valueChanges.pipe(
            startWith(
                this.field_data.initialValue && this.field_data.initialValue.length
                    ? this.field_data.initialValue[0].value
                    : '',
            ),
            debounceTime(this.field_data.allowSearchTrigger ? 1000 : 0),
            distinctUntilChanged(),
            map((keyword) => this._filter(keyword)),
        );
    }

    ngAfterViewInit() {
        this.setupDefaults();
        this.startTriggerListener();
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

        return option ? option.value : '';
    }

    private _filter(keyword: any) {
        if (this.staticVal) return;

        const filterValue = keyword.hasOwnProperty('value')
            ? keyword.value.toLowerCase()
            : keyword.toLowerCase();
        let filterResult = this.field_data.data.filter((option) =>
            option.value.toLowerCase().includes(filterValue),
        );

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
                filterResult = this.field_data.data.filter((option) =>
                    option.value.toLowerCase().includes(filterValue),
                );

                if (!filterResult.length && this.field_data.data.length) {
                    filterResult = this.field_data.data;
                }
            }
        }

        this.keyword = keyword;
        return filterResult;
    }

    onFocus() {
        this.staticVal = false;
        this.field_data.noData = null;
    }

    valueSelected(e) {
        this.value_selected.emit(e.option.value);
    }

    startTriggerListener() {
        if (this.field_data.trigger) {
            this.field_data.trigger.subscribe((triggerData: { data: any; action: string }) => {
                switch (triggerData.action) {
                    case AUTOCOMPLETE_ACTIONS.static:
                        this.staticVal = true;

                        setTimeout(() => {
                            this.autoCompleteControl.setValue(triggerData.data);
                        }, 0);
                        break;
                    default:
                        break;
                }
            });
        }
    }
}
