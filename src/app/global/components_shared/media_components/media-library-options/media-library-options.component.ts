import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { UserSortModalComponent } from '../user-sort-modal/user-sort-modal.component';

@Component({
    selector: 'app-media-library-options',
    templateUrl: './media-library-options.component.html',
    styleUrls: ['./media-library-options.component.scss'],
})
export class MediaLibraryOptionsComponent implements OnInit {
    @Input() show_filler_search: boolean = true;
    @Input() disable_user_filter: boolean = false;
    @Input() fillers: { feedId: string; feedTitle: string }[] = [];
    @Input() empty_s: boolean;
    @Output() filetype = new EventEmitter();
    @Output() sortAscend = new EventEmitter();
    @Output() sortDescend = new EventEmitter();
    @Output() sortUser = new EventEmitter();
    @Output() searchKeyword = new EventEmitter();
    @Output() filterByFiller = new EventEmitter();
    filtered_options: Observable<{ feedId: string; feedTitle: string }[]>;
    subscription: Subscription = new Subscription();
    filler_search: FormGroup;
    selected_filler: string;
    search_control = new FormControl();
    search_form_invalid: boolean = false;
    constructor(
        private _dialog: MatDialog,
        private _form: FormBuilder,
    ) {}

    ngOnInit() {
        this.onSearch();

        this.filler_search = this._form.group({
            filler: [''],
            filler_id: [''],
        });

        this.matAutoFilter();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    viewByFileType(e) {
        this.filetype.emit(e);
    }

    sortAscending() {
        this.sortAscend.emit(true);
    }

    sortDescending() {
        this.sortDescend.emit(true);
    }

    sortByUser() {
        let dialog = this._dialog.open(UserSortModalComponent, {
            width: '500px',
        });

        dialog.afterClosed().subscribe((data) => {
            if (data) {
                this.sortUser.emit(data);
            }
        });
    }

    filterByFeedId(data) {
        this.filterByFiller.emit(data);
    }

    onSelectionChanged(e: { feedId: string; feedTitle: string }) {
        this.f.filler.setValue(e.feedTitle);
        this.filterByFeedId(e);
    }

    onSearch() {
        this.search_control.setValidators([Validators.minLength(3)]);

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
                        this.searchKeyword.emit(data);
                    } else {
                        this.search_form_invalid = true;
                    }
                }),
        );
    }

    /** New Feed Form Control Getter */
    get f() {
        return this.filler_search.controls;
    }

    /**
     * Filter Method for the Angular Material Autocomplete
     * @param {string} value The entered phrase in the field
     * @returns {feedId: string, feedTitle: string} Array of filtered results
     */
    private filter(value: string): { feedId: string; feedTitle: string }[] {
        const filter_value = value ? value.toLowerCase() : '';

        const filtered_result = this.fillers
            ? this.fillers.filter((i) => i.feedTitle.toLowerCase().includes(filter_value))
            : [];

        return filtered_result;
    }

    /** Initialize Angular Material Autocomplete Component */
    private matAutoFilter(): void {
        this.filtered_options = this.f.filler.valueChanges.pipe(
            startWith(''),
            map((value) => this.filter(value)),
        );
    }
}
