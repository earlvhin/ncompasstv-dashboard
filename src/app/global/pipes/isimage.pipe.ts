import { Pipe, PipeTransform } from '@angular/core';
import { IMAGE_FILETYPE } from '../models/ui_filetype';

@Pipe({
    name: 'isimage',
})
export class IsimagePipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        if (value in IMAGE_FILETYPE) {
            return true;
        }
    }
}
