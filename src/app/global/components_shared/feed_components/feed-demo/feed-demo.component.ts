import { Component, Input, OnInit } from '@angular/core';
import { FeedItem } from '../../../../global/models/ui_feed_item.model';

@Component({
	selector: 'app-feed-demo',
	templateUrl: './feed-demo.component.html',
	styleUrls: ['./feed-demo.component.scss']
})

export class FeedDemoComponent implements OnInit {
	@Input() feed_items: FeedItem[] = [];

	image: string;
	heading: string;
	paragraph: string;

	private current_display_index: number = 0;
	private duration_handler: any;

	constructor() { }

	ngOnInit() {
		if (this.feed_items.length > 0) {
			this.controlFeedDisplay(this.current_display_index);
		}
	}

	ngOnDestroy() {
		clearTimeout(this.duration_handler);
	}

	/**
	 * Control Feed Elements to Display
	 * @param i the current index of feed_items array to display
	 */
	private controlFeedDisplay(i: number): void {
		if (this.current_display_index < this.feed_items.length) {
			this.displayFeed(this.feed_items[i]);
			return;
		} else {
			this.current_display_index = 0;
			this.displayFeed(this.feed_items[0]);
		}
	}

	/** 
	 * Display Current Feed Index
	 * @param feed_item Currently Displaying Feed Item
	 */
	private displayFeed(feed_item: FeedItem): void {
		this.image = feed_item.image.file_url;
		this.heading = feed_item.context.heading;
		this.paragraph = feed_item.context.paragraph;
		this.current_display_index += 1;

		this.duration_handler = setTimeout(() => {
			this.image = null;
			this.heading = null;
			this.paragraph = null;

			this.controlFeedDisplay(this.current_display_index);
		}, feed_item.context.duration * 1000)
	}
}
