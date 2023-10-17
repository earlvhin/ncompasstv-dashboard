import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService } from 'src/app/global/services/auth-service/auth.service';
import { HostService } from 'src/app/global/services';
import { API_CATEGORY, API_HOST, PAGING } from 'src/app/global/models';

@Component({
	selector: 'app-host-view',
	templateUrl: './host-view.component.html',
	styleUrls: ['./host-view.component.scss']
})
export class HostViewComponent implements OnInit, OnDestroy {
	categoriesData: API_CATEGORY[] = [];
	categorySearchKey = '';
	currentSearchOption = 'host';
	currentUser = this._auth.current_user_value;
	hostsData: API_HOST[] = [];
	isCurrentUserDealer = this._auth.current_role === 'dealer';
	isSearchingHosts = false;
	isSearchingHostsByCategory = false;
	isSearchingHostsByState = false;
	searchDealerId = this.isCurrentUserDealer ? this._auth.current_user_value.roleInfo.dealerId : '';
	searchKey = '';
	stateSearchKey = '';
	statesData: any[] = [];
	status = false;

	protected _unsubscribe = new Subject<void>();

	constructor(private _auth: AuthService, private _host: HostService, private _router: Router) {}

	ngOnInit() {
		this.getHosts(1);
		this.getHostCategories(1);
		this.getHostStates(1);
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	addHostPlace(): void {
		this._router.navigate([`/${this.roleRoute}/hosts/create-host/`]);
	}

	onSearchOption(key: string): void {
		this.currentSearchOption = key;
		this.status = false;

		switch (key) {
			case 'host':
				if (this.isSearchingHosts) return;
				this.getHosts(1);
				break;

			case 'state':
				if (this.isSearchingHostsByState) return;
				this.getHostStates(1);
				break;

			default: // category
				if (this.isSearchingHostsByCategory) return;
				this.getHostCategories(1);
		}
	}

	toggleOverMap(): void {
		this.status = !this.status;
	}

	private getHostCategories(page: number): void {
		this.isSearchingHostsByCategory = true;
		this._host
			.get_host_categories(page, this.categorySearchKey, this.searchDealerId, 0)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { category: any[]; paging: PAGING; message?: string }) => {
					// no records found
					if ('message' in response) return;
					this.categoriesData = [...(response.paging.entities as API_CATEGORY[])].filter((category) => category.totalLicenses > 0);
				},
				(error) => {
					console.error(error);
				}
			)
			.add(() => (this.isSearchingHostsByCategory = false));
	}

	private getHosts(page: number): void {
		let search = this.searchKey ? this.searchKey : this.categorySearchKey;
		search = search ? search : this.stateSearchKey;

		const filters = {
			page,
			search: this.searchKey,
			sortColumn: '',
			sortOrder: '',
			pageSize: 0
		};

		const getDealerHostsRequest = this._host.get_host_by_dealer_id_locator(this.searchDealerId, page, search, 0, false);
		const defaultGetHostsRequest = this._host.get_host_by_page(filters);
		const request = this.isCurrentUserDealer ? getDealerHostsRequest : defaultGetHostsRequest;
		this.isSearchingHosts = true;

		request
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { paging?: PAGING; message?: string; host?: API_HOST[] }) => {
					if (this.isCurrentUserDealer) {
						if ('message' in response) return (this.hostsData = []);
						const hosts = response.paging.entities as API_HOST[];
						this.hostsData = hosts.filter((host) => host.totalLicenses > 0);
						return;
					}

					this.hostsData = response.host;
				},
				(error) => {
					console.error(error);
				}
			)
			.add(() => (this.isSearchingHosts = false));
	}

	private getHostStates(page: number): void {
		this.isSearchingHostsByState = true;
		this._host
			.get_host_states(page, this.stateSearchKey, this.searchDealerId, 0)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { state: any[]; paging: PAGING; message?: string }) => {
					// no records found
					if ('message' in response) return;

					this.statesData = [...response.paging.entities];
				},
				(error) => {
					console.error(error);
				}
			)
			.add(() => (this.isSearchingHostsByState = false));
	}

	protected get roleRoute() {
		return this._auth.roleRoute;
	}
}
