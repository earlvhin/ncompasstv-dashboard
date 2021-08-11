import { Component, Input, OnInit } from '@angular/core';
import { FeedService } from '../../../../global/services/feed-service/feed.service';
import { GenerateWeatherFeed } from '../../../../global/models/api_feed_generator.model';

@Component({
	selector: 'app-weather-demo',
	templateUrl: './weather-demo.component.html',
	styleUrls: ['./weather-demo.component.scss']
})

export class WeatherDemoComponent implements OnInit {
	@Input() weather_data: GenerateWeatherFeed;

	constructor(
		private _feed: FeedService
	) { }

	ngOnInit() {
		this.weather_data.feeds.status = "C";
		console.log(this.weather_data)
		this.generateWeatherFeedDemo();
	}

	generateWeatherFeedDemo() {
		this._feed.create_weather_feed_demo(this.weather_data.feedWeather).subscribe(
			data => {
				console.log('DEMO URL', data);
			}
		)
	}
}