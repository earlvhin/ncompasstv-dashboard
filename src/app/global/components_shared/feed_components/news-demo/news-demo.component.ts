import { Component, Input, OnInit } from '@angular/core';
import { environment as env } from '../../../../../environments/environment';
import { GenerateNewsFeed } from '../../../../global/models/api_feed_generator.model';

@Component({
    selector: 'app-news-demo',
    templateUrl: './news-demo.component.html',
    styleUrls: ['./news-demo.component.scss'],
})
export class NewsDemoComponent implements OnInit {
    @Input() news_data: GenerateNewsFeed;
    news_demo_url: string;

    constructor() {}

    ngOnInit() {
        this.news_demo_url = `${env.third_party.filestack_screenshot}/${env.base_uri}${env.create.api_new_news_feed_demo}?
		results=${this.news_data.feedNews.results}&
		loopCycle=${this.news_data.feedNews.loopCycle}&
		fontColor=${this.news_data.feedNews.fontColor.replace('#', '')}&
		fontSize=${this.news_data.feedNews.fontSize}&
		marginTop=${this.news_data.feedNews.marginTop}&
		marginLeft=${this.news_data.feedNews.marginLeft}&
		backgroundColor=${this.news_data.feedNews.backgroundColor.replace('#', '')}&
		backgroundContentId=${this.news_data.feedNews.backgroundContentId}&
		time=${this.news_data.feedNews.time}&
		rssFeedUrl=${this.news_data.feedNews.rssFeedUrl}`;
    }
}
