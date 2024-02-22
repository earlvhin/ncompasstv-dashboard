import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    HostListener,
    OnDestroy,
    AfterViewInit,
    OnChanges,
    SimpleChanges,
    SimpleChange,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormControl } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { HelperService } from 'src/app/global/services';
@HostListener('scroll', ['$event'])
@Component({
    selector: 'app-autocomplete-field',
    templateUrl: './autocomplete-field.component.html',
    styleUrls: ['./autocomplete-field.component.scss'],
    providers: [TitleCasePipe],
})
export class AutocompleteFieldComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
    @Output() data_value = new EventEmitter();
    @Output() change_value = new EventEmitter();
    @Output() call_next_page = new EventEmitter();
    @Output() searched = new EventEmitter();
    @Output() search_triggered = new EventEmitter();
    @Input() data_reference: Array<any>;
    @Input() paging: any;
    @Input() disabled: boolean;
    @Input() white_label: boolean = false;
    @Input() autocompleteSetting: string = 'nope';
    @Input() key_of_value: string;
    @Input() label: string;
    @Input() placeholder: string;
    @Input() primary_keyword: string;
    @Input() required: boolean;
    @Input() search_keyword: string;
    @Input() initial_value: string;
    @Input() is_scroll_next_disabled = false;
    @Input() new_value: string;
    @Input() no_edit: boolean;
    @Input() loading_data: boolean;
    @Input() loading_search: boolean;
    @Input() old: boolean = false;
    @Input() initial_load: boolean;
    @Input() reset_value: boolean;
    @Input() type?: string;
    @Input() isLocator?: boolean;
    @Input() disable_minimum_search_length = false;
    @Input() is_city = false;
    @Input() display_role: boolean = false;
    @Input() role: string;
    @Input() control?: FormControl;

    input_field_control = new FormControl();
    view_value: string;
    paginated_input_field_control = new FormControl();
    search_result: Array<any>;
    search_via_api: boolean = false;
    timeOut: NodeJS.Timer;
    timeOutDuration = 1000;

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(private _helper: HelperService) {}

    ngOnInit() {
        this.view_value = this.initial_value;
        this.subscribeToResetField();

        if (this.disabled) {
            this.input_field_control.disable();
            this.paginated_input_field_control.disable();
        }

        document.addEventListener('click', this.customBlur);

        if (this.control) {
            this.control.valueChanges.subscribe((value) => {
                // Update the component's view with the new value
                this.view_value = value;
            });
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        this.view_value = this.new_value;

        if (this.reset_value) this.view_value = '';
        this.data_reference = this.data_reference;

        if (this.no_edit) {
            this.view_value = this.initial_value;
        } else {
            if (this.paging && this.search_via_api && this.data_reference.length > 0) {
                this.data_reference = this.data_reference;
                this.search_result = this.data_reference;
            }
        }

        if (changes.disabled as SimpleChange) {
            if (changes.disabled.currentValue) {
                this.input_field_control.disable();
                this.paginated_input_field_control.disable();
                return;
            }

            this.input_field_control.enable();
            this.paginated_input_field_control.enable();
        }
    }

    ngAfterViewInit(): void {
        this.subscribeToMarkAsTouched();
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
        document.removeEventListener('click', this.customBlur);
    }

    customBlur = (event) => {
        if (!event || event.target.className.includes('skip-blur')) return;
        this.emptySearch();
    };

    dataSelected(data: PointerEvent) {
        const target = data.target as HTMLInputElement;
        this.data_value.emit(target.getAttribute('data-value'));
        this.view_value = target.getAttribute('data-text');
        if (this.is_city) this.view_value = this.view_value.split(',')[0].trim();
    }

    emptySearch() {
        setTimeout(() => {
            this.search_result = [];
        }, 300);
    }

    initializeSearch(event: { target: { value: any } }) {
        if (event.target.value) {
            this.search_result = this.data_reference.filter((res) => {
                if (res[this.primary_keyword].toLowerCase().includes(event.target.value.toLowerCase())) {
                    return res;
                }
            });
        } else if (event.target.value === '') {
            this.search_result = this.data_reference;
        }
    }

    search(event: { target: { value: any } }) {
        if (event.target.value) {
            this.search_result = this.data_reference.filter((res) => {
                if (res[this.primary_keyword].toLowerCase().includes(event.target.value.toLowerCase())) {
                    return res;
                }
            });
        } else if (event.target.value === '') {
            this.search_result = this.data_reference;
        }
    }

    search_by_api() {
        clearTimeout(this.timeOut);

        this.timeOut = setTimeout(() => {
            // hotfix only
            // should be refactored
            if (this.disable_minimum_search_length) {
                this.search_via_api = true;
                this.searched.emit(this.view_value);

                if (this.view_value.length === 0) {
                    this.search_via_api = true;
                    this.paging = true;
                    this.call_next_page.emit({ page: 1, is_search: true, no_keyword: true });
                }

                return;
            }

            if (this.view_value.length >= 3) {
                this.search_via_api = true;
                this.searched.emit(this.view_value);
            } else {
                if (this.view_value.length == 0) {
                    this.search_via_api = true;
                    this.paging = true;
                    this.call_next_page.emit({ page: 1, is_search: true, no_keyword: true });
                }
            }
        }, this.timeOutDuration);
    }

    onChangeData(event) {
        this.change_value.emit(event.target.getAttribute('data-value'));
    }

    onScroll(event) {
        if (this.is_scroll_next_disabled) return;

        if (
            event.target.offsetHeight + event.target.scrollTop == event.target.scrollHeight &&
            event.target.scrollHeight != 0
        ) {
            if (this.paging) {
                if (this.paging.hasNextPage) {
                    this.timeOut = setTimeout(() => {
                        this.call_next_page.emit({ page: this.paging.page + 1, is_search: false });
                    }, 1500);
                }
            }
        }
    }

    private subscribeToResetField(): void {
        this._helper.onResetAutocompleteField.pipe(takeUntil(this._unsubscribe)).subscribe(
            (response: string) => {
                if (response !== this.type) return;
                this.ngOnInit();
            },
            (error) => {
                console.error(error);
            },
        );
    }

    private subscribeToMarkAsTouched() {
        this._helper.onTouchPaginatedAutoCompleteField
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(() => this.paginated_input_field_control.markAllAsTouched());
    }
}
