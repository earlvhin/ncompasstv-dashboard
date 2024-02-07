import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'substring',
})
export class SubstringPipe implements PipeTransform {
    public slicedString: string;
    transform(value: any, length: number): any {
        if (value.length > length) {
            this.slicedString = value.substr(0, length);
            return this.slicedString + '...';
        } else {
            return value;
        }
    }
}
