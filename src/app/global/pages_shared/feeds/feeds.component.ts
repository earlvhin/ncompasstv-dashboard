import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe, Location } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

import { CreateFeedComponent } from '../../components_shared/feed_components/create-feed/create-feed.component';
import { CreateFillerFeedComponent } from '../fillers/components/create-filler-feed/create-filler-feed.component';
import { AuthService, FeedService } from 'src/app/global/services';
import { API_FEED, FEED, PAGING, UI_ROLE_DEFINITION_TEXT, UI_TABLE_FEED } from 'src/app/global/models';

@Component({
	selector: 'app-feeds',
	templateUrl: './feeds.component.html',
	styleUrls: ['./feeds.component.scss']
})
export class FeedsComponent implements OnInit, OnDestroy {
	current_user = this._auth.current_user_value;
	feed_data: UI_TABLE_FEED[] = [];
	feed_stats: any = {};
	feeds_stats: any = {};
	filler_stats: any = {};
	filtered_data: any = [];
	initial_load = true;
	isActiveTab = 0;
	is_view_only = false;
	no_feeds = false;
	paging_data: any;
	reload_detected = false;
	search_data = '';
	searching = false;
	sort_column = 'DateCreated';
	sort_order = 'desc';
	title = 'Feeds';

	feeds_table_column = [
		{ name: '#', sortable: false },
		{ name: 'Feed Title', sortable: true, column: 'Title' },
		{ name: 'Business Name', sortable: true, column: 'BusinessName' },
		{ name: 'Type', sortable: true, column: 'Classification' },
		{ name: 'Created By', sortable: true, column: 'CreatedByName' },
		{ name: 'Creation Date', sortable: true, column: 'DateCreated' },
		{ name: 'Action', sortable: false }
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _date: DatePipe,
		private _dialog: MatDialog,
		private _feed: FeedService,
		private cdRef: ChangeDetectorRef,
		private _location: Location,
		private _route: Router
	) {}

	ngOnInit() {
		this.onTabChanged(0);
		this.getFeedsTotal();
		this.is_view_only = this.current_user.roleInfo.permission === 'V';
	}

	ngAfterViewInit() {
		this.cdRef.detectChanges();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	get isCurrentRoleDealer() {
		return this.currentRole === 'dealer';
	}

	get isCurrentRoleSubDealer() {
		return this.currentRole === 'sub-dealer';
	}

	filterData(keyword: string): void {
		this.search_data = '';
		if (keyword && keyword.length > 0) this.search_data = keyword;
		this.getFeeds(1);
	}

	getColumnsAndOrder(data: { column: string; order: string }): void {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.getFeeds(1);
	}

	getFeeds(page: number): void {
		this.searching = true;
		this.feed_data = [];
		let request = this._feed.get_feeds(page, this.search_data, this.sort_column, this.sort_order);
		if (this.isCurrentRoleDealer || this.isCurrentRoleSubDealer)
			request = this._feed.get_feeds_by_dealer(this.current_user.roleInfo.dealerId, page, this.search_data);

		request
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response) => {
					if (response.message || response.paging.entities.length === 0) {
						if (this.search_data == '') this.no_feeds = true;
						this.feed_data = [];
						this.filtered_data = [];
						return;
					}

					const mappedData = this.mapToTableFormat(response.paging.entities);
					this.feed_data = [...mappedData];
					this.filtered_data = [...mappedData];
					this.paging_data = response.paging;
				},
				(error) => {
					throw new Error(error);
				}
			)
			.add(() => {
				this.initial_load = false;
				this.searching = false;
			});
	}

	onCreateUrlFeed(): void {
		const dialog = this._dialog.open(CreateFeedComponent, {
			width: '600px',
			panelClass: 'app-media-modal',
			autoFocus: false,
			disableClose: true
		});

		dialog.afterClosed().subscribe((data) => {
			if (data) this.getFeeds(1);
		});
	}

	reloadPage(e: boolean): void {
		if (e) this.ngOnInit();
	}

	private getFeedsTotal(): void {
		let request = this._feed.get_feeds_total();

		if (this.isCurrentRoleDealer || this.isCurrentRoleSubDealer) {
			const id = this.current_user.roleInfo.dealerId;
			request = this._feed.get_feeds_total_by_dealer(id);
		}

		request.pipe(takeUntil(this._unsubscribe)).subscribe((response) => {
			this.feeds_stats = {
				total_value: response.total,
				total_label: 'Feed(s)',
				this_week_value: response.newFeedsThisWeek,
				this_week_value_label: 'Feed(s)',
				this_week_value_description: 'New this week'
			};

			this.filler_stats = {
				total_value: response.fillerTotal,
				total_label: 'Filler Feed(s)',
				this_week_value: response.newFillerThisWeek,
				this_week_value_label: 'Filler Feed(s)',
				this_week_value_description: 'New this week'
			};
		});
	}

	onTabChanged(index) {
		if (this.isFillersTab) {
			console.log('HERE');
			index = 1;
		}
		this.isActiveTab = index;
		switch (index) {
			case 0:
				this.getFeeds(1);
				break;
			case 1:
				break;
			default:
		}
	}

	private mapToTableFormat(feeds: FEED[]): UI_TABLE_FEED[] {
		let count = 1;

		return feeds.map((data: FEED) => {
			const {
				contentId,
				dealerId,
				feedId,
				url,
				title,
				classification,
				createdByName,
				dateCreated,
				description,
				embeddedScript: embeddedscript
			} = data;

			let businessName = dealerId ? data.businessName : '--';

			if (this.isCurrentRoleDealer || this.isCurrentRoleSubDealer) businessName = this.current_user.roleInfo.businessName;

			const role = this.currentRole === UI_ROLE_DEFINITION_TEXT.dealeradmin ? UI_ROLE_DEFINITION_TEXT.administrator : this.currentRole;

			return new UI_TABLE_FEED(
				{ value: contentId, editable: false, hidden: true },
				{ value: feedId, editable: false, hidden: true },
				{ value: count++, editable: false, hidden: false },
				{ value: title, link: `/${role}/media-library/${contentId}`, editable: false, hidden: false, new_tab_link: true },
				{ value: businessName, link: `/${role}/dealers/${dealerId}`, id: dealerId, editable: false, hidden: false, new_tab_link: true },
				{ value: data.classification ? classification : '--', editable: false, hidden: false },
				{ value: createdByName, editable: false, hidden: false },
				{ value: this._date.transform(dateCreated, 'MMMM d, y'), editable: false, hidden: false },
				{ value: title, link: url, editable: false, hidden: true },
				{ value: description, editable: false, hidden: true },
				{ value: embeddedscript, editable: false, hidden: true }
			);
		});
	}

	protected get currentRole() {
		return this._auth.current_role;
	}

	createFillerFeed() {
		let dialog = this._dialog.open(CreateFillerFeedComponent, {
			width: '500px',
			data: {
				group: []
			}
		});

		dialog.afterClosed().subscribe(() => {
			this._dialog.closeAll();
			this._route.navigate([`/${this.roleRoute}/feeds?tab=1`]);
		});
	}

	protected get roleRoute() {
		return this._auth.roleRoute;
	}

	private get isFillersTab(): boolean {
		return this._location.path().includes('tab=1');
	}
}
