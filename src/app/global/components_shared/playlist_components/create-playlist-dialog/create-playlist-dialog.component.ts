import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { debounceTime, map, startWith, takeUntil } from 'rxjs/internal/operators';
import { forkJoin, Observable, Subject } from 'rxjs';

import { AuthService, DealerService } from 'src/app/global/services';
import { API_DEALER, PAGING } from 'src/app/global/models';

@Component({
    selector: 'app-create-playlist-dialog',
    templateUrl: './create-playlist-dialog.component.html',
    styleUrls: ['./create-playlist-dialog.component.scss'],
})
export class CreatePlaylistDialogComponent implements OnInit, OnDestroy {
    @Input() businessName = null;
    @Input() dealerId = null;
    createPlaylistForm: FormGroup;
    dealers: API_DEALER[] = [];
    dealerSearchControl = new FormControl(this.dealerId ? this.dealerId : '');
    dealersDataPaging: PAGING;
    filteredDealers: Observable<API_DEALER[]>;
    formFields = this._fields;
    hasLoadedDealers = false;
    hasSelectedDealer = false;
    isFormReady = false;
    isLoadingDealers = false;
    isSearchingDealers = false;
    selectedDealerId: string = null;
    title = 'Create Playlist';

    protected _unsubscribe = new Subject<void>();

    constructor(
        private _auth: AuthService,
        private _dealer: DealerService,
        private _dialogRef: MatDialogRef<CreatePlaylistDialogComponent>,
    ) {}

    ngOnInit() {
        this.dealerId = this._auth.current_user_value.roleInfo.dealerId;
        this.businessName = this._auth.current_user_value.roleInfo.businessName;
        if (!this.dealerId) this.getDealers(); // if dealer user is logged in then do not load dealers
        this.initializeForm();
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    clearDealerSelection() {
        this.dealerSearchControl.enable();
        this.dealerSearchControl.setValue('');
        this.createPlaylistForm.get('dealerId').setValue(null);
        this.hasSelectedDealer = false;
    }

    createPlaylist() {
        const formValue = this.createPlaylistForm.value;
        const newPlaylistData = { type: 'unset', assets: [], ...formValue };
        this._dialogRef.close(newPlaylistData);
    }

    dealerSelected(dealerId: string) {
        this.selectedDealerId = dealerId;
        this.hasSelectedDealer = true;
        this.createPlaylistForm.get('dealerId').setValue(dealerId);
    }

    private getDealers(page = 1) {
        this.isLoadingDealers = true;
        const pageSize = 50;

        this._dealer
            .get_dealers_with_page_minified(page, '', pageSize)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe({
                next: (response) => {
                    if (response.message) {
                        this.isLoadingDealers = false;
                        return;
                    }

                    this.dealers = [...(response.paging.entities as API_DEALER[])];
                    let remainingRequests: Observable<{ paging?: PAGING; message?: string }>[] = [];
                    const { page, pages } = response.paging;
                    const currentPage = page;
                    const lastPage = pages;

                    // if result only has one page of data then proceed to set dealers data
                    if (currentPage >= lastPage) {
                        this.setDealersData();
                        return;
                    }

                    // else loop through the remaining requests

                    for (let i = currentPage; i < lastPage; i++) {
                        remainingRequests.push(this._dealer.get_dealers_with_page_minified(i + 1, '', pageSize));
                    }

                    forkJoin(remainingRequests)
                        .pipe(takeUntil(this._unsubscribe))
                        .subscribe({
                            next: (response) => {
                                response.forEach((r) => {
                                    this.dealers = this.dealers.concat(r.paging.entities);
                                });

                                this.setDealersData();
                            },
                        });
                },
                error: (e) => {
                    console.error('Could not load dealers', e);
                },
            });
    }

    private initializeForm() {
        const configs = {};

        this._fields.forEach((field) => {
            let validators = [];
            if (field.is_required) validators.push(Validators.required);
            if (field.max_length) validators.push(Validators.maxLength(field.max_length));
            configs[field.name] = new FormControl(field.value, validators);
        });

        if (this.dealerId) {
            this.dealerSearchControl.setValue(this.businessName);
            this.dealerSearchControl.disable();
        }

        this.createPlaylistForm = new FormGroup(configs);
        this.isFormReady = true;
    }

    private setDealersData() {
        const dealerData = this.dealers[0];
        this.dealerId = dealerData.dealerId;
        this.isLoadingDealers = false;
        this.hasLoadedDealers = true;
        this.subscribeToDealerSearch();
    }

    private subscribeToDealerSearch() {
        this.filteredDealers = this.dealerSearchControl.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            takeUntil(this._unsubscribe),
            map((keyword: string) => (keyword ? this._filterDealers(keyword) : this.dealers.slice())),
        );
    }

    private _filterDealers(value: string): API_DEALER[] {
        const keyword = value.toLowerCase();
        return this.dealers.filter((dealer) => dealer.businessName.toLowerCase().includes(keyword));
    }

    protected get _fields() {
        return [
            {
                name: 'playlistName',
                label: 'Playlist Name',
                type: 'text',
                value: null,
                is_required: true,
                max_length: 50,
            },
            {
                name: 'playlistDescription',
                label: 'Description',
                type: 'text',
                value: null,
                is_required: true,
                max_length: 100,
            },
            {
                name: 'dealerId',
                label: 'Assign to Dealer',
                type: 'autocomplete',
                value: this.dealerId ? this.dealerId : null,
                is_required: true,
            },
        ];
    }
}
