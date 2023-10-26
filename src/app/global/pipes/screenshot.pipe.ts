import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
	name: 'screenshot'
})
export class ScreenshotPipe extends DatePipe implements PipeTransform {
	public slicedString: string;

	transform(value: any, ...args: any[]): any {
		const handle_removed = value.substring(value.lastIndexOf('/') + 1);
		let s_date = handle_removed.substring(0, handle_removed.indexOf('--'));
		let s_time = handle_removed.substring(handle_removed.indexOf('--') + 2);
		(s_time = s_time.split('_')), (s_time = s_time.slice(0, 2));
		s_time = s_time.join(':');
		let valid_time = s_time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [s_time];

		if (valid_time.length > 1) {
			// If valid_time format correct
			valid_time = valid_time.slice(1); // Remove full string match value
			valid_time[5] = +valid_time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
			valid_time[0] = +valid_time[0] % 12 || 12; // Adjust hours
		}

		valid_time = valid_time.join(''); // return adjusted time or original string

		return `${super.transform(s_date.split('_').join('/'), 'MMM d, y')} \n ${valid_time}`;
	}
}
