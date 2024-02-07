import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filesize',
})
export class FileSizePipe implements PipeTransform {
    transform(size: number) {
        const kb = 1024;
        const mb = kb * kb;

        if (size >= mb) {
            return (size / mb).toFixed(2) + ' MB';
        } else {
            return (size / kb).toFixed(2) + ' KB';
        }
    }
}
