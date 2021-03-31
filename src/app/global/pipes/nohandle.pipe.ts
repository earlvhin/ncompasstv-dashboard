import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'nohandle'
})

export class NohandlePipe implements PipeTransform {
	public slicedString: string;
	transform(value: any, ...args: any[]): any {
		const handle_removed = value.substring(value.indexOf('_') + 1);
		if (handle_removed.length > 35) {
			this.slicedString = handle_removed.substr(0, 35);
			return (this.slicedString + '...');
		} else {
			return handle_removed;
		}
	}
}
