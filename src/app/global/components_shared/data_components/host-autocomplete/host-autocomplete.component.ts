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

    ngOnChanges(changes: SimpleChanges) {
        if (changes['dealer_id']) this.onDealerSelected();
    }

    /**
     * Fetches a list of hosts in a minified format (host ID, name, dealer ID) for the specified dealer.
     * The function first resets the current host data and then makes an API call to retrieve hosts.
     * If the dealer ID is provided, it fetches the hosts for that specific dealer; otherwise, it uses the current dealer.
     * Upon success, it maps the host data and updates the autocomplete options.
     *
     * @param {string} [dealerId] - (Optional) The ID of the dealer to fetch hosts for. If not provided, the current dealer ID is used.
     * @public
     * @returns {void}
     */
    public getHostsMinified(dealerId?: string): void {
        // Reset host data
        this.hostDataFetched = false;
        this.hostsData.data = [];

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
            });
    }

    /**
     * Sets the autocomplete configuration for the host selection field.
     * This includes the label, placeholder, available hosts data, and options like unselectability.
     *
     * @param {UI_AUTOCOMPLETE_DATA[]} hosts - An array of hosts to be displayed in the autocomplete field.
     * @private
     * @returns {void}
     */
    private setAutocomplete(hosts: UI_AUTOCOMPLETE_DATA[]): void {
        this.hostsData = {
            label: 'Select Host Name',
            placeholder: 'Ex. NCompass Host',
            data: hosts,
            initialValue: this.initial_value || [],
            unselect: true,
        };
    }

    /**
     * Emits the selected host data to the parent component.
     * The emitted data contains the host ID, name, and optional dealer ID.
     *
     * @param {{ id: string; value: string; dealerId?: string }} data - The selected host's data.
     * @public
     * @returns {void}
     */
    public setHost(data: { id: string; value: string; dealerId?: string }): void {
        this.host_selected.emit(data || null);
    }

    /**
     * Updates the autocomplete to indicate that no hosts were found and emits a `null` value for the host.
     *
     * @public
     * @returns {void}
     */
    public hostNotFound(): void {
        this.hostsData.noData = 'Host Not Found';
        this.host_selected.emit(null);
    }

    /**
     * Fetches the hosts for the selected dealer.
     * If a `dealer_id` is available, it immediately fetches the minified host data for that dealer.
     * Otherwise, it subscribes to the `onDealerSelected$` observable to get the selected dealer and fetch the hosts.
     *
     * @private
     * @returns {void}
     */
    private onDealerSelected(): void {
        if (this.dealer_id) {
            this.getHostsMinified(this.dealer_id);
            return;
        }

        this._helper.onDealerSelected$.subscribe((data: { id: string; value: string }) => {
            this.getHostsMinified(data.id);
        });
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
}
