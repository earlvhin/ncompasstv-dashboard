import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { AdvertiserService, HelperService } from 'src/app/global/services';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UI_AUTOCOMPLETE, UI_AUTOCOMPLETE_DATA } from 'src/app/global/models';

@Component({
    selector: 'app-advertiser-autocomplete',
    templateUrl: './advertiser-autocomplete.component.html',
    styleUrls: ['./advertiser-autocomplete.component.scss'],
})
export class AdvertiserAutocompleteComponent implements OnInit {
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

    @Input() initial_value: any;
    @Input() is_dealer_admin = false;
    @Input() is_disabled = false;
    @Output() advertiser_selected: EventEmitter<any> = new EventEmitter();
    @Output() loaded = new EventEmitter();
    @Output() no_data_found = new EventEmitter();

    protected _unsubscribe: Subject<void> = new Subject();

    constructor(
        private _advertiser: AdvertiserService,
        private _helper: HelperService,
    ) {}

    ngOnInit() {
        this.onDealerSelected(this._helper.currentlySelectedDealer);
    }

    public setAutocomplete(advertisers: UI_AUTOCOMPLETE_DATA[]): void {
        this.advertiserData = {
            label: 'Advertiser',
            placeholder: 'Ex: Blue Iguana',
            data: advertisers,
            unselect: true,
        };
    }

    private getAdvertisersMinified(dealerId?: string): void {
        this.advertisers = [];
        this.advertiserDataFetched = false;

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
                        this.advertiserDataFetched = true;
                        this.advertiserData.data = this.advertisers;
                        this.setAutocomplete(this.advertiserData.data);
                    } else {
                        this.noAdvertiser = true;
                    }
                },
                error: (err) => console.error('Error fetching data:', err),
            });
    }

    public setAdvertiser(data: { id: string; value: string; dealerId?: string }): void {
        this.advertiser_selected.emit(data || null);
    }

    public advertiserNotFound(keyword: string): void {
        this.advertiserData.noData = 'Advertiser Not Found';
        this.advertiser_selected.emit(null);
    }

    public onDealerSelected(dealerId): void {
        if (dealerId.id) {
            this.getAdvertisersMinified(dealerId.id);
            return;
        }
    }
}
