import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filename',
})
export class FilenamePipe implements PipeTransform {
    public slicedString: string;
    transform(value: any, ...args: any[]): any {
        const handle_removed = value;
        // const handle_removed = value.substring(value.indexOf('_') + 1);
        // if (handle_removed.length > 15) {
        this.slicedString = handle_removed.substr(0, 10);
        return this.slicedString + `${handle_removed.length > 10 ? '...' : ''}`;
        // } else {
        // 	return handle_removed;
        // }
    }
}
