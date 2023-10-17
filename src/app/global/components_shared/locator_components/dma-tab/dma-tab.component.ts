import { AgmInfoWindow } from '@agm/core';
import { MatSelect } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { forkJoin, ReplaySubject, Subject } from 'rxjs';
import * as moment from 'moment';

import { API_DMA, PAGING, UI_STORE_HOUR } from 'src/app/global/models';
import { ExportService, HostService } from 'src/app/global/services';

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
	dmaHostLocations: any = [];
	dmaOrderList: { dmaRank: number; dmaCode: string }[] = [];
	filteredDMA = new ReplaySubject<API_DMA[]>(1);
	hasSelectedDMA = false;
	isExporting = false;
	isFormReady = false;
	isSearchingDMA = false;
	latitude = 39.7395247;
	longitude = -105.1524133;
	searchKeyword = '';
	searchSelectForm: FormGroup;
	status: boolean = false;

	protected _unsubscribe = new Subject<void>();

	constructor(private _export: ExportService, private _formBuilder: FormBuilder, private _host: HostService) {}

	ngOnInit() {
		this.initializeForm();

		this.getAllDMAByRank().subscribe((response) => {
			const dma: API_DMA[] = response.paging.entities;
			this.filteredDMA.next([...dma]);
		});
	}

	ngOnDestroy(): void {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onClickExpandHostSearchResult(): void {}

	onClickHostName(hostId: string): void {
		this.currentHostIdSelected = hostId;
	}

	onClickMarkedHostLocation(hostId: string, window: AgmInfoWindow): void {}

	onCloseSearchSelectMenu(): void {
		this.updateDMAHostLocations();
	}

	onDeselectDMA(index: number): void {
		this._dmaListControl.value.splice(index, 1);
		this.searchSelectDMADropdown.compareWith = (a, b) => a && b && a === b;
		this.updateDMAHostLocations();
	}

	onClearDMA() {
		this._dmaListControl.value.length = 0;
		this.searchSelectDMADropdown.compareWith = (a, b) => a && b && a === b;
		this.updateDMAHostLocations();
	}

	onExport(): void {
		const columns = [
			{ name: 'Host ID', key: 'hostId' },
			{ name: 'Host Name', key: 'hostName' },
			{ name: 'Category', key: 'category' },
			{ name: 'General Category', key: 'generalCategory' },
			{ name: 'Dealer Name', key: 'businessName' },
			{ name: 'Address', key: 'address' },
			{ name: 'City', key: 'city' },
			{ name: 'State', key: 'state' },
			{ name: 'Postal Code', key: 'zip' },
			{ name: 'Timezone', key: 'timezoneName' },
			{ name: 'Total Licenses', key: 'totalLicenses' },
			{ name: 'Tags', key: 'tagsToString' },
			{ name: 'Business Hours', key: 'mappedStoreHours' },
			{ name: 'Total Business Hours', key: 'storeHoursTotal' },
			{ name: 'DMA Rank', key: 'dmaRank' },
			{ name: 'DMA Code', key: 'dmaCode' },
			{ name: 'DMA Name', key: 'dmaName' },
			{ name: 'Latitude', key: 'latitude' },
			{ name: 'Longitude', key: 'longitude' }
		];

		const config = [{ name: 'DMA Hosts', columns, data: this.dmaHostLocations }];

		this._export.generate('locator-dma-view', config);
	}

	private getAllDMAByRank(pageSize = 15) {
		return this._host.get_all_dma(this.currentPage, this.searchKeyword, pageSize).pipe(takeUntil(this._unsubscribe));
	}

	private getHostsByDMA(rank: number, code: string, name: string) {
		return this._host.get_dma_hosts_by_rank(rank, code, name).pipe(takeUntil(this._unsubscribe));
	}

	private initializeForm(): void {
		this.searchSelectForm = this._formBuilder.group({
			dmaList: [[], Validators.required],
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
				map((keyword) => {
					if (control.invalid) return;

					this.searchKeyword = keyword;
					this.currentPage = 1;

					this.getAllDMAByRank(0).subscribe((response: { paging: PAGING }) => {
						const currentDMAList: API_DMA[] = this._dmaListControl.value;
						const merged = currentDMAList.concat(response.paging.entities as API_DMA[]);
						const unique = merged.filter(
							(dma, index, merged) =>
								merged.findIndex((mergedDMA) => mergedDMA.dmaRank === dma.dmaRank && mergedDMA.dmaCode === dma.dmaCode) === index
						);
						this.filteredDMA.next(unique);
					});
				})
			)
			.subscribe(() => (this.searchSelectDMADropdown.compareWith = (a, b) => a && b && a === b));
	}

	private onSelectDMA(): void {
		const control = this.searchSelectForm.get('dmaList');

		control.valueChanges
			.pipe(
				tap(() => (this.isSearchingDMA = true)),
				takeUntil(this._unsubscribe)
			)
			.subscribe(() => this.updateDMAHostLocations());
	}

	private mapStoreHours(storeHours: UI_STORE_HOUR[]) {
		let days = [];

		storeHours = storeHours.sort((a, b) => {
			return a.id - b.id;
		});

		storeHours.map((hour) => {
			if (!hour.status) {
				days.push(`${hour.day} : Closed`);
				return;
			}

			hour.periods.map((period) => {
				if (period.open === '' && period.close === '') days.push(`${hour.day} : Open 24 hrs`);
				else days.push(`${hour.day} : ${period.open} - ${period.close}`);
			});
		});

		return days.toString().split(',').join('\n');
	}

	private sumTotalStoreHours(data: UI_STORE_HOUR[]): string {
		let hour_diff = 0;
		let hour_diff_temp = [];
		let diff_hours = 0;

		data.forEach((hours) => {
			if (!hours.status) return;

			hours.periods.forEach((period) => {
				diff_hours = 0;

				if (period.open && period.close) {
					let close = moment(period.close, 'H:mm A');
					let open = moment(period.open, 'H:mm A');
					let time_start = new Date(`01/01/2007 ${open.format('HH:mm:ss')}`);
					let time_end = new Date(`01/01/2007 ${close.format('HH:mm:ss')}`);

					if (time_start.getTime() > time_end.getTime()) {
						time_end = new Date(time_end.getTime() + 60 * 60 * 24 * 1000);
						diff_hours = (time_end.getTime() - time_start.getTime()) / 1000;
					} else {
						diff_hours = (time_end.getTime() - time_start.getTime()) / 1000;
					}
				} else {
					diff_hours = 86400;
				}

				hour_diff_temp.push(diff_hours);
			});
		});

		hour_diff = 0;
		hour_diff_temp.forEach((hour) => (hour_diff += hour));

		let totalSeconds = hour_diff;
		let hours = Math.floor(totalSeconds / 3600);

		totalSeconds %= 3600;
		let minutes = Math.floor(totalSeconds / 60);
		let seconds = totalSeconds % 60;

		return `${hours}h ${minutes}m ${seconds}s`;
	}

	private updateDMAHostLocations() {
		let requests: any[] = [];
		let dmaHostLocations: any = [];

		const currentDMAList: API_DMA[] = this._dmaListControl.value;
		this.currentDMAList = currentDMAList;

		if (currentDMAList.length <= 0) {
			// if no DMA is selected then do nothing
			this.isSearchingDMA = false;
			this.dmaHostLocations = [];
			return;
		}

		currentDMAList.forEach((dma) => {
			const { dmaRank, dmaCode, dmaName } = dma;
			this.dmaOrderList.push({ dmaRank, dmaCode });
			requests.push(this.getHostsByDMA(dmaRank, dmaCode, dmaName));
		});

		forkJoin(requests)
			.pipe(
				takeUntil(this._unsubscribe),
				map((response: { paging: PAGING }[]) => {
					response.forEach((dmaPagingResponse) => {
						let dmaHosts: any = dmaPagingResponse.paging.entities;
						dmaHosts = dmaHosts.filter((host) => host.totalLicenses > 0);

						dmaHosts = dmaHosts.map((host) => {
							host.storeHoursParsed = JSON.parse(host.storeHours);
							host.mappedStoreHours = this.mapStoreHours(host.storeHoursParsed);
							host.storeHoursTotal = this.sumTotalStoreHours(host.storeHoursParsed);
							host.tagsToString = host.tags.toString();
							return host;
						});

						const merged = dmaHostLocations.concat(dmaHosts);
						dmaHostLocations = [...merged];

						if (dmaHosts.length > 0) {
							const index = this.currentDMAList.findIndex(
								(orderedDma) => orderedDma.dmaCode === dmaHosts[0].dmaCode && orderedDma.dmaRank === dmaHosts[0].dmaRank
							);
							this.currentDMAList[index].hosts = dmaHosts;
						}
					});
				})
			)
			.subscribe(
				() => {
					this.dmaHostLocations = dmaHostLocations;

					if (!this.dmaHostLocations || this.dmaHostLocations.length <= 0) return;

					this.hasSelectedDMA = true;
				},
				(error) => {
					console.error(error);
				}
			)
			.add(() => (this.isSearchingDMA = false));
	}

	protected get _dmaListControl() {
		return this.searchSelectForm.get('dmaList');
	}

	protected initializeSubscriptions(): void {
		this.onSearchDMA();
		this.onSelectDMA();
	}

	toggleOverMap() {
		this.status = !this.status;
	}
}
