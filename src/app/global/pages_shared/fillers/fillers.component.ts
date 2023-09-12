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
	styleUrls: ['./fillers.component.scss']
})
export class FillersComponent implements OnInit {
	current_filter: any;
	current_role: number;
	current_tab = 0;
	current_user_id: string = '';
	fillers_count: any;
	filler_group: any;
	filler_group_cache = [];
	is_dealer = this._isDealer;
	is_loading: boolean;
	no_search_result = false;

	// Dealers Dropdown
	current_dealer_selected: string = '';
	dealers_data: API_DEALER[] = [];
	dealer_initial_load: boolean = true;
	loading_data = true;
	paging: PAGING;
	loading_search = false;
	private is_search = false;

	title = 'Fillers Library';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _dialog: MatDialog,
		private _filler: FillerService,
		private _auth: AuthService,
		private _cdr: ChangeDetectorRef,
		private _dealer: DealerService
	) {}

	ngOnInit() {
		this.current_user_id = this._auth.current_user_value.user_id;
		this.getFillersTotal();
		this.getAllFillers(1, '');
	}

	ngAfterContentChecked() {
		this._cdr.detectChanges();
	}

	onTabChanged(e: { index: number }) {
		this.current_tab = e.index;
		this.filler_group_cache = [];
		this.filler_group = [];
		switch (e.index) {
			case 0:
				this.getAllFillers(1, '');
				break;
			case 1:
				if (this.is_dealer) {
					this.current_role = 1;
					this.getFillersOtherRole(this.current_role, 1, '');
				}
				break;
			case 2:
				this.getDealers(1);
				break;
			default:
		}
	}

	addFillerContent(group) {
		this._dialog
			.open(AddFillerContentComponent, {
				width: '500px',
				data: {
					group: group
				}
			})
			.afterClosed()
			.subscribe(() => {
				this.ngOnInit();
			});
	}

	getFillersTotal() {
		this._filler
			.get_filler_totals()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				this.fillers_count = {
					label: 'Fillers',
					admin_label: 'Admin Fillers',
					admin_count: data.admin ? data.admin.total : 0,
					admin_data: data.admin,
					dealer_label: 'Dealer Fillers',
					dealer_count: data.dealer.total,
					dealer_data: data.dealer,
					dealer_admin_label: 'Dealer Admin Fillers',
					dealer_admin_count: data.dealerAdmin ? data.dealerAdmin.total : 0,
					dealer_admin_data: data.dealerAdmin
				};
			});
	}

	getFillersOtherRole(role, page?, keyword?, sort_col?, sort_ord?) {
		if (page == 1) this.is_loading = true;
		this._filler
			.get_filler_group_of_other_roles(role, page, keyword, 11, sort_col, sort_ord)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				if (!data.message) {
					this.no_search_result = false;
					this.filler_group = data.paging;
					if (page > 1) {
						data.paging.entities.map((group) => {
							this.filler_group_cache.push(group);
						});
						return;
					} else this.filler_group_cache = data.paging.entities;
				} else {
					if (keyword == '') {
						this.filler_group = [];
						this.no_search_result = false;
						return;
					} else this.no_search_result = true;
				}
			})
			.add(() => {
				this.is_loading = false;
			});
	}

	setFilters(event) {
		this.current_filter = {
			page: event.page ? event.page : 1,
			keyword: event.keyword ? event.keyword : '',
			sort_col: event.sort_col ? event.sort_col : '',
			sort_ord: event.sort_ord ? event.sort_ord : ''
		};

		if (this.current_tab == 0)
			this.getAllFillers(this.current_filter.page, this.current_filter.keyword, this.current_filter.sort_col, this.current_filter.sort_ord);
		else if (this.current_tab == 1)
			this.getFillersOtherRole(
				this.current_role,
				this.current_filter.page,
				this.current_filter.keyword,
				this.current_filter.sort_col,
				this.current_filter.sort_ord
			);
		else if (this.current_tab == 2)
			this.getDealerFillersAdminView(
				this.current_filter.page,
				this.current_filter.keyword,
				this.current_filter.sort_col,
				this.current_filter.sort_ord
			);
	}

	getAllFillers(page, keyword?, sort_col?, sort_ord?) {
		if (page == 1) this.is_loading = true;
		this._filler
			.get_filler_groups(page, keyword, 11, sort_col, sort_ord, this.is_dealer)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				if (!data.message) {
					this.no_search_result = false;
					this.filler_group = data.paging;
					if (page > 1) {
						data.paging.entities.map((group) => {
							this.filler_group_cache.push(group);
						});
						return;
					} else this.filler_group_cache = data.paging.entities;
				} else {
					if (keyword == '') {
						this.filler_group = [];
						this.no_search_result = false;
						return;
					} else this.no_search_result = true;
				}
			})
			.add(() => {
				this.is_loading = false;
			});
	}

	private getDealers(page: number) {
		if (page > 1) this.loading_data = true;
		else {
			if (this.is_search) this.loading_search = true;
		}
		this._dealer
			.get_dealers_with_page(page, '')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					this.dealers_data = data.dealers;
					this.paging = data.paging;
					this.loading_data = false;
					if (page == 1) this.loading_search = false;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => (this.dealer_initial_load = false));
	}

	searchBoxTrigger(event: { is_search: boolean; page: number }) {
		this.is_search = event.is_search;
		this.getDealers(event.page);
	}

	searchDealer(keyword: string) {
		this.loading_search = true;

		this._dealer
			.get_search_dealer(keyword)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(data) => {
					if (data.paging.entities && data.paging.entities.length > 0) this.dealers_data = data.paging.entities;
					else this.dealers_data = [];
					this.paging = data.paging;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => {
				this.loading_search = false;
			});
	}

	setToDealer(id: string) {
		this.current_dealer_selected = id;
		this.getDealerFillersAdminView(1);
	}

	getDealerFillersAdminView(page, keyword?, sort_col?, sort_ord?) {
		if (page == 1) this.is_loading = true;
		this._filler
			.get_filler_group_dealer_admin_view(this.current_dealer_selected, page, keyword, 11, sort_col, sort_ord)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((data: any) => {
				if (!data.message) {
					this.no_search_result = false;
					this.filler_group = data.paging;
					if (page > 1) {
						data.paging.entities.map((group) => {
							this.filler_group_cache.push(group);
						});
						return;
					} else this.filler_group_cache = data.paging.entities;
				} else {
					if (keyword == '') {
						this.filler_group = [];
						this.no_search_result = false;
						return;
					} else this.no_search_result = true;
				}
			})
			.add(() => {
				this.is_loading = false;
			});
	}

	protected get _isDealer() {
		const DEALER_ROLES = ['dealer', 'sub-dealer'];
		return DEALER_ROLES.includes(this._auth.current_role);
	}
}
