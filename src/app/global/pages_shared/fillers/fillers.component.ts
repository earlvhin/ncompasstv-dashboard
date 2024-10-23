import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs';
import { AuthService } from 'src/app/global/services';

import { FillerService, DealerService } from 'src/app/global/services';
import { AddFillerContentComponent } from './components/add-filler-content/add-filler-content.component';
import { API_DEALER, PAGING } from '../../models';

@Component({
    selector: 'app-fillers',
    templateUrl: './fillers.component.html',
    styleUrls: ['./fillers.component.scss'],
})
export class FillersComponent implements OnInit {
    current_filter: any;
    current_role: number;
    current_tab = 0;
    current_user_id: string = '';
    current_user_view: string = '';
    fillers_count: any;
    filler_group: any;
    filler_group_cache = [];
    is_admin = this._isAdmin;
    is_dealer = this._isDealer;
    is_dealer_admin = this._isDealerAdmin;
    is_loading: boolean;
    notOwner = false;
    no_search_result = false;
    selectedDealerId: string = '';

    title = 'Fillers Library';

    protected _unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private _dialog: MatDialog,
        private _filler: FillerService,
        private _auth: AuthService,
        private _cdr: ChangeDetectorRef,
        private _dealer: DealerService,
    ) {}

    ngOnInit() {
        this.current_user_id = this._auth.current_user_value.user_id;
        this.getFillersTotal();
        if (!this.is_dealer_admin) this.getAllFillers(1, '');
        else this.getDealerAdminsDealerFillers(1, '', '', '', 'dealeradmin');
    }

    ngAfterContentChecked() {
        this._cdr.detectChanges();
    }

    onTabChanged(e: { index: number }) {
        this.current_tab = e.index;
        this.filler_group_cache = [];
        this.filler_group = [];
        this.notOwner = false;
        switch (e.index) {
            case 0:
                if (this.is_dealer_admin) this.getDealerAdminsDealerFillers(1, '', '', '', 'dealeradmin');
                else this.getAllFillers(1, '');
                break;
            case 1:
                this.notOwner = true;
                if (this.is_dealer) {
                    this.current_role = 1;
                    this.getFillersOtherRole(this.current_role, 1, '');
                } else if (this.is_dealer_admin) this.getAllFillers(1, '');
                else this.getDealerAdminsDealerFillers(1, '', '', '', 'dealeradmin');
                break;
            case 2:
                this.notOwner = true;
                if (this.is_dealer_admin) this.getDealerAdminsDealerFillers(1, '', '', '', 'dealer');
                else if (this.is_dealer) this.getDealerAdminsDealerFillers(1, '', '', '', 'dealeradmin');
                else this.getDealerFillersAdminView(1, '', '');
                break;
            default:
        }
    }

    addFillerContent(group) {
        this._dialog
            .open(AddFillerContentComponent, {
                width: '500px',
                data: {
                    group: group,
                },
            })
            .afterClosed()
            .subscribe(() => this.ngOnInit());
    }

    getFillersTotal() {
        this._filler
            .get_filler_totals()
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data: any) => {
                this.fillers_count = {
                    label: 'Fillers',
                    admin_label: 'Admin Fillers',
                    admin_count: data.admin.total || 0,
                    admin_data: data.admin,
                    dealer_label: 'Dealer Fillers',
                    dealer_count: data.dealer.total,
                    dealer_data: data.dealer,
                    dealer_admin_label: 'Dealer Admin Fillers',
                    dealer_admin_count: data.dealerAdmin.total || 0,
                    dealer_admin_data: data.dealerAdmin,
                };
            });
    }

    getFillersOtherRole(role, page?, keyword?, sort_col?, sort_ord?) {
        this.is_loading = page === 1;
        this._filler
            .get_filler_group_of_other_roles(role, page, keyword, 11, sort_col, sort_ord, this.notOwner)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data: any) => {
                if (!data.message) {
                    this.no_search_result = false;
                    this.filler_group = data.paging;
                    if (page > 1) this.filler_group_cache.push(...data.paging.entities);
                    else this.filler_group_cache = data.paging.entities;
                } else if (keyword == '') {
                    this.filler_group = [];
                    this.no_search_result = false;
                } else this.no_search_result = true;
            })
            .add(() => (this.is_loading = false));
    }

    setFilters(event) {
        const { page = 1, keyword = '', sort_col = '', sort_ord = '' } = event;
        switch (this.current_tab) {
            case 0:
                if (this.is_dealer_admin)
                    this.getDealerAdminsDealerFillers(page, keyword, sort_col, sort_ord, 'dealeradmin');
                else this.getAllFillers(page, keyword, sort_col, sort_ord);
                break;
            case 1:
                if (this.is_dealer) this.getFillersOtherRole(this.current_role, page, keyword, sort_col, sort_ord);
                else if (this.is_dealer_admin) this.getAllFillers(page, keyword, sort_col, sort_ord);
                else this.getDealerAdminsDealerFillers(page, keyword, sort_col, sort_ord, 'dealeradmin');
                break;
            default:
                if (this.is_dealer_admin)
                    this.getDealerAdminsDealerFillers(page, keyword, sort_col, sort_ord, 'dealer');
                else if (this.is_dealer)
                    this.getDealerAdminsDealerFillers(page, keyword, sort_col, sort_ord, 'dealeradmin');
                else this.getDealerFillersAdminView(page, keyword, sort_col, sort_ord);
                break;
        }
    }

    /**
     *
     * @param page for pagenumber
     * @param keyword for searchkey
     * @param sort_col for column to search
     * @param sort_ord for column order accepts asc and desc
     */
    public getAllFillers(page: number, keyword?: string, sort_col?: string, sort_ord?: string): void {
        if (page == 1) this.is_loading = true;
        this._filler
            .get_filler_groups(page, keyword, 11, sort_col, sort_ord, this.is_dealer, this.notOwner)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data: any) => {
                this.no_search_result = !!data.message && keyword !== '';
                this.filler_group = data.paging || [];

                if (!this.no_search_result && !data.message) {
                    this.filler_group_cache =
                        page > 1 ? this.filler_group_cache.concat(data.paging.entities) : data.paging.entities;
                } else this.filler_group_cache = [];
            })
            .add(() => {
                this.is_loading = false;
            });
    }
    /**
     *
     * @param page for pagenumber
     * @param keyword for searchkey
     * @param sort_col for column to search
     * @param sort_ord for column order accepts asc and desc
     * @param user for userfilter accepts userid
     */
    public getDealerAdminsDealerFillers(
        page: number,
        keyword?: string,
        sort_col?: string,
        sort_ord?: string,
        user?: string,
    ): void {
        if (page == 1) this.is_loading = true;
        this._filler
            .get_filler_group_dealer_admin_view('', page, keyword, 11, sort_col, sort_ord, user, this.notOwner)
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data: any) => {
                this.no_search_result = !!data.message && keyword !== '';
                this.filler_group = data.paging || [];

                if (!this.no_search_result && !data.message) {
                    this.filler_group_cache =
                        page > 1 ? this.filler_group_cache.concat(data.paging.entities) : data.paging.entities;
                } else this.filler_group_cache = [];
            })
            .add(() => {
                this.is_loading = false;
            });
    }

    getDealerFillersAdminView(page, keyword?, sort_col?, sort_ord?) {
        this.is_loading = page === 1;
        this._filler
            .get_filler_group_dealer_admin_view(
                this.selectedDealerId,
                page,
                keyword,
                11,
                sort_col,
                sort_ord,
                '',
                this.notOwner,
            )
            .pipe(takeUntil(this._unsubscribe))
            .subscribe((data: any) => {
                this.no_search_result = data.message && keyword != '' ? true : false;
                if (!data.message)
                    this.filler_group_cache =
                        page > 1 ? [...this.filler_group_cache, ...data.paging.entities] : data.paging.entities;
                else this.filler_group = [];
            })
            .add(() => (this.is_loading = false));
    }

    setDealerSelected(id) {
        this.selectedDealerId = id;
        this.getDealerFillersAdminView(1);
    }

    protected get _isDealer() {
        const DEALER_ROLES = ['dealer', 'sub-dealer'];
        return DEALER_ROLES.includes(this._auth.current_role);
    }

    protected get _isDealerAdmin() {
        const DEALER_ADMIN_ROLE = ['dealeradmin'];
        return DEALER_ADMIN_ROLE.includes(this._auth.current_role);
    }

    protected get _isAdmin() {
        const ADMIN_ROLE = ['administrator'];
        return ADMIN_ROLE.includes(this._auth.current_role);
    }
}
