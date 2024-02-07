import { Component, Input, OnInit } from '@angular/core';
import { environment as env } from '../../../../../environments/environment';
import { GenerateWeatherFeed } from '../../../../global/models/api_feed_generator.model';

@Component({
    selector: 'app-weather-demo',
    templateUrl: './weather-demo.component.html',
    styleUrls: ['./weather-demo.component.scss'],
})
export class WeatherDemoComponent implements OnInit {
    @Input() weather_data: GenerateWeatherFeed;
    weather_demo_url: string;

    constructor() {}

    ngOnInit() {
        this.weather_demo_url = `${env.third_party.filestack_screenshot}/${env.base_uri}${env.create.api_new_weather_feed_demo}?
		backgroundContentId=${this.weather_data.feedWeather.backgroundContentId}&
		bannerContentId=${this.weather_data.feedWeather.bannerContentId}&
		daysFontColor=${this.weather_data.feedWeather.daysFontColor.replace('#', '')}&
		boxBackgroundColor=${this.weather_data.feedWeather.boxBackgroundColor.replace('#', '')}&
		fontFamily=${this.weather_data.feedWeather.fontFamily}&
		footerContentId=${this.weather_data.feedWeather.footerContentId}&
		numberDays=${this.weather_data.feedWeather.numberDays}&
		headerImageSize=${this.weather_data.feedWeather.headerImageSize}&
		footerImageSize=${this.weather_data.feedWeather.footerImageSize}`;
    }
}
