import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
    name: 'screenshot',
})
export class ScreenshotPipe extends DatePipe implements PipeTransform {
    transform(value: string): string {
        const DATE_FORMAT = 'MMM d, y';
        const TIME_FORMAT = 'h:mm a';
        const splitString = value.split('/');
        let extracted = splitString[splitString.length - 1].split('.')[0];

        // Check if the screenshot filename is using the old format
        if (extracted.includes('_')) {
            const splitOldFormat = extracted.split('_');
            extracted = splitOldFormat[splitOldFormat.length - 1];
        }

        const parseDateValue = (rawDateValue: string) => {
            let index = 0;

            const LENGTHS = {
                year: 4,
                month: 2,
                day: 2,
                hour: 2,
                minute: 2,
                second: 2,
            };

            const lengthList = Object.values(LENGTHS).map((value) => value);

            const values = lengthList.map((length) => {
                const value = rawDateValue.substring(index, index + length);
                index += length;
                return value;
            });

            const [year, month, day, hour, minute, second] = values;
            return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
        };

        const parsed = parseDateValue(extracted);
        const date = super.transform(parsed, DATE_FORMAT);
        const time = super.transform(parsed, TIME_FORMAT);
        return `${date} \n ${time}`;
    }
}
