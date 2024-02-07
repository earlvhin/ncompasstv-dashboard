import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-pagination-field',
    templateUrl: './pagination-field.component.html',
    styleUrls: ['./pagination-field.component.scss'],
})
export class PaginationFieldComponent implements OnInit {
    @Input() paging_data: any = [];
    @Input() media_lib: boolean;
    @Input() saved_page: any;
    @Output() get_page = new EventEmitter();
    pages: any;

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
    ) {}

    ngOnInit() {}

    ngOnChanges() {
        if (this.paging_data) {
            this.pages = Array(this.paging_data.pages);
            this.paginate();
        }
    }

    getPage(e) {
        this.get_page.emit(e);

        this._router.navigate([], {
            relativeTo: this._route,
            queryParams: {
                page: e,
            },
            queryParamsHandling: 'merge',
        });

        this.paginate();
    }

    paginate() {
        var currentPage = this.paging_data.page;
        var nrOfPages = this.paging_data.pages;
        var delta = 2,
            range = [],
            rangeWithDots = [],
            l;
        range.push(1);

        if (nrOfPages <= 1) {
            return range;
        }

        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
            if (i < nrOfPages && i > 1) {
                range.push(i);
            }
        }
        if (nrOfPages != 1) range.push(nrOfPages);

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }
        this.pages = rangeWithDots;
        return rangeWithDots;
    }
}
