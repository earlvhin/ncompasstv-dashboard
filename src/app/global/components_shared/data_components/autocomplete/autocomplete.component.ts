import { Component, ElementRef, EventEmitter, Input, OnInit, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, first, map, startWith, takeUntil, timeout } from 'rxjs/operators';
import { AUTOCOMPLETE_ACTIONS } from 'src/app/global/constants/autocomplete';
import { UI_AUTOCOMPLETE, UI_AUTOCOMPLETE_DATA, UI_ROLE_DEFINITION } from 'src/app/global/models';
import { AuthService } from 'src/app/global/services';

@Component({
    selector: 'app-autocomplete',
    templateUrl: './autocomplete.component.html',
    styleUrls: ['./autocomplete.component.scss'],
})
export class AutocompleteComponent implements OnInit, OnDestroy {
    @Input() field_data: UI_AUTOCOMPLETE = {
        label: 'Label',
        placeholder: 'Type anything',
        data: [],
        disabled: false,
        initialValue: [],
        noData: null,
        unselect: false,
    };
    @Input() trigger_input_update = new Observable<UI_AUTOCOMPLETE_DATA | string>();

    @Output() value_selected: EventEmitter<{ id: string; value: string }> = new EventEmitter();
    @Output() input_changed = new EventEmitter<string>();
    @Output() no_data_found: EventEmitter<string> = new EventEmitter();
    @ViewChild('autoCompleteInputField', { static: true }) autoCompleteInputField: ElementRef<HTMLInputElement>;

    // autoCompleteInputField: ElementRef;
    autoCompleteControl = new FormControl();
    filteredOptions!: Observable<any[]>;
    keyword = '';
    staticVal: boolean = false;

    protected ngUnsubscribe = new Subject<void>();

    constructor(private _auth: AuthService) {}

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

        // watch for update from parent component and update the control value
        this.trigger_input_update.pipe(takeUntil(this.ngUnsubscribe)).subscribe((response) => {
            this.autoCompleteControl.setValue(response, { emitEvent: false });
        });

        // emit change on input field
        this.autoCompleteControl.valueChanges
            .pipe(takeUntil(this.ngUnsubscribe), debounceTime(1000))
            .subscribe((response) => {
                this.input_changed.emit(response);
            });

        if (this.field_data.disabled && this.isDealer) this.autoCompleteControl.disable();
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    ngAfterViewInit() {
        this.setupDefaults();
        this.startTriggerListener();
    }

    ngOnChanges() {
        this.field_data.data = this.field_data.data;
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
        if (option && option.display) return option.display;
        return option ? option.value : '';
    }

    private _filter(keyword: any) {
        if (this.staticVal) return;

        const filterValue = keyword.hasOwnProperty('value') ? keyword.value.toLowerCase() : keyword.toLowerCase();
        let filterResult = this.field_data.data.filter((option) => option.value.toLowerCase().includes(filterValue));

        // In an event that the keyword search returned does not have a result
        // then we trigger no_data_found event back so the parent can do something about it.
        const noDataFound = !filterResult.length;
        const newKeyword = keyword.length && this.keyword !== keyword;

        if (noDataFound) {
            if (newKeyword) this.no_data_found.emit(keyword);

            // This means that the field_data.data source has been changed by the parent
            // and we need to fire it again for the existing search.
            if (this.field_data.allowSearchTrigger) {
                filterResult = this.field_data.data.filter((option) =>
                    option.value.toLowerCase().includes(filterValue),
                );

                if (!filterResult.length && this.field_data.data.length) filterResult = this.field_data.data;
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

    removeSelection() {
        this.autoCompleteControl.setValue('');
        this.value_selected.emit();
    }

    autoCompleteFocusTrigger(event: MouseEvent): void {
        // Necessary beacause theres a magic happening if preventdefault or propagation doenst stop, the focus is not triggering
        event.preventDefault(); // Prevent the default action of the click event
        event.stopPropagation(); // Stop the event propagation

        this.autoCompleteInputField.nativeElement.focus();
        this.removeSelection();
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

    protected get isDealer() {
        const DEALER_ROLES = ['dealer', 'sub-dealer'];
        return DEALER_ROLES.includes(this._auth.current_role);
    }
}
