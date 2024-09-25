import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { DealerService, HelperService } from 'src/app/global/services';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { API_FILTERS, UI_AUTOCOMPLETE } from 'src/app/global/models';

@Component({
    selector: 'app-dealer-autocomplete',
    templateUrl: './dealer-autocomplete.component.html',
    styleUrls: ['./dealer-autocomplete.component.scss'],
})
export class DealerAutocompleteComponent implements OnInit, OnDestroy {
    dealers_data: UI_AUTOCOMPLETE;
    dealers: { id: string; value: string }[] = [];
    isEmptyDealer = false;
    key = '';
    searchKeyword: string;

    @Input() initial_value: any;
    @Input() active_only: boolean = false;
    @Input() isDealerAdmin = false;
    @Input() isDisabled = false;
    @Input() field_label = 'Select Dealer Business Name';
    @Input() field_placeholder = 'Ex. NCompass TV';
    @Output() dealer_selected: EventEmitter<any> = new EventEmitter();
    @Output() loaded = new EventEmitter();
    @Output() no_data_found = new EventEmitter();

    protected ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _dealer: DealerService,
        private _helper: HelperService,
    ) {}

    ngOnInit() {
        this.getDealerList();
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * Retrieves the list of dealers based on the current user's role.
     * If the user is a dealer admin, it fetches the list of dealers specific to dealer admins.
     * Otherwise, it retrieves a minified version of the dealer list based on a keyword.
     *
     * @private
     * @returns {void}
     */
    private getDealerList(): void {
        if (this.isDealerAdmin) {
            this.getDealerAdminDealers();
            return;
        }

        this.getDealersMinified(this.key);
    }

    /**
     * Fetches a minified list of dealers based on the provided keyword and stores the results in the `dealers` array.
     * The response is paginated, and the relevant dealer data is added to the list for use in the autocomplete feature.
     *
     * @private
     * @param {string} keyword - The search keyword used to filter the dealers.
     * @returns {void}
     */
    private getDealersMinified(keyword: string): void {
        const filters: API_FILTERS = {
            page: 1,
            keyword,
            pageSize: 0,
            isActive: this.active_only,
        };

        this._dealer
            .getMinifiedDealerData(filters)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response) => {
                    response.paging.entities.forEach((dealer) =>
                        this.dealers.push({ id: dealer.dealerId, value: dealer.businessName }),
                    );

                    this.setAutocomplete();
                },
                (err) => console.error('Failed to retrieve minified dealers data', err),
            );
    }

    /**
     * Initializes the autocomplete configuration for the dealer search input.
     * It sets the label, placeholder, data, and other options for the autocomplete feature.
     * Once the configuration is set, it emits a `loaded` event.
     *
     * @private
     * @returns {void}
     */
    private setAutocomplete(): void {
        this.dealers_data = {
            label: this.field_label,
            placeholder: this.field_placeholder,
            data: this.dealers,
            initialValue: this.initial_value || [],
            unselect: true,
            disabled: this.isDisabled || false,
        };
        this.loaded.emit(true);
    }

    /**
     * Handles the scenario where no dealers are found during the search.
     * It sets the `noData` field in the autocomplete configuration and emits a `dealer_selected` event with `null`.
     *
     * @public
     * @returns {void}
     */
    public dealerNotFound(): void {
        this.dealers_data.noData = 'Dealer Not Found';
        this.dealer_selected.emit(null);
    }

    public setDealer(data: { id: string; value: string }): void {
        this._helper.currentlySelectedDealer = data;
        this.dealer_selected.emit(data ? data : null);
    }

    public dealerInputChangeListener(dealer: string): void {
        if (!dealer) this.dealer_selected.emit(null);
    }

    private getDealerAdminDealers(): void {
        this._dealer
            .get_dealers()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response) => {
                    response.forEach((dealer) =>
                        this.dealers.push({ id: dealer.dealerId, value: dealer.businessName }),
                    );

                    this.setAutocomplete();
                },
                (err) => {
                    console.error('Failed to retrieve dealeradmin dealers', err);
                },
            );
    }
}
