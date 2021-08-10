import { Component, Input, OnInit } from '@angular/core';
import { GenerateWeatherFeed } from '../../../../global/models/api_feed_generator.model';

@Component({
	selector: 'app-weather-demo',
	templateUrl: './weather-demo.component.html',
	styleUrls: ['./weather-demo.component.scss']
})

export class WeatherDemoComponent implements OnInit {
	@Input() weather_data: GenerateWeatherFeed;

	constructor() { }

	ngOnInit() {
		console.log(this.weather_data)
	}
}
