import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import {
    API_CONTENT,
    API_HOST,
    PAGING,
    UI_AUTOCOMPLETE,
    UI_AUTOCOMPLETE_DATA,
    UI_ROLE_DEFINITION,
} from 'src/app/global/models';
import { AdvertiserService, AuthService, ContentService, HostService } from 'src/app/global/services';
import { DealerService, StatisticsService } from 'src/app/global/services';

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
    assignData = { dealer: '', host: '', advertiser: '' };
    dealers: any = [];
    dealers_data: any = [];
    dealerOwner: UI_AUTOCOMPLETE_DATA[] = [];
    hostOwner: UI_AUTOCOMPLETE_DATA[] = [];
    hosts_data: any[] = [];
    hosts: API_HOST[] = [];
    initialLoad = false;
    isDealer = false;
    isEdit: boolean;
    is_floating = false;
    loading_data = true;
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
    optimize_video_upload: boolean;
    paging: PAGING;
    paging_advertiser: PAGING;
    paging_host: PAGING;
    to_empty = false;

    private advertiserid: string;
    private contentData: API_CONTENT;
    private dealerid: string;
    private filter: any = [];
    private hostid: string;
    private temp: any = {};
    private temp_dname = '';

    protected _unsubscribe = new Subject<void>();

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
        this.optimize_video_upload = localStorage.getItem('optimize_video') == 'false' ? false : true;
    }

    ngOnInit() {
        this.getDealerStatistics();

        this.isEdit = this.data_before_modal ? this.data_before_modal[0].isEdit : false;

        const { role_id, roleInfo } = this._auth.current_user_value;
        const { dealer, 'sub-dealer': subDealer } = UI_ROLE_DEFINITION;

        if (role_id === dealer || role_id === subDealer) {
            this.isDealer = true;
            this.dealerOwner.push({ id: roleInfo.dealerId, value: roleInfo.businessName });
            this.assignData.dealer = roleInfo.dealerId;
            this.getAdvertiserByDealerId;
            this.initialLoad = true;
        } else {
            if (this.isEdit) {
                this._content
                    .get_content_by_id(this.data_before_modal[1].id)
                    .pipe(takeUntil(this._unsubscribe))
                    .subscribe(
                        (data) => {
                            this.contentData = data.content;

                            if (this.contentData.fileType !== 'feed') {
                                const { dealerId, advertiserId, hostId } = this.contentData;

                                if (!dealerId && !advertiserId && !hostId) this.is_floating = true;
                                else {
                                    this.hostid = hostId;
                                    this.advertiserid = advertiserId;
                                    this.dealerid = dealerId;

                                    if (hostId) this.getHostById(this.hostid);
                                    if (advertiserId) this.getAdvertiserById(this.advertiserid);
                                    this.getDealerById(dealerId);
                                }
                            } else {
                                if (this.contentData.dealerId !== '') {
                                    this.dealerid = data.content.dealerId;
                                    this.getDealerById(data.content.dealerId);
                                    return;
                                }
                                this.is_floating = true;
                            }
                        },
                        (error) => console.error(error),
                        () => setTimeout(() => (this.initialLoad = true), 3000),
                    );
            } else this.initialLoad = true;
        }
    }

    ngOnDestroy(): void {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    public advertiserSelected(data: { id: string; value: string }): void {
        if (data == null) {
            this.assignData.advertiser = '';
            return;
        }
        this.assignData.advertiser = data.id;
    }

    public dealerSelected(data: { id: string; value: string }): void {
        if (data == null) {
            this.assignData.dealer = '';
            return;
        }
        this.assignData.dealer = data.id;

        if (this.isEdit) {
            this.loading_data = false;
            if (this.contentData.fileType != 'feed') {
                this.assignData.host = '';
                this.assignData.advertiser = '';
                this.to_empty = true;
                this.loading_form = false;
                this.getAdvertiserByDealerId();
            }

            if (data.id != this.temp_dname) {
                this.assignData.host = '';
                this.assignData.advertiser = '';
            }
        } else this.getAdvertiserByDealerId();
    }

    public hostSelected(data: { id: string; value: string }): void {
        if (data == null) {
            this.assignData.host = '';
            return;
        }
        this.assignData.host = data.id;
    }

    public onToggleFloatingContent(event: { checked: boolean }): void {
        this.is_floating = event.checked;

        if (this.is_floating) {
            this.temp = {
                hostid: this.hostid,
                advertiserid: this.advertiserid,
                dealerid: this.dealerid,
            };

            this.hostid = '';
            this.advertiserid = '';
            this.dealerid = '';
            this.no_advertiser_found = true;
            this.no_host_found = true;
        } else {
            if (this.contentData.dealerId && this.contentData.advertiserId && this.contentData.hostId) {
                this.hostid = this.temp.hostid;
                this.advertiserid = this.temp.advertiserid;
                this.dealerid = this.temp.dealerid;
                this.getHostById(this.hostid);
                this.getAdvertiserById(this.advertiserid);
                this.getDealerById(this.dealerid);
            }
        }
    }

    public setOptimizedVideoUploadValue(e): void {
        localStorage.setItem('optimize_video', e.checked.toString());
    }

    public updateData(): void {
        const filter = {
            contentid: this.contentData.contentId,
            dealerid: this.is_floating ? this.dealerid : this.assignData.dealer,
            hostid: this.is_floating ? this.hostid : this.assignData.host,
            advertiserid: this.is_floating ? this.advertiserid : this.assignData.advertiser,
        };

        this.filter.push(filter);

        this._content
            .unassign_content(this.filter)
            .pipe(takeUntil(this._unsubscribe))
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
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((response) => {
                if (response.total === 0) this.noDealerData = true;
            });
    }

    private getAdvertiserById(id: string): void {
        this._advertiser
            .get_advertiser_by_id(id)
            .pipe(takeUntil(this._unsubscribe))
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
            dealer_id: this.assignData.dealer,
            page: 1,
            sortColumn: '',
            sortOrder: '',
            pageSize: 0,
        };

        this.advertisers = [];

        this._advertiser
            .get_advertisers_by_dealer_id(filters)
            .pipe(takeUntil(this._unsubscribe))
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
            .pipe(takeUntil(this._unsubscribe))
            .subscribe(
                (response) => {
                    this.dealerOwner.push({ id: response.dealerId, value: response.businessName });
                    this.assignData.dealer = response.dealerId;
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
            .pipe(takeUntil(this._unsubscribe))
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
            .subscribe((response) => {
                this._dialog.closeAll();
            });
    }
}
