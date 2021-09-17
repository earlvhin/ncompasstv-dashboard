import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { CreateFeedComponent } from '../../components_shared/feed_components/create-feed/create-feed.component';
import { AuthService, FeedService } from 'src/app/global/services';
import { API_FEED, FEED, PAGING, UI_TABLE_FEED } from 'src/app/global/models';

@Component({
	selector: 'app-feeds',
	templateUrl: './feeds.component.html',
	styleUrls: ['./feeds.component.scss'],
})
export class FeedsComponent implements OnInit, OnDestroy {

	title = 'Feeds';
	feed_data: UI_TABLE_FEED[] = [];
	feed_stats: any = {};
	feeds_stats: any = {};
	filtered_data: any = [];
	initial_load = true;
	no_feeds = false;
	paging_data: any;
	search_data = '';
	searching = false;
    sort_column = 'DateCreated';
	sort_order = 'desc';

	feeds_table_column = [
        { name: '#', sortable: false },
        { name: 'Feed Title', sortable: true, column: 'Title' },
        { name: 'Business Name', sortable: true, column: 'BusinessName' },
        { name: 'Type', sortable: true, column: 'Classification' },
        { name: 'Created By', sortable: true, column: 'CreatedByName' },
        { name: 'Creation Date', sortable: true, column: 'DateCreated' },
        { name: 'Action', sortable: false },
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();
	
	constructor(
		private _auth: AuthService,
		private _date: DatePipe,
		private _dialog: MatDialog,
		private _feed: FeedService,
	) { }

	ngOnInit() {
		this.getFeedsTotal();
		this.getFeeds(1);
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	get currentUser() {
		return this._auth.current_user_value;
	}

	filterData(keyword: string): void {
		this.search_data = '';
		if (keyword && keyword.length > 0) this.search_data = keyword;
		this.getFeeds(1);
	}

	getColumnsAndOrder(data: { column: string, order: string }): void {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.getFeeds(1);
	}

	getFeeds(page: number): void {
		this.searching = true;
		this.feed_data = [];

		this._feed.get_feeds(page, this.search_data, this.sort_column, this.sort_order)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				(response: { cFeeds: API_FEED[], paging: PAGING, message?: string }) => {
					
					if (response.message || response.paging.entities.length === 0) {
						if (this.search_data == '') this.no_feeds = true;
						this.feed_data = [];
						this.filtered_data = [];
						return;
					}

					this.feed_data = this.mapToTableFormat(response.paging.entities);
					this.filtered_data = this.mapToTableFormat(response.paging.entities);
					this.paging_data = response.paging;
				},	
				error => console.log('Error retrieving feeds', error)
			)
			.add(() => {
				this.initial_load = false;
				this.searching = false;
			});
	}

	onCreateUrlFeed(): void {

		const dialog = this._dialog.open(CreateFeedComponent, {
			width: '600px',
			panelClass: 'app-media-modal'
		});

		dialog.afterClosed()
			.subscribe(
				data => {
					if (data) this.getFeeds(1);
				}
			);
	}

	reloadPage(e: boolean): void {
		if (e) this.ngOnInit();
	}

	private getFeedsTotal(): void {

		this._feed.get_feeds_total()
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				response => {
					this.feeds_stats = {
						total_value : response.total,
						total_label: "Feed(s)",
						this_week_value: response.newFeedsThisWeek,
						this_week_value_label: "Feed(s)",
						this_week_value_description: "New this week",
						last_week_value: response.newFeedsLastWeek,
						last_week_value_label: "Feed(s)",
						last_week_value_description: "New this week"
					}
				}
			);
	}

	private mapToTableFormat(feeds: FEED[]): UI_TABLE_FEED[] {
		let count = 1;

		return feeds.map(
			(data: FEED) => {

				const { contentId, dealerId, feedId, url, title, businessName, classification, createdByName, 
					dateCreated, description } = data;

				return new UI_TABLE_FEED(
					{ value: contentId, link: null , editable: false, hidden: true },
					{ value: feedId, link: null, editable: false, hidden: true },
					{ value: count++, link: null , editable: false, hidden: false },
					{ value: title, link: `/administrator/media-library/${contentId}`, editable: false, hidden: false },
					{ value: businessName, link: `/administrator/dealers/${data.dealerId}`, id: dealerId, editable: false, hidden: false },
					{ value: data.classification ? classification : '--', link: null, editable: false, hidden: false },
					{ value: createdByName, editable: false, hidden: false },
					{ value: this._date.transform(dateCreated, 'MMMM d, y'), link: null, editable: false, hidden: false },
					{ value: title, link: url, editable: false, hidden: true },
					{ value: description, link: null, editable: false, hidden: true },
				);
			}
		);
	}

}
