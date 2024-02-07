import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService, AdvertiserService } from 'src/app/global/services';
import { API_ADVERTISER, PAGING, UI_ADVERTISER } from 'src/app/global/models';
@Component({
    selector: 'app-advertisers',
    templateUrl: './advertisers.component.html',
    styleUrls: ['./advertisers.component.scss'],
})
export class AdvertisersComponent implements OnInit, OnDestroy {
    advertiser_stats: any;
    base_url = `/${this.currentRole}/advertisers`;
    initial_load_advertiser = true;
    is_searching = false;
    is_view_only = false;
    no_advertisers = false;
    paging_data: PAGING;
    tab: any = { tab: 2 };
    table = { columns: [], data: [] as UI_ADVERTISER[] };
    title: string = 'Advertisers';

    private keyword = '';
    protected _unsubscribe = new Subject<void>();

    constructor(
        private _advertiser: AdvertiserService,
        private _auth: AuthService,
    ) {}

    ngOnInit() {
        this.table.columns = [
            '#',
            'Business Name',
            'Total Assets',
            'Address',
            'City',
            'State',
            'Status',
            'Postal Code',
        ];
        this.getAdvertiserByDealer(1);
        this.getAdvertiserTotal(this.currentDealerId);
        this.is_view_only = this.currentUser.roleInfo.permission === 'V';
    }

    ngOnDestroy() {
        this._unsubscribe.next();
        this._unsubscribe.complete();
    }

    getAdvertiserByDealer(page) {
        const filters = {
            dealer_id: this.currentDealerId,
            page,
            search: this.keyword,
            sortColumn: '',
            sortOrder: '',
            pageSize: 15,
        };

        this.is_searching = true;

        this._advertiser
            .get_advertisers_by_dealer_id(filters)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                if (data.message) {
                    this.table.data = [];

                    if (this.keyword === '') this.no_advertisers = true;
                    return;
                }

                this.paging_data = data.paging;
                const advertisers = this.mapToDataTable(data.advertisers);
                this.table.data = [...advertisers];
            })
            .add(() => {
                this.initial_load_advertiser = false;
                this.is_searching = false;
            });
    }

    onSearchAdvertiser(keyword: string) {
        if (keyword) this.keyword = keyword;
        else this.keyword = '';
        this.getAdvertiserByDealer(1);
    }

    private getAdvertiserTotal(id) {
        this._advertiser
            .get_advertisers_total_by_dealer(id)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data) => {
                this.advertiser_stats = {
                    basis: data.total,
                    basis_label: 'Advertiser(s)',
                    good_value: data.totalActive,
                    good_value_label: 'Active',
                    bad_value: data.totalInActive,
                    bad_value_label: 'Inactive',
                    new_this_week_value: data.newAdvertisersThisWeek,
                    new_this_week_label: 'Advertiser(s)',
                    new_this_week_description: 'New this week',
                    new_last_week_value: data.newAdvertisersLastWeek,
                    new_last_week_label: 'Advertiser(s)',
                    new_last_week_description: 'New last week',
                };
            });
    }

    private mapToDataTable(data: API_ADVERTISER[]): UI_ADVERTISER[] {
        let count = this.paging_data.pageStart;

        return data.map((advertiser) => {
            return {
                advertiserId: { value: advertiser.id, link: null, editable: false, hidden: true },
                index: { value: count++, link: null, editable: false, hidden: false },
                name: {
                    value: advertiser.name,
                    link: `${this.base_url}/${advertiser.id}`,
                    editable: false,
                    hidden: false,
                },
                totalAssets: { value: advertiser.totalAssets },
                address: { value: advertiser.address },
                city: {
                    value: advertiser.city ? advertiser.city : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                state: {
                    value: advertiser.state ? advertiser.state : '--',
                    link: null,
                    editable: false,
                    hidden: false,
                },
                status: { value: advertiser.status, link: null, editable: false, hidden: false },
                postalCode: { value: advertiser.postalCode },
            };
        });
    }

    private get currentDealerId() {
        return this._auth.current_user_value.roleInfo.dealerId;
    }

    protected get currentRole() {
        return this._auth.current_role;
    }

    protected get currentUser() {
        return this._auth.current_user_value;
    }
}
