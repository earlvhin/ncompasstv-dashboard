import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { AuthService } from '../../../../global/services/auth-service/auth.service';
import { CreateFeedComponent } from '../../../../global/components_shared/feed_components/create-feed/create-feed.component';
import { FeedService } from '../../../../global/services/feed-service/feed.service';
import { UI_TABLE_FEED_DEALER } from '../../../../global/models/ui_table-feed.model';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'app-feeds',
	templateUrl: './feeds.component.html',
	styleUrls: ['./feeds.component.scss'],
	providers: [
		DatePipe, TitleCasePipe
	],
})
export class FeedsComponent implements OnInit, OnDestroy {

	@Input() title: string = 'Feeds';
	feed_data: UI_TABLE_FEED_DEALER[] = [];
	feed_stats: any = {};
	feeds_stats: any = {};
	filtered_data: any = [];
	initial_load: boolean = true;
	is_view_only = false;
	no_feeds: boolean = false;
	paging_data: any;
	search_data: string = "";
	searching: boolean = false;

	feeds_table_column = [
		'#',
		'Feed Title',
		'Type',
		'Created By',
		'Creation Date',
		'Action'
	];

	protected _unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		private _auth: AuthService,
		private _date: DatePipe,
		private _dialog: MatDialog,
		private _feed: FeedService,
		private _titlecase: TitleCasePipe
	) { }

	ngOnInit() {
		this.getFeedsTotal(this._auth.current_user_value.roleInfo.dealerId);
		this.pageRequested(1);
		this.is_view_only = this.currentUser.roleInfo.permission === 'V';
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}
	
	// Upload Modal
	createFeedModal() {
		let dialogRef = this._dialog.open(CreateFeedComponent, {
			width: '600px',
			panelClass: 'app-media-modal'
		})

		dialogRef.afterClosed().subscribe(
			data => {
				if (data) {
					this.reloadPage(true);
				}
			}
		)
	}

	reloadPage(e) {
		this.initial_load = true;
		this.no_feeds = false;
		if (e) {
			this.ngOnInit()
		}
	}

	getFeedsTotal(id: string): void {

		this._feed.get_feeds_total_by_dealer(id).pipe(takeUntil(this._unsubscribe))
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
				},
				error => console.log('Error retrieving dealer feeds total', error)
			);

	}

	pageRequested(e: number): void {

		this.feed_data = [];

		this._feed.get_feeds_by_dealer(this._auth.current_user_value.roleInfo.dealerId, e, this.search_data)
			.pipe(takeUntil(this._unsubscribe))
			.subscribe(
				data => {
					this.paging_data = data.paging;

					if (!data.message) {
						this.feed_data = this.mapFeedsToUI(data.cFeeds);
						this.filtered_data = this.mapFeedsToUI(data.cFeeds);

					} else {

						if (this.search_data == "") {
							this.no_feeds = true;
						}

						this.feed_data=[];
						this.filtered_data = [];

					}

					this.initial_load = false;
					this.searching = false;
				},	
				error => console.log('Error retrieving feeds by dealer', error)
			);
	}

	filterData(e: string): void {

		this.searching = true;

		if (e) {
			this.search_data = e;
			this.pageRequested(1);

		} else {
			this.search_data = "";
			this.pageRequested(1);

		}

	}

	private get currentUser() {
		return this._auth.current_user_value;
	}

	private mapFeedsToUI(data): UI_TABLE_FEED_DEALER[] {
		let count = this.paging_data.pageStart;
		return data.map(
			i => {
				return new UI_TABLE_FEED_DEALER(
					{ value:i.feed.contentId, link: null , editable: false, hidden: true },
					{ value:count++, link: null , editable: false, hidden: false },
					{ value:i.feed.feedTitle, link: '/sub-dealer/media-library/' +  i.feed.contentId , editable: false, hidden: false },
					{ value: i.feed.classification ? this._titlecase.transform(i.feed.classification) : '--', link: null, editable: false, hidden: false },
					{ value:`${i.owner.firstName} ${i.owner.lastName}`, link: '/sub-dealer/users/' + i.owner.userId, editable: false, hidden: false },
					{ value: this._date.transform(i.feed.dateCreated, 'MMM d, y, h:mm a'), link: null, editable: false, hidden: false },
					{ value: i.feed.feedTitle, link: i.feed.feedUrl, editable: false, hidden: true },
					{ value:i.feed.feedDescription, link: null, editable: false, hidden: true },
				)
			}
		)
	}
}
