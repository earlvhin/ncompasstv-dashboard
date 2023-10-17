import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { API_DEALER } from 'src/app/global/models/api_dealer.model';
import { DealerService } from 'src/app/global/services/dealer-service/dealer.service';
import { PAGING } from 'src/app/global/models/paging.model';
import { ConfirmationModalComponent } from 'src/app/global/components_shared/page_components/confirmation-modal/confirmation-modal.component';

@Component({
	selector: 'app-reassign-dealer',
	templateUrl: './reassign-dealer.component.html',
	styleUrls: ['./reassign-dealer.component.scss']
})
export class ReassignDealerComponent implements OnInit, OnDestroy {
	assets_selected = {
		hosts: true,
		advertisers: true,
		licenses: true,
		media_files: true,
		playlists: true,
		screens: true
	};

	dealer: API_DEALER;
	dealers: API_DEALER[] = [];
	description = 'Assign assets from this dealer to another';
	is_data_ready = false;
	is_reassigning = false;
	keyword = '';
	loading_data = true;
	loading_search = true;
	page = 1;
	reassigning_dealer_text = 'Reassigning dealer assets...';
	title = 'Reassign Dealer';

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public current_dealer: { dealer_id: string },
		private _dealer: DealerService,
		private _dialog: MatDialog,
		private _dialog_ref: MatDialogRef<ReassignDealerComponent>
	) {}

	ngOnInit() {
		this.getDealers();
	}

	ngOnDestroy() {}

	get can_assign(): boolean {
		// return this.has_selected_dealer && this.has_asset_toggled;
		return this.has_selected_dealer;
	}

	get has_asset_toggled(): boolean {
		let result = false;

		Object.values(this.assets_selected).forEach((value) => {
			if (value) {
				result = true;
				return;
			}
		});

		return result;
	}

	get has_selected_dealer(): boolean {
		if (typeof this.dealer === 'undefined' || !this.dealer) return false;
		return true;
	}

	getDealers(): void {
		this._dealer
			.get_dealers_with_page(this.page, '')
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { dealers: API_DEALER[]; paging: PAGING }) => {
					// remove current dealer from results
					const dealers = response.dealers;
					const existingIndex = dealers.findIndex((dealer) => dealer.dealerId === this.current_dealer.dealer_id);
					if (existingIndex >= 0) response.dealers.splice(existingIndex, 1);

					this.dealers = response.dealers;
					this.page = response.paging.page;
					this.loading_data = false;
					this.loading_search = false;
					this.is_data_ready = true;
				},
				(error) => {
					console.error(error);
				}
			);
	}

	onSelectAsset(event: Event, name: string): void {
		event.preventDefault();

		Object.keys(this.assets_selected).forEach((key) => {
			if (key === name) this.assets_selected[key] = !this.assets_selected[key];
		});
	}

	onSubmit(): void {
		const oldId = this.current_dealer.dealer_id;
		const newId = this.dealer.dealerId;

		const confirmationModal = this._dialog.open(ConfirmationModalComponent, {
			width: '500px',
			height: '350px',
			data: {
				status: 'warning',
				message: 'Reassign Dealer Assets?',
				return_msg: 'All right, bombs away'
			}
		});

		confirmationModal.afterClosed().subscribe((response: boolean) => {
			if (!response) return;

			this.is_reassigning = true;
			this.is_data_ready = false;

			this._dealer
				.reassign_dealer(oldId, newId)
				.pipe(takeUntil(this._unsubscribe))
				.subscribe(
					(response) => {
						this.is_reassigning = false;
						this.is_data_ready = true;
						this._dealer.onSuccessReassigningDealer.next();
						this._dialog_ref.close();
					},
					(error) => {
						console.error(error);
					}
				);
		});
	}

	selectedDealer(id: string): void {
		if (id === this.current_dealer.dealer_id) {
			this.dealer = null;
			return;
		}

		this._dealer
			.get_dealer_by_id(id)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					this.dealer = response;
				},
				(error) => {
					console.error(error);
				}
			);
	}

	searchDealer(keyword: number | string): void {
		this.loading_search = true;

		if (typeof keyword === 'number') this.dealer = null;

		this._dealer
			.get_search_dealer(keyword)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe((response: { paging: PAGING }) => {
				if (response.paging.entities.length <= 0) {
					this.dealers = [];
				} else {
					// remove current dealer from search results
					const entities: { dealerId: string; businessName: string }[] = response.paging.entities;
					const existingIndex = entities.findIndex((entity) => entity.dealerId === this.current_dealer.dealer_id);
					if (existingIndex >= 0) response.paging.entities.splice(existingIndex, 1);

					this.dealers = response.paging.entities;
				}

				this.loading_search = false;
				this.page = response.paging.page;
			});
	}

	searchBoxTrigger(event: { page: number; no_keyword: boolean }): void {
		if (event.no_keyword) {
			this.dealer = null;
		}

		this.searchDealer(event.page);
	}
}
