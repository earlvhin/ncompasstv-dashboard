import { Component, Input, OnInit } from '@angular/core';
import { SLIDE_GLOBAL_SETTINGS } from '../../../../global/models/api_feed_generator.model';
import { environment as env } from '../../../../../environments/environment';
import { FeedItem } from '../../../../global/models/ui_feed_item.model';
import { API_CONTENT } from '../../../../global/models';

@Component({
    selector: 'app-feed-demo',
    templateUrl: './feed-demo.component.html',
    styleUrls: ['./feed-demo.component.scss'],
})
export class FeedDemoComponent implements OnInit {
    @Input() feed_items: FeedItem[] = [];
    @Input() global_settings: SLIDE_GLOBAL_SETTINGS;
    @Input() banner_image_data: API_CONTENT;

    image: string;
    heading: string;
    paragraph: string;
    slide_demo_url: string;

    private current_display_index: number = 0;
    private duration_handler: any;

    constructor() {}

    ngOnInit() {
        if (this.feed_items.length > 0) {
            this.controlFeedDisplay(this.current_display_index);
        }

        this.slide_demo_url = `${env.third_party.filestack_screenshot}/${env.base_uri}${env.create.api_new_slide_feed_demo}?
		imageContentId=${this.feed_items[0].image.content_id}&
		bannerImageContentId=${this.global_settings.bannerImage}&
		fontFamily=${this.global_settings.fontFamily}&
		overlayBackground=${this.global_settings.overlay}&
		fontColor=${this.global_settings.fontColor}&
		headLineBackground=${this.global_settings.headlineBackground}&
		headLineColor=${this.global_settings.headlineColor}&
		textAlignment=${this.global_settings.textAlign}`;
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
        }, feed_item.context.duration * 1000);
    }
}
