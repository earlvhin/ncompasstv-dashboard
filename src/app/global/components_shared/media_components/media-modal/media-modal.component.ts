import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ConfirmationModalComponent } from '../../page_components/confirmation-modal/confirmation-modal.component';
import { API_ADVERTISER, API_CONTENT, API_HOST, PAGING, UI_ROLE_DEFINITION } from 'src/app/global/models';
import { AdvertiserService, AuthService, ContentService, HostService } from 'src/app/global/services';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';

@Component({
	selector: 'app-media-modal',
	templateUrl: './media-modal.component.html',
	styleUrls: ['./media-modal.component.scss']
})
export class MediaModalComponent implements OnInit, OnDestroy {
	advertisers: API_ADVERTISER[] = [];
	advertiser_data: any[] = [];
	advertiser_name = '';
	assign_data = { dealer: '', host: '', advertiser: '' };
	dealers: any = [];
	dealer_name = '';
	dealers_data: any = [];
	host_name = '';
	hosts_data: any[] = [];
	hosts: API_HOST[] = [];
	initial_load = false;
	initial_load_host = false;
	initial_load_advertiser = false;
	is_dealer = false;
	is_edit: any;
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
	no_dealer_data: boolean;
	no_host_found = true;
	optimize_video_upload: boolean;
	paging: PAGING;
	paging_advertiser: PAGING;
	paging_host: PAGING;
	to_empty = false;

	private advertiserid: string;
	private content_data: API_CONTENT;
	private dealerid: string;
	private filter: any = [];
	private hostid: string;
	private is_search = false;
	private is_search_host = false;
	private is_search_advertiser = false;
	private search_advertiser_data = '';
	private search_dealer_data = '';
	private search_host_data = '';
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
		private _host: HostService
	) {
		this.optimize_video_upload = localStorage.getItem('optimize_video') == 'false' ? false : true;
	}

	ngOnInit() {
		this.getDealers(1);

		if (this.data_before_modal) this.is_edit = this.data_before_modal[0].is_edit;
		else this.is_edit = false;

		const roleId = this._auth.current_user_value.role_id;
		const dealerRole = UI_ROLE_DEFINITION.dealer;
		const subDealerRole = UI_ROLE_DEFINITION['sub-dealer'];

		if (roleId === dealerRole || roleId === subDealerRole) {
			this.is_dealer = true;
			this.dealerid = this._auth.current_user_value.roleInfo.dealerId;
			this.dealer_name = this._auth.current_user_value.roleInfo.businessName;
			this.dealerSelected(this.dealerid);
		} else {
			if (this.is_edit) {
				this._content
					.get_content_by_id(this.data_before_modal[1].id)
					.pipe(takeUntil(this._unsubscribe))
					.subscribe(
						(data) => {
							this.content_data = data.content;

							if (this.content_data.fileType != 'feed') {
								if (this.content_data.dealerId == '' && this.content_data.advertiserId == '' && this.content_data.hostId == '') {
									this.is_floating = true;
								} else {
									const advertiserId = data.content.advertiserId;
									const hostId = data.content.hostId;
									this.hostid = data.content.hostId;
									this.advertiserid = data.content.advertiserId;
									this.dealerid = data.content.dealerId;

									if (hostId && hostId.length > 0) this.getHostById(this.hostid);
									if (advertiserId && advertiserId.length > 0) this.getAdvertiserById(this.advertiserid);
									this.getDealerById(data.content.dealerId);
								}
							} else {
								if (this.content_data.dealerId == '') {
									this.is_floating = true;
								} else {
									this.dealerid = data.content.dealerId;
									this.getDealerById(data.content.dealerId);
								}
							}
						},
						(error) => {
							console.error(error);
						}
					);
			}
		}
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	advertiserSearchBoxTrigger(event: { is_search: boolean; page: number }): void {
		this.is_search_advertiser = event.is_search;

		if (this.is_search_advertiser) {
			this.search_advertiser_data = '';
			this.advertiser_data = [];
			this.loading_search_advertiser = true;
		}

		if (this.paging.hasNextPage || this.is_search_advertiser) this.getAdvertiserByDealerId(event.page);
	}

	advertiserSelected(id: string) {
		this.assign_data.advertiser = id;
	}

	checkInitialLoad(): boolean {
		if (this.is_edit) {
			if (!this.is_floating) {
				if (this.dealers && this.hosts && this.advertisers && this.dealer_name) {
					return true;
				}

				if (this.content_data) {
					if (this.dealers && this.content_data.fileType == 'feed') {
						return true;
					}

					if (this.content_data.dealerId == '' && this.content_data.advertiserId == '' && this.content_data.hostId == '') {
						return true;
					}
				}
			} else {
				return true;
			}
		} else {
			if (this.dealers.length > 0) return true;
		}
	}

	dealerSelected(id: string): void {
		this.loading_form = false;
		this.no_dealer = false;
		this.assign_data.dealer = id;
		this.initial_load_host = false;

		if (this.is_edit) {
			this.loading_data = false;

			if (this.content_data.fileType != 'feed') {
				this.hosts = [];
				this.hosts_data = [];
				this.advertiser_data = [];
				this.advertisers = [];
				this.assign_data.host = '';
				this.host_name = '';
				this.assign_data.advertiser = '';
				this.advertiser_name = '';
				this.to_empty = true;
				this.loading_form = false;
				this.getHostByDealerId(1);
				this.getAdvertiserByDealerId(1);
			}

			if (id != this.temp_dname) {
				this.assign_data.host = '';
				this.host_name = '';
				this.assign_data.advertiser = '';
				this.advertiser_name = '';
			}
		} else {
			this.hosts = [];
			this.hosts_data = [];
			this.advertiser_data = [];
			this.advertisers = [];
			this.assign_data.host = '';
			this.host_name = '';
			this.assign_data.advertiser = '';
			this.advertiser_name = '';
			this.to_empty = true;
			this.loading_form = false;
			this.getHostByDealerId(1);
			this.getAdvertiserByDealerId(1);
		}
	}

	hostSearchBoxTrigger(event: { is_search: boolean; page: number }): void {
		this.is_search_host = event.is_search;

		if (this.is_search_host) {
			this.search_host_data = '';
			this.hosts_data = [];
			this.loading_search_host = true;
		}

		if (this.paging_host.hasNextPage || this.is_search_host) this.getHostByDealerId(event.page);
	}

	hostSelected(id: string): void {
		this.assign_data.host = id;
	}

	onToggleFloatingContent(event: { checked: boolean }): void {
		this.is_floating = event.checked;

		if (this.is_floating) {
			this.temp = {
				hostid: this.hostid,
				host_name: this.host_name,
				advertiserid: this.advertiserid,
				advertiser_name: this.advertiser_name,
				dealerid: this.dealerid,
				dealer_name: this.dealer_name
			};

			this.hostid = '';
			this.host_name = '';
			this.advertiserid = '';
			this.advertiser_name = '';
			this.dealerid = '';
			this.dealer_name = '';
			this.no_advertiser_found = true;
			this.no_host_found = true;
		} else {
			if (this.content_data.dealerId != '' && this.content_data.advertiserId != '' && this.content_data.hostId != '') {
				this.hostid = this.temp.hostid;
				this.advertiserid = this.temp.advertiserid;
				this.dealerid = this.temp.dealerid;
				this.getHostById(this.hostid);
				this.getAdvertiserById(this.advertiserid);
				this.getDealerById(this.dealerid);
			}
		}
	}

	setOptimizedVideoUploadValue(e) {
		localStorage.setItem('optimize_video', e.checked.toString());
	}

	searchAdvertiserData(keyword: string): void {
		this.search_advertiser_data = keyword;
		this.getAdvertiserByDealerId(1);
	}

	searchBoxTrigger(event: { is_search: boolean; page: number }): void {
		this.is_search = event.is_search;

		if (this.is_search) {
			this.search_dealer_data = '';
			this.dealers_data = [];
			this.loading_search = true;
			this.assign_data.dealer = '';
			this.assign_data.host = '';
			this.assign_data.advertiser = '';
		}

		if (this.paging.hasNextPage || this.is_search) this.getDealers(event.page);
	}

	searchData(keyword: string) {
		this.search_dealer_data = keyword;
		this.getDealers(1);
	}

	searchHostData(keyword: string): void {
		this.search_host_data = keyword;
		this.getHostByDealerId(1);
	}

	updateData(): void {
		let filter = {};

		if (!this.is_floating) {
			filter = {
				contentid: this.content_data.contentId,
				dealerid: this.assign_data.dealer,
				hostid: this.assign_data.host,
				advertiserid: this.assign_data.advertiser
			};
		} else {
			filter = {
				contentid: this.content_data.contentId,
				dealerid: this.dealerid,
				hostid: this.hostid,
				advertiserid: this.advertiserid
			};
		}

		this.filter.push(filter);

		this._content
			.unassign_content(this.filter)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					if (!response) return;
					this.openConfirmationModal('success', 'Content assignment successfully edited.', 'Click OK to continue');
				},
				(error) => {
					console.error(error);
				}
			);
	}

	private getAdvertiserById(id: string) {
		this._advertiser
			.get_advertiser_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					if (response.message) return;
					this.advertiser_name = response.advertiser.name;
					this.advertiserSelected(response.advertiser.id);
				},
				(error) => {
					console.error(error);
				}
			);
	}

	private getAdvertiserByDealerId(page: number) {
		const filters = {
			dealer_id: this.assign_data.dealer,
			page,
			search: this.search_advertiser_data,
			sortColumn: '',
			sortOrder: '',
			pageSize: 15
		};

		if (page > 1) {
			this.loading_advertiser_data = true;

			this._advertiser
				.get_advertisers_by_dealer_id(filters)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						data.advertisers.map((i) => {
							this.advertisers.push(i);
							this.advertiser_data.push(i);
						});

						this.paging_advertiser = data.paging;
						this.loading_advertiser_data = false;
						this.loading_search_advertiser = false;
					},
					(error) => {
						console.error(error);
					}
				);
		} else {
			if (this.search_advertiser_data != '') {
				this.loading_search_advertiser = true;
				this.advertiser_data = [];
			}

			this._advertiser
				.get_advertisers_by_dealer_id(filters)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						if (!data.message) {
							data.advertisers.map((i) => {
								this.advertisers.push(i);
								this.advertiser_data.push(i);
							});

							this.paging_advertiser = data.paging;
							this.no_advertiser_found = false;
						}

						this.to_empty = false;
						this.loading_advertiser_data = false;
						this.loading_search_advertiser = false;
						this.loading_form = false;
					},
					(error) => {
						console.error(error);
					}
				);
		}
	}

	private getDealers(page: number) {
		if (page > 1) {
			this.loading_data = true;

			this._dealer
				.get_dealers_with_page(page, this.search_dealer_data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						data.dealers.map((i) => {
							this.dealers.push(i);
							this.dealers_data.push(i);
						});
						this.paging = data.paging;
						this.loading_data = false;
						this.loading_search = false;
					},
					(error) => {
						console.error(error);
					}
				);
		} else {
			if (this.search_dealer_data != '') {
				this.loading_search = true;
				this.dealers_data = [];
			}

			this._dealer
				.get_dealers_with_page(page, this.search_dealer_data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						if (data.dealers.length > 0) {
							data.dealers.map((i) => {
								this.dealers.push(i);
								this.dealers_data.push(i);
							});

							this.paging = data.paging;
						}

						this.loading_data = false;
						this.loading_search = false;
					},
					(error) => {
						console.error(error);
					}
				);
		}
	}

	private getDealerById(id: string) {
		this._dealer
			.get_dealer_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					this.dealer_name = response.businessName;
					this.temp_dname = response.dealerId;
					this.dealerSelected(response.dealerId);
				},
				(error) => {
					console.error(error);
				}
			);
	}

	private getHostByDealerId(page: number): void {
		if (page > 1) {
			this.loading_host_data = true;

			this._host
				.get_host_by_dealer_id(this.assign_data.dealer, page, this.search_host_data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						data.paging.entities.map((i) => {
							this.hosts.push(i);
							this.hosts_data.push(i);
						});
						this.paging_host = data.paging;
						this.loading_host_data = false;
						this.loading_search_host = false;
					},
					(error) => {
						console.error(error);
					}
				);
		} else {
			if (this.search_host_data != '') {
				this.loading_search_host = true;
				this.hosts_data = [];
			}

			this._host
				.get_host_by_dealer_id(this.assign_data.dealer, page, this.search_host_data)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(data) => {
						if (!data.message) {
							data.paging.entities.map((i) => {
								this.hosts.push(i);
								this.hosts_data.push(i);
							});

							this.paging_host = data.paging;
							this.no_host_found = false;
						}

						this.to_empty = false;
						this.loading_host_data = false;
						this.loading_search_host = false;
						this.loading_form = false;
					},
					(error) => {
						console.error(error);
					}
				);
		}
	}

	private getHostById(id: string) {
		this._host
			.get_host_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					if (response.message) return;
					this.host_name = response.host.name;
					this.hostSelected(response.host.hostId);
				},
				(error) => {
					console.error(error);
				}
			);
	}

	private openConfirmationModal(status: string, message: string, data: string) {
		const dialogRef = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: { status, message, data }
		});

		dialogRef.afterClosed().subscribe((response) => {
			this._dialog.closeAll();
		});
	}
}
