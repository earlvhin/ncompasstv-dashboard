import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import {
    API_CONTENT,
    API_HOST,
    PAGING,
    UI_AUTOCOMPLETE,
    UI_AUTOCOMPLETE_DATA,
    UI_CURRENT_USER,
    UI_ROLE_DEFINITION_TEXT,
    MediaDialogData,
} from 'src/app/global/models';
import {
    AdvertiserService,
    AuthService,
    ContentService,
    DealerService,
    HostService,
    StatisticsService,
} from 'src/app/global/services';
import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-media-modal',
    templateUrl: './media-modal.component.html',
    styleUrls: ['./media-modal.component.scss'],
})
export class MediaModalComponent implements OnInit, OnDestroy {
    advertisers: UI_AUTOCOMPLETE_DATA[] = [];
    advertisersData: UI_AUTOCOMPLETE;
    advertiserOwner: UI_AUTOCOMPLETE_DATA[] = [];
    advertiser_data: any[] = [];
    advertiserHasValue = false;
    assignData: MediaDialogData;
    dealers: any = [];
    dealers_data: any = [];
    dealerOwner: UI_AUTOCOMPLETE_DATA[] = [];
    hostOwner: UI_AUTOCOMPLETE_DATA[] = [];
    hosts_data: any[] = [];
    hosts: API_HOST[] = [];
    hostHasValue: boolean;
    initialLoad = true;
    isDealer = false;
    isReassigningContent: boolean;
    is_floating = false;
    loading_advertiser_data = false;
    loading_host_data = false;
    loading_form = false;
    loading_search = false;
    loading_search_advertiser = false;
    loading_search_host = false;
    no_advertiser_found = true;
    no_dealer = true;
    noDealerData = false;
    no_host_found = true;
    optimizeVideoUpload = localStorage.getItem('optimize_video') !== 'false';
    paging: PAGING;
    paging_advertiser: PAGING;
    paging_host: PAGING;
    to_empty = false;

    private advertiserId: string;
    private contentData: API_CONTENT;
    private dealerId: string;
    private filter: any = [];
    private hostId: string;
    private temp: any = {};
    private temp_dname = '';
    protected ngUnsubscribe = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data_before_modal: any,
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
        private _content: ContentService,
        private _dealer: DealerService,
        private _dialog: MatDialog,
        private _host: HostService,
        private _stats: StatisticsService,
    ) {
        this.assignData = { dealerId: null, hostId: null, advertiserId: null };
    }

    ngOnInit() {
        this.initialLoad = true;
        this.getDealerStatistics();
        this.isReassigningContent = this.data_before_modal ? this.data_before_modal[0].isEdit : false;

        console.log('');

        if (this.hasDealerRole) {
            this.initializeDealerRoleData();
            return;
        }

        this.initializeAdminData();
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * Checks if the current user has the "dealer admin" role.
     * The function retrieves the current role of the user from the authentication service
     * and compares it to the "dealer admin" role definition.
     *
     * @returns {boolean} - Returns true if the current role is "dealer admin", otherwise false.
     */
    public get isUserDealerAdmin(): boolean {
        const currentRole = this._auth.current_role as UI_ROLE_DEFINITION_TEXT;
        return currentRole === UI_ROLE_DEFINITION_TEXT.dealeradmin;
    }

    /**
     * Handles the event when an advertiser is selected. It sets the `advertiserHasValue` flag
     * to indicate whether a valid advertiser has been selected and updates the `assignData` object
     * with the advertiser's ID. If no advertiser is selected, it sets the advertiser ID to `null`.
     *
     * @param {{ id: string; value: string }} data - The selected advertiser's data containing the advertiser ID and name.
     * @returns {void}
     */
    public advertiserSelected(data: { id: string; value: string }): void {
        this.advertiserHasValue = data !== null;
        this.assignData.advertiserId = this.advertiserHasValue ? data.id : null;
    }

    /**
     * Handles the selection of a dealer from the provided data.
     * If no dealer is selected, it resets the owner data. Otherwise, depending on the reassigning content status,
     * it sets the dealer ID, resets form values, and fetches advertiser data.
     *
     * @param {{ id: string; value: string } | null} data - The selected dealer data, or null if no dealer is selected.
     * @returns {void}
     */
    public dealerSelected(data: { id: string; value: string } | null): void {
        // Reset the dealer, host, and advertiser ids
        this.resetOwnerData();

        // If data being passed is null then do not continue
        if (!data) return;

        // Sets the dealer id being used by the autocomplete components
        this.assignData.dealerId = data.id;

        if (!this.isReassigningContent) {
            this.getAdvertiserByDealerId();
            return;
        }

        if (this.contentData.fileType != 'feed') {
            this.assignData.hostId = null;
            this.assignData.advertiserId = null;
            this.to_empty = true;
            this.loading_form = false;
            this.getAdvertiserByDealerId();
        }

        if (data.id != this.temp_dname) {
            this.assignData.hostId = null;
            this.assignData.advertiserId = null;
        }
    }

    /**
     * Handles the event when a host is selected. It sets the `hostHasValue` flag
     * to indicate whether a valid host has been selected and updates the `assignData` object
     * with the host's ID. If no host is selected, it sets the host ID to `null`.
     *
     * @param {{ id: string; value: string }} data - The selected host's data containing the host ID and name.
     * @returns {void}
     */
    public hostSelected(data: { id: string; value: string }): void {
        this.hostHasValue = data !== null;
        this.assignData.hostId = this.hostHasValue ? data.id : null;
    }

    public onToggleFloatingContent(event: { checked: boolean }): void {
        this.is_floating = event.checked;

        if (this.is_floating) {
            this.temp = {
                hostid: this.hostId,
                advertiserid: this.advertiserId,
                dealerid: this.dealerId,
            };

            this.hostId = '';
            this.advertiserId = '';
            this.dealerId = '';
            this.no_advertiser_found = true;
            this.no_host_found = true;
        } else {
            if (this.contentData.dealerId && this.contentData.advertiserId && this.contentData.hostId) {
                this.hostId = this.temp.hostid;
                this.advertiserId = this.temp.advertiserid;
                this.dealerId = this.temp.dealerid;
                this.getHostById(this.hostId);
                this.getAdvertiserById(this.advertiserId);
                this.getDealerById(this.dealerId);
            }
        }
    }

    /**
     * Resets the `assignData` properties for `dealerId`, `hostId`, and `advertiserId`.
     * If the current user is not of type dealer or sub-dealer, the `dealerId` is also set to `null`.
     * This function ensures that the owner data is cleared based on the user's role and permissions.
     *
     * @public
     * @returns {void}
     *
     * @returns {void}
     */
    public resetOwnerData(): void {
        // Only reset the dealer id if the current user has a dealer role (dealer user or sub-dealer user)
        if (!this.hasDealerRole) {
            this.assignData.dealerId = null;
        }

        this.assignData.hostId = null;
        this.assignData.advertiserId = null;
    }

    /**
     * Sets the "optimize_video" value in local storage based on the user's input.
     * The value is stored as a string representation of the boolean `checked` property.
     *
     * @param {{ checked: boolean }} e - The event object containing the `checked` property that determines whether video optimization is enabled.
     * @returns {void}
     */
    public setOptimizedVideoUploadValue(e: { checked: boolean }): void {
        localStorage.setItem('optimize_video', e.checked.toString());
    }

    public updateData(): void {
        const filter = {
            contentid: this.contentData.contentId,
            dealerid: this.is_floating ? this.dealerId : this.assignData.dealerId,
            hostid: this.is_floating ? this.hostId : this.assignData.hostId,
            advertiserid: this.is_floating ? this.advertiserId : this.assignData.advertiserId,
        };

        this.filter.push(filter);

        this._content
            .unassign_content(this.filter)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response) => {
                    if (!response) return;
                    this.openConfirmationModal(
                        'success',
                        'Content assignment successfully edited.',
                        'Click OK to continue',
                    );
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private getDealerStatistics(): void {
        this._stats
            .api_get_dealer_total()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((response) => {
                if (response.total === 0) this.noDealerData = true;
            });
    }

    private getAdvertiserById(id: string): void {
        this._advertiser
            .get_advertiser_by_id(id)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response) => {
                    this.advertiserOwner.push({ id: response.advertiser.id, value: response.advertiser.name });
                    this.setAdvertiserAutocomplete();
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private getAdvertiserByDealerId() {
        const filters = {
            dealer_id: this.assignData.dealerId,
            page: 1,
            sortColumn: '',
            sortOrder: '',
            pageSize: 0,
        };

        this.advertisers = [];

        this._advertiser
            .get_advertisers_by_dealer_id(filters)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (data) => {
                    this.advertisers = data.message
                        ? []
                        : data.advertisers.map((advertiser) => ({ id: advertiser.id, value: advertiser.name }));
                    this.setAdvertiserAutocomplete();
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private setAdvertiserAutocomplete(): void {
        this.advertisersData = {
            label: 'Select Advertiser Name',
            placeholder: 'Ex. NCompassTV Advertiser',
            data: this.advertisers,
            initialValue: this.advertiserOwner,
            unselect: true,
        };
    }

    private getDealerById(id: string): void {
        this._dealer
            .get_dealer_by_id(id)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response) => {
                    this.dealerOwner.push({ id: response.dealerId, value: response.businessName });
                    this.assignData.dealerId = response.dealerId;
                    this.getAdvertiserByDealerId();
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private getHostById(id: string): void {
        this._host
            .get_host_by_id(id)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (response) => {
                    this.hostOwner.push({ id: response.host.hostId, value: response.host.name });
                },
                (error) => {
                    console.error(error);
                },
            );
    }

    private openConfirmationModal(status: string, message: string, data: string): void {
        this._dialog
            .open(ConfirmationModalComponent, {
                width: '500px',
                height: '350px',
                data: { status, message, data },
            })
            .afterClosed()
            .subscribe(() => {
                this._dialog.closeAll();
            });
    }

    /**
     * Retrieves content to reassign based on the provided content ID, and checks whether the content is "floating."
     * It assigns relevant data (dealer, host, and advertiser IDs), and if the content type is 'feed', it processes the dealer ID.
     * Calls specific methods to fetch dealer, host, and advertiser details depending on the presence of IDs.
     *
     * @private
     * @returns {void}
     */
    private getContentToReassign(): void {
        const hasValue = (data: string) => typeof data !== 'undefined' && data !== null && data.trim().length > 0;

        const isFloatingContent = (dealerId: string, hostId: string, advertiserId: string) => {
            return !hasValue(dealerId) && !hasValue(hostId) && !hasValue(advertiserId);
        };

        this._content
            .get_content_by_id(this.data_before_modal[1].id)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                (data) => {
                    const { advertiserId, dealerId, fileType, hostId } = this.contentData;
                    this.advertiserId = advertiserId;
                    this.dealerId = dealerId;
                    this.hostId = hostId;
                    this.is_floating = isFloatingContent(dealerId, hostId, advertiserId);

                    if (fileType === 'feed') {
                        if (dealerId !== '') {
                            this.dealerId = dealerId ? dealerId : data.content.dealerId;
                            this.getDealerById(this.dealerId);
                            return;
                        }

                        this.is_floating = true;
                        return;
                    }

                    this.getDealerById(dealerId);
                    if (hasValue(hostId)) this.getHostById(hostId);
                    if (hasValue(advertiserId)) this.getAdvertiserById(advertiserId);
                },
                (err) => console.error('Failed to retrieve the content', err),
                () => setTimeout(() => (this.initialLoad = true), 3000),
            );
    }

    /**
     * Initializes the admin-related data based on the content reassignment state.
     * If content is being reassigned, it triggers the retrieval of content via `getContentToReassign`.
     * Otherwise, it sets the `initialLoad` flag to true.
     *
     * @private
     * @returns {void}
     */
    private initializeAdminData(): void {
        this.isReassigningContent ? this.getContentToReassign() : (this.initialLoad = true);
    }

    /**
     * Initializes the data related to the dealer role for the current user.
     * It sets the dealer status, assigns the dealer ID from the user's role information,
     * and pushes the dealer information to the `dealerOwner` array.
     * It also triggers fetching of advertisers by dealer ID and marks the initial load as complete.
     *
     * @private
     * @returns {void}
     */
    private initializeDealerRoleData(): void {
        this.isDealer = true;
        this.initialLoad = true;
        const { roleInfo } = this.currentUserData;
        this.dealerOwner.push({ id: roleInfo.dealerId, value: roleInfo.businessName });
        this.assignData.dealerId = roleInfo.dealerId;
        this.getAdvertiserByDealerId();
    }

    /**
     * Determines if the current user has a dealer role.
     * This includes checking whether the user's role is `dealer` or `sub-dealer`.
     *
     * @protected
     * @returns {boolean} - Returns `true` if the current user has a dealer or sub-dealer role, otherwise `false`.
     *
     * @protected
     * @returns {boolean} - Returns true if the user has a dealer or sub-dealer role, otherwise false.
     */
    protected get hasDealerRole(): boolean {
        const currentRole = this._auth.current_role as UI_ROLE_DEFINITION_TEXT;
        const hasPermissions = [UI_ROLE_DEFINITION_TEXT.dealer, UI_ROLE_DEFINITION_TEXT['sub-dealer']];
        return hasPermissions.includes(currentRole);
    }

    /**
     * Retrieves the current user's data from the authentication service.
     *
     * @protected
     * @returns {UI_CURRENT_USER} - The current user's data.
     */
    protected get currentUserData(): UI_CURRENT_USER {
        return this._auth.current_user_value;
    }
}
