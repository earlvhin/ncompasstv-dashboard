import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FillerService } from 'src/app/global/services';
import { Observable, Subject } from 'rxjs';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { takeUntil } from 'rxjs/operators';
import { UI_TABLE_FILLER_FEED } from 'src/app/global/models/ui_table-filler-feed.model';

@Component({
    selector: 'app-filler-feeds-table',
    templateUrl: './filler-feeds-table.component.html',
    styleUrls: ['./filler-feeds-table.component.scss'],
})
export class FillerFeedsTableComponent implements OnInit {
    @Input() reloads: any = false;
	@Input() reload$: Observable<void>;

    initial_load = true;
    filtered_data = [];
    fillers_paging: any;
    searching = false;
    search_data: string = '';

    fillers_table_column = [
        { name: '#', sortable: false },
        { name: 'Name', sortable: true, column: 'Name' },
        { name: 'Quantity', sortable: true, column: 'Quantity' },
        { name: 'Interval (Days)', sortable: true, column: 'Interval' },
        { name: 'Owner', sortable: true, column: 'Owner' },
        { name: '# of Groups', sortable: true, column: 'Groups' },
        { name: 'Created Date', sortable: true, column: 'CreatedDate' },
        { name: 'Action', sortable: false },
    ];

    protected _unsubscribe: Subject<void> = new Subject<void>();
    @Output() reload_page = new EventEmitter();

    constructor(private _filler: FillerService, private _date: DatePipe, private _route: Router) {}

    ngOnInit() {
        this.getAllFillerFeeds();

        this.reload$
            .pipe(takeUntil(this._unsubscribe))
            .subscribe({
                next: () => {
                    this.getAllFillerFeeds();
                }
            })
    }

    getAllFillerFeeds(page?) {
        this.searching = true;
        this._filler
            .get_filler_feeds(page, this.search_data)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                if (!response.message) {
                    const mappedData = this.mapToTableFormat(response.paging.entities);
                    this.filtered_data = mappedData;
                    this.fillers_paging = response.paging;
                    return;
                }
                this.filtered_data = [];
                this.fillers_paging = [];
            })
            .add(() => {
                this.initial_load = false;
                this.searching = false;
            });
    }

    private mapToTableFormat(filler_feeds): UI_TABLE_FILLER_FEED[] {
        let count = 1;

        return filler_feeds.map((filler) => {
            return new UI_TABLE_FILLER_FEED(
                { value: filler.fillerPlaylistId, editable: false, hidden: true },
                { value: count++, editable: false, hidden: false },
                { value: filler.name, editable: false, hidden: false },
                {
                    value: this.formulateDisplayforQuantity(filler),
                    editable: false,
                    link: null,
                    hidden: false,
                    quantity: true,
                    filler_groups: filler.fillerGroups,
                },
                { value: filler.interval, link: null, editable: false, hidden: false, new_tab_link: true },
                { value: filler.createdByName, link: null, editable: false, hidden: false, new_tab_link: true },
                { value: filler.fillerGroups.length, editable: false, hidden: false },
                { value: this._date.transform(filler.dateCreated, 'MMM dd y'), editable: false, hidden: false }
            );
        });
    }

    formulateDisplayforQuantity(filler) {
        let place_holder = '';
        filler.fillerGroups.map((filler, i, { length }) => {
            if (filler.isPair) {
                if (length - 1 === i) place_holder = place_holder + filler.quantity + '<i class="fas fa-circle text-orange ml-1 mr-2" title="In Pairs"></i>';
                else place_holder = place_holder + filler.quantity + '<i class="fas fa-circle text-orange ml-1 mr-2" title="In Pairs"></i>' + ' , ';
            } else {
                if (length - 1 === i) place_holder = place_holder + filler.quantity;
                else place_holder = place_holder + filler.quantity + ' , ';
            }
        });

        return place_holder;
    }

    reloadPage(e) {
        if (e) this.ngOnInit();
    }

    filterData(keyword: string): void {
        this.search_data = '';
        if (keyword && keyword.length > 0) this.search_data = keyword;
        this.getAllFillerFeeds(1);
    }
}
