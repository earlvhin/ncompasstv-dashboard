import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'isEmpty',
})
export class IsEmptyPipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        if (typeof value === 'undefined' || value === null || value.length === 0) {
            return true;
        }

        return false;
    }
}
