import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { DealerService } from 'src/app/global/services';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UI_AUTOCOMPLETE } from 'src/app/global/models';

@Component({
    selector: 'app-dealer-autocomplete',
    templateUrl: './dealer-autocomplete.component.html',
    styleUrls: ['./dealer-autocomplete.component.scss'],
})
export class DealerAutocompleteComponent implements OnInit {
    dealers_data: UI_AUTOCOMPLETE;
    dealers: any = [];
    isEmptyDealer = false;
    key = '';
    searchKeyword: string;

    @Input() initial_value: any;
    @Input() active_only: boolean = false;
    @Input() isDealerAdmin = false;
    @Input() isDisabled = false;
    @Output() dealer_selected: EventEmitter<any> = new EventEmitter();
    @Output() no_data_found = new EventEmitter();


    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(private _dealer: DealerService) {}

    ngOnInit() {
        if (this.isDealerAdmin) this.getDealerAdminDealers();
        this.getDealersMinified(this.key);
    }

    getDealersMinified(keyword: string) {
        this._dealer
            .get_dealers_with_page_minified(1, keyword, 0, this.active_only)
            .subscribe(
                (response) => {
                    response.paging.entities.map((dealer) =>
                        this.dealers.push({ id: dealer.dealerId, value: dealer.businessName }),
                    );
                    this.setAutocomplete();
                },
                (error) => console.error(error),
            );
    }

    setAutocomplete() {
        this.dealers_data = {
            label: 'Select Dealer Business Name',
            placeholder: 'Ex. NCompass TV',
            data: this.dealers,
            initialValue: this.initial_value || [],
            unselect: true,
            disabled: this.isDisabled || false,
        };
    }

    public dealerNotFound(keyword: string) {
        this.dealers_data.noData = 'Dealer Not Found';
        this.dealer_selected.emit(null);
    }

    setDealer(id) {
        id ? this.dealer_selected.emit(id) : this.dealer_selected.emit(null);
    }

    private getDealerAdminDealers(): void {
        this._dealer
            .get_dealers()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    response.paging.entities.map((dealer) =>
                        this.dealers.push({ id: dealer.dealerId, value: dealer.businessName }),
                    );
                    this.setAutocomplete();
                },
                (error) => console.error(error),
            );
    }
}
