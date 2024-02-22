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

    @Input() initial_value: any;
    @Input() active_only: boolean = false;
    @Output() dealer_selected: EventEmitter<any> = new EventEmitter();

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(private _dealer: DealerService) {}

    ngOnInit() {
        this.getDealersMinified();
    }

    getDealersMinified() {
        this._dealer
            .get_dealers_with_page_minified(1, '', 0, this.active_only)
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

    setAutocomplete() {
        this.dealers_data = {
            label: 'Assigned To',
            placeholder: 'Ex. NCompass TV',
            data: this.dealers,
            initialValue: this.initial_value ? this.initial_value : [],
            unselect: true,
        };
    }

    setDealer(id) {
        id ? this.dealer_selected.emit(id) : this.dealer_selected.emit(null);
    }
}
