import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'isFeed',
})
export class IsFeedPipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        if (value == 'feed') {
            return true;
        }
    }
}
