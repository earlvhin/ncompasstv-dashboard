import { Pipe, PipeTransform } from '@angular/core';
import { VIDEO_FILETYPE } from '../models/ui_filetype';

@Pipe({
    name: 'isvideo',
})
export class IsvideoPipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        if (value in VIDEO_FILETYPE) {
            return true;
        }
    }
}
