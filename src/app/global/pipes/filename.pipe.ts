import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filename',
})
export class FilenamePipe implements PipeTransform {
    public slicedString: string;
    transform(value: any, ...args: any[]): any {
        if (!value.length) return;
        const handle_removed = value;
        this.slicedString = handle_removed.substr(0, 10);
        return this.slicedString + `${handle_removed.length > 10 ? '...' : ''}`;
    }
}
