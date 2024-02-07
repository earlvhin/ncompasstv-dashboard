import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'nohandle',
})
export class NohandlePipe implements PipeTransform {
    public slicedString: string;
    transform(value: any, ...args: any[]): any {
        return value.substring(value.indexOf('_') + 1);
    }
}
