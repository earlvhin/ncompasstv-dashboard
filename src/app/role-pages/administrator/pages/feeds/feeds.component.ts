import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { UI_TABLE_FEED } from '../../../../global/models/ui_table-feed.model';
import { FeedService } from '../../../../global/services/feed-service/feed.service';
import { CreateFeedComponent } from '../../../../global/components_shared/feed_components/create-feed/create-feed.component';
import { TitleCasePipe, DatePipe } from '@angular/common';

@Component({
	selector: 'app-feeds',
	templateUrl: './feeds.component.html',
	styleUrls: ['./feeds.component.scss'],
	providers: [
		DatePipe, TitleCasePipe
	],
})
export class FeedsComponent implements OnInit {

	@Input() title: string = "Feeds";

	feed_data: UI_TABLE_FEED[] = [];
	feed_stats: any = {};
	feeds_stats: any = {};
	feeds_table_column = [
        { name: '#', sortable: false},
        { name: 'Feed Title', sortable: true, column:'Title'},
        { name: 'Business Name', sortable: true, column:'BusinessName'},
        { name: 'Type', sortable: true, column:'Classification'},
        { name: 'Created By', sortable: true, column:'CreatedByName'},
        { name: 'Creation Date', sortable: true, column:'DateCreated'},
        { name: 'Action', sortable: false},
	];
	filtered_data: any = [];
	no_feeds: boolean = false;
	paging_data: any;
	initial_load: boolean = true;
	search_data: string = "";
	searching: boolean = false;
    sort_column: string = 'DateCreated';
	sort_order: string = 'desc';
	subscription: Subscription = new Subscription();
	
	constructor(
		private _date: DatePipe,
		private _dialog: MatDialog,
		private _feed: FeedService,
	) { }

	ngOnInit() {
		this.getFeedsTotal();
		this.pageRequested(1);
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
					this.pageRequested(1);
				}
			}
		)
	}

	reloadPage(e) {
		if (e) {
			this.ngOnInit()
		}
	}

	getFeedsTotal() {
		this.subscription.add(
			this._feed.get_feeds_total().subscribe(
				data => {
					this.feeds_stats = {
						total_value : data.total,
						total_label: "Feed(s)",
						this_week_value: data.newFeedsThisWeek,
						this_week_value_label: "Feed(s)",
						this_week_value_description: "New this week",
						last_week_value: data.newFeedsLastWeek,
						last_week_value_label: "Feed(s)",
						last_week_value_description: "New this week"
					}
				}
			)
		)
	}

    getColumnsAndOrder(data) {
		this.sort_column = data.column;
		this.sort_order = data.order;
		this.pageRequested(1);
	}

	pageRequested(e) {
		this.searching = true;
		this.feed_data = [];
		this.subscription.add(
			this._feed.get_feeds(e, this.search_data, this.sort_column, this.sort_order).subscribe(
				data => {
					console.log(data);
					this.initial_load = false;
					this.searching = false;
                    this.paging_data = data.paging;
					if(!data.message) {
						this.feed_data = this.feeds_mapToUIFormat(data.cFeeds);
						this.filtered_data = this.feeds_mapToUIFormat(data.cFeeds);
					} else {
						if(this.search_data == "") {
							this.no_feeds = true;
						}
						this.feed_data=[];
						this.filtered_data = [];
					}					
				},	
				error => {
					console.log('#getFeeds', error);
				}
			)
		)
	}

	filterData(e) {
		if (e) {
			this.search_data = e;
			this.pageRequested(1);
		} else {
			this.search_data = "";
			this.pageRequested(1);
		}
	}

	feeds_mapToUIFormat(data) {
		let count = this.paging_data.pageStart;
		return data.map(
			i => {
				return new UI_TABLE_FEED(
					{ value:i.feed.contentId, link: null , editable: false, hidden: true},
					{ value:i.feed.feedId, link: null, editable: false, hidden: true},
					{ value:count++, link: null , editable: false, hidden: false},
					{ value:i.feed.feedTitle, link: '/administrator/media-library/' +  i.feed.contentId , editable: false, hidden: false},
					// { value:i.feed.feedDescription, link: null, editable: false, hidden: false},
					{ value:i.dealer ? i.dealer.businessName : null, link: i.dealer ? '/administrator/dealers/' + i.dealer.dealerId : null, id: i.dealer ? i.dealer.dealerId : '', editable: false, hidden: false},
					{ value: i.feed.classification ? i.feed.classification : '--', link: null, editable: false, hidden: false},
					{ value:`${i.owner.firstName} ${i.owner.lastName}`, link: '/administrator/users/' + i.owner.userId, editable: false, hidden: false},
					{ value: this._date.transform(i.feed.dateCreated, 'MMMM d, y'), link: null, editable: false, hidden: false},
					{ value: i.feed.feedTitle, link: i.feed.feedUrl, editable: false, hidden: true},
					{ value:i.feed.feedDescription, link: null, editable: false, hidden: true},
				)
			}
		)
	}
}
