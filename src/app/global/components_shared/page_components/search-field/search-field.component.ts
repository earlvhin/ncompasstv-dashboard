import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-search-field',
    templateUrl: './search-field.component.html',
    styleUrls: ['./search-field.component.scss'],
})
export class SearchFieldComponent implements OnInit {
    @Input() placeholder: string;
    @Input() search_keyword: string;
    @Input() form_title: string;
    @Input() data_reference: any[];
    @Input() primary_keyword: string;
    @Input() secondary_keyword: string;
    @Input() api_search: boolean;
    @Input() allow_one: boolean;
    @Output() searched = new EventEmitter();
    @Output() reset_search = new EventEmitter();
    search_result: Array<any>;
    search_form_invalid: boolean = false;
    subscription: Subscription = new Subscription();
    timeOut;
    timeOutDuration = 3000;

    // Search Form as FormControl
    search_control = new FormControl();

    constructor() {}

    ngOnInit() {
        this.searchByApi();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    search() {
        if (this.search_keyword) {
            this.search_result = this.data_reference.filter((res) => {
                if (typeof res[this.primary_keyword] === 'object') {
                    if (
                        res[this.primary_keyword].value
                            .toLowerCase()
                            .includes(this.search_keyword.toLowerCase()) ||
                        res[this.secondary_keyword].value
                            .toLowerCase()
                            .includes(this.search_keyword.toLowerCase())
                    ) {
                        return res;
                    } else if (
                        res[this.primary_keyword].value
                            .toLowerCase()
                            .includes(this.search_keyword.toLowerCase())
                    ) {
                        return res;
                    }
                } else {
                    if (
                        res[this.primary_keyword]
                            .toLowerCase()
                            .includes(this.search_keyword.toLowerCase()) ||
                        res[this.secondary_keyword]
                            .toLowerCase()
                            .includes(this.search_keyword.toLowerCase())
                    ) {
                        return res;
                    } else if (
                        res[this.primary_keyword]
                            .toLowerCase()
                            .includes(this.search_keyword.toLowerCase())
                    ) {
                        return res;
                    }
                }
            });
        } else if (this.search_keyword === '') {
            this.search_result = this.data_reference;
        }

        this.searched.emit(this.search_result);
    }

    searchByApi() {
        this.search_control.setValidators(
            !this.allow_one ? [Validators.minLength(3)] : [Validators.minLength(1)],
        );
        // clearTimeout(this.timeOut);
        // this.timeOut = setTimeout(() => {
        // 	if(this.search_keyword.length >= 3) {
        // 		this.searched.emit(this.search_keyword);
        // 	} else {
        // 		if(this.search_keyword.length == 0) {
        // 			this.reset_search.emit(true);
        // 		}
        // 	}
        // }, this.timeOutDuration);

        this.subscription.add(
            this.search_control.valueChanges
                .pipe(debounceTime(1000), distinctUntilChanged())
                .subscribe((data) => {
                    if (this.search_control.valid) {
                        this.search_form_invalid = false;
                        this.searched.emit(data);
                    } else {
                        this.search_form_invalid = true;
                    }
                }),
        );
    }
}
