import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AdvertiserService, AuthService, HelperService } from 'src/app/global/services';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { UI_AUTOCOMPLETE, UI_AUTOCOMPLETE_DATA } from 'src/app/global/models';

@Component({
    selector: 'app-advertiser-autocomplete',
    templateUrl: './advertiser-autocomplete.component.html',
    styleUrls: ['./advertiser-autocomplete.component.scss'],
})
export class AdvertiserAutocompleteComponent implements OnInit, OnChanges {
    advertisers: { dealerId: string; id: string; value: string }[] = [];
    advertiserData: UI_AUTOCOMPLETE = {
        label: '',
        placeholder: '',
        data: [],
        initialValue: [],
    };
    advertiserDataFetched = false;
    loadingAdvertiserData = true;
    noAdvertiser = false;

    @Input() dealer_id: string = '';
    @Input() is_dealer_admin = false;
    @Input() is_disabled = false;
    @Output() advertiser_selected: EventEmitter<any> = new EventEmitter();
    @Output() loaded = new EventEmitter();
    @Output() no_data_found = new EventEmitter();

    protected _unsubscribe: Subject<void> = new Subject();

    constructor(
        private _auth: AuthService,
        private _advertiser: AdvertiserService,
        private _helper: HelperService,
    ) {}

    ngOnInit() {
        const dealerId = this.isDealer ? this.currentDealerId : this.dealer_id;
        this.getAdvertisersMinified(dealerId);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['dealer_id']) this.onDealerSelected(this.dealer_id);
    }

    /**
     * Sets the autocomplete configuration for the advertiser selection field.
     * This includes the label, placeholder, and available advertiser data for the autocomplete.
     *
     * @param {UI_AUTOCOMPLETE_DATA[]} advertisers - An array of advertiser data to populate the autocomplete options.
     * @public
     * @returns {void}
     */
    public setAutocomplete(advertisers: UI_AUTOCOMPLETE_DATA[]): void {
        this.advertiserData = {
            label: 'Select Advertiser Name',
            placeholder: 'Ex: Blue Iguana',
            data: advertisers,
            unselect: true,
        };
    }

    /**
     * Fetches a minified list of advertisers for the specified dealer ID.
     * The function resets the advertiser data and performs an API call to retrieve the advertisers.
     * If no dealer ID is provided, the function prevents the API call.
     * Once the advertisers are fetched, it sets the autocomplete data with the results.
     *
     * @param {string} dealerId - The ID of the dealer to fetch advertisers for.
     * @private
     * @returns {void}
     */
    private getAdvertisersMinified(dealerId: string): void {
        // Reset advertiser data
        this.advertiserDataFetched = false;
        this.advertisers = [];
        this.advertiserData.data = [];

        // Prevent the API call and reset the advertisers array if no dealer id is provided
        if (typeof dealerId === 'undefined' || !dealerId || dealerId.trim().length <= 0) return;

        this._advertiser
            .getAdvertisersUnassignedToUserMinified(dealerId)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe({
                next: (response: { advertisers: { dealerId: string; id: string; name: string }[] }) => {
                    if (response.advertisers) {
                        this.advertisers = response.advertisers.map(({ dealerId, id, name }) => ({
                            dealerId,
                            id,
                            value: name,
                        }));

                        this.advertiserData.data = this.advertisers;
                        this.setAutocomplete(this.advertiserData.data);
                    } else {
                        this.noAdvertiser = true;
                        this.advertiserDataFetched = true;
                    }
                },
                error: (err) => console.error('Error fetching data:', err),
            });
    }

    /**
     * Emits the selected advertiser data to the parent component.
     * The emitted data contains the advertiser ID, value (name), and optional dealer ID.
     *
     * @param {{ id: string; value: string; dealerId?: string }} data - The selected advertiser's data.
     * @public
     * @returns {void}
     */
    public setAdvertiser(data: { id: string; value: string; dealerId?: string }): void {
        this.advertiser_selected.emit(data || null);
    }

    /**
     * Updates the autocomplete to indicate that no advertisers were found and emits a `null` value for the advertiser.
     *
     * @public
     * @returns {void}
     */
    public advertiserNotFound(): void {
        this.advertiserData.noData = 'Advertiser Not Found';
        this.advertiser_selected.emit(null);
    }

    /**
     * Handles the event when a user selects a dealer
     *
     * @param {string} dealerId
     * @returns {void}
     */
    public onDealerSelected(dealerId: string): void {
        if (!dealerId) return;
        this.getAdvertisersMinified(dealerId);
    }

    /**
     * Checks if the current user's role is either "dealer" or "sub-dealer".
     * This helps determine if the user has dealer-specific permissions.
     *
     * @protected
     * @returns {boolean} - Returns `true` if the user is a dealer or sub-dealer, otherwise `false`.
     */
    protected get isDealer(): boolean {
        const DEALER_ROLES = ['dealer', 'sub-dealer'];
        return DEALER_ROLES.includes(this._auth.current_role);
    }

    /**
     * Retrieves the dealer ID based on the isDealer flag
     *
     * returns {string} The dealer id in string value
     */
    protected get currentDealerId(): string {
        const selectedDealer = this._helper.currentlySelectedDealer;
        if (this.isDealer) return this._auth.current_user_value.roleInfo.dealerId;
        return selectedDealer == null ? null : selectedDealer.id;
    }
}
