import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService, HelperService, HostService } from 'src/app/global/services';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UI_AUTOCOMPLETE, UI_AUTOCOMPLETE_DATA } from 'src/app/global/models';

@Component({
    selector: 'app-host-autocomplete',
    templateUrl: './host-autocomplete.component.html',
    styleUrls: ['./host-autocomplete.component.scss'],
})
export class HostAutocompleteComponent implements OnInit, OnChanges {
    dealerId = this._auth.current_user_value.roleInfo.dealerId || '';
    hostsData: UI_AUTOCOMPLETE = {
        label: '',
        placeholder: '',
        data: [],
        initialValue: [],
    };
    hostDataFetched = false;

    @Input() assigned: boolean;
    @Input() dealer_id: string;
    @Input() initial_value: any;
    @Input() hosts: UI_AUTOCOMPLETE_DATA[] = [];
    @Output() host_selected: EventEmitter<any> = new EventEmitter();

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _host: HostService,
        private _helper: HelperService,
    ) {}

    ngOnInit() {
        this.getHostsMinified(this.isDealer ? this._auth.current_user_value.roleInfo.dealerId : '');
    }

    //Detect change on the create screen component
    ngOnChanges(changes: SimpleChanges) {
        if (changes['dealer_id']) this.onDealerSelected();
    }

    getHostsMinified(dealerId?: string) {
        this.hostDataFetched = false;
        // this.useWarning = false; // hide warning message
        this.hostsData.data = []; // reset host data

        if (dealerId) this.dealerId = dealerId;

        this._host
            .getHostAllMinified(this.dealerId, this.assigned)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe({
                next: (response: { hostId: string; name: string; dealerId: string }[]) => {
                    this.hosts = response.map((r) => {
                        return {
                            id: r.hostId,
                            value: r.name,
                            dealerId: r.dealerId,
                        };
                    });

                    this.hostDataFetched = true;
                },
                error: (error) => console.error(error),
                complete: () => {
                    if (this.hosts) this.setAutocomplete(this.hosts);
                },
            })
            .add(() => {
                return this.setAutocomplete(this.hosts);
                this.hostsData.data = []; // reset host data
                this.onDealerSelected();
            });
    }

    setAutocomplete(hosts: UI_AUTOCOMPLETE_DATA[]) {
        this.hostsData = {
            label: 'Select Host Name',
            placeholder: 'Ex. NCompass Host',
            data: hosts,
            initialValue: this.initial_value || [],
            unselect: true,
        };
    }

    setHost(id: string) {
        this.host_selected.emit(id || null);
    }

    onDealerSelected() {
        if (this.dealer_id) {
            this.getHostsMinified(this.dealer_id);
            return;
        }

        this._helper.onDealerSelected$.subscribe((data: { id: string; value: string }) => {
            this.getHostsMinified(data.id);
        });
    }

    protected get isDealer() {
        const DEALER_ROLES = ['dealer', 'sub-dealer'];
        return DEALER_ROLES.includes(this._auth.current_role);
    }
}
