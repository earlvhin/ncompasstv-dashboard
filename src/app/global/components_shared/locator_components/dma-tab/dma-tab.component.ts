import { AgmInfoWindow } from '@agm/core';
import { MatSelect } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { debounceTime, first, map, takeUntil } from 'rxjs/operators';
import { forkJoin, ReplaySubject, Subject, Subscription } from 'rxjs';

import { API_DMA, API_DMA_HOST, PAGING, UI_HOST_LOCATOR_MARKER_DEALER_MODE } from 'src/app/global/models';
import { HostService } from 'src/app/global/services';

@Component({
	selector: 'app-dma-tab',
	templateUrl: './dma-tab.component.html',
	styleUrls: ['./dma-tab.component.scss']
})
export class DmaTabComponent implements OnInit, OnDestroy {

	@ViewChild('dma_multi_select', { static: false }) searchSelectDMADropdown: MatSelect;

	currentDMAList: API_DMA[] = [];
	currentHostIdSelected: string;
	currentPage = 1;
	dmaHostLocations: API_DMA_HOST[] = [];
	dmaOrderList: { dmaRank: number, dmaCode: string }[] = [];
	filteredDMA = new ReplaySubject<API_DMA[]>(1);
	hasSelectedDMA = false;
	isFormReady = false;
	isSearchingDMA = false;
	latitude = 39.7395247;
	longitude = -105.1524133;
	searchKeyword = '';
	searchSelectForm: FormGroup;

	protected _unsubscribe = new Subject<void>();
	
	constructor(
		private _formBuilder: FormBuilder,
		private _host: HostService,
	) { }
	
	ngOnInit() {
		this.initializeForm();

		this.getAllDMAByRank()
			.subscribe(
				response => {
					const dma: API_DMA[] = response.paging.entities;
					this.filteredDMA.next([...dma]);
				}
			);

	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onClickExpandHostSearchResult(): void {

	}

	onClickHostName(hostId: string): void {
		this.currentHostIdSelected = hostId;
	}

	onClickMarkedHostLocation(hostId: string, window: AgmInfoWindow): void {

	}

	onCloseSearchSelectMenu(): void {
		this.updateDMAHostLocations();
	}

	onDeselectDMA(index: number): void {
		this._dmaListControl.value.splice(index, 1);
		this.searchSelectDMADropdown.compareWith = (a, b) => a && b && a === b;
		this.updateDMAHostLocations();
	}

	private getAllDMAByRank(pageSize = 15) {
		return this._host.get_all_dma(this.currentPage, this.searchKeyword, pageSize).pipe(takeUntil(this._unsubscribe));
	}

	private getHostsByDMA(rank: number, code: string, name: string) {
		return this._host.get_host_via_dma(rank, code, name).pipe(takeUntil(this._unsubscribe));
	}

	private initializeForm(): void {

		this.searchSelectForm = this._formBuilder.group({
			dmaList: [ [], Validators.required ],
			searchDMAKeyword: null
		});

		this.initializeSubscriptions();
		this.isFormReady = true;

	}

	private onSearchDMA(): void {

		const control = this.searchSelectForm.get('searchDMAKeyword');

		control.valueChanges
			.pipe(
				takeUntil(this._unsubscribe),
				debounceTime(1000),
				map(
					keyword => {

						if (control.invalid) return;

						this.searchKeyword = keyword;
						this.currentPage = 1;

						this.getAllDMAByRank(0)
							.subscribe(
								(response: { paging: PAGING }) => {
									const currentDMAList: API_DMA[] = this._dmaListControl.value;
									const merged = currentDMAList.concat(response.paging.entities as API_DMA[]);
									const unique = merged.filter((dma, index, merged) => merged.findIndex(mergedDMA => ((mergedDMA.dmaRank === dma.dmaRank) && (mergedDMA.dmaCode === dma.dmaCode))) === index);
									this.filteredDMA.next(unique);
								}
							);
					}
				)
			)
			.subscribe(() => this.searchSelectDMADropdown.compareWith = (a, b) => a && b && a === b);

	}

	private updateDMAHostLocations(): void {

		let requests: any[] = [];
		let dmaHostLocations: API_DMA_HOST[] = [];

		const currentDMAList: API_DMA[] = this._dmaListControl.value;
		this.currentDMAList = currentDMAList;

		if (currentDMAList.length <= 0) return; // if no DMA is selected then do nothing

		currentDMAList.forEach(
			dma => {
				const { dmaRank, dmaCode, dmaName } = dma;
				this.dmaOrderList.push({ dmaRank, dmaCode });
				requests.push(this.getHostsByDMA(dmaRank, dmaCode, dmaName));
			}
		);

		forkJoin(requests)
			.pipe(
				takeUntil(this._unsubscribe),
				map(
					(response: { paging: PAGING }[]) => {

						response.forEach(
							(dmaPagingResponse) => {

								let dmaHosts: API_DMA_HOST[] = dmaPagingResponse.paging.entities;
								
								dmaHosts = dmaHosts.map(
									host => {
										host.storeHours = JSON.parse(host.storeHours);
										return host;
									}
								);

								const merged = dmaHostLocations.concat(dmaHosts);
								dmaHostLocations = [...merged];

								if (dmaHosts.length > 0) {
									const index = this.currentDMAList.findIndex(orderedDma => (orderedDma.dmaCode === dmaHosts[0].dmaCode) && orderedDma.dmaRank === dmaHosts[0].dmaRank);
									this.currentDMAList[index].hosts = dmaHosts;
								}
							}
						);

					}
				)
			)
			.subscribe(
				() => {

					this.dmaHostLocations = dmaHostLocations;
					if (!this.dmaHostLocations || this.dmaHostLocations.length <= 0) return;
					this.hasSelectedDMA = true;

				},
				error => console.log('Error retrieving hosts by dma', error)
			);

	}

	protected get _dmaListControl() {
		return this.searchSelectForm.get('dmaList');
	}

	protected initializeSubscriptions(): void {
		this.onSearchDMA();
	}

}
